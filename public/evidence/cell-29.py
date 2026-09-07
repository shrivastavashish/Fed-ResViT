def poison_client_dataframe(client_df, flip_prob=1.0, seed=42):
    rng = np.random.default_rng(seed)
    poisoned = client_df.copy()
    y = poisoned["label_idx"].values.copy()

    malignant_mask = np.isin(y, MALIGNANT_IDXS)
    flip_mask = malignant_mask & (rng.random(len(y)) < flip_prob)

    y[flip_mask] = TARGET_BENIGN_IDX
    poisoned["original_label_idx"] = poisoned["label_idx"].values
    poisoned["label_idx"] = y.astype(int)
    poisoned["is_flipped"] = flip_mask.astype(int)

    return poisoned


# Demonstration on client 0
demo_client = train_df.iloc[client_indices[0]].copy()
demo_poisoned = poison_client_dataframe(demo_client, flip_prob=1.0, seed=42)
print("Demo flipped labels:", int(demo_poisoned["is_flipped"].sum()))
display(pd.crosstab(
    demo_client["dx"],
    demo_poisoned["label_idx"].map(IDX_TO_CLASS),
    rownames=["Original"], colnames=["Poisoned"],
))
