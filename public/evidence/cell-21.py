def show_examples(df, n_per_class=3):
    fig, axes = plt.subplots(
        len(CLASS_ORDER), n_per_class,
        figsize=(3 * n_per_class, 2.4 * len(CLASS_ORDER)),
    )
    for row, cls in enumerate(CLASS_ORDER):
        subset = df[df["dx"] == cls].sample(
            min(n_per_class, (df["dx"] == cls).sum()), random_state=42
        )
        for col in range(n_per_class):
            ax = axes[row, col] if len(CLASS_ORDER) > 1 else axes[col]
            ax.axis("off")
            if col < len(subset):
                img = Image.open(subset.iloc[col]["image_path"]).convert("RGB")
                ax.imshow(img)
                ax.set_title(f"{cls}: {CLASS_NAMES[cls]}", fontsize=8)
    plt.tight_layout()
    plt.show()

show_examples(df, n_per_class=3)
