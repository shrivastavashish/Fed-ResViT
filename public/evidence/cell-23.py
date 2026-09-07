def patient_level_split(df, test_size=0.15, val_size=0.15, seed=42):
    df = df.reset_index(drop=True).copy()

    if HAS_STRATIFIED_GROUP_KFOLD:
        # 1 fold of 7 gives ~14.3% test -- closest to 15%.
        sgkf = StratifiedGroupKFold(n_splits=7, shuffle=True, random_state=seed)
        y = df["label_idx"].values
        groups = df["lesion_id"].values
        train_val_idx, test_idx = next(sgkf.split(df, y, groups))
        train_val_df = df.iloc[train_val_idx].reset_index(drop=True)
        test_df = df.iloc[test_idx].reset_index(drop=True)

        # 1 fold of 6 over the remaining ~85.7% gives ~14.3% overall val.
        sgkf2 = StratifiedGroupKFold(n_splits=6, shuffle=True, random_state=seed + 1)
        y2 = train_val_df["label_idx"].values
        groups2 = train_val_df["lesion_id"].values
        train_idx2, val_idx2 = next(sgkf2.split(train_val_df, y2, groups2))

        train_df = train_val_df.iloc[train_idx2].reset_index(drop=True)
        val_df = train_val_df.iloc[val_idx2].reset_index(drop=True)
    else:
        gss = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=seed)
        train_val_idx, test_idx = next(gss.split(df, groups=df["lesion_id"]))
        train_val_df = df.iloc[train_val_idx].reset_index(drop=True)
        test_df = df.iloc[test_idx].reset_index(drop=True)

        adjusted_val_size = val_size / (1.0 - test_size)
        gss2 = GroupShuffleSplit(
            n_splits=1, test_size=adjusted_val_size, random_state=seed + 1
        )
        train_idx2, val_idx2 = next(gss2.split(train_val_df, groups=train_val_df["lesion_id"]))
        train_df = train_val_df.iloc[train_idx2].reset_index(drop=True)
        val_df = train_val_df.iloc[val_idx2].reset_index(drop=True)

    return train_df, val_df, test_df


train_df, val_df, test_df = patient_level_split(
    df,
    test_size=CONFIG["TEST_SIZE"],
    val_size=CONFIG["VAL_SIZE"],
    seed=CONFIG["SPLIT_SEED"],
)

# Optional smoke-test sub-sample (debug/smoke profiles only).
if CONFIG.get("SMOKE_TEST"):
    print(f"SMOKE_TEST active -- capping each class to ~{CONFIG['SMOKE_MAX_IMAGES'] // 7} train samples.")
    train_df = (
        train_df.groupby("dx", group_keys=False)
        .apply(lambda x: x.sample(
            min(len(x), max(20, CONFIG["SMOKE_MAX_IMAGES"] // len(CLASS_ORDER))),
            random_state=42,
        ))
        .reset_index(drop=True)
    )
    val_df = (
        val_df.groupby("dx", group_keys=False)
        .apply(lambda x: x.sample(min(len(x), 50), random_state=43))
        .reset_index(drop=True)
    )
    test_df = (
        test_df.groupby("dx", group_keys=False)
        .apply(lambda x: x.sample(min(len(x), 50), random_state=44))
        .reset_index(drop=True)
    )

print("Train:", train_df.shape)
print("Val:", val_df.shape)
print("Test:", test_df.shape)

split_counts = pd.DataFrame({
    "train": train_df["dx"].value_counts().reindex(CLASS_ORDER),
    "val":   val_df["dx"].value_counts().reindex(CLASS_ORDER),
    "test":  test_df["dx"].value_counts().reindex(CLASS_ORDER),
}).fillna(0).astype(int)
display(split_counts)


def compute_balanced_class_weights(labels, num_classes=7, power=0.5):
    """Soft inverse-frequency class weights for imbalanced HAM10000 training.

    power=1.0 gives full inverse-frequency weighting; power=0.5 is safer for
    small/federated runs because it avoids over-correcting rare classes.
    """
    labels = np.asarray(labels, dtype=np.int64)
    counts = np.bincount(labels, minlength=num_classes).astype(np.float64)
    counts = np.maximum(counts, 1.0)
    weights = counts.sum() / (num_classes * counts)
    weights = np.power(weights, float(power))
    weights = weights / weights.mean()
    return weights.astype(np.float32)

GLOBAL_CLASS_WEIGHTS = torch.tensor(
    compute_balanced_class_weights(
        train_df["label_idx"].values,
        num_classes=CONFIG["NUM_CLASSES"],
        power=CONFIG.get("CLASS_WEIGHT_POWER", 0.5),
    ),
    dtype=torch.float32,
)
print("Global class weights used if USE_CLASS_WEIGHTED_LOSS=True:")
print(dict(zip(CLASS_ORDER, np.round(GLOBAL_CLASS_WEIGHTS.numpy(), 3))))

GLOBAL_CLASS_PRIOR = np.bincount(
    train_df["label_idx"].values,
    minlength=CONFIG["NUM_CLASSES"],
).astype(np.float64)
GLOBAL_CLASS_PRIOR = GLOBAL_CLASS_PRIOR / np.maximum(GLOBAL_CLASS_PRIOR.sum(), 1.0)
print("Global train class prior:")
print(dict(zip(CLASS_ORDER, np.round(GLOBAL_CLASS_PRIOR, 4))))


train_lesions = set(train_df["lesion_id"])
val_lesions = set(val_df["lesion_id"])
test_lesions = set(test_df["lesion_id"])
print("Train ∩ Val lesion overlap:", len(train_lesions & val_lesions))
print("Train ∩ Test lesion overlap:", len(train_lesions & test_lesions))
print("Val ∩ Test lesion overlap:", len(val_lesions & test_lesions))
