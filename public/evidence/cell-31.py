class FedResViT(nn.Module):
    def __init__(
        self,
        num_classes=7,
        vit_backbone="vit_base_patch16_224",
        fusion_dim=512,
        dropout=0.3,
        resnet_pretrained=True,
        vit_pretrained=True,
        freeze_backbones=False,
    ):
        super().__init__()

        # ---- CNN stream: ResNet-50 (Sec 4.2, ref [22]) ----
        try:
            from torchvision.models import ResNet50_Weights
            weights = ResNet50_Weights.IMAGENET1K_V2 if resnet_pretrained else None
            self.cnn = resnet50(weights=weights)
        except Exception as e:
            print("ResNet pretrained load failed. Falling back to random init:", repr(e))
            self.cnn = resnet50(weights=None)

        cnn_in = self.cnn.fc.in_features
        self.cnn.fc = nn.Identity()

        # ---- ViT stream (Sec 4.2, ref [23]) ----
        try:
            self.vit = timm.create_model(
                vit_backbone, pretrained=vit_pretrained, num_classes=0
            )
        except Exception as e:
            print("ViT pretrained load failed. Falling back to random init:", repr(e))
            self.vit = timm.create_model(
                vit_backbone, pretrained=False, num_classes=0
            )

        vit_dim = self.vit.num_features

        if freeze_backbones:
            for p in self.cnn.parameters():
                p.requires_grad = False
            for p in self.vit.parameters():
                p.requires_grad = False

            # Accuracy-oriented partial fine-tuning:
            # keep most pretrained features frozen but allow the final semantic
            # layers to adapt to dermoscopic lesions. This is much lighter than
            # full backpropagation through ResNet-50 + ViT.
            if CONFIG.get("UNFREEZE_RESNET_LAYER3", False) and hasattr(self.cnn, "layer3"):
                for p in self.cnn.layer3.parameters():
                    p.requires_grad = True

            if CONFIG.get("UNFREEZE_RESNET_LAYER4", False) and hasattr(self.cnn, "layer4"):
                for p in self.cnn.layer4.parameters():
                    p.requires_grad = True

            n_vit = int(CONFIG.get("UNFREEZE_VIT_LAST_N_BLOCKS", 0) or 0)
            if n_vit > 0 and hasattr(self.vit, "blocks"):
                for block in self.vit.blocks[-n_vit:]:
                    for p in block.parameters():
                        p.requires_grad = True

            if CONFIG.get("UNFREEZE_VIT_NORM", False) and hasattr(self.vit, "norm"):
                for p in self.vit.norm.parameters():
                    p.requires_grad = True

        # ---- Fusion + classifier (Sec 4.2) ----
        self.fusion = nn.Sequential(
            nn.Linear(cnn_in + vit_dim, fusion_dim),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            nn.Linear(fusion_dim, num_classes),
        )

        # Optional classifier-prior initialization.
        # This only sets the initial bias and can speed convergence on imbalanced HAM10000.
        if CONFIG.get("INIT_CLASSIFIER_BIAS", False) and "GLOBAL_CLASS_PRIOR" in globals():
            try:
                prior = np.asarray(GLOBAL_CLASS_PRIOR, dtype=np.float32)
                prior = np.clip(prior, 1e-6, 1.0)
                bias = torch.log(torch.tensor(prior / prior.sum(), dtype=torch.float32))
                with torch.no_grad():
                    self.fusion[-1].bias.copy_(bias)
                print("Initialized classifier bias from train-set class prior.")
            except Exception as e:
                print("Classifier bias prior initialization skipped:", repr(e))

    def forward(self, x):
        local_feat = self.cnn(x)          # CNN stream
        global_feat = self.vit(x)         # ViT stream
        fused = torch.cat([local_feat, global_feat], dim=1)
        logits = self.fusion(fused)
        return logits


def build_model():
    model = FedResViT(
        num_classes=CONFIG["NUM_CLASSES"],
        vit_backbone=CONFIG["VIT_BACKBONE"],
        fusion_dim=CONFIG["FUSION_DIM"],
        dropout=CONFIG["DROPOUT"],
        resnet_pretrained=CONFIG["RESNET_PRETRAINED"],
        vit_pretrained=CONFIG["VIT_PRETRAINED"],
        freeze_backbones=CONFIG["FREEZE_BACKBONES"],
    )
    if CONFIG.get("USE_CHANNELS_LAST", False) and DEVICE.type == "cuda":
        model = model.to(memory_format=torch.channels_last)
    return model


# Smoke check
model = build_model().to(DEVICE)
x = torch.randn(2, 3, CONFIG["IMG_SIZE"], CONFIG["IMG_SIZE"]).to(DEVICE)
with torch.no_grad():
    y = model(x)
print("Output shape:", y.shape)
print(f"Total parameters: {sum(p.numel() for p in model.parameters()):,}")
print(f"Trainable parameters: {sum(p.numel() for p in model.parameters() if p.requires_grad):,}")
del model, x, y
if torch.cuda.is_available():
    torch.cuda.empty_cache()
