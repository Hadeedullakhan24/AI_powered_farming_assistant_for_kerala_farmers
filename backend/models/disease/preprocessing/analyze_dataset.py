"""
Dataset Analysis Script

Analyzes:
1. Images per crop
2. Images per class
3. Image resolution
4. Image formats
5. Dataset statistics

Author: Yamuna KN
"""

from pathlib import Path
from collections import Counter
from PIL import Image
import json

# ===========================================================
# Paths
# ===========================================================

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

# ===========================================================

statistics = {}

total_images = 0

print("\n" + "=" * 70)
print("Dataset Analysis")
print("=" * 70)

for crop in sorted(DATASET_ROOT.iterdir()):

    if not crop.is_dir():
        continue

    crop_info = {}

    format_counter = Counter()

    width = []

    height = []

    crop_total = 0

    print(f"\nCrop : {crop.name}")

    for cls in sorted(crop.iterdir()):

        if not cls.is_dir():
            continue

        images = list(cls.glob("*"))

        crop_info[cls.name] = len(images)

        crop_total += len(images)

        print(f"{cls.name:30} {len(images)}")

        for img_path in images:

            try:

                with Image.open(img_path) as img:

                    width.append(img.width)

                    height.append(img.height)

                    format_counter[img.format] += 1

                    total_images += 1

            except Exception:

                pass

    statistics[crop.name] = {

        "classes": crop_info,

        "total_images": crop_total,

        "average_width": round(sum(width)/len(width),2),

        "average_height": round(sum(height)/len(height),2),

        "formats": dict(format_counter)

    }

print("\nTotal Images :", total_images)

with open(REPORT_PATH / "dataset_statistics.json","w") as f:

    json.dump(statistics,f,indent=4)

print("\nReport Saved Successfully")