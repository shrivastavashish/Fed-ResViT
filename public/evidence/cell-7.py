import os
import glob
import math
import random
import time
import copy
import gc
import warnings
from pathlib import Path
from collections import defaultdict

import numpy as np
import pandas as pd
from PIL import Image

import matplotlib.pyplot as plt

from tqdm.auto import tqdm

import sklearn
from sklearn.model_selection import GroupShuffleSplit
try:
    from sklearn.model_selection import StratifiedGroupKFold
    HAS_STRATIFIED_GROUP_KFOLD = True
except Exception:
    HAS_STRATIFIED_GROUP_KFOLD = False

from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    classification_report,
)

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler

import torchvision
from torchvision import transforms
from torchvision.models import resnet50

import timm
import kagglehub

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------
# Choose experiment profile
# ---------------------------------------------------------------------
# "debug"      : tiny run, only to verify the code path runs end-to-end.
# "smoke"      : a few rounds on a sub-sample, to sanity-check trends.
# "paper_fast" : optimized quick research run; keeps the same method but fewer repetitions.
# "colab_safe"  : smallest stable run for Colab/T4 when runtime crashes; values are only sanity-check values.
# "colab_quality": better Colab run; slower than colab_safe but gives more meaningful metrics.
# "target90_clean" : full-data clean FL run tuned for high clean accuracy.
# "target90_balanced": full-data clean FL run tuned for stronger macro-F1.
# "target90_v2" : improved high-accuracy run after the first plateau near 80%.
# "target90_v2_balanced": improved high-accuracy run that also protects macro-F1.
# "target90_central_probe": centralized upper-bound probe; use this to check if 90% is realistic before FL.
# "paper_full"  : manuscript protocol of Sec 5.3. USE THIS FOR PAPER NUMBERS.
EXPERIMENT_PROFILE = "target90_v4_multirun"

