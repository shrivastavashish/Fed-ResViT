def scientific_source(obj):
    if inspect.isclass(obj):
        methods = []
        for name, value in sorted(obj.__dict__.items()):
            if isinstance(value, (staticmethod, classmethod)):
                value = value.__func__
            if inspect.isfunction(value):
                methods.append(name + '\n' + inspect.getsource(value))
        return obj.__name__ + '\n' + ''.join(methods)
    return inspect.getsource(obj)

def jsonable(x):
    if isinstance(x, dict):
        return {str(k): jsonable(v) for k, v in x.items()}
    if isinstance(x, (list, tuple, set)):
        return [jsonable(v) for v in x]
    if isinstance(x, np.ndarray):
        return jsonable(x.tolist())
    if isinstance(x, np.generic):
        return jsonable(x.item())
    if isinstance(x, Path):
        return str(x)
    if isinstance(x, float) and (not np.isfinite(x)):
        return None
    return x

def canonical(x):
    return json.dumps(jsonable(x), sort_keys=True, separators=(',', ':'), allow_nan=False)

def atomic_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    with open(temp, 'w') as f:
        f.write(json.dumps(jsonable(value), indent=2, allow_nan=False))
        f.flush()
        os.fsync(f.fileno())
    os.replace(temp, path)

def capture_rng():
    return dict(python=random.getstate(), numpy=np.random.get_state(), torch=torch.get_rng_state(), cuda=torch.cuda.get_rng_state_all() if torch.cuda.is_available() else None)

def restore_rng(state):
    random.setstate(state['python'])
    np.random.set_state(state['numpy'])
    torch.set_rng_state(state['torch'])
    if state['cuda'] is not None:
        if not torch.cuda.is_available() or len(state['cuda']) != torch.cuda.device_count():
            raise RuntimeError('CUDA topology changed; exact continuation is not supported.')
        torch.cuda.set_rng_state_all(state['cuda'])

