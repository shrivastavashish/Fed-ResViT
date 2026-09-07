def run_centralized_baseline(seed=42, epochs=15):
    set_seed(seed)
    train_loader = make_loader(
        train_df, train_tfms, batch_size=CONFIG["BATCH_SIZE"], shuffle=True
    )
    model = build_model().to(DEVICE)

    history = []
    for epoch in range(1, epochs + 1):
        loss = train_local_model(
            model, train_loader,
            local_epochs=1,
            lr=CONFIG["LR"],
            weight_decay=CONFIG["WEIGHT_DECAY"],
            device=DEVICE,
            max_batches=CONFIG.get("MAX_TRAIN_BATCHES_PER_CLIENT", None),
        )
        val_metrics, _, _, _ = evaluate_model(
            model, val_loader, DEVICE,
            max_batches=CONFIG.get("MAX_VAL_BATCHES", None),
        )
        val_metrics["asr"] = np.nan
        val_metrics["malignant_safety"] = np.nan
        row = {"epoch": epoch, "loss": loss}
        row.update({f"val_{k}": v for k, v in val_metrics.items()})
        history.append(row)
        print(
            f"Epoch {epoch:03d} | loss={loss:.4f} | "
            f"val_acc={val_metrics['accuracy']:.4f} | val_f1={val_metrics['macro_f1']:.4f}"
        )

    test_metrics, y_true, y_pred, y_prob = evaluate_model(
        model, test_loader, DEVICE,
        max_batches=CONFIG.get("MAX_TEST_BATCHES", None),
    )
    test_metrics["asr"] = np.nan
    test_metrics["malignant_safety"] = np.nan
    return model, pd.DataFrame(history), test_metrics, y_true, y_pred, y_prob


centralized_result_row = None
if CONFIG["RUN_CENTRALIZED_BASELINE"]:
    centralized_model, centralized_history, centralized_test_metrics, c_y_true, c_y_pred, c_y_prob = (
        run_centralized_baseline(seed=CONFIG["SPLIT_SEED"], epochs=CONFIG["CENTRALIZED_EPOCHS"])
    )
    centralized_result_row = {
        "seed": CONFIG["SPLIT_SEED"],
        "aggregation": "centralized_upper_bound",
        "malicious_fraction": 0.0,
        "num_malicious": 0,
        "malicious_clients": [],
    }
    centralized_result_row.update({f"test_{k}": v for k, v in centralized_test_metrics.items()})
    print(centralized_test_metrics)
    # Do not keep a full centralized model in GPU/CPU memory after recording results.
    del centralized_model
    cleanup_memory()
