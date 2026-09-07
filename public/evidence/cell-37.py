def cleanup_memory():
    """Release Python and CUDA cached memory between clients/rounds."""
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        try:
            torch.cuda.ipc_collect()
        except Exception:
            pass

def freeze_batchnorm_stats(model):
    """Keep BatchNorm running_mean/running_var fixed during federated fine-tuning.

    This matters in FL because each client has a small and often non-IID batch
    distribution. Averaging client-specific BatchNorm running stats can harm
    validation accuracy even when the train loss decreases.
    """
    for module in model.modules():
        if isinstance(module, (nn.BatchNorm1d, nn.BatchNorm2d, nn.BatchNorm3d, nn.SyncBatchNorm)):
            module.eval()
            for p in module.parameters():
                p.requires_grad = False


def round_learning_rate(round_idx, num_rounds):
    base_lr = float(CONFIG["LR"])

    # Linear warmup: several profiles unfreeze many pretrained layers at once
    # (ResNet layer3/layer4 + several ViT blocks). Hitting all of those with
    # the full target LR on round 1 tends to cause a rough start that the
    # federated averaging never fully recovers from -- a warmup avoids that.
    warmup_rounds = int(CONFIG.get("LR_WARMUP_ROUNDS", 0) or 0)
    if warmup_rounds > 0 and round_idx <= warmup_rounds:
        warmup_lr = base_lr * (round_idx / float(warmup_rounds))
        return max(warmup_lr, base_lr * 0.05)

    schedule = str(CONFIG.get("ROUND_LR_SCHEDULE", "constant")).lower()
    if schedule != "cosine":
        return base_lr

    min_mult = float(CONFIG.get("MIN_LR_MULT", 0.10))
    # Progress is measured over the post-warmup rounds so the cosine curve
    # still spans the full remaining schedule instead of being compressed.
    remaining_rounds = max(num_rounds - warmup_rounds, 1)
    progress = (round_idx - warmup_rounds - 1) / max(remaining_rounds - 1, 1)
    progress = min(max(progress, 0.0), 1.0)
    cosine = 0.5 * (1.0 + math.cos(math.pi * progress))
    return base_lr * (min_mult + (1.0 - min_mult) * cosine)



def train_local_model(
    model,
    loader,
    local_epochs=1,
    lr=1e-4,
    weight_decay=0.0,
    device=DEVICE,
    max_batches=None,
):
    """Train one local client model.

    max_batches is used only for quick Colab-safe runs. Keep it None for
    manuscript/final results.
    """
    model.train()
    if CONFIG.get("FREEZE_BATCHNORM_STATS", False):
        freeze_batchnorm_stats(model)

    trainable_params = [p for p in model.parameters() if p.requires_grad]
    if len(trainable_params) == 0:
        raise RuntimeError("No trainable parameters found. Check FREEZE_BACKBONES/fusion settings.")

    # Differential learning rate:
    # the fusion head can learn faster, while partially unfrozen pretrained
    # backbone layers use a smaller LR to prevent catastrophic forgetting.
    if hasattr(model, "fusion"):
        fusion_param_ids = {id(p) for p in model.fusion.parameters() if p.requires_grad}
        fusion_params = [p for p in model.fusion.parameters() if p.requires_grad]
        backbone_params = [p for p in trainable_params if id(p) not in fusion_param_ids]
        param_groups = []
        if len(backbone_params) > 0:
            param_groups.append({
                "params": backbone_params,
                "lr": lr * float(CONFIG.get("BACKBONE_LR_MULT", 0.2)),
                "weight_decay": weight_decay,
            })
        if len(fusion_params) > 0:
            param_groups.append({
                "params": fusion_params,
                "lr": lr,
                "weight_decay": weight_decay,
            })
    else:
        param_groups = [{"params": trainable_params, "lr": lr, "weight_decay": weight_decay}]

    if CONFIG.get("OPTIMIZER", "adam") == "adam":
        optimizer = torch.optim.Adam(param_groups)
    else:
        optimizer = torch.optim.AdamW(param_groups)

    label_smoothing = float(CONFIG.get("LABEL_SMOOTHING", 0.0) or 0.0)

    if CONFIG.get("USE_FOCAL_LOSS", False):
        criterion = FocalLoss(gamma=CONFIG.get("FOCAL_GAMMA", 2.0))
    elif CONFIG.get("USE_CLASS_WEIGHTED_LOSS", False):
        # Uses clean global train distribution, not poisoned client labels.
        # This improves macro-F1 stability in small Colab runs without changing
        # the federated aggregation logic.
        criterion = nn.CrossEntropyLoss(
            weight=GLOBAL_CLASS_WEIGHTS.to(device), label_smoothing=label_smoothing
        )
    else:
        criterion = nn.CrossEntropyLoss(label_smoothing=label_smoothing)

    use_amp = CONFIG["USE_AMP"] and device.type == "cuda"
    scaler = torch.amp.GradScaler("cuda", enabled=use_amp)

    total_loss = 0.0
    total_count = 0

    for _ in range(local_epochs):
        for batch_idx, (images, labels) in enumerate(loader):
            if max_batches is not None and batch_idx >= max_batches:
                break

            images = images.to(device, non_blocking=True)
            if CONFIG.get("USE_CHANNELS_LAST", False) and device.type == "cuda":
                images = images.to(memory_format=torch.channels_last)
            labels = labels.to(device, non_blocking=True)

            optimizer.zero_grad(set_to_none=True)

            with torch.amp.autocast("cuda", enabled=use_amp):
                logits = model(images)
                loss = criterion(logits, labels)

            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(trainable_params, max_norm=5.0)
            scaler.step(optimizer)
            scaler.update()

            bs = images.size(0)
            total_loss += float(loss.detach().item()) * bs
            total_count += bs

            # reduce temporary GPU references before the next batch
            del images, labels, logits, loss

    return total_loss / max(total_count, 1)


@torch.inference_mode()
def evaluate_model(model, loader, device=DEVICE, max_batches=None):
    model.eval()
    y_true, y_pred, y_prob = [], [], []

    use_amp = CONFIG.get("USE_AMP", False) and device.type == "cuda"
    for batch_idx, (images, labels) in enumerate(loader):
        if max_batches is not None and batch_idx >= max_batches:
            break
        images = images.to(device, non_blocking=True)
        if CONFIG.get("USE_CHANNELS_LAST", False) and device.type == "cuda":
            images = images.to(memory_format=torch.channels_last)

        with torch.amp.autocast("cuda", enabled=use_amp):
            logits = model(images)
            probs = torch.softmax(logits, dim=1)

            # Optional test-time augmentation. Horizontal flip averaging is
            # cheap and often improves clean HAM10000 accuracy slightly.
            if CONFIG.get("TTA_EVAL", False):
                logits_flip = model(torch.flip(images, dims=[3]))
                probs_flip = torch.softmax(logits_flip, dim=1)
                probs = 0.5 * (probs + probs_flip)
                del logits_flip, probs_flip

        preds = torch.argmax(probs, dim=1)

        y_true.extend(labels.cpu().numpy().tolist())
        y_pred.extend(preds.detach().cpu().numpy().tolist())
        y_prob.extend(probs.detach().cpu().numpy().tolist())

        del images, logits, probs, preds

    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    y_prob = np.array(y_prob)
    metrics = compute_metrics(y_true, y_pred)
    return metrics, y_true, y_pred, y_prob