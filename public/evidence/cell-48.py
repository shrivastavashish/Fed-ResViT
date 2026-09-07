metric_cols = [
    "test_accuracy",
    "test_macro_precision",
    "test_macro_recall",
    "test_macro_f1",
    "test_macro_specificity",
    "test_malignant_safety",
    "test_asr",
    "test_detection_rate",
    "test_false_positive_rate",
]
metric_cols = [c for c in metric_cols if c in results_df.columns]


def mean_std_text(x):
    x = pd.to_numeric(x, errors="coerce").dropna()
    if len(x) == 0:
        return "—"
    if len(x) == 1:
        return f"{x.iloc[0]:.4f}"
    return f"{x.mean():.4f} ± {x.std(ddof=1):.4f}"


summary = (
    results_df
    .groupby(["malicious_fraction", "aggregation"], dropna=False)[metric_cols]
    .agg(mean_std_text)
    .reset_index()
)
display(summary)

summary_csv = os.path.join(CONFIG["OUTPUT_DIR"], "fedresvit_summary_mean_std.csv")
summary.to_csv(summary_csv, index=False)
print("Saved summary:", summary_csv)

# Table 3: clean classification
clean_table = summary[summary["malicious_fraction"] == 0.0].copy()
clean_csv = os.path.join(CONFIG["OUTPUT_DIR"], "table_clean_classification.csv")
clean_table.to_csv(clean_csv, index=False)
print("Saved clean table:", clean_csv)

# Table 4: attack robustness
attack_table = summary[summary["malicious_fraction"] > 0.0].copy()
attack_csv = os.path.join(CONFIG["OUTPUT_DIR"], "table_attack_robustness.csv")
attack_table.to_csv(attack_csv, index=False)
print("Saved attack table:", attack_csv)
