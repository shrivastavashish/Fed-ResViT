# Fed-ResViT — Research & Clinical Intelligence Platform

An evidence-grounded web application for the final Fed-ResViT study on HAM10000. It explains hybrid ResNet-50/ViT-small lesion classification, ten-client federated learning, poisoning attacks, robust aggregation, Trust scoring, and the measured outcomes.

## Completed experiment

The final executed notebook is `notebooks/FedResViT_Final_265_Runs.ipynb`. It contains 265 **distinct** completed 30-round experiments across five seeds:

- **Main:** 200 runs: balanced and Dirichlet α=0.5 partitions × 0/10/20/30% malicious clients × FedAvg, Krum, Trimmed Mean, coordinate-wise Median and Trust × five seeds.
- **Adaptive:** 25 runs: the five methods under a defense-aware omniscient update-blending attack at Dirichlet 20%.
- **Trust sensitivity:** 40 new runs: eight one-factor Trust variants × five seeds at Dirichlet 20%. The five default references reuse completed main-study Trust runs, so they are not counted twice.

All runs reuse one fixed lesion-disjoint HAM10000 test split. The site presents stage-separated means, standard deviations where the notebook displays them, robustness curves, adaptive and sensitivity comparisons, ROC/PR, confusion and per-class analyses, and paired main-study Macro-F1 tests. It does not treat repeated predictions across models as independent patients.

The notebook repeats some results in later reports. In particular, its §34 consolidated table groups by partition/fraction/aggregator but omits attack and Trust setting, thereby mixing stages at Dirichlet 20%. The application takes its condition inventory from the stage-specific §21 completed-run summary, uses the dedicated adaptive and sensitivity sections for their unique metrics, and does not display the mixed aggregate as a main-study result. Download the [stage-separated evidence JSON](public/evidence/final-study/summary.json) or regenerate it with:

```sh
python scripts/extract_final_study_results.py notebooks/FedResViT_Final_265_Runs.ipynb
```

The extraction script reads saved notebook outputs; it does not execute training. Notebook source SHA-256 and source-cell indices are stored with the exported evidence.

## Run the application

Node 22.13+ is required.

```sh
npm ci
npm run dev
```

The deployed web app is a research and educational demonstration. Image upload supports viewing and preprocessing; real lesion inference requires a trained checkpoint and an inference service, which were not supplied. Illustrative probabilities and simulation signals are labelled separately from measured results. There is no clinical deployment, treatment advice, regulatory approval, differential privacy, secure aggregation, or implemented explanation map.

Training runs in the notebook outside the website. The site does not launch Colab jobs or stream live training. Original checkpoints, per-run predictions, and full round-history files are referenced by the notebook but are not embedded in the web repository. The optional local FastAPI companion remains tied to the earlier evidence snapshot and is not the source of the final-study pages.

## Validation

```sh
npm run lint
npx tsc --noEmit
npm run build
```

The earlier eight-run notebook and its historical evidence files are retained in the repository for provenance. Current application findings use the final 265-run study.
