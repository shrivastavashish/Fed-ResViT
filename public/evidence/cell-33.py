def compute_specificity_macro(y_true, y_pred, num_classes=7):
    cm = confusion_matrix(y_true, y_pred, labels=list(range(num_classes)))
    specificities = []
    for c in range(num_classes):
        tp = cm[c, c]
        fp = cm[:, c].sum() - tp
        fn = cm[c, :].sum() - tp
        tn = cm.sum() - tp - fp - fn
        denom = tn + fp
        spec = tn / denom if denom > 0 else np.nan
        specificities.append(spec)
    return float(np.nanmean(specificities))


def compute_asr(y_true, y_pred):
    '''ASR (Sec 5.5): proportion of malignant test samples predicted as the
    benign target class by the poisoned global model.'''
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    malignant_mask = np.isin(y_true, MALIGNANT_IDXS)
    if malignant_mask.sum() == 0:
        return np.nan
    return float(np.mean(y_pred[malignant_mask] == TARGET_BENIGN_IDX))


def compute_malignant_safety(y_true, y_pred):
    asr = compute_asr(y_true, y_pred)
    if np.isnan(asr):
        return np.nan
    return float(1.0 - asr)


def compute_metrics(y_true, y_pred, prefix=""):
    acc = accuracy_score(y_true, y_pred)
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_true, y_pred,
        labels=list(range(CONFIG["NUM_CLASSES"])),
        average="macro", zero_division=0,
    )
    specificity = compute_specificity_macro(y_true, y_pred, num_classes=CONFIG["NUM_CLASSES"])
    asr = compute_asr(y_true, y_pred)
    malignant_safety = compute_malignant_safety(y_true, y_pred)

    return {
        f"{prefix}accuracy": float(acc),
        f"{prefix}macro_precision": float(precision),
        f"{prefix}macro_recall": float(recall),
        f"{prefix}macro_f1": float(f1),
        f"{prefix}macro_specificity": float(specificity),
        f"{prefix}asr": float(asr) if not np.isnan(asr) else np.nan,
        f"{prefix}malignant_safety": float(malignant_safety) if not np.isnan(malignant_safety) else np.nan,
    }