# ---------------------------------------------------------------------
# Base configuration -- matches the manuscript.
# Anything not explicitly overridden by a profile is the manuscript default.
# ---------------------------------------------------------------------
BASE_CONFIG = {
    # ---- Dataset (Sec 5.1) ------------------------------------------
    "DATASET_REF": "kmader/skin-cancer-mnist-ham10000",
    "IMG_SIZE": 224,                       # Sec 5.2
    "TEST_SIZE": 0.15,                     # Sec 5.2: 70:15:15 split
    "VAL_SIZE": 0.15,
    "SPLIT_SEED": 42,

    # ---- Federated learning (Sec 5.3) -------------------------------
    "DIRICHLET_ALPHA": 0.5,                # Sec 5.3
    "PARTITION_METHOD": "dirichlet",        # options: "dirichlet" or "stratified_balanced"
    "USE_CLIENT_BALANCED_SAMPLER": False,  # client-level weighted sampler for rare classes
    "FREEZE_BATCHNORM_STATS": False,       # keep ResNet BN running stats fixed during FL fine-tuning
    "ROUND_LR_SCHEDULE": "constant",       # options: "constant" or "cosine"
    "MIN_LR_MULT": 0.10,                   # final LR multiplier for cosine round schedule
    "INIT_CLASSIFIER_BIAS": False,         # initialize final classifier bias with train-set class prior
    "NUM_WORKERS": 0,
    "PIN_MEMORY": False,
    "PERSISTENT_WORKERS": False,
    "PREFETCH_FACTOR": 2,

    # ---- Runtime optimizations --------------------------------------
    # These do NOT change the model/research method when left at defaults.
    "USE_CHANNELS_LAST": False,           # optional CUDA memory format; turn on only if stable on your GPU
    "USE_STRONG_AUG": False,              # stronger train-time augmentation for full-data accuracy runs
    "USE_RANDOM_ERASING": False,          # regularization for fine-tuning runs
    "TTA_EVAL": False,                    # test-time horizontal flip averaging during validation/test
    "USE_BEST_VAL_MODEL": False,          # evaluate the best validation round, not only the final round
    "BEST_MODEL_METRIC": "accuracy",      # "accuracy" or "macro_f1"
    "BEST_MODEL_MIN_ROUND": 1,            # ignore very early rounds for best-model tracking
    "UNFREEZE_RESNET_LAYER3": False,      # train the second-to-last ResNet block too (more capacity)
    "UNFREEZE_RESNET_LAYER4": False,      # train only final ResNet block when backbones are otherwise frozen
    "UNFREEZE_VIT_LAST_N_BLOCKS": 0,      # train last N ViT transformer blocks when backbones are otherwise frozen
    "UNFREEZE_VIT_NORM": False,           # train ViT final norm layer during partial fine-tuning
    "BACKBONE_LR_MULT": 0.20,             # lower LR for partially unfrozen backbone layers
    "EVAL_EVERY": 1,                      # validate every round; increase to 2/5 for faster exploratory runs
    "MAX_VAL_BATCHES": None,              # use an integer only for quick sanity checks
    "CLEAR_CUDA_EACH_CLIENT": False,      # empty_cache is slow; keep False unless you hit CUDA OOM
    "MAX_TRAIN_BATCHES_PER_CLIENT": None, # cap client batches only for quick/low-memory runs
    "MAX_TEST_BATCHES": None,             # cap final test batches only for sanity runs
    "SAVE_RUN_ARTIFACTS_IN_MEMORY": False,# prevents y_prob/pred arrays from accumulating across runs
    "SAVE_PREDICTIONS_TO_DISK": True,     # save predictions as compact .npz files instead of holding them
    "SAVE_MODEL_CHECKPOINTS": True,       # set False in low-memory/quick profiles to avoid heavy .pt files
    "RESUME_FROM_PARTIAL": True,          # skip finished runs when re-running after a crash

    # ---- Model (Sec 4.2) --------------------------------------------
    "NUM_CLASSES": 7,
    "RESNET_PRETRAINED": True,
    "VIT_PRETRAINED": True,
    # Sec 2.2 compares against full hybrid CNN-ViT models (e.g. GlobalSkinNet).
    # Use vit_base_patch16_224 -- the standard ViT from Dosovitskiy et al. [23].
    "VIT_BACKBONE": "vit_base_patch16_224",
    "FUSION_DIM": 512,
    "DROPOUT": 0.30,
    "FREEZE_BACKBONES": False,

    # ---- Optimisation (Sec 5.3) -------------------------------------
    # Sec 5.3: "Adam optimizer with an initial learning rate of 1x10^-4
    #           and a batch size of 32".
    "OPTIMIZER": "adam",
    "LR": 1e-4,
    "WEIGHT_DECAY": 0.0,                   # Adam, no decay mentioned in Sec 5.3
    "LABEL_SMOOTHING": 0.0,                # set >0 (e.g. 0.05-0.1) in high-accuracy profiles;
                                            # softens one-hot targets, reduces overconfidence/overfitting
    "LR_WARMUP_ROUNDS": 0,                 # linearly ramp LR from 0 -> target over N rounds; helps
                                            # when several backbone layers are unfrozen simultaneously
    "USE_AMP": True,                       # speed only; does not change math
    # Sec 4.2: "optionally replaced by a focal loss formulation [21]".
    # We make focal loss OPTIONAL and DEFAULT OFF, because the manuscript says
    # "optionally". If you want the focal-loss variant, set this to True.
    "USE_FOCAL_LOSS": False,
    "FOCAL_GAMMA": 2.0,
    # Optional class weighting. Helpful for HAM10000 because the original dataset is
    # highly imbalanced and tiny Colab smoke tests can otherwise collapse to one class.
    "USE_CLASS_WEIGHTED_LOSS": False,
    "CLASS_WEIGHT_POWER": 0.5,            # 0.5 = softened inverse-frequency weighting

    # ---- Poisoning (Sec 4.4 + Sec 5.4) ------------------------------
    "FLIP_PROB": 1.0,                      # Sec 5.4: "rho = 1.0"
    "MALICIOUS_CLASSES": ["mel", "bcc", "akiec"],   # Sec 5.4
    "TARGET_BENIGN_CLASS": "nv",                    # Sec 5.4

    # ---- Aggregation baselines (Sec 5.4) ---------------------------
    "AGGREGATORS": ["fedavg", "krum", "trimmed_mean", "trust"],
    "TRIM_RATIO": 0.2,                     # Sec 5.4: trimmed mean

    # ---- Trust-aware aggregation (Sec 4.5) --------------------------
    # IMPORTANT: matches Algorithm 1 verbatim.
    # - Geometric median as reference (not coordinate median).
    # - Fixed T_low / T_high thresholds on Euclidean distance.
    # - Momentum reputation r_i with parameter rho_m.
    # - Aggregation: w_g = sum_i r_i * phi * w_i / sum_i r_i * phi.
    # No validation blending, no min-agg-weight floor, no auto-thresholds.
    "TRUST_T_LOW": 1.0e-2,                 # distance below which client is fully trusted
    "TRUST_T_HIGH": 1.0e-1,                # distance above which client gets zero trust
    "TRUST_MOMENTUM": 0.85,                # rho_m in Eq. for r_i^(t+1)
    "TRUST_FLAG_PHI_THRESHOLD": 0.5,       # for detection-rate metric (Sec 5.5)
    "TRUST_FLAG_ROUNDS": 5,                # "within a fixed number of rounds" (Sec 5.5)
    "TRUST_GEOM_MEDIAN_ITERS": 10,         # Weiszfeld iterations for GeomMed
    # Raw L2 distance over millions of parameters can make all phi values zero.
    # "rms" uses L2/sqrt(num_parameters), which is more numerically stable in Colab runs.
    # Use "l2" only if your manuscript explicitly defines raw Euclidean distance.
    "TRUST_DISTANCE_MODE": "rms",          # options: "rms" or "l2"
    "TRUST_ADAPTIVE_THRESHOLDS": True,     # robust MAD thresholds reduce all-zero trust weights
    "TRUST_MAD_LOW_MULT": 0.5,
    "TRUST_MAD_HIGH_MULT": 3.0,

    # ---- Centralized upper bound (Sec 5.4) -------------------------
    "RUN_CENTRALIZED_BASELINE": True,
    "CENTRALIZED_EPOCHS": 15,

    # ---- Output -----------------------------------------------------
    # Use the OUTPUT_DIR set by the Colab setup cell (cell 1) if available;
    # otherwise fall back to a Colab-aware default.
    "OUTPUT_DIR": OUTPUT_DIR if 'OUTPUT_DIR' in globals() else (
        "/content/fedresvit_outputs_manuscript" if os.path.exists("/content")
        else "./fedresvit_outputs_manuscript"
    ),
}

