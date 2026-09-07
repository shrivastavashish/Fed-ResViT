def dirichlet_partition(dataframe, num_clients=10, alpha=0.5, seed=42, min_size=1):
    rng = np.random.default_rng(seed)
    labels = dataframe["label_idx"].values
    client_indices = [[] for _ in range(num_clients)]

    for class_idx in range(CONFIG["NUM_CLASSES"]):
        class_indices = np.where(labels == class_idx)[0]
        rng.shuffle(class_indices)

        proportions = rng.dirichlet(alpha=np.repeat(alpha, num_clients))
        cuts = (np.cumsum(proportions) * len(class_indices)).astype(int)[:-1]
        splits = np.split(class_indices, cuts)

        for client_id, split in enumerate(splits):
            client_indices[client_id].extend(split.tolist())

    for client_id in range(num_clients):
        rng.shuffle(client_indices[client_id])

    # Ensure no client is empty (only relevant in tiny smoke tests).
    for client_id in range(num_clients):
        if len(client_indices[client_id]) < min_size:
            largest = int(np.argmax([len(x) for x in client_indices]))
            if len(client_indices[largest]) > min_size:
                client_indices[client_id].append(client_indices[largest].pop())

    return client_indices


def stratified_balanced_partition(dataframe, num_clients=5, seed=42):
    """Near-IID client split with each class distributed across all clients.

    Use this only for clean high-accuracy experiments. For robustness/non-IID
    manuscript experiments, keep PARTITION_METHOD="dirichlet".
    """
    rng = np.random.default_rng(seed)
    labels = dataframe["label_idx"].values
    client_indices = [[] for _ in range(num_clients)]

    for class_idx in range(CONFIG["NUM_CLASSES"]):
        class_indices = np.where(labels == class_idx)[0]
        rng.shuffle(class_indices)
        splits = np.array_split(class_indices, num_clients)
        for client_id, split in enumerate(splits):
            client_indices[client_id].extend(split.tolist())

    for client_id in range(num_clients):
        rng.shuffle(client_indices[client_id])

    return client_indices


def make_client_indices(dataframe, seed=42):
    method = str(CONFIG.get("PARTITION_METHOD", "dirichlet"))
    if method == "stratified_balanced":
        return stratified_balanced_partition(
            dataframe,
            num_clients=CONFIG["NUM_CLIENTS"],
            seed=seed,
        )
    if method == "dirichlet":
        return dirichlet_partition(
            dataframe,
            num_clients=CONFIG["NUM_CLIENTS"],
            alpha=CONFIG["DIRICHLET_ALPHA"],
            seed=seed,
        )
    raise ValueError(f"Unknown PARTITION_METHOD={method}. Use 'dirichlet' or 'stratified_balanced'.")



client_indices = make_client_indices(train_df, seed=CONFIG["SPLIT_SEED"])

client_summary = []
for cid, idxs in enumerate(client_indices):
    sub = train_df.iloc[idxs]
    counts = sub["dx"].value_counts().reindex(CLASS_ORDER).fillna(0).astype(int)
    row = {"client_id": cid, "n": len(sub)}
    row.update(counts.to_dict())
    client_summary.append(row)

client_summary_df = pd.DataFrame(client_summary)
display(client_summary_df)

plt.figure(figsize=(12, 5))
bottom = np.zeros(len(client_summary_df))
x = client_summary_df["client_id"].astype(str)
for cls in CLASS_ORDER:
    plt.bar(x, client_summary_df[cls], bottom=bottom, label=cls)
    bottom += client_summary_df[cls].values
plt.xlabel("Client institution")
plt.ylabel("Number of images")
plt.title(f"Client class distribution ({CONFIG.get('PARTITION_METHOD', 'dirichlet')}, alpha={CONFIG.get('DIRICHLET_ALPHA', None)})")
plt.legend(ncol=4)
plt.grid(axis="y", alpha=0.3)
plt.show()
