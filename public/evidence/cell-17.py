image_files = (
    list(DATA_ROOT.rglob("*.jpg"))
    + list(DATA_ROOT.rglob("*.jpeg"))
    + list(DATA_ROOT.rglob("*.png"))
)
print("Total image files found:", len(image_files))

image_map = {}
for p in image_files:
    image_map[Path(p).stem] = str(p)

required_cols = {"image_id", "lesion_id", "dx"}
missing_cols = required_cols - set(df.columns)
if missing_cols:
    raise ValueError(f"Metadata is missing required columns: {missing_cols}")

df["image_path"] = df["image_id"].map(image_map)
missing_paths = df["image_path"].isna().sum()
print("Rows without image path:", missing_paths)

df = df.dropna(subset=["image_path"]).copy()
df = df[df["dx"].isin(CLASS_ORDER)].copy()
df["label_idx"] = df["dx"].map(CLASS_TO_IDX).astype(int)
df["class_name"] = df["dx"].map(CLASS_NAMES)

print("Clean metadata shape:", df.shape)
display(df.head())
