class_counts = (
    df["dx"]
    .value_counts()
    .reindex(CLASS_ORDER)
    .rename_axis("class_code")
    .reset_index(name="count")
)
class_counts["class_name"] = class_counts["class_code"].map(CLASS_NAMES)
class_counts["percentage"] = 100 * class_counts["count"] / class_counts["count"].sum()
display(class_counts)

plt.figure(figsize=(10, 5))
plt.bar(class_counts["class_code"], class_counts["count"])
plt.xlabel("HAM10000 class")
plt.ylabel("Number of images")
plt.title("HAM10000 class distribution (Manuscript Table 2)")
plt.grid(axis="y", alpha=0.3)
plt.show()
