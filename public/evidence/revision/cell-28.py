def dirichlet_partition(dataframe, num_clients=10, alpha=0.5, seed=42, min_size=None):
    minimum = int(CONFIG.get('MIN_CLIENT_SAMPLES', 16) if min_size is None else min_size)
    if alpha <= 0 or len(dataframe) < num_clients * minimum:
        raise ValueError('Invalid alpha or insufficient data for minimum client size')
    rng = np.random.default_rng(seed)
    labels = dataframe['label_idx'].to_numpy()
    for attempt in range(1000):
        parts = [[] for _ in range(num_clients)]
        for c in range(CONFIG['NUM_CLASSES']):
            ids = np.where(labels == c)[0]
            rng.shuffle(ids)
            counts = rng.multinomial(len(ids), rng.dirichlet(np.full(num_clients, alpha)))
            for i, chunk in enumerate(np.split(ids, np.cumsum(counts)[:-1])):
                parts[i].extend(chunk.tolist())
        if min(map(len, parts)) >= minimum:
            for part in parts:
                rng.shuffle(part)
            return parts
    raise RuntimeError('Dirichlet minimum-size rejection sampler exhausted; revise protocol explicitly')

def stratified_balanced_partition(dataframe, num_clients=5, seed=42):
    """Near-IID client split with each class distributed across all clients.

    Use this only for clean high-accuracy experiments. For robustness/non-IID
    manuscript experiments, keep PARTITION_METHOD="dirichlet".
    """
    rng = np.random.default_rng(seed)
    labels = dataframe['label_idx'].values
    client_indices = [[] for _ in range(num_clients)]
    for class_idx in range(CONFIG['NUM_CLASSES']):
        class_indices = np.where(labels == class_idx)[0]
        rng.shuffle(class_indices)
        splits = np.array_split(class_indices, num_clients)
        for client_id, split in enumerate(splits):
            client_indices[client_id].extend(split.tolist())
    for client_id in range(num_clients):
        rng.shuffle(client_indices[client_id])
    return client_indices

def make_client_indices(dataframe, seed=42):
    method = str(CONFIG.get('PARTITION_METHOD', 'dirichlet'))
    if method == 'stratified_balanced':
        return stratified_balanced_partition(dataframe, num_clients=CONFIG['NUM_CLIENTS'], seed=seed)
    if method == 'dirichlet':
        return dirichlet_partition(dataframe, num_clients=CONFIG['NUM_CLIENTS'], alpha=CONFIG['DIRICHLET_ALPHA'], seed=seed)
    raise ValueError(f"Unknown PARTITION_METHOD={method}. Use 'dirichlet' or 'stratified_balanced'.")
