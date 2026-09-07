def print_tree(root, max_depth=3, max_files_per_dir=8):
    root = Path(root)
    print(root)
    for current_root, dirs, files in os.walk(root):
        current_root = Path(current_root)
        depth = len(current_root.relative_to(root).parts)
        if depth >= max_depth:
            dirs[:] = []
        indent = "  " * depth
        if depth > 0:
            print(f"{indent}{current_root.name}/")
        shown_files = files[:max_files_per_dir]
        for file in shown_files:
            print(f"{indent}  {file}")
        if len(files) > max_files_per_dir:
            print(f"{indent}  ... {len(files) - max_files_per_dir} more files")

print_tree(DATA_ROOT, max_depth=2)

metadata_candidates = list(DATA_ROOT.rglob("*metadata*.csv"))
print("Metadata candidates:")
for p in metadata_candidates:
    print(" -", p)

if not metadata_candidates:
    raise FileNotFoundError("Could not find HAM10000 metadata CSV.")

metadata_path = metadata_candidates[0]
print("Using metadata:", metadata_path)

df = pd.read_csv(metadata_path)
print("Metadata shape:", df.shape)
print("Columns:", df.columns.tolist())
display(df.head())