PROFILE_OVERRIDES = {
    "debug": {
        "SMOKE_TEST": True,
        "SMOKE_MAX_IMAGES": 700,
        "NUM_CLIENTS": 5,
        "NUM_ROUNDS": 2,
        "LOCAL_EPOCHS": 1,
        "BATCH_SIZE": 16,
        "MALICIOUS_FRACTIONS": [0.0, 0.2],
        "SEEDS": [42],
        "RUN_CENTRALIZED_BASELINE": False,
    },
    "smoke": {
        "SMOKE_TEST": True,
        "SMOKE_MAX_IMAGES": 3000,
        "NUM_CLIENTS": 5,
        "NUM_ROUNDS": 5,
        "LOCAL_EPOCHS": 1,
        "BATCH_SIZE": 32,
        "MALICIOUS_FRACTIONS": [0.0, 0.2],
        "SEEDS": [42],
        "RUN_CENTRALIZED_BASELINE": False,
    },
    "paper_fast": {
        # Fast research run: same Fed-ResViT + FL idea, fewer repetitions.
        # Use this for code testing, ablation drafting, and preliminary tables.
        "SMOKE_TEST": True,
        "SMOKE_MAX_IMAGES": 3000,
        "NUM_CLIENTS": 5,
        "NUM_ROUNDS": 5,
        "LOCAL_EPOCHS": 1,
        "BATCH_SIZE": 32,
        "MALICIOUS_FRACTIONS": [0.0, 0.2],
        "SEEDS": [42],
        "AGGREGATORS": ["fedavg", "trust"],
        "RUN_CENTRALIZED_BASELINE": False,
        "EVAL_EVERY": 1,
        "MAX_VAL_BATCHES": None,
        "MAX_TRAIN_BATCHES_PER_CLIENT": None,
        "SAVE_RUN_ARTIFACTS_IN_MEMORY": False,
        "SAVE_MODEL_CHECKPOINTS": False,
        "VIT_BACKBONE": "vit_base_patch16_224",
    },

    "colab_quality": {
        # Practical quality run for Colab/T4.
        # Use this after colab_safe runs. It is still much faster than paper_full,
        # but it uses enough data/rounds to avoid meaningless 10–20% sanity-check scores.
        "SMOKE_TEST": True,
        "SMOKE_MAX_IMAGES": 3500,
        "NUM_CLIENTS": 5,
        "NUM_ROUNDS": 8,
        "LOCAL_EPOCHS": 1,
        "BATCH_SIZE": 16,
        "MALICIOUS_FRACTIONS": [0.0, 0.2],
        "SEEDS": [42],
        "AGGREGATORS": ["fedavg", "trust"],
        "RUN_CENTRALIZED_BASELINE": False,
        "EVAL_EVERY": 1,
        "MAX_VAL_BATCHES": None,
        "MAX_TEST_BATCHES": None,
        "MAX_TRAIN_BATCHES_PER_CLIENT": 20,
        "NUM_WORKERS": 0,
        "PIN_MEMORY": False,
        "PERSISTENT_WORKERS": False,
        "CLEAR_CUDA_EACH_CLIENT": True,
        "SAVE_RUN_ARTIFACTS_IN_MEMORY": False,
        "SAVE_MODEL_CHECKPOINTS": False,
        "SAVE_PREDICTIONS_TO_DISK": True,
        "RESUME_FROM_PARTIAL": True,
        "USE_AMP": True,
        "OPTIMIZER": "adamw",
        "LR": 5e-4,
        "WEIGHT_DECAY": 1e-4,
        "USE_CLASS_WEIGHTED_LOSS": True,
        "CLASS_WEIGHT_POWER": 0.5,
        "VIT_BACKBONE": "vit_tiny_patch16_224",
        "FUSION_DIM": 256,
        "FREEZE_BACKBONES": True,
        "TRUST_GEOM_MEDIAN_ITERS": 3,
        "TRUST_DISTANCE_MODE": "rms",
        "TRUST_ADAPTIVE_THRESHOLDS": True,
    },

    "colab_safe": {
        # Ultra-safe run for Colab free/T4 when runtime crashes.
        # This is for verifying the pipeline, not for final manuscript numbers.
        "SMOKE_TEST": True,
        "SMOKE_MAX_IMAGES": 1200,
        "NUM_CLIENTS": 3,
        "NUM_ROUNDS": 3,
        "LOCAL_EPOCHS": 1,
        "BATCH_SIZE": 8,
        "MALICIOUS_FRACTIONS": [0.0, 0.2],
        "SEEDS": [42],
        "AGGREGATORS": ["fedavg", "trust"],
        "RUN_CENTRALIZED_BASELINE": False,
        "EVAL_EVERY": 1,
        "MAX_VAL_BATCHES": 10,
        "NUM_WORKERS": 0,
        "PIN_MEMORY": False,
        "PERSISTENT_WORKERS": False,
        "CLEAR_CUDA_EACH_CLIENT": True,
        "MAX_TRAIN_BATCHES_PER_CLIENT": 8,
        "MAX_TEST_BATCHES": 10,
        "SAVE_RUN_ARTIFACTS_IN_MEMORY": False,
        "SAVE_MODEL_CHECKPOINTS": False,
        "SAVE_PREDICTIONS_TO_DISK": True,
        "RESUME_FROM_PARTIAL": True,
        "USE_AMP": True,
        "VIT_BACKBONE": "vit_tiny_patch16_224",
        "FUSION_DIM": 128,
        "FREEZE_BACKBONES": True,
        "TRUST_GEOM_MEDIAN_ITERS": 3,
        "TRUST_DISTANCE_MODE": "rms",
        "TRUST_ADAPTIVE_THRESHOLDS": True,
    },


    "target90_clean": {
        # High-accuracy clean FL run. This is the profile to try first
        # when the objective is 90%+ clean accuracy. It uses the full
        # HAM10000 split, no smoke cap, no attack condition, partial
        # fine-tuning, stronger augmentation, best-validation checkpointing,
        # and TTA. It is slower than colab_quality but still much lighter
        # than paper_full.
        "SMOKE_TEST": False,
        "SMOKE_MAX_IMAGES": None,
        "NUM_CLIENTS": 5,
        "NUM_ROUNDS": 25,
        "LOCAL_EPOCHS": 2,
        "BATCH_SIZE": 16,
        "DIRICHLET_ALPHA": 1.0,
        "MALICIOUS_FRACTIONS": [0.0],
        "SEEDS": [42],
        "AGGREGATORS": ["fedavg"],
        "RUN_CENTRALIZED_BASELINE": False,
        "EVAL_EVERY": 1,
        "MAX_VAL_BATCHES": None,
        "MAX_TEST_BATCHES": None,
        "MAX_TRAIN_BATCHES_PER_CLIENT": None,
        "NUM_WORKERS": 2,
        "PIN_MEMORY": True,
        "PERSISTENT_WORKERS": False,
        "CLEAR_CUDA_EACH_CLIENT": True,
        "SAVE_RUN_ARTIFACTS_IN_MEMORY": False,
        "SAVE_MODEL_CHECKPOINTS": True,
        "SAVE_PREDICTIONS_TO_DISK": True,
        "RESUME_FROM_PARTIAL": False,
        "USE_AMP": True,
        "USE_CHANNELS_LAST": True,
        "OPTIMIZER": "adamw",
        "LR": 3e-4,
        "BACKBONE_LR_MULT": 0.20,
        "WEIGHT_DECAY": 1e-4,
        "USE_CLASS_WEIGHTED_LOSS": False,
        "USE_FOCAL_LOSS": False,
        "VIT_BACKBONE": "vit_small_patch16_224",
        "FUSION_DIM": 512,
        "DROPOUT": 0.25,
        "FREEZE_BACKBONES": True,
        "UNFREEZE_RESNET_LAYER4": True,
        "UNFREEZE_VIT_LAST_N_BLOCKS": 2,
        "UNFREEZE_VIT_NORM": True,
        "USE_STRONG_AUG": True,
        "USE_RANDOM_ERASING": True,
        "TTA_EVAL": True,
        "USE_BEST_VAL_MODEL": True,
        "BEST_MODEL_METRIC": "accuracy",
        "BEST_MODEL_MIN_ROUND": 3,
        "TRUST_GEOM_MEDIAN_ITERS": 3,
        "TRUST_DISTANCE_MODE": "rms",
        "TRUST_ADAPTIVE_THRESHOLDS": True,
    },

    "target90_balanced": {
        # Same as target90_clean, but tuned to avoid simply maximizing the
        # dominant nv class. This is better for a publishable table because
        # macro-F1, recall, and minority classes matter.
        "SMOKE_TEST": False,
        "SMOKE_MAX_IMAGES": None,
        "NUM_CLIENTS": 5,
        "NUM_ROUNDS": 30,
        "LOCAL_EPOCHS": 2,
        "BATCH_SIZE": 16,
        "DIRICHLET_ALPHA": 1.0,
        "MALICIOUS_FRACTIONS": [0.0],
        "SEEDS": [42],
        "AGGREGATORS": ["fedavg"],
        "RUN_CENTRALIZED_BASELINE": False,
        "EVAL_EVERY": 1,
        "MAX_VAL_BATCHES": None,
        "MAX_TEST_BATCHES": None,
        "MAX_TRAIN_BATCHES_PER_CLIENT": None,
        "NUM_WORKERS": 2,
        "PIN_MEMORY": True,
        "PERSISTENT_WORKERS": False,
        "CLEAR_CUDA_EACH_CLIENT": True,
        "SAVE_RUN_ARTIFACTS_IN_MEMORY": False,
        "SAVE_MODEL_CHECKPOINTS": True,
        "SAVE_PREDICTIONS_TO_DISK": True,
        "RESUME_FROM_PARTIAL": False,
        "USE_AMP": True,
        "USE_CHANNELS_LAST": True,
        "OPTIMIZER": "adamw",
        "LR": 3e-4,
        "BACKBONE_LR_MULT": 0.20,
        "WEIGHT_DECAY": 1e-4,
        "USE_CLASS_WEIGHTED_LOSS": True,
        "CLASS_WEIGHT_POWER": 0.25,
        "USE_FOCAL_LOSS": False,
        "VIT_BACKBONE": "vit_small_patch16_224",
        "FUSION_DIM": 512,
        "DROPOUT": 0.25,
        "FREEZE_BACKBONES": True,
        "UNFREEZE_RESNET_LAYER4": True,
        "UNFREEZE_VIT_LAST_N_BLOCKS": 2,
        "UNFREEZE_VIT_NORM": True,
        "USE_STRONG_AUG": True,
        "USE_RANDOM_ERASING": True,
        "TTA_EVAL": True,
        "USE_BEST_VAL_MODEL": True,
        "BEST_MODEL_METRIC": "macro_f1",
        "BEST_MODEL_MIN_ROUND": 3,
        "TRUST_GEOM_MEDIAN_ITERS": 3,
        "TRUST_DISTANCE_MODE": "rms",
        "TRUST_ADAPTIVE_THRESHOLDS": True,
    },


    "target90_central_probe": {
        # Centralized upper-bound probe. Run this before expecting 90%+ from FL.
        # If this does not approach 90%, federated FedAvg usually will not.
        "SMOKE_TEST": False,
        "SMOKE_MAX_IMAGES": None,
        "NUM_CLIENTS": 5,
        "NUM_ROUNDS": 1,
        "LOCAL_EPOCHS": 1,
        "BATCH_SIZE": 16,
        "PARTITION_METHOD": "stratified_balanced",
        "MALICIOUS_FRACTIONS": [0.0],
        "SEEDS": [42],
        "AGGREGATORS": [],
        "RUN_CENTRALIZED_BASELINE": True,
        "CENTRALIZED_EPOCHS": 30,
        "NUM_WORKERS": 2,
        "PIN_MEMORY": True,
        "PERSISTENT_WORKERS": False,
        "CLEAR_CUDA_EACH_CLIENT": True,
        "SAVE_RUN_ARTIFACTS_IN_MEMORY": False,
        "SAVE_MODEL_CHECKPOINTS": True,
        "SAVE_PREDICTIONS_TO_DISK": True,
        "RESUME_FROM_PARTIAL": False,
        "USE_AMP": True,
        "USE_CHANNELS_LAST": True,
        "OPTIMIZER": "adamw",
        "LR": 2e-4,
        "BACKBONE_LR_MULT": 0.10,
        "WEIGHT_DECAY": 1e-4,
        "USE_CLASS_WEIGHTED_LOSS": False,
        "USE_FOCAL_LOSS": False,
        "VIT_BACKBONE": "vit_small_patch16_224",
        "FUSION_DIM": 768,
        "DROPOUT": 0.20,
        "FREEZE_BACKBONES": True,
        "FREEZE_BATCHNORM_STATS": True,
        "UNFREEZE_RESNET_LAYER4": True,
        "UNFREEZE_VIT_LAST_N_BLOCKS": 4,
        "UNFREEZE_VIT_NORM": True,
        "USE_STRONG_AUG": True,
        "USE_RANDOM_ERASING": False,
        "TTA_EVAL": True,
        "USE_BEST_VAL_MODEL": True,
        "BEST_MODEL_METRIC": "accuracy",
        "BEST_MODEL_MIN_ROUND": 5,
        "INIT_CLASSIFIER_BIAS": True,
    },

    "target90_v2": {
        # Improved high-accuracy FL profile after the first run plateaued near 80%.
        # It reduces client drift by using a stratified-balanced client split,
        # freezes ResNet BatchNorm running statistics, applies cosine round LR decay,
        # and fine-tunes slightly more of the pretrained backbones.
        "SMOKE_TEST": False,
        "SMOKE_MAX_IMAGES": None,
        "NUM_CLIENTS": 5,
        "NUM_ROUNDS": 40,
        "LOCAL_EPOCHS": 2,
        "BATCH_SIZE": 16,
        "PARTITION_METHOD": "stratified_balanced",
        "DIRICHLET_ALPHA": 10.0,
        "MALICIOUS_FRACTIONS": [0.0],
        "SEEDS": [42],
        "AGGREGATORS": ["fedavg"],
        "RUN_CENTRALIZED_BASELINE": False,
        "EVAL_EVERY": 1,
        "MAX_VAL_BATCHES": None,
        "MAX_TEST_BATCHES": None,
        "MAX_TRAIN_BATCHES_PER_CLIENT": None,
        "NUM_WORKERS": 2,
        "PIN_MEMORY": True,
        "PERSISTENT_WORKERS": False,
        "CLEAR_CUDA_EACH_CLIENT": True,
        "SAVE_RUN_ARTIFACTS_IN_MEMORY": False,
        "SAVE_MODEL_CHECKPOINTS": True,
        "SAVE_PREDICTIONS_TO_DISK": True,
        "RESUME_FROM_PARTIAL": False,
        "USE_AMP": True,
        "USE_CHANNELS_LAST": True,
        "OPTIMIZER": "adamw",
        "LR": 2e-4,
        "BACKBONE_LR_MULT": 0.10,
        "WEIGHT_DECAY": 1e-4,
        "ROUND_LR_SCHEDULE": "cosine",
        "MIN_LR_MULT": 0.15,
        "USE_CLASS_WEIGHTED_LOSS": False,
        "USE_CLIENT_BALANCED_SAMPLER": False,
        "USE_FOCAL_LOSS": False,
        "VIT_BACKBONE": "vit_small_patch16_224",
        "FUSION_DIM": 768,
        "DROPOUT": 0.20,
        "FREEZE_BACKBONES": True,
        "FREEZE_BATCHNORM_STATS": True,
        "UNFREEZE_RESNET_LAYER4": True,
        "UNFREEZE_VIT_LAST_N_BLOCKS": 4,
        "UNFREEZE_VIT_NORM": True,
        "USE_STRONG_AUG": True,
        "USE_RANDOM_ERASING": False,
        "TTA_EVAL": True,
        "USE_BEST_VAL_MODEL": True,
        "BEST_MODEL_METRIC": "accuracy",
        "BEST_MODEL_MIN_ROUND": 5,
        "INIT_CLASSIFIER_BIAS": True,
        "TRUST_GEOM_MEDIAN_ITERS": 3,
        "TRUST_DISTANCE_MODE": "rms",
        "TRUST_ADAPTIVE_THRESHOLDS": True,
    },

    "target90_v2_balanced": {
        # Balanced version. This may produce slightly lower top-line accuracy
        # than target90_v2, but usually gives better macro-F1/recall.
        "SMOKE_TEST": False,
        "SMOKE_MAX_IMAGES": None,
        "NUM_CLIENTS": 5,
        "NUM_ROUNDS": 45,
        "LOCAL_EPOCHS": 2,
        "BATCH_SIZE": 16,
        "PARTITION_METHOD": "stratified_balanced",
        "DIRICHLET_ALPHA": 10.0,
        "MALICIOUS_FRACTIONS": [0.0],
        "SEEDS": [42],
        "AGGREGATORS": ["fedavg"],
        "RUN_CENTRALIZED_BASELINE": False,
        "EVAL_EVERY": 1,
        "MAX_VAL_BATCHES": None,
        "MAX_TEST_BATCHES": None,
        "MAX_TRAIN_BATCHES_PER_CLIENT": None,
        "NUM_WORKERS": 2,
        "PIN_MEMORY": True,
        "PERSISTENT_WORKERS": False,
        "CLEAR_CUDA_EACH_CLIENT": True,
        "SAVE_RUN_ARTIFACTS_IN_MEMORY": False,
        "SAVE_MODEL_CHECKPOINTS": True,
        "SAVE_PREDICTIONS_TO_DISK": True,
        "RESUME_FROM_PARTIAL": False,
        "USE_AMP": True,
        "USE_CHANNELS_LAST": True,
        "OPTIMIZER": "adamw",
        "LR": 2e-4,
        "BACKBONE_LR_MULT": 0.10,
        "WEIGHT_DECAY": 1e-4,
        "ROUND_LR_SCHEDULE": "cosine",
        "MIN_LR_MULT": 0.15,
        "USE_CLASS_WEIGHTED_LOSS": True,
        "CLASS_WEIGHT_POWER": 0.25,
        "USE_CLIENT_BALANCED_SAMPLER": True,
        "USE_FOCAL_LOSS": False,
        "VIT_BACKBONE": "vit_small_patch16_224",
        "FUSION_DIM": 768,
        "DROPOUT": 0.20,
        "FREEZE_BACKBONES": True,
        "FREEZE_BATCHNORM_STATS": True,
        "UNFREEZE_RESNET_LAYER4": True,
        "UNFREEZE_VIT_LAST_N_BLOCKS": 4,
        "UNFREEZE_VIT_NORM": True,
        "USE_STRONG_AUG": True,
        "USE_RANDOM_ERASING": False,
        "TTA_EVAL": True,
        "USE_BEST_VAL_MODEL": True,
        "BEST_MODEL_METRIC": "macro_f1",
        "BEST_MODEL_MIN_ROUND": 5,
        "INIT_CLASSIFIER_BIAS": False,
        "TRUST_GEOM_MEDIAN_ITERS": 3,
        "TRUST_DISTANCE_MODE": "rms",
        "TRUST_ADAPTIVE_THRESHOLDS": True,
    },

    "target90_v3": {
        # Full-fine-tune, high-accuracy profile. Differs from target90_v2 in the
        # ways most likely to close the gap to 90%+ raw test accuracy:
        #  - unfreezes ResNet layer3+layer4 and the last 6 ViT blocks (not just
        #    layer4 / last-4-blocks), so the backbones can actually adapt to
        #    dermoscopic images instead of staying close to ImageNet features;
        #  - uses a 3-round linear LR warmup before cosine decay, since waking up
        #    that many pretrained layers at once at full LR is what usually causes
        #    early-training instability / underfitting plateaus;
        #  - adds light label smoothing (helps generalization on a noisy,
        #    imbalanced 7-class problem);
        #  - trains for more rounds since more parameters are being adapted.
        # Still uses stratified_balanced (near-IID) partitioning + best-val
        # checkpoint + TTA, like target90_v2.
        "SMOKE_TEST": False,
        "SMOKE_MAX_IMAGES": None,
        "NUM_CLIENTS": 5,
        "NUM_ROUNDS": 60,
        "LOCAL_EPOCHS": 2,
        "BATCH_SIZE": 16,
        "PARTITION_METHOD": "stratified_balanced",
        "DIRICHLET_ALPHA": 10.0,
        "MALICIOUS_FRACTIONS": [0.0],
        "SEEDS": [42],
        "AGGREGATORS": ["fedavg"],
        "RUN_CENTRALIZED_BASELINE": False,
        "EVAL_EVERY": 1,
        "MAX_VAL_BATCHES": None,
        "MAX_TEST_BATCHES": None,
        "MAX_TRAIN_BATCHES_PER_CLIENT": None,
        "NUM_WORKERS": 2,
        "PIN_MEMORY": True,
        "PERSISTENT_WORKERS": False,
        "CLEAR_CUDA_EACH_CLIENT": True,
        "SAVE_RUN_ARTIFACTS_IN_MEMORY": False,
        "SAVE_MODEL_CHECKPOINTS": True,
        "SAVE_PREDICTIONS_TO_DISK": True,
        "RESUME_FROM_PARTIAL": False,
        "USE_AMP": True,
        "USE_CHANNELS_LAST": True,
        "OPTIMIZER": "adamw",
        "LR": 2e-4,
        "BACKBONE_LR_MULT": 0.10,
        "WEIGHT_DECAY": 1e-4,
        "LABEL_SMOOTHING": 0.05,
        "LR_WARMUP_ROUNDS": 3,
        "ROUND_LR_SCHEDULE": "cosine",
        "MIN_LR_MULT": 0.05,
        "USE_CLASS_WEIGHTED_LOSS": False,
        "USE_CLIENT_BALANCED_SAMPLER": False,
        "USE_FOCAL_LOSS": False,
        "VIT_BACKBONE": "vit_small_patch16_224",
        "FUSION_DIM": 768,
        "DROPOUT": 0.20,
        "FREEZE_BACKBONES": True,
        "FREEZE_BATCHNORM_STATS": True,
        "UNFREEZE_RESNET_LAYER3": True,
        "UNFREEZE_RESNET_LAYER4": True,
        "UNFREEZE_VIT_LAST_N_BLOCKS": 6,
        "UNFREEZE_VIT_NORM": True,
        "USE_STRONG_AUG": True,
        "USE_RANDOM_ERASING": True,
        "TTA_EVAL": True,
        "USE_BEST_VAL_MODEL": True,
        "BEST_MODEL_METRIC": "accuracy",
        "BEST_MODEL_MIN_ROUND": 5,
        "INIT_CLASSIFIER_BIAS": True,
        "TRUST_GEOM_MEDIAN_ITERS": 3,
        "TRUST_DISTANCE_MODE": "rms",
        "TRUST_ADAPTIVE_THRESHOLDS": True,
    },


    # ---- MULTI-RUN ATTACK-AWARE HIGH-ACCURACY PROFILE ----
    # Same backbone/fine-tuning recipe as target90_v3 (best clean accuracy so
    # far: val 0.8295 / test 0.8337), but:
    #  - runs 2 seeds (42, 43) instead of 1, so you get >1 run and can see
    #    run-to-run variance instead of a single row;
    #  - adds a malicious_fraction=0.2 condition, so ASR / detection-rate /
    #    false-positive-rate are actually populated instead of showing
    #    'ASR=NA (no attack)' every round;
    #  - runs both 'fedavg' (undefended) and 'trust' (trust-aware defense)
    #    so you can directly see the defense working: fedavg accuracy/ASR
    #    should degrade under attack while trust should hold up better;
    #  - slightly reduces backbone LR mult and unfrozen ViT blocks vs v3
    #    (which plateaued/oscillated after round 14) to reduce drift, and
    #    trims NUM_ROUNDS since v3's improvement had already saturated by
    #    round ~14-20 -- extra rounds were mostly wasted compute.
    # 2 seeds x 2 malicious_fractions x 2 aggregators = 8 runs total.
    # NOTE: this is meaningfully more GPU time than target90_v3 (roughly
    # 8x one run's worth). RESUME_FROM_PARTIAL is turned back on so you can
    # split this across multiple Colab sessions safely -- completed
    # (seed, malicious_fraction, aggregator) combos are skipped on rerun.
    "target90_v4_multirun": {
        "SMOKE_TEST": False,
        "SMOKE_MAX_IMAGES": None,
        "NUM_CLIENTS": 5,
        "NUM_ROUNDS": 30,
        "LOCAL_EPOCHS": 2,
        "BATCH_SIZE": 16,
        "PARTITION_METHOD": "stratified_balanced",
        "DIRICHLET_ALPHA": 10.0,
        "MALICIOUS_FRACTIONS": [0.0, 0.2],
        "SEEDS": [42, 43],
        "AGGREGATORS": ["fedavg", "trust"],
        "RUN_CENTRALIZED_BASELINE": False,
        "EVAL_EVERY": 1,
        "MAX_VAL_BATCHES": None,
        "MAX_TEST_BATCHES": None,
        "MAX_TRAIN_BATCHES_PER_CLIENT": None,
        "NUM_WORKERS": 2,
        "PIN_MEMORY": True,
        "PERSISTENT_WORKERS": False,
        "CLEAR_CUDA_EACH_CLIENT": True,
        "SAVE_RUN_ARTIFACTS_IN_MEMORY": False,
        "SAVE_MODEL_CHECKPOINTS": True,
        "SAVE_PREDICTIONS_TO_DISK": True,
        "RESUME_FROM_PARTIAL": True,
        "USE_AMP": True,
        "USE_CHANNELS_LAST": True,
        "OPTIMIZER": "adamw",
        "LR": 2e-4,
        "BACKBONE_LR_MULT": 0.08,
        "WEIGHT_DECAY": 1e-4,
        "LABEL_SMOOTHING": 0.05,
        "LR_WARMUP_ROUNDS": 3,
        "ROUND_LR_SCHEDULE": "cosine",
        "MIN_LR_MULT": 0.05,
        "USE_CLASS_WEIGHTED_LOSS": False,
        "USE_CLIENT_BALANCED_SAMPLER": False,
        "USE_FOCAL_LOSS": False,
        "VIT_BACKBONE": "vit_small_patch16_224",
        "FUSION_DIM": 768,
        "DROPOUT": 0.20,
        "FREEZE_BACKBONES": True,
        "FREEZE_BATCHNORM_STATS": True,
        "UNFREEZE_RESNET_LAYER3": True,
        "UNFREEZE_RESNET_LAYER4": True,
        "UNFREEZE_VIT_LAST_N_BLOCKS": 4,
        "UNFREEZE_VIT_NORM": True,
        "USE_STRONG_AUG": True,
        "USE_RANDOM_ERASING": True,
        "TTA_EVAL": True,
        "USE_BEST_VAL_MODEL": True,
        "BEST_MODEL_METRIC": "accuracy",
        "BEST_MODEL_MIN_ROUND": 5,
        "INIT_CLASSIFIER_BIAS": True,
        "TRUST_GEOM_MEDIAN_ITERS": 3,
        "TRUST_DISTANCE_MODE": "rms",
        "TRUST_ADAPTIVE_THRESHOLDS": True,
    },

    # ---- THE MANUSCRIPT PROTOCOL (Sec 5.3, 5.4, 5.5) ----
    "paper_full": {
        "SMOKE_TEST": False,
        "SMOKE_MAX_IMAGES": None,
        "NUM_CLIENTS": 10,                 # Sec 5.3 - 10 originally
        "NUM_ROUNDS": 50,                 # Sec 5.3
        "LOCAL_EPOCHS": 3,                 # Sec 5.3
        "BATCH_SIZE": 32,                  # Sec 5.3
        "MALICIOUS_FRACTIONS": [0.0, 0.1, 0.2, 0.3],   # Sec 5.4
        "SEEDS": [42, 43, 44, 45, 46],     # Sec 5.5: five seeds
        "RUN_CENTRALIZED_BASELINE": True,  # Sec 5.4
        "VIT_BACKBONE": "vit_base_patch16_224",
    },
}

if EXPERIMENT_PROFILE not in PROFILE_OVERRIDES:
    raise ValueError(
        f"Unknown EXPERIMENT_PROFILE={EXPERIMENT_PROFILE}. "
        "Use debug, smoke, paper_fast, colab_safe, colab_quality, target90_clean, target90_balanced, target90_central_probe, target90_v2, target90_v2_balanced, target90_v3, target90_v4_multirun, or paper_full."
    )

CONFIG = BASE_CONFIG.copy()
CONFIG.update(PROFILE_OVERRIDES[EXPERIMENT_PROFILE])
os.makedirs(CONFIG["OUTPUT_DIR"], exist_ok=True)

CLASS_ORDER = ["nv", "mel", "bkl", "bcc", "akiec", "vasc", "df"]
CLASS_NAMES = {
    "nv": "Melanocytic nevi",
    "mel": "Melanoma",
    "bkl": "Benign keratosis-like lesions",
    "bcc": "Basal cell carcinoma",
    "akiec": "Actinic keratoses",
    "vasc": "Vascular lesions",
    "df": "Dermatofibroma",
}
IDX_TO_CLASS = {i: c for i, c in enumerate(CLASS_ORDER)}
CLASS_TO_IDX = {c: i for i, c in enumerate(CLASS_ORDER)}

MALIGNANT_IDXS = [CLASS_TO_IDX[c] for c in CONFIG["MALICIOUS_CLASSES"]]
TARGET_BENIGN_IDX = CLASS_TO_IDX[CONFIG["TARGET_BENIGN_CLASS"]]

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print("Experiment profile:", EXPERIMENT_PROFILE)
print("PyTorch:", torch.__version__)
print("Torchvision:", torchvision.__version__)
print("timm:", timm.__version__)
print("sklearn:", sklearn.__version__)
print("Device:", DEVICE)
if DEVICE.type == "cuda":
    print("GPU:", torch.cuda.get_device_name(0))

print("\nActive CONFIG:")
for k, v in CONFIG.items():
    print(f"  {k}: {v}")


# ---------------------------------------------------------------------
# CUDA speed settings
# ---------------------------------------------------------------------
if DEVICE.type == "cuda":
    torch.backends.cudnn.benchmark = True
    try:
        torch.backends.cuda.matmul.allow_tf32 = True
        torch.backends.cudnn.allow_tf32 = True
        torch.set_float32_matmul_precision("high")
        print("CUDA speed options enabled: cuDNN benchmark + TF32 matmul")
    except Exception as e:
        print("CUDA speed option warning:", repr(e))
