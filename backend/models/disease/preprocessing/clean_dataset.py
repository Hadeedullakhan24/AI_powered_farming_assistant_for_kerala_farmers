
from pathlib import Path
from PIL import Image
from tqdm import tqdm
import json

# =====================================================
# Configuration
# =====================================================

PROJECT_ROOT = Path(__file__).resolve().parents[4]

DATASET_ROOT = PROJECT_ROOT / "datasets" / "disease_detection"

REPORT_FOLDER = Path(__file__).parent / "reports"
REPORT_FOLDER.mkdir(exist_ok=True)

SUPPORTED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".bmp",
    ".tif",
    ".tiff",
    ".webp"
}

# =====================================================
# Report
# =====================================================

report = {
    "total_images": 0,
    "valid_images": 0,
    "corrupted_images": [],
    "unsupported_files": [],
    "empty_files": [],
    "empty_class_folders": []
}

# =====================================================
# Start Scan
# =====================================================

print("\n" + "=" * 70)
print("AI Powered Farming Assistant")
print("Dataset Cleaning")
print("=" * 70)

for crop in sorted(DATASET_ROOT.iterdir()):

    if not crop.is_dir():
        continue

    print(f"\nScanning Crop : {crop.name}")

    for cls in sorted(crop.iterdir()):

        if not cls.is_dir():
            continue

        images = list(cls.iterdir())

        if len(images) == 0:
            report["empty_class_folders"].append(str(cls))
            print(f"  Empty Folder : {cls.name}")
            continue

        for image_path in tqdm(images, desc=cls.name):

            report["total_images"] += 1

            if image_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
                report["unsupported_files"].append(str(image_path))
                continue

            if image_path.stat().st_size == 0:
                report["empty_files"].append(str(image_path))
                continue

            try:
                with Image.open(image_path) as img:
                    img.verify()

                report["valid_images"] += 1

            except Exception:
                report["corrupted_images"].append(str(image_path))

# =====================================================
# Save Report
# =====================================================

output_file = REPORT_FOLDER / "cleaning_report.json"

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(report, f, indent=4)

# =====================================================
# Summary
# =====================================================

print("\n" + "=" * 70)
print("Cleaning Completed")
print("=" * 70)

print(f"Total Images       : {report['total_images']}")
print(f"Valid Images       : {report['valid_images']}")
print(f"Corrupted Images   : {len(report['corrupted_images'])}")
print(f"Unsupported Files  : {len(report['unsupported_files'])}")
print(f"Empty Files        : {len(report['empty_files'])}")
print(f"Empty Folders      : {len(report['empty_class_folders'])}")

print("\nReport Saved To:")
print(output_file)