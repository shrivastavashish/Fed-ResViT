"""Extract stage-separated, completed results from the final Fed-ResViT notebook.

The notebook contains several repeated reports. Its section 21 summary preserves
attack and setting, while some later summaries omit those dimensions and pool
different stages. This exporter treats each completed configuration once.
"""
from __future__ import annotations

import base64
import hashlib
import json
import math
import sys
from html.parser import HTMLParser
from pathlib import Path


class Table(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows = []
        self.row = None
        self.cell = None

    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self.row = []
        elif tag in {"td", "th"} and self.row is not None:
            self.cell = ""

    def handle_data(self, data):
        if self.cell is not None:
            self.cell += data

    def handle_endtag(self, tag):
        if tag in {"td", "th"} and self.cell is not None:
            self.row.append(self.cell.strip())
            self.cell = None
        elif tag == "tr" and self.row is not None:
            self.rows.append(self.row)
            self.row = None


def html_rows(notebook, cell, output):
    parser = Table()
    parser.feed("".join(notebook["cells"][cell]["outputs"][output]["data"]["text/html"]))
    return parser.rows


def number(value):
    try:
        result = float(value)
        return None if math.isnan(result) else result
    except (TypeError, ValueError):
        return None


def triple(values):
    # Notebook summary order is count, mean, sample standard deviation.
    n, mean, std = values
    return [number(mean), number(std), int(n)]


def figure(notebook, cell, output, path):
    data = notebook["cells"][cell]["outputs"][output]["data"]["image/png"]
    path.write_bytes(base64.b64decode("".join(data)))


def extract(path):
    notebook = json.loads(path.read_text())
    old = json.loads(Path("lib/main-study-results.json").read_text())
    old_main = {
        (r["partition"], r["fraction"], r["method"]): r
        for r in old["records"]
    }
    methods = {"fedavg", "krum", "trimmed_mean", "coordinate_median", "trust"}
    settings = {
        "default", "mad_narrow", "mad_wide", "ema_fast", "ema_slow",
        "flag_low", "flag_high", "window_1", "window_10",
    }
    context = {}
    visible = []
    for line in html_rows(notebook, 56, 1)[3:]:
        position = next((i for i, value in enumerate(line) if value in methods), None)
        if position is None:
            continue
        for value in line[:position]:
            if value in {"dirichlet", "stratified_balanced"}:
                context["partition"] = value
            elif value in {"none", "targeted_label_flipping", "adaptive_omniscient_blend"}:
                context["attack"] = value
            elif value in {"0.0", "0.1", "0.2", "0.3"}:
                context["fraction"] = float(value)
            elif value in settings:
                context["setting"] = value
        method = line[position]
        assert line[position + 1] == "10", line
        values = line[position + 2:]
        tail = values[values.index("...") + 1:]
        assert len(tail) == 10, (method, tail)
        stage = (
            "adaptive" if context["attack"] == "adaptive_omniscient_blend"
            else "sensitivity" if context["setting"] != "default"
            else "main"
        )
        record = {
            "stage": stage,
            "partition": context["partition"],
            "fraction": context["fraction"],
            "attack": context["attack"],
            "setting": context["setting"],
            "method": method,
            "accuracy": triple(values[:3]),
            "macro_precision": triple(values[3:6]),
            "macro_recall": triple(values[6:9]),
            "malignant_macro_recall": triple(tail[1:4]),
            "detection_rate": triple(tail[4:7]),
            "false_positive_rate": triple(tail[7:10]),
        }
        visible.append(record)
    assert len(visible) == 53, len(visible)
    assert {stage: sum(r["accuracy"][2] for r in visible if r["stage"] == stage)
            for stage in ("main", "adaptive", "sensitivity")} == {
                "main": 200, "adaptive": 25, "sensitivity": 40
            }

    adaptive = {}
    for line in html_rows(notebook, 75, 1)[3:]:
        if line[0] in methods:
            adaptive[line[0]] = {
                "macro_f1": [number(v) for v in line[4:6]] + [int(line[6])],
                "malignant_recall": [number(v) for v in line[7:9]] + [int(line[9])],
                "asr": [number(v) for v in line[10:12]] + [int(line[12])],
            }
    assert len(adaptive) == 5

    sensitivity = {}
    for line in html_rows(notebook, 57, 29)[2:]:
        if line[0] in settings:
            sensitivity[line[0]] = {
                "macro_f1": [number(line[1]), None, 5],
                "asr": [number(line[2]), None, 5],
            }
    assert len(sensitivity) == 8

    for record in visible:
        key = (record["partition"], record["fraction"], record["method"])
        if record["stage"] == "main":
            previous = old_main[key]
            for metric in ("accuracy", "macro_precision", "macro_recall",
                           "malignant_macro_recall", "detection_rate",
                           "false_positive_rate"):
                for actual, prior in zip(record[metric], previous[metric]):
                    if actual is not None and prior is not None:
                        assert abs(actual - prior) < 0.000002, (key, metric, actual, prior)
            for metric in ("macro_f1", "malignant_recall", "asr"):
                record[metric] = previous[metric]
        elif record["stage"] == "adaptive":
            record.update(adaptive[record["method"]])
        else:
            record.update(sensitivity[record["setting"]])
            record["malignant_recall"] = [None, None, 0]

    headline_names = {
        "FedAvg": "fedavg", "Krum": "krum",
        "Trimmed Mean": "trimmed_mean", "Coord. Median": "coordinate_median",
        "Trust (ours)": "trust",
    }
    headline_seen = set()
    for line in html_rows(notebook, 57, 11)[1:]:
        if len(line) < 10 or line[3] not in headline_names:
            continue
        key = (line[1], int(line[2].strip("%")) / 100, headline_names[line[3]])
        actual = old_main[key]
        for metric, column in (
            ("accuracy", 5), ("macro_f1", 6),
            ("malignant_recall", 8), ("asr", 9),
        ):
            displayed = number(line[column].split(" ± ")[0])
            if displayed is not None:
                assert abs(actual[metric][0] - displayed) < 0.00051, (key, metric)
        headline_seen.add(key)
    assert len(headline_seen) == 40, len(headline_seen)

    # This matrix pools predictions from all 265 model evaluations. It is not
    # a single model or an independent-patient sample.
    classes = ["nv", "mel", "bkl", "bcc", "akiec", "vasc", "df"]
    confusion = []
    for line in html_rows(notebook, 62, 3)[1:]:
        if line[0] in classes:
            confusion.append([int(value) for value in line[1:]])
    assert len(confusion) == 7 and all(len(row) == 7 for row in confusion)
    assert sum(map(sum, confusion)) == 265 * 1448

    roc = []
    for line in html_rows(notebook, 72, 2)[1:]:
        if line[1] in {"FedAvg", "Krum", "Trimmed Mean", "Coord. Median", "Trust (ours)"}:
            roc.append({"method": {
                "FedAvg": "fedavg", "Krum": "krum", "Trimmed Mean": "trimmed_mean",
                "Coord. Median": "coordinate_median", "Trust (ours)": "trust",
            }[line[1]], "roc_auc": number(line[2]),
                         "average_precision": number(line[3]),
                         "pooled_seeds": int(line[4])})
    assert len(roc) == 5

    tests = []
    for line in html_rows(notebook, 57, 35)[1:]:
        if line[0].isdigit():
            tests.append({
                "partition": line[1], "fraction": int(line[2].strip("%")) / 100,
                "baseline": {
                    "Coord. Median": "coordinate_median", "FedAvg": "fedavg",
                    "Krum": "krum", "Trimmed Mean": "trimmed_mean",
                }[line[3].split("vs ", 1)[1]],
                "n": int(line[4]), "macro_f1_difference": number(line[5]),
                "cohen_dz": number(line[6]), "paired_t_p": number(line[7]),
                "wilcoxon_p": number(line[8]), "holm_t_p": number(line[9]),
            })
    assert len(tests) == 32

    output = {
        "notebook": path.name,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "scope": "265 distinct completed runs: 200 main, 25 adaptive, 40 sensitivity variants; five seeds each",
        "source_cells": {
            "stage_summary": 56, "main_statistics": 57, "adaptive": 75,
            "sensitivity": 57, "roc_pr": 72, "all_study_confusion": 62,
        },
        "records": visible,
        "aggregate_confusion": confusion,
        "roc_pr_main_dirichlet_20": roc,
        "main_macro_f1_tests": tests,
        "compute": {"gpu_hours": 138.2, "rounds": 7950, "source_cell": 57},
    }
    content = json.dumps(output, indent=2) + "\n"
    destination = Path("public/evidence/final-study")
    destination.mkdir(parents=True, exist_ok=True)
    Path("lib/final-study-results.json").write_text(content)
    (destination / "summary.json").write_text(content)
    figures = {
        "coverage.png": (57, 3),
        "frontier-dirichlet.png": (57, 5),
        "frontier-balanced.png": (57, 6),
        "cost-dirichlet.png": (57, 8),
        "cost-balanced.png": (57, 9),
        "roc-pr.png": (72, 1),
        "per-class-recall.png": (57, 16),
        "confusion-differential.png": (73, 1),
        "main-convergence.png": (57, 20),
        "trust-diagnostics.png": (57, 22),
        "detection.png": (57, 25),
        "partition-heterogeneity.png": (57, 27),
        "sensitivity.png": (57, 30),
        "adaptive.png": (57, 32),
        "compute.png": (57, 38),
    }
    for name, (cell, index) in figures.items():
        figure(notebook, cell, index, destination / name)
    print("Exported 265 verified runs in 53 distinct conditions and", len(figures), "figures")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python scripts/extract_final_study_results.py NOTEBOOK.ipynb")
    extract(Path(sys.argv[1]))
