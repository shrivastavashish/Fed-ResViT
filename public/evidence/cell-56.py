from scipy.stats import ttest_rel, wilcoxon


def paired_compare(results_df, metric="test_macro_f1", proposed="trust", attack_only=False):
    df = results_df.copy()
    if attack_only:
        df = df[df["malicious_fraction"] > 0].copy()

    rows = []
    baselines = [a for a in df["aggregation"].dropna().unique()
                 if a not in [proposed, "centralized_upper_bound"]]

    for mal in sorted(df["malicious_fraction"].dropna().unique()):
        for baseline in baselines:
            prop = df[(df["aggregation"] == proposed) & (df["malicious_fraction"] == mal)][["seed", metric]]
            base = df[(df["aggregation"] == baseline) & (df["malicious_fraction"] == mal)][["seed", metric]]
            merged = prop.merge(base, on="seed", suffixes=("_proposed", "_baseline"))
            merged = merged.dropna()

            if len(merged) < 2:
                rows.append({
                    "malicious_fraction": mal,
                    "comparison": f"{proposed} vs {baseline}",
                    "metric": metric,
                    "n_pairs": len(merged),
                    "mean_diff": np.nan if len(merged) == 0 else float((merged[f"{metric}_proposed"] - merged[f"{metric}_baseline"]).mean()),
                    "paired_t_p": "need >=2 seeds",
                    "wilcoxon_p": "need >=2 seeds",
                })
                continue

            diffs = merged[f"{metric}_proposed"] - merged[f"{metric}_baseline"]
            try:
                t_p = float(ttest_rel(merged[f"{metric}_proposed"], merged[f"{metric}_baseline"]).pvalue)
            except Exception:
                t_p = np.nan
            try:
                w_p = float(wilcoxon(diffs).pvalue)
            except Exception:
                w_p = np.nan

            rows.append({
                "malicious_fraction": mal,
                "comparison": f"{proposed} vs {baseline}",
                "metric": metric,
                "n_pairs": len(merged),
                "mean_diff": float(diffs.mean()),
                "paired_t_p": t_p,
                "wilcoxon_p": w_p,
            })

    return pd.DataFrame(rows)


stats_f1_df = paired_compare(results_df, metric="test_macro_f1", proposed="trust", attack_only=False)
display(stats_f1_df)
stats_f1_csv = os.path.join(CONFIG["OUTPUT_DIR"], "fedresvit_paired_stats_macro_f1.csv")
stats_f1_df.to_csv(stats_f1_csv, index=False)
print("Saved macro-F1 stats:", stats_f1_csv)

if "test_asr" in results_df.columns:
    stats_asr_df = paired_compare(results_df, metric="test_asr", proposed="trust", attack_only=True)
    display(stats_asr_df)
    stats_asr_csv = os.path.join(CONFIG["OUTPUT_DIR"], "fedresvit_paired_stats_asr.csv")
    stats_asr_df.to_csv(stats_asr_csv, index=False)
    print("Saved ASR stats:", stats_asr_csv)