def environment_record():
    from importlib.metadata import version, PackageNotFoundError
    packages = {}
    for p in ['torch', 'torchvision', 'timm', 'numpy', 'pandas', 'scikit-learn', 'scipy', 'Pillow']:
        try:
            packages[p] = version(p)
        except PackageNotFoundError:
            packages[p] = 'unavailable'
    return dict(python=platform.python_version(), packages=packages, cuda=torch.version.cuda, gpu=torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU', cuda_devices=torch.cuda.device_count(), cudnn=torch.backends.cudnn.version(), deterministic=torch.are_deterministic_algorithms_enabled(), cudnn_benchmark=torch.backends.cudnn.benchmark, cudnn_deterministic=torch.backends.cudnn.deterministic, matmul_tf32=torch.backends.cuda.matmul.allow_tf32, cudnn_tf32=torch.backends.cudnn.allow_tf32, cublas_workspace=os.environ.get('CUBLAS_WORKSPACE_CONFIG'))

def save_recovery(folder, state):
    """Two alternating generations; incomplete writes never replace a valid generation.
    Drive FUSE durability is best-effort: retain the prior generation + checksum.
    Only load checkpoints produced by this trusted notebook (torch uses pickle).
    """
    folder = Path(folder)
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / f'recovery-{int(state['round']) % 2}.pt'
    temp = folder / 'recovery-writing.tmp'
    with open(temp, 'wb') as f:
        torch.save(state, f)
        f.flush()
        os.fsync(f.fileno())
    digest = file_sha(temp)
    os.replace(temp, path)
    atomic_json(str(path) + '.sha256.json', {'sha256': digest})

def file_sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for block in iter(lambda: f.read(8 * 1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

def load_recovery(folder, run_id, environment):
    candidates = []
    errors = []
    for p in Path(folder).glob('recovery-*.pt'):
        try:
            expected = json.loads(Path(str(p) + '.sha256.json').read_text())['sha256']
            if file_sha(p) != expected:
                raise ValueError('Checksum mismatch')
            state = torch.load(p, map_location='cpu', weights_only=False)
            if state['run_id'] != run_id:
                raise ValueError('Wrong experiment ID')
            if state['environment'] != environment:
                raise ValueError('Environment mismatch; restore the original environment')
            candidates.append(state)
        except Exception as e:
            errors.append(f'{p.name}: {e}')
    if errors:
        warnings.warn('Recovery validation: ' + '; '.join(errors))
    if candidates:
        return max(candidates, key=lambda x: x['round'])
    if errors:
        raise RuntimeError('No compatible valid recovery. Refusing to silently restart.')
    return None

def validate_updates(updates):
    if not updates:
        raise ValueError('No client updates')
    keys = list(updates[0])
    for d in updates:
        if list(d) != keys:
            raise ValueError('Update keys differ')
        for k in keys:
            if d[k].shape != updates[0][k].shape:
                raise ValueError('Update shapes differ')
            if d[k].is_floating_point() and (not torch.isfinite(d[k]).all()):
                raise ValueError('Nonfinite update')

def aggregate_krum_checked(updates, f, multi=False, m=None):
    validate_updates(updates)
    n = len(updates)
    f = int(f)
    if f < 0 or n <= 2 * f + 2:
        raise ValueError(f'Krum requires n > 2f+2; n={n}, f={f}')
    distances = np.zeros((n, n), dtype=np.float64)
    for i in range(n):
        for j in range(i):
            v = sum((float(((updates[i][k].double() - updates[j][k].double()) ** 2).sum()) for k in updates[i] if updates[i][k].is_floating_point()))
            distances[i, j] = distances[j, i] = v
    nearest_count = n - f - 2
    scores = [np.sort(np.delete(distances[i], i))[:nearest_count].sum() for i in range(n)]
    count = (nearest_count if m is None else int(m)) if multi else 1
    if not 1 <= count <= nearest_count:
        raise ValueError('Multi-Krum m must be in [1,n-f-2]')
    selected = np.argsort(scores, kind='stable')[:count]
    return {k: torch.stack([updates[i][k].float() for i in selected]).mean(0).to(v.dtype) if v.is_floating_point() else v.clone() for k, v in updates[0].items()}

def aggregate_coordinate(updates, trim_count=None):
    validate_updates(updates)
    n = len(updates)
    if trim_count is not None and (trim_count < 0 or 2 * trim_count >= n):
        raise ValueError('Invalid trim count')
    out = {}
    for k, v in updates[0].items():
        if not v.is_floating_point():
            out[k] = v.clone()
            continue
        a = torch.stack([d[k].float() for d in updates]).sort(dim=0).values
        if trim_count is None:
            out[k] = ((a[(n - 1) // 2] + a[n // 2]) / 2).to(v.dtype)
        else:
            out[k] = a[trim_count:n - trim_count].mean(0).to(v.dtype)
    return out

def additional_metrics(y_true, y_pred, malignant_ids, target, classes):
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    malignant = np.isin(y_true, malignant_ids)
    predicted_malignant = np.isin(y_pred, malignant_ids)
    denom = int(malignant.sum())
    tp = int((malignant & predicted_malignant).sum())
    fn = int((malignant & ~predicted_malignant).sum())
    fp = int((~malignant & predicted_malignant).sum())
    tn = int((~malignant & ~predicted_malignant).sum())
    result = dict(malignant_support=denom, malignant_binary_tp=tp, malignant_binary_fn=fn, malignant_binary_fp=fp, malignant_binary_tn=tn, malignant_binary_recall=tp / denom if denom else np.nan, malignant_exact_recall=float((y_true[malignant] == y_pred[malignant]).mean()) if denom else np.nan, malignant_to_nv_rate=float((y_pred[malignant] == target).mean()) if denom else np.nan)
    recalls = []
    for i in malignant_ids:
        mask = y_true == i
        count = int(mask.sum())
        value = float((y_pred[mask] == i).mean()) if count else np.nan
        result[f'{classes[i]}_recall'] = value
        result[f'{classes[i]}_support'] = count
        recalls.append(value)
    result['malignant_macro_recall'] = float(np.nanmean(recalls)) if denom else np.nan
    return result

def detector_counts(flags, malicious, n):
    truth = np.array([i in malicious for i in range(n)], dtype=bool)
    flags = np.asarray(flags, dtype=bool)
    return dict(detector_tp=int((flags & truth).sum()), detector_fp=int((flags & ~truth).sum()), detector_tn=int((~flags & ~truth).sum()), detector_fn=int((~flags & truth).sum()))

def validate_partition(indices, size, minimum=1):
    flat = [int(i) for part in indices for i in part]
    if sorted(flat) != list(range(size)):
        raise ValueError('Partition must cover each training row exactly once')
    if min(map(len, indices)) < minimum:
        raise ValueError('Client too small for the declared minimum')

def adaptive_camouflage(updates, malicious, trust_probe, grid):
    """Omniscient same-round, defense-aware update attacker.
    Sees every pre-aggregation update; blends poisoned updates toward the geometric
    median of HONEST updates. Searches largest poison retention accepted by the
    current Trust score/flag threshold. Does not access validation/test labels.
    A new Trust clone evaluates every candidate; real reputation is not mutated.
    This is one bounded adaptive strategy, not a universal/worst-case attacker.
    """
    if not malicious:
        return (updates, {'attack': 'none'})
    honest = [d for i, d in enumerate(updates) if i not in malicious]
    reference = aggregate_geometric_median(honest, max_iters=trust_probe.geom_median_iters)
    chosen = None
    trace = []
    for scale in sorted(set((float(x) for x in grid)), reverse=True):
        if not 0 <= scale <= 1:
            raise ValueError('Attack blend must be within [0,1]')
        candidate = list(updates)
        for i in malicious:
            candidate[i] = {k: reference[k] + scale * (updates[i][k] - reference[k]) if v.is_floating_point() else v.clone() for k, v in reference.items()}
        probe = copy.deepcopy(trust_probe)
        _, info = probe.aggregate(candidate, [1] * len(candidate))
        accepted = all((info['phi'][i] >= probe.flag_phi_threshold for i in malicious))
        trace.append(dict(scale=scale, accepted=accepted, phi=info['phi'].tolist(), distances=info['distances'].tolist()))
        chosen = (candidate, dict(attack='adaptive_omniscient_blend', selected_scale=scale, accepted=accepted, search=trace))
        if accepted:
            break
    if chosen is None:
        raise ValueError('Empty attack grid')
    return chosen

def data_manifest(frames):
    records = {}
    for name, frame in frames.items():
        cols = [k for k in ['image_id', 'lesion_id', 'label_idx', 'image_sha256'] if k in frame]
        records[name] = frame[cols].to_dict('records')
    return records

class SessionBudgetReached(RuntimeError):
    pass

def run_identified(aggregation_method, malicious_fraction, seed, num_rounds, local_epochs):
    """Isolate all artifacts and resume state by full settings/data/code identity."""
    set_seed(seed)
    old_output = CONFIG['OUTPUT_DIR']
    runtime_keys = {'OUTPUT_DIR', 'RESUME_FROM_PARTIAL', 'DRIVE_OUTPUT_DIR', 'MAX_RUNS_PER_SESSION', 'SESSION_HOURS'}
    cfg = {k: v for k, v in CONFIG.items() if k not in runtime_keys}
    cfg.update(aggregation=aggregation_method, malicious_fraction=malicious_fraction, seed=seed, actual_rounds=num_rounds, actual_local_epochs=local_epochs)
    manifest = data_manifest({'train': train_df, 'validation': val_df, 'test': test_df})
    identity = {'revision': REVISION, 'code_sha256': RESEARCH_CODE_SHA, 'config': cfg, 'pipeline': {'train': repr(train_tfms), 'evaluation': repr(globals().get('eval_tfms')), 'classes': list(CLASS_ORDER), 'malignant_ids': list(MALIGNANT_IDXS), 'target_id': int(TARGET_BENIGN_IDX)}, 'data_sha256': hashlib.sha256(canonical(manifest).encode()).hexdigest()}
    run_id = hashlib.sha256(canonical(identity).encode()).hexdigest()[:24]
    folder = Path(STUDY_ROOT) / 'runs' / run_id
    folder.mkdir(parents=True, exist_ok=True)
    env = environment_record()
    manifest_path = folder / 'manifest.json'
    if manifest_path.exists():
        prior = json.loads(manifest_path.read_text())
        if prior['identity'] != jsonable(identity):
            raise RuntimeError('Manifest identity mismatch')
        if prior['environment'] != env:
            raise RuntimeError('Environment changed. Restore the recorded environment before resuming or reusing this run.')
    else:
        atomic_json(manifest_path, dict(identity=identity, run_id=run_id, environment=env))
        atomic_json(folder / 'split_manifest.json', manifest)
    CONFIG['OUTPUT_DIR'] = str(folder)
    globals()['ACTIVE_RUN_ID'] = run_id
    globals()['ACTIVE_ENVIRONMENT'] = env
    try:
        done = folder / 'completed.json'
        if done.exists():
            saved = json.loads(done.read_text())
            if saved['run_id'] != run_id:
                raise RuntimeError('Completed ID mismatch')
            for name, digest in saved['artifact_sha256'].items():
                path = folder / name
                if not path.is_file() or file_sha(path) != digest:
                    raise RuntimeError(f'Completed artifact missing/corrupt: {name}. Restore backup; refusing silent reuse.')
            print('Skipping completed experiment', run_id)
            return {'result': saved['result'], 'history': pd.read_csv(folder / 'round_history.csv')}
        output = _run_federated_core(aggregation_method, malicious_fraction, seed, num_rounds, local_epochs)
        result = output['result']
        result.update(run_id=run_id, partition=CONFIG['PARTITION_METHOD'], dirichlet_alpha=CONFIG['DIRICHLET_ALPHA'], attack=CONFIG['ATTACK_MODE'], setting=CONFIG['SETTING'], num_clients=CONFIG['NUM_CLIENTS'], evidence_state='EXECUTED', environment=env, adversary_bound_policy='oracle_count', trim_count=int(round(CONFIG['NUM_CLIENTS'] * malicious_fraction)))
        output['history'].to_csv(folder / 'round_history.csv', index=False)
        for key in ['model_path', 'prediction_path', 'classification_report_path']:
            if not Path(result[key]).is_file():
                raise RuntimeError(f'Missing artifact {key}')
        required = [Path(result[k]) for k in ['model_path', 'prediction_path', 'classification_report_path']]
        required += [folder / n for n in ['confusion_matrix.csv', 'round_history.csv', 'round_history.json', 'clients.json', 'poison_stats.csv', 'split_manifest.json']]
        hashes = {p.name: file_sha(p) for p in required}
        atomic_json(done, dict(run_id=run_id, result=result, artifact_sha256=hashes))
        return output
    finally:
        CONFIG['OUTPUT_DIR'] = old_output

def build_plan(stage, include_multikrum=False):
    methods = ['fedavg', 'krum', 'trimmed_mean', 'coordinate_median', 'trust']
    if include_multikrum:
        methods.insert(2, 'multi_krum')
    rows = []

    def add(part, frac, method, seed, attack='targeted_label_flipping', setting='default', overrides=None):
        rows.append(dict(partition=part, malicious_fraction=frac, aggregation=method, seed=seed, attack='none' if frac == 0 else attack, setting=setting, overrides=overrides or {}))
    if stage == 'pilot':
        for method in methods:
            add('dirichlet', 0.2, method, 42)
    elif stage == 'main':
        for part in ['stratified_balanced', 'dirichlet']:
            for seed in [42, 43, 44, 45, 46]:
                for frac in [0.0, 0.1, 0.2, 0.3]:
                    for method in methods:
                        add(part, frac, method, seed)
    elif stage == 'adaptive':
        for seed in [42, 43, 44, 45, 46]:
            for method in methods:
                add('dirichlet', 0.2, method, seed, 'adaptive_omniscient_blend')
    elif stage == 'sensitivity':
        settings = {'default': {}, 'mad_narrow': {'TRUST_MAD_LOW_MULT': 0.25, 'TRUST_MAD_HIGH_MULT': 2.0}, 'mad_wide': {'TRUST_MAD_LOW_MULT': 1.0, 'TRUST_MAD_HIGH_MULT': 4.0}, 'ema_fast': {'TRUST_MOMENTUM': 0.7}, 'ema_slow': {'TRUST_MOMENTUM': 0.95}, 'flag_low': {'TRUST_FLAG_PHI_THRESHOLD': 0.25}, 'flag_high': {'TRUST_FLAG_PHI_THRESHOLD': 0.75}, 'window_1': {'TRUST_FLAG_ROUNDS': 1}, 'window_10': {'TRUST_FLAG_ROUNDS': 10}}
        for seed in [42, 43, 44, 45, 46]:
            for setting, ov in settings.items():
                add('dirichlet', 0.2, 'trust', seed, setting=setting, overrides=ov)
    else:
        raise ValueError('Stage must be pilot, main, adaptive, or sensitivity')
    return rows

def collect_results(root):
    rows = []
    for path in (Path(root) / 'runs').glob('*/completed.json'):
        row = json.loads(path.read_text())['result']
        row['artifact_dir'] = str(path.parent)
        rows.append(row)
    frame = pd.DataFrame(rows)
    keys = ['partition', 'dirichlet_alpha', 'attack', 'malicious_fraction', 'setting', 'num_clients', 'aggregation', 'seed']
    if not frame.empty and frame.duplicated(keys).any():
        raise ValueError('Multiple protocols/revisions share a result key. Use separate study roots; summaries must not pool them.')
    return frame

def run_study(plan):
    original = copy.deepcopy(CONFIG)
    outputs = []
    globals()['SESSION_DEADLINE'] = time.monotonic() + 3600 * SESSION_HOURS
    try:
        for job in plan[JOB_START:JOB_STOP]:
            if time.monotonic() >= SESSION_DEADLINE:
                break
            CONFIG.clear()
            CONFIG.update(copy.deepcopy(original))
            CONFIG.update(PARTITION_METHOD=job['partition'], ATTACK_MODE=job['attack'], SETTING=job['setting'])
            CONFIG.update(job['overrides'])
            try:
                outputs.append(run_identified(job['aggregation'], job['malicious_fraction'], job['seed'], CONFIG['NUM_ROUNDS'], CONFIG['LOCAL_EPOCHS']))
            except SessionBudgetReached as e:
                print(e)
                break
        return outputs
    finally:
        CONFIG.clear()
        CONFIG.update(original)
        records = collect_results(STUDY_ROOT)
        records.to_csv(Path(STUDY_ROOT) / 'all_completed_results.csv', index=False)

def statistical_report(results, folder):
    """Complete paired seeds only; Holm correction across all tests in this export."""
    from scipy.stats import ttest_rel, wilcoxon
    grouping = ['partition', 'dirichlet_alpha', 'attack', 'malicious_fraction', 'setting', 'num_clients']
    metrics = ['test_macro_f1', 'test_asr', 'test_malignant_binary_recall', 'test_macro_precision', 'test_macro_recall', 'test_accuracy', 'test_macro_specificity']
    comparisons = []
    differences = []
    if results.empty:
        return pd.DataFrame()
    for group, sub in results.groupby(grouping, dropna=False):
        for method in sorted(set(sub.aggregation) - {'trust'}):
            for metric in metrics:
                if metric not in sub:
                    continue
                selected = sub[sub.aggregation.isin(['trust', method])]
                if selected.duplicated(['seed', 'aggregation']).any():
                    raise ValueError('Multiple experiments share a comparison key; filter to one protocol/revision first')
                paired = selected.pivot(index='seed', columns='aggregation', values=metric)
                if 'trust' not in paired or method not in paired:
                    continue
                paired = paired[['trust', method]].dropna()
                d = paired['trust'] - paired[method]
                n = len(d)
                row = dict(zip(grouping, group))
                row.update(baseline=method, metric=metric, n=n, mean_difference=float(d.mean()) if n else None, sd_difference=float(d.std(ddof=1)) if n > 1 else None, paired_t_p=None, wilcoxon_p=None, status='descriptive_only')
                for seed, value in d.items():
                    differences.append(dict(row, seed=int(seed), difference=float(value)))
                if n >= 5:
                    row['status'] = 'exploratory_small_sample'
                    if np.all(d.to_numpy() == 0):
                        row.update(paired_t_p=1.0, wilcoxon_p=1.0)
                    else:
                        if float(d.std(ddof=1)) > 1e-15:
                            row['paired_t_p'] = float(ttest_rel(paired['trust'], paired[method]).pvalue)
                        row['wilcoxon_p'] = float(wilcoxon(d, method='auto').pvalue)
                comparisons.append(row)
    for name in ['paired_t_p', 'wilcoxon_p']:
        valid = sorted([(i, r[name]) for i, r in enumerate(comparisons) if r[name] is not None and np.isfinite(r[name])], key=lambda x: x[1])
        prev = 0.0
        for rank, (i, p) in enumerate(valid):
            prev = max(prev, min(1.0, p * (len(valid) - rank)))
            comparisons[i][name + '_holm'] = prev
    frame = pd.DataFrame(comparisons)
    frame.to_csv(Path(folder) / 'paired_statistics.csv', index=False)
    pd.DataFrame(differences).to_csv(Path(folder) / 'paired_seed_differences.csv', index=False)
    return frame
