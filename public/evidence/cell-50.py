if not history_df.empty:
    plt.figure(figsize=(10, 5))
    for (agg, mal), sub in history_df.groupby(["aggregation", "malicious_fraction"]):
        label = f"{agg}, mal={mal}"
        sub_mean = sub.groupby("round")["val_macro_f1"].mean()
        plt.plot(sub_mean.index, sub_mean.values, marker="o", label=label)
    plt.xlabel("Federated communication round")
    plt.ylabel("Validation macro-F1")
    plt.title("Fed-ResViT convergence across rounds (Manuscript Figure 5)")
    plt.grid(alpha=0.3)
    plt.legend()
    plt.tight_layout()
    fig_path = os.path.join(CONFIG["OUTPUT_DIR"], "figure_convergence_macro_f1.png")
    plt.savefig(fig_path, dpi=300, bbox_inches="tight")
    plt.show()
    print("Saved figure:", fig_path)
else:
    print("No history available to plot.")
