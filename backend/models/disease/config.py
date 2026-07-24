from pathlib import Path
import torch

# ============================================================
# Project Paths
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[3]

DATASET_DIR = PROJECT_ROOT / "datasets"

RAW_DATASET_DIR = DATASET_DIR / "disease_detection"

PROCESSED_DATASET_DIR = DATASET_DIR / "processed"

SAVE_MODEL_DIR = PROJECT_ROOT / "saved" / "disease"

REPORT_DIR = (
    PROJECT_ROOT /
    "backend" /
    "models" /
    "disease" /
    "reports"
)

# ============================================================
# Image Configuration
# ============================================================

IMAGE_SIZE = 224
CHANNELS = 3

# ============================================================
# Training Configuration
# ============================================================

BATCH_SIZE = 32
EPOCHS = 10
LEARNING_RATE = 1e-4
WEIGHT_DECAY = 1e-4
NUM_WORKERS = 0
RANDOM_SEED = 42

# ============================================================
# Device
# ============================================================

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

# ============================================================
# Crops
# ============================================================

CROPS = [
    "banana",
    "coconut",
    "paddy",
    "pepper",
    "rubber"
]

# ============================================================
# Model Names

# ============================================================

MODEL_FILES = {
    "banana": "banana_model.pth",
    "coconut": "coconut_model.pth",
    "paddy": "paddy_model.pth",
    "pepper": "pepper_model.pth",
    "rubber": "rubber_model.pth"
}