all_results = []
all_histories = []

results_csv = os.path.join(CONFIG["OUTPUT_DIR"], "fedresvit_results.csv")
history_csv = os.path.join(CONFIG["OUTPUT_DIR"], "fedresvit_round_history.csv")
partial_results_csv = os.path.join(CONFIG["OUTPUT_DIR"], "fedresvit_results_partial.csv")
partial_history_csv = os.path.join(CONFIG["OUTPUT_DIR"], "fedresvit_round_history_partial.csv")

completed_keys = set()

# Resume from partial files if a previous Colab session crashed.
if CONFIG.get("RESUME_FROM_PARTIAL", True) and os.path.exists(partial_results_csv):
    try:
        prev_results = pd.read_csv(partial_results_csv)
        if len(prev_results) > 0:
            all_results.extend(prev_results.to_dict("records"))
            for _, r in prev_results.iterrows():
                if r.get("aggregation") != "centralized_upper_bound":
                    completed_keys.add((
                        int(r["seed"]),
                        float(r["malicious_fraction"]),
                        str(r["aggregation"]),
                    ))
            print(f"Resume mode: found {len(completed_keys)} completed FL runs.")
    except Exception as e:
        print("Could not load partial results; starting fresh:", repr(e))

if CONFIG.get("RESUME_FROM_PARTIAL", True) and os.path.exists(partial_history_csv):
    try:
        prev_hist = pd.read_csv(partial_history_csv)
        if len(prev_hist) > 0:
            all_histories.append(prev_hist)
    except Exception as e:
        print("Could not load partial history:", repr(e))

if centralized_result_row is not None:
    # Avoid duplicate centralized rows when resuming.
    if not any(str(r.get("aggregation")) == "centralized_upper_bound" for r in all_results):
        all_results.append(centralized_result_row)

for seed in CONFIG["SEEDS"]:
    for malicious_fraction in CONFIG["MALICIOUS_FRACTIONS"]:
        for agg in CONFIG["AGGREGATORS"]:
            run_key = (int(seed), float(malicious_fraction), str(agg))
            if run_key in completed_keys:
                print(f"Skipping completed run: seed={seed}, mal={malicious_fraction}, agg={agg}")
                continue

            output = run_federated_experiment(
                aggregation_method=agg,
                malicious_fraction=malicious_fraction,
                seed=seed,
                num_rounds=CONFIG["NUM_ROUNDS"],
                local_epochs=CONFIG["LOCAL_EPOCHS"],
            )

            all_results.append(output["result"])

            hist = output["history"].copy()
            hist["seed"] = seed
            hist["aggregation"] = agg
            hist["malicious_fraction"] = malicious_fraction
            all_histories.append(hist)

            # Save after every run. If Colab crashes later, completed runs are preserved.
            results_df_partial = pd.DataFrame(all_results)
            history_df_partial = pd.concat(all_histories, ignore_index=True) if len(all_histories) else pd.DataFrame()
            results_df_partial.to_csv(partial_results_csv, index=False)
            history_df_partial.to_csv(partial_history_csv, index=False)
            completed_keys.add(run_key)

            # Drop large local references immediately.
            del output, hist, results_df_partial, history_df_partial
            cleanup_memory()

results_df = pd.DataFrame(all_results)
history_df = pd.concat(all_histories, ignore_index=True) if len(all_histories) else pd.DataFrame()

results_df.to_csv(results_csv, index=False)
history_df.to_csv(history_csv, index=False)

print("Saved results:", results_csv)
print("Saved history:", history_csv)
print("Saved partial results:", partial_results_csv)
display(results_df)