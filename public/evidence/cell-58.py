print("Output directory:", CONFIG["OUTPUT_DIR"])
print("Generated files:")
for p in sorted(glob.glob(os.path.join(CONFIG["OUTPUT_DIR"], "*"))):
    print(" -", p)

config_path = os.path.join(CONFIG["OUTPUT_DIR"], "active_config.txt")
with open(config_path, "w", encoding="utf-8") as f:
    f.write(f"EXPERIMENT_PROFILE={EXPERIMENT_PROFILE}\n")
    for k, v in CONFIG.items():
        f.write(f"{k}: {v}\n")
print("Saved config:", config_path)

# ---- Mirror everything to Google Drive (Colab only) ----------------------
# If you mounted Drive in cell 1, this copies the entire OUTPUT_DIR to
# /content/drive/MyDrive/fedresvit_outputs_manuscript/ so your trained
# models, CSVs, and figures survive Colab session resets.
try:
    _drive_target = DRIVE_OUTPUT_DIR if 'DRIVE_OUTPUT_DIR' in globals() else None
except NameError:
    _drive_target = None

if _drive_target:
    import shutil
    print(f"\nMirroring outputs to Google Drive: {_drive_target}")
    os.makedirs(_drive_target, exist_ok=True)
    for p in glob.glob(os.path.join(CONFIG["OUTPUT_DIR"], "*")):
        dest = os.path.join(_drive_target, os.path.basename(p))
        try:
            if os.path.isdir(p):
                if os.path.exists(dest):
                    shutil.rmtree(dest)
                shutil.copytree(p, dest)
            else:
                shutil.copy2(p, dest)
        except Exception as e:
            print(f"  failed to copy {p}: {e}")
    print("Drive mirror complete.")
else:
    print("Drive not mounted -- skipping mirror step (outputs remain in CONFIG['OUTPUT_DIR']).")
