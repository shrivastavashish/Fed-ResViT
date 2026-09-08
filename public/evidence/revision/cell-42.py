def make_client_dataframes(train_df, client_indices, malicious_clients=None, seed=42):
    if malicious_clients is None:
        malicious_clients = set()
    client_dfs = []
    poison_stats = []
    for cid, idxs in enumerate(client_indices):
        client_df = train_df.iloc[idxs].copy().reset_index(drop=True)
        if cid in malicious_clients:
            client_df = poison_client_dataframe(client_df, flip_prob=CONFIG['FLIP_PROB'], seed=seed + cid)
            flipped = int(client_df['is_flipped'].sum())
        else:
            client_df['original_label_idx'] = client_df['label_idx'].values
            client_df['is_flipped'] = 0
            flipped = 0
        client_dfs.append(client_df)
        poison_stats.append({'client_id': cid, 'is_malicious': cid in malicious_clients, 'n': len(client_df), 'flipped_labels': flipped, 'flip_rate_within_client': flipped / max(len(client_df), 1)})
    return (client_dfs, pd.DataFrame(poison_stats))

def choose_malicious_clients(num_clients, malicious_fraction, seed=42):
    rng = np.random.default_rng(seed)
    n_mal = int(round(num_clients * malicious_fraction))
    n_mal = min(max(n_mal, 0), num_clients)
    if n_mal == 0:
        return set()
    return set(rng.choice(num_clients, size=n_mal, replace=False).tolist())

def detection_metrics(flagged, malicious_clients, num_clients):
    """Detection rate = TP / (#malicious); FPR = FP / (#benign)."""
    flagged = np.asarray(flagged).astype(bool)
    malicious_mask = np.array([i in malicious_clients for i in range(num_clients)], dtype=bool)
    if malicious_mask.sum() > 0:
        detection_rate = float(np.mean(flagged[malicious_mask]))
    else:
        detection_rate = np.nan
    benign_mask = ~malicious_mask
    if benign_mask.sum() > 0:
        false_positive_rate = float(np.mean(flagged[benign_mask]))
    else:
        false_positive_rate = np.nan
    return (detection_rate, false_positive_rate)

def _clean_asr_if_no_attack(metrics, malicious_fraction):
    """ASR is only defined under attack (Sec 5.5)."""
    metrics = dict(metrics)
    if malicious_fraction == 0:
        metrics['asr'] = np.nan
        metrics['malignant_safety'] = np.nan
    return metrics

def _safe_model_filename(aggregation_method, malicious_fraction, seed):
    mal_tag = str(malicious_fraction).replace('.', 'p')
    return f'{aggregation_method}_mal{mal_tag}_seed{seed}.pt'

def _weighted_delta_accumulate(acc, delta, weight):
    """Streaming FedAvg helper: avoids storing all client deltas in RAM."""
    if acc is None:
        out = {}
        for k, v in delta.items():
            if is_float_tensor(v):
                out[k] = v.float() * float(weight)
            else:
                out[k] = v.clone()
        return out
    for k, v in delta.items():
        if is_float_tensor(v):
            acc[k] += v.float() * float(weight)
    return acc

def _finalize_weighted_delta(acc, total_weight):
    out = {}
    total_weight = max(float(total_weight), 1e-12)
    for k, v in acc.items():
        if is_float_tensor(v):
            out[k] = (v.float() / total_weight).to(dtype=v.dtype)
        else:
            out[k] = v.clone()
    return out

