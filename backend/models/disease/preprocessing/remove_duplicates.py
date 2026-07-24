"""
Duplicate Image Detector

Detects duplicate images using SHA256 hash.

No files are deleted.

Author: Yamuna KN
"""

from pathlib import Path
import hashlib
import json

# ======================================================

PROJECT_ROOT = Path(__file__).resolve().parents[4]

DATASET_ROOT = PROJECT_ROOT / "datasets" / "disease_detection"

REPORT_PATH = (
    PROJECT_ROOT
    / "backend"
    / "models"
    / "disease"
    / "reports"
)

REPORT_PATH.mkdir(exist_ok=True)

# ======================================================

hashes = {}

duplicates = []

print("\nScanning for duplicate images...\n")

for crop in DATASET_ROOT.iterdir():

    if not crop.is_dir():

        continue

    for cls in crop.iterdir():

        if not cls.is_dir():

            continue

        for img in cls.glob("*"):

            if not img.is_file():

                continue

            try:

                with open(img, "rb") as f:

                    file_hash = hashlib.sha256(f.read()).hexdigest()

                if file_hash in hashes:

                    duplicates.append({

                        "original": hashes[file_hash],

                        "duplicate": str(img)

                    })

                else:

                    hashes[file_hash] = str(img)

            except Exception:

                pass

print(f"Duplicate Images Found : {len(duplicates)}")

with open(REPORT_PATH / "duplicate_report.json","w") as f:

    json.dump(duplicates,f,indent=4)

print("Duplicate report generated successfully.")