plot_df = results_df.copy()
plot_df = plot_df[plot_df["aggregation"] != "centralized_upper_bound"].copy()

# ASR vs malicious fraction
attack_plot_df = plot_df[plot_df["malicious_fraction"] > 0].copy()
if len(attack_plot_df) > 0 and attack_plot_df["test_asr"].notna().any():
    plt.figure(figsize=(9, 5))
    for agg, sub in attack_plot_df.groupby("aggregation"):
        sub_mean = sub.groupby("malicious_fraction")["test_asr"].mean().sort_index()
        plt.plot(sub_mean.index, sub_mean.values, marker="o", label=agg)
    plt.xlabel("Malicious client fraction")
    plt.ylabel("Attack Success Rate")
    plt.title("ASR vs malicious-client fraction (Manuscript Figure 7)")
    plt.grid(alpha=0.3)
    plt.legend()
    plt.tight_layout()
    fig_path = os.path.join(CONFIG["OUTPUT_DIR"], "figure_asr_vs_malicious_fraction.png")
    plt.savefig(fig_path, dpi=300, bbox_inches="tight")
    plt.show()
    print("Saved ASR figure:", fig_path)
else:
    print("No attack ASR values available to plot.")

# Accuracy under attack vs malicious fraction
plt.figure(figsize=(9, 5))
for agg, sub in plot_df.groupby("aggregation"):
    sub_mean = sub.groupby("malicious_fraction")["test_accuracy"].mean().sort_index()
    plt.plot(sub_mean.index, sub_mean.values, marker="o", label=agg)
plt.xlabel("Malicious client fraction")
plt.ylabel("Test accuracy")
plt.title("Accuracy under attack vs malicious-client fraction")
plt.grid(alpha=0.3)
plt.legend()
plt.tight_layout()
fig_path = os.path.join(CONFIG["OUTPUT_DIR"], "figure_accuracy_vs_malicious_fraction.png")
plt.savefig(fig_path, dpi=300, bbox_inches="tight")
plt.show()
print("Saved accuracy figure:", fig_path)

# Detection rate vs malicious fraction
if "test_detection_rate" in attack_plot_df.columns and attack_plot_df["test_detection_rate"].notna().any():
    plt.figure(figsize=(9, 5))
    for agg, sub in attack_plot_df.groupby("aggregation"):
        if sub["test_detection_rate"].notna().any():
            sub_mean = sub.groupby("malicious_fraction")["test_detection_rate"].mean().sort_index()
            plt.plot(sub_mean.index, sub_mean.values, marker="o", label=agg)
    plt.xlabel("Malicious client fraction")
    plt.ylabel("Malicious-client detection rate")
    plt.title("Detection rate vs malicious-client fraction")
    plt.grid(alpha=0.3)
    plt.legend()
    plt.tight_layout()
    fig_path = os.path.join(CONFIG["OUTPUT_DIR"], "figure_detection_rate.png")
    plt.savefig(fig_path, dpi=300, bbox_inches="tight")
    plt.show()
    print("Saved detection figure:", fig_path)
else:
    print("No detection-rate values available to plot.")

# FPR vs malicious fraction
if "test_false_positive_rate" in plot_df.columns and plot_df["test_false_positive_rate"].notna().any():
    plt.figure(figsize=(9, 5))
    for agg, sub in plot_df.groupby("aggregation"):
        if sub["test_false_positive_rate"].notna().any():
            sub_mean = sub.groupby("malicious_fraction")["test_false_positive_rate"].mean().sort_index()
            plt.plot(sub_mean.index, sub_mean.values, marker="o", label=agg)
    plt.xlabel("Malicious client fraction")
    plt.ylabel("False-positive rate")
    plt.title("False-positive rate vs malicious-client fraction")
    plt.grid(alpha=0.3)
    plt.legend()
    plt.tight_layout()
    fig_path = os.path.join(CONFIG["OUTPUT_DIR"], "figure_false_positive_rate.png")
    plt.savefig(fig_path, dpi=300, bbox_inches="tight")
    plt.show()
    print("Saved FPR figure:", fig_path)
