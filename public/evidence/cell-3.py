import os
import sys
import shutil
from pathlib import Path

# ---- 1. Detect Colab ------------------------------------------------------
IN_COLAB = "google.colab" in sys.modules or os.path.exists("/content")
print("Running on Colab:", IN_COLAB)

# Output directory: Colab VM disk by default. If you mount Drive below, the
# notebook will ALSO mirror outputs to Drive at the end of each experiment.
if IN_COLAB:
    OUTPUT_DIR = "/content/fedresvit_outputs_manuscript"
else:
    OUTPUT_DIR = "./fedresvit_outputs_manuscript"
os.makedirs(OUTPUT_DIR, exist_ok=True)
print("Output directory:", OUTPUT_DIR)

# ---- 2. Kaggle credentials ------------------------------------------------
KAGGLE_DIR = Path.home() / ".kaggle"
KAGGLE_DIR.mkdir(parents=True, exist_ok=True)
kaggle_json = KAGGLE_DIR / "kaggle.json"

if not kaggle_json.exists() and IN_COLAB:
    print("\n--- Kaggle setup ---")
    print("Upload your kaggle.json (downloadable from kaggle.com → Settings → API → Create New Token).")
    try:
        from google.colab import files
        uploaded = files.upload()  # opens a file picker
        if "kaggle.json" in uploaded:
            with open(kaggle_json, "wb") as f:
                f.write(uploaded["kaggle.json"])
            os.chmod(kaggle_json, 0o600)
            print(f"Saved kaggle.json to {kaggle_json} (chmod 600).")
        else:
            print("WARNING: kaggle.json not found in upload. kagglehub will fail later.")
    except Exception as e:
        print(f"Could not run Colab upload widget: {e}")
        print("Fallback: place kaggle.json manually at ~/.kaggle/kaggle.json with chmod 600.")
elif kaggle_json.exists():
    print(f"Kaggle credentials already present: {kaggle_json}")
else:
    print("Not on Colab and no kaggle.json found. Make sure kagglehub can find your credentials.")

# ---- 3. Optional Google Drive mount ---------------------------------------
MOUNT_DRIVE = True  # set to False to skip Drive mounting
DRIVE_OUTPUT_DIR = "/content/drive/MyDrive/fedresvit_outputs_manuscript"

if IN_COLAB and MOUNT_DRIVE:
    try:
        from google.colab import drive
        drive.mount("/content/drive")
        os.makedirs(DRIVE_OUTPUT_DIR, exist_ok=True)
        print(f"Google Drive mounted. Outputs will also be mirrored to: {DRIVE_OUTPUT_DIR}")
    except Exception as e:
        print(f"Drive mount skipped: {e}")
        DRIVE_OUTPUT_DIR = None
else:
    DRIVE_OUTPUT_DIR = None
    if not IN_COLAB:
        print("Not on Colab -- skipping Drive mount.")
    elif not MOUNT_DRIVE:
        print("MOUNT_DRIVE=False -- skipping Drive mount.")

print("\nColab setup complete.")
