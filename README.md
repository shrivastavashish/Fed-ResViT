# Fed-ResViT — Research & Clinical Intelligence Platform

An evidence-grounded research application built from the executed `FedResViT_HAM10000_Fixed_v2_(1).ipynb` notebook. No GPU or retraining is required to explore the stored evidence.

## Scope

- Seven connected research workspaces with a guided academic demonstration.
- Eight executed runs: 5 clients × 30 rounds, 2 local epochs, seeds 42/43, FedAvg/Trust, 0%/20% malicious clients.
- 240 recovered round records; 120 trust snapshots; interactive client inspection and explanatory replay.
- Actual summary comparisons, original embedded image gallery, a verified transcription of the saved Trust/20%/seed43 confusion matrix and per-class report.
- Image upload stays in the browser: zoom, pan, fullscreen and preprocessing preview. **Inference is unavailable until a checkpoint/service is connected.** No probabilities or attention maps are fabricated.
- Experiment settings export as drafts. **Training is not connected.** No new results are generated.

## Run the web application

Node 22.13+ is required.

```sh
npm ci
npm run dev
```

The app uses React, TypeScript, Tailwind, shadcn/Base UI and the Sites Vinext runtime (Next.js App Router conventions). Research charts are lightweight interactive SVGs. Evidence is embedded for deterministic, low-latency browsing. Clinical and Observatory modules load lazily.

## Optional local evidence API

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app:app --port 8000
```

The FastAPI companion initializes SQLite from the same evidence snapshot. It exposes experiments, rounds, artifact availability and a WebSocket stream of recorded rounds. It is separate from the hosted Sites runtime; the web explorer does not depend on it. API docs: `/docs`. No patient data is stored. The Prediction table remains empty because predictions were not supplied.

- `GET /api/health`: explicit inference/training availability.
- `GET /api/experiments`, `GET /api/experiments/{run_id}/rounds`.
- `GET /api/artifacts`: distinguishes original listed-only artifacts from available recovered files.
- `WS /ws/replay/{run_id}`: measured records, explicitly identified as replay.
- `POST /api/predict` returns 503, and `POST /api/experiments` returns 501; neither simulates successful execution.

## Local Docker demonstration

```sh
docker compose up --build
```

Web: `http://localhost:3000`; optional API: `http://localhost:8000`. Bindings are local only. The Docker configuration is provided for local use; see VALIDATION.md for what was actually verified.

## Evidence provenance

`public/evidence/research.json` contains source SHA-256, configuration, data availability, summaries and round records. `scripts/extract_notebook.py /path/to/notebook.ipynb` rebuilds it from notebook outputs. Original source cells are downloadable under `public/evidence/cell-N.py`. The extraction script does not execute notebook cells.

Round metrics retain printed precision. Effective weights/contributions are derived from rounded logged φ and reputation and labeled approximate. Most individual seed-level test F1 values were truncated in the saved dataframe; they remain null instead of being inferred from summary statistics. The available per-class report and matrix belong only to Trust / 20% / seed 43. Original `.pt` and `.npz` files are listed, not included.

The matrix was transcribed from the embedded figure and checked against all row totals, precision, recall, F1, accuracy and ASR. Its provenance is recorded in the JSON. The notebook function name `patient_level_split` groups by lesion ID; the interface correctly calls the split lesion-disjoint.

## Scientific interpretation

Current partitions are stratified-balanced / near-IID, not strong non-IID. Detection/FPR are final-round five-round-window client statistics, whereas classification uses selected best-validation checkpoints. “Malignant safety” means 1 − ASR, not clinical safety. Statistics use only two paired seeds. Review the in-app Limitations tab.

## Validation

```sh
npx tsc --noEmit
python -m unittest discover -s tests -p '*test.py'
npm run build
```

Do not present configuration changes, replay animation or browser normalization previews as new experimental measurements. No differential privacy, cryptographic secure aggregation, live hospital deployment, calibrated uncertainty or implemented XAI is claimed.
