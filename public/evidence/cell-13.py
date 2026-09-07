path = kagglehub.dataset_download(CONFIG["DATASET_REF"])
print("Path to dataset files:", path)
DATA_ROOT = Path(path)
print("Exists:", DATA_ROOT.exists())