def _run_federated_core(aggregation_method='trust', malicious_fraction=0.2, seed=42, num_rounds=None, local_epochs=None):
    set_seed(seed)
    if num_rounds is None:
        num_rounds = CONFIG['NUM_ROUNDS']
    if local_epochs is None:
        local_epochs = CONFIG['LOCAL_EPOCHS']
    client_indices = make_client_indices(train_df, seed=seed)
    malicious_clients = choose_malicious_clients(CONFIG['NUM_CLIENTS'], malicious_fraction, seed=seed + 1000)
    client_dfs, poison_stats = make_client_dataframes(train_df, client_indices, malicious_clients=malicious_clients, seed=seed)
    client_sizes = [len(cdf) for cdf in client_dfs]
    validate_partition(client_indices, len(train_df), CONFIG.get('MIN_CLIENT_SAMPLES', 16))
    atomic_json(Path(CONFIG['OUTPUT_DIR']) / 'clients.json', {'indices': client_indices, 'sizes': client_sizes, 'malicious_clients': sorted(malicious_clients), 'class_counts': [d['label_idx'].value_counts().to_dict() for d in client_dfs]})
    poison_stats.to_csv(Path(CONFIG['OUTPUT_DIR']) / 'poison_stats.csv', index=False)
    global_model = build_model().to(DEVICE)
    global_state = clone_state_dict(global_model.state_dict())
    local_model = build_model().to(DEVICE)
    trust_agg = None
    if aggregation_method == 'trust':
        trust_agg = TrustAwareAggregator(num_clients=CONFIG['NUM_CLIENTS'], t_low=CONFIG['TRUST_T_LOW'], t_high=CONFIG['TRUST_T_HIGH'], momentum=CONFIG['TRUST_MOMENTUM'], flag_phi_threshold=CONFIG['TRUST_FLAG_PHI_THRESHOLD'], flag_rounds=CONFIG['TRUST_FLAG_ROUNDS'], geom_median_iters=CONFIG['TRUST_GEOM_MEDIAN_ITERS'], distance_mode=CONFIG.get('TRUST_DISTANCE_MODE', 'rms'), adaptive_thresholds=CONFIG.get('TRUST_ADAPTIVE_THRESHOLDS', True), mad_low_mult=CONFIG.get('TRUST_MAD_LOW_MULT', 0.5), mad_high_mult=CONFIG.get('TRUST_MAD_HIGH_MULT', 3.0))
    attack_probe = trust_agg if trust_agg is not None else TrustAwareAggregator(num_clients=CONFIG['NUM_CLIENTS'], t_low=CONFIG['TRUST_T_LOW'], t_high=CONFIG['TRUST_T_HIGH'], momentum=CONFIG['TRUST_MOMENTUM'], flag_phi_threshold=CONFIG['TRUST_FLAG_PHI_THRESHOLD'], flag_rounds=CONFIG['TRUST_FLAG_ROUNDS'], geom_median_iters=CONFIG['TRUST_GEOM_MEDIAN_ITERS'], distance_mode=CONFIG['TRUST_DISTANCE_MODE'], adaptive_thresholds=CONFIG['TRUST_ADAPTIVE_THRESHOLDS'], mad_low_mult=CONFIG['TRUST_MAD_LOW_MULT'], mad_high_mult=CONFIG['TRUST_MAD_HIGH_MULT'])
    history = []
    last_trust_info = None
    best_state = None
    best_round = None
    best_metric_value = -np.inf
    best_metric_name = str(CONFIG.get('BEST_MODEL_METRIC', 'accuracy'))
    print('=' * 90)
    print(f'Aggregator: {aggregation_method} | malicious_fraction={malicious_fraction} | seed={seed}')
    print('Malicious clients:', sorted(malicious_clients))
    display(poison_stats)
    start_round = 1
    recovery = load_recovery(CONFIG['OUTPUT_DIR'], ACTIVE_RUN_ID, ACTIVE_ENVIRONMENT)
    if recovery is not None:
        global_state = recovery['global_state']
        global_model.load_state_dict(global_state)
        best_state = recovery['best_state']
        best_round = recovery['best_round']
        best_metric_value = recovery['best_metric_value']
        history = recovery['history']
        last_trust_info = recovery['last_trust_info']
        if trust_agg is not None:
            trust_agg.__dict__.update(recovery['trust_state'])
        attack_probe.__dict__.update(recovery['probe_state'])
        restore_rng(recovery['rng'])
        start_round = recovery['round'] + 1
        print('RESUME: last saved round', recovery['round'], 'next', start_round)
    del recovery
    for round_idx in range(start_round, num_rounds + 1):
        if time.monotonic() >= globals().get('SESSION_DEADLINE', float('inf')):
            raise SessionBudgetReached('Session budget reached. Rerun the same plan to resume.')
        round_start = time.time()
        base_state = clone_state_dict(global_state)
        current_lr = round_learning_rate(round_idx, num_rounds)
        train_losses = []
        detection_rate_current = np.nan
        false_positive_rate_current = np.nan
        fedavg_acc = None
        fedavg_weight = 0.0
        stream_fedavg = aggregation_method == 'fedavg' and CONFIG['ATTACK_MODE'] != 'adaptive_omniscient_blend'
        client_deltas = None if stream_fedavg else []
        for cid, client_df in enumerate(tqdm(client_dfs, desc=f'Round {round_idx}/{num_rounds}', leave=False)):
            loader = make_loader(client_df, train_tfms, batch_size=CONFIG['BATCH_SIZE'], shuffle=True, balanced_sampler=CONFIG.get('USE_CLIENT_BALANCED_SAMPLER', False))
            local_model.load_state_dict(base_state, strict=True)
            loss = train_local_model(local_model, loader, local_epochs=local_epochs, lr=current_lr, weight_decay=CONFIG['WEIGHT_DECAY'], device=DEVICE, max_batches=CONFIG.get('MAX_TRAIN_BATCHES_PER_CLIENT', None))
            local_state = clone_state_dict(local_model.state_dict())
            client_delta = subtract_state_dict(local_state, base_state)
            train_losses.append(loss)
            if stream_fedavg:
                fedavg_acc = _weighted_delta_accumulate(fedavg_acc, client_delta, client_sizes[cid])
                fedavg_weight += float(client_sizes[cid])
                del local_state, client_delta
            else:
                client_deltas.append(client_delta)
                del local_state
            del loader
            if CONFIG.get('CLEAR_CUDA_EACH_CLIENT', False):
                cleanup_memory()
        attack_info = {'attack': CONFIG['ATTACK_MODE']}
        if CONFIG['ATTACK_MODE'] == 'adaptive_omniscient_blend' and malicious_clients:
            client_deltas, attack_info = adaptive_camouflage(client_deltas, malicious_clients, attack_probe, CONFIG['ADAPTIVE_BLEND_GRID'])
            if aggregation_method != 'trust':
                attack_probe.aggregate(client_deltas, client_sizes)
        if aggregation_method == 'fedavg' and (not stream_fedavg):
            aggregated_delta = aggregate_weighted_average(client_deltas, client_sizes)
        elif stream_fedavg:
            aggregated_delta = _finalize_weighted_delta(fedavg_acc, fedavg_weight)
            del fedavg_acc
        elif aggregation_method == 'krum':
            f = len(malicious_clients)
            aggregated_delta = aggregate_krum_delta(client_deltas, f=f)
        elif aggregation_method == 'multi_krum':
            aggregated_delta = aggregate_krum_checked(client_deltas, len(malicious_clients), multi=True, m=CONFIG.get('MULTI_KRUM_M'))
        elif aggregation_method == 'coordinate_median':
            aggregated_delta = aggregate_coordinate(client_deltas)
        elif aggregation_method == 'trimmed_mean':
            aggregated_delta = aggregate_coordinate(client_deltas, trim_count=len(malicious_clients))
        elif aggregation_method == 'trust':
            aggregated_delta, last_trust_info = trust_agg.aggregate(client_deltas, client_sizes)
            detection_rate_current, false_positive_rate_current = detection_metrics(last_trust_info['flagged_now'], malicious_clients, CONFIG['NUM_CLIENTS'])
        else:
            raise ValueError(f'Unknown aggregation method: {aggregation_method}')
        if client_deltas is not None:
            del client_deltas
        global_state = add_delta_to_state(base_state, aggregated_delta)
        global_model.load_state_dict(global_state, strict=True)
        del base_state, aggregated_delta
        cleanup_memory()
        if round_idx % CONFIG.get('EVAL_EVERY', 1) == 0 or round_idx == num_rounds:
            val_metrics, _, _, _ = evaluate_model(global_model, val_loader, DEVICE, max_batches=CONFIG.get('MAX_VAL_BATCHES', None))
            val_metrics = _clean_asr_if_no_attack(val_metrics, malicious_fraction)
        else:
            val_metrics = {'accuracy': np.nan, 'macro_precision': np.nan, 'macro_recall': np.nan, 'macro_f1': np.nan, 'macro_specificity': np.nan, 'asr': np.nan, 'malignant_safety': np.nan}
        if CONFIG.get('USE_BEST_VAL_MODEL', False):
            metric_value = val_metrics.get(best_metric_name, np.nan)
            if round_idx >= int(CONFIG.get('BEST_MODEL_MIN_ROUND', 1)) and metric_value is not None and (not np.isnan(metric_value)) and (float(metric_value) > float(best_metric_value)):
                if best_state is not None:
                    del best_state
                best_state = clone_state_dict(global_state)
                best_metric_value = float(metric_value)
                best_round = int(round_idx)
        elapsed = time.time() - round_start
        row = {'seed': seed, 'round': round_idx, 'aggregation': aggregation_method, 'malicious_fraction': malicious_fraction, 'num_malicious': len(malicious_clients), 'malicious_clients': sorted(list(malicious_clients)), 'avg_train_loss': float(np.mean(train_losses)), 'round_lr': float(current_lr), 'round_seconds': elapsed, 'detection_rate_current': detection_rate_current, 'false_positive_rate_current': false_positive_rate_current}
        row.update({f'val_{k}': v for k, v in val_metrics.items()})
        if last_trust_info is not None:
            row.update({'trust_mean_phi': float(np.mean(last_trust_info['phi'])), 'trust_min_phi': float(np.min(last_trust_info['phi'])), 'trust_mean_reputation': float(np.mean(last_trust_info['reputation'])), 'trust_min_reputation': float(np.min(last_trust_info['reputation'])), 'trust_num_flagged_now': int(np.sum(last_trust_info['flagged_now'])), 'trust_distance_mode': last_trust_info.get('distance_mode', ''), 'trust_round_t_low': float(last_trust_info.get('round_t_low', np.nan)), 'trust_round_t_high': float(last_trust_info.get('round_t_high', np.nan))})
        row['attack_info'] = jsonable(attack_info)
        if last_trust_info is not None:
            row.update(detector_counts(last_trust_info['flagged_now'], malicious_clients, CONFIG['NUM_CLIENTS']))
            row['client_trust'] = jsonable(last_trust_info)
        history.append(row)
        save_recovery(CONFIG['OUTPUT_DIR'], dict(run_id=ACTIVE_RUN_ID, environment=ACTIVE_ENVIRONMENT, round=round_idx, global_state=global_state, best_state=best_state, best_round=best_round, best_metric_value=best_metric_value, history=history, last_trust_info=last_trust_info, trust_state=copy.deepcopy(trust_agg.__dict__) if trust_agg is not None else None, probe_state=copy.deepcopy(attack_probe.__dict__), rng=capture_rng()))
        atomic_json(Path(CONFIG['OUTPUT_DIR']) / 'round_history.json', history)
        pd.DataFrame(history).to_csv(Path(CONFIG['OUTPUT_DIR']) / 'round_history.csv', index=False)
        if globals().get('STOP_AFTER_ROUND') == round_idx:
            raise SessionBudgetReached(f'Deliberate recovery drill: saved round {round_idx}. Set STOP_AFTER_ROUND=None and rerun.')
        asr_print = 'NA (no attack)' if np.isnan(row['val_asr']) and malicious_fraction == 0 else 'NA' if np.isnan(row['val_asr']) else f'{row['val_asr']:.4f}'
        best_text = ''
        if CONFIG.get('USE_BEST_VAL_MODEL', False) and best_round is not None:
            best_text = f' | best_{best_metric_name}=round{best_round}:{best_metric_value:.4f}'
        print(f'Round {round_idx:03d} | loss={row['avg_train_loss']:.4f} | lr={current_lr:.2e} | val_acc={row['val_accuracy']:.4f} | val_f1={row['val_macro_f1']:.4f} | ASR={asr_print}{best_text} | time={elapsed:.1f}s')
        if last_trust_info is not None:
            print('  dist:', np.round(last_trust_info['distances'], 6), 'thr:', (round(last_trust_info.get('round_t_low', np.nan), 6), round(last_trust_info.get('round_t_high', np.nan), 6)), 'phi:', np.round(last_trust_info['phi'], 3), 'rep:', np.round(last_trust_info['reputation'], 3), 'flag_now:', last_trust_info['flagged_now'].astype(int))
    del local_model
    cleanup_memory()
    if CONFIG.get('USE_BEST_VAL_MODEL', False) and best_state is not None:
        print(f'Using best validation checkpoint from round {best_round} ({best_metric_name}={best_metric_value:.4f}) for final test.')
        global_state = best_state
        global_model.load_state_dict(global_state, strict=True)
    test_metrics, y_true, y_pred, y_prob = evaluate_model(global_model, test_loader, DEVICE, max_batches=CONFIG.get('MAX_TEST_BATCHES', None))
    test_metrics = _clean_asr_if_no_attack(test_metrics, malicious_fraction)
    result = {'seed': seed, 'aggregation': aggregation_method, 'malicious_fraction': malicious_fraction, 'num_malicious': len(malicious_clients), 'malicious_clients': sorted(list(malicious_clients)), 'best_val_round': best_round, f'best_val_{best_metric_name}': best_metric_value if best_round is not None else np.nan}
    result.update({f'test_{k}': v for k, v in test_metrics.items()})
    if last_trust_info is not None:
        final_det, final_fpr = detection_metrics(last_trust_info['flagged_now'], malicious_clients, CONFIG['NUM_CLIENTS'])
        result.update(detector_counts(last_trust_info['flagged_now'], malicious_clients, CONFIG['NUM_CLIENTS']))
        result['detection_scope'] = 'final_training_round_history_window_not_best_checkpoint'
        result['test_detection_rate'] = final_det
        result['test_false_positive_rate'] = final_fpr
        result['trust_final_phi'] = np.round(last_trust_info['phi'], 6).tolist()
        result['trust_final_reputation'] = np.round(last_trust_info['reputation'], 6).tolist()
    else:
        result['test_detection_rate'] = np.nan
        result['test_false_positive_rate'] = np.nan
        result['trust_final_phi'] = None
        result['trust_final_reputation'] = None
    model_name = _safe_model_filename(aggregation_method, malicious_fraction, seed)
    model_path = os.path.join(CONFIG['OUTPUT_DIR'], model_name)
    if CONFIG.get('SAVE_MODEL_CHECKPOINTS', True):
        torch.save(global_state, model_path)
        result['model_path'] = model_path
    else:
        result['model_path'] = 'not_saved_low_memory_mode'
    prediction_path = os.path.join(CONFIG['OUTPUT_DIR'], model_name.replace('.pt', '_predictions.npz'))
    if CONFIG.get('SAVE_PREDICTIONS_TO_DISK', True):
        np.savez_compressed(prediction_path, y_true=y_true.astype(np.int64), y_pred=y_pred.astype(np.int64), y_prob=y_prob.astype(np.float32))
        result['prediction_path'] = prediction_path
    else:
        result['prediction_path'] = ''
    report = classification_report(y_true, y_pred, labels=list(range(CONFIG['NUM_CLASSES'])), target_names=[CLASS_NAMES[c] for c in CLASS_ORDER], zero_division=0, output_dict=True)
    report_df = pd.DataFrame(report).T
    report_name = model_name.replace('.pt', '_classification_report.csv')
    report_path = os.path.join(CONFIG['OUTPUT_DIR'], report_name)
    report_df.to_csv(report_path)
    cm = confusion_matrix(y_true, y_pred, labels=list(range(CONFIG['NUM_CLASSES'])))
    pd.DataFrame(cm, index=CLASS_ORDER, columns=CLASS_ORDER).to_csv(Path(CONFIG['OUTPUT_DIR']) / 'confusion_matrix.csv')
    result['classification_report_path'] = report_path
    del global_model
    cleanup_memory()
    output = {'result': result, 'history': pd.DataFrame(history), 'poison_stats': poison_stats, 'classification_report': report_df}
    if CONFIG.get('SAVE_RUN_ARTIFACTS_IN_MEMORY', False):
        output.update({'y_true': y_true, 'y_pred': y_pred, 'y_prob': y_prob})
    else:
        del y_true, y_pred, y_prob
    return output
