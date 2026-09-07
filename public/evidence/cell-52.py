def plot_confusion_matrix(y_true, y_pred, title="Confusion matrix", save_path=None):
    cm = confusion_matrix(y_true, y_pred, labels=list(range(CONFIG["NUM_CLASSES"])))
    plt.figure(figsize=(8, 7))
    plt.imshow(cm, interpolation="nearest")
    plt.title(title)
    plt.colorbar()
    tick_marks = np.arange(CONFIG["NUM_CLASSES"])
    plt.xticks(tick_marks, CLASS_ORDER, rotation=45)
    plt.yticks(tick_marks, CLASS_ORDER)

    thresh = cm.max() / 2 if cm.max() > 0 else 0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(
                j, i, format(cm[i, j], "d"),
                ha="center", va="center",
                color="white" if cm[i, j] > thresh else "black",
            )
    plt.ylabel("True label")
    plt.xlabel("Predicted label")
    plt.tight_layout()
    if save_path is not None:
        plt.savefig(save_path, dpi=300, bbox_inches="tight")
    plt.show()


def select_prediction_row(results_df):
    """Select a saved prediction file for plotting without relying on RAM artifacts."""
    if results_df is None or len(results_df) == 0:
        return None
    df_plot = results_df.copy()
    if "prediction_path" not in df_plot.columns:
        return None
    df_plot = df_plot[df_plot["prediction_path"].astype(str).str.len() > 0]
    df_plot = df_plot[df_plot["prediction_path"].apply(lambda p: os.path.exists(str(p)))]
    if len(df_plot) == 0:
        return None

    # Prefer proposed trust aggregation under the highest available attack setting;
    # otherwise use the latest available run.
    max_mal = df_plot["malicious_fraction"].max()
    preferred = df_plot[(df_plot["aggregation"] == "trust") & (df_plot["malicious_fraction"] == max_mal)]
    if len(preferred) == 0:
        preferred = df_plot[df_plot["malicious_fraction"] == max_mal]
    return preferred.iloc[-1]


selected_row = select_prediction_row(results_df if "results_df" in globals() else None)
if selected_row is not None:
    pred_path = str(selected_row["prediction_path"])
    pred_data = np.load(pred_path)
    y_true = pred_data["y_true"]
    y_pred = pred_data["y_pred"]

    agg = selected_row["aggregation"]
    mal = float(selected_row["malicious_fraction"])
    seed = int(selected_row["seed"])
    print("Selected saved prediction file:", pred_path)

    cm_path = os.path.join(
        CONFIG["OUTPUT_DIR"],
        f"figure_confusion_matrix_{agg}_mal{str(mal).replace('.', 'p')}_seed{seed}.png",
    )
    plot_confusion_matrix(
        y_true, y_pred,
        title=f"Confusion matrix: agg={agg}, malicious_fraction={mal}",
        save_path=cm_path,
    )
    print("Saved confusion matrix:", cm_path)

    report_path = str(selected_row.get("classification_report_path", ""))
    if os.path.exists(report_path):
        display(pd.read_csv(report_path, index_col=0))
else:
    print("No saved prediction file available for confusion-matrix plotting yet.")
