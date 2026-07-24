"""
Split Dataset into Train / Validation / Test

70% Train
15% Validation
15% Test

Author: Yamuna KN
"""

from pathlib import Path
from sklearn.model_selection import train_test_split
import shutil

# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parents[4]

SOURCE = PROJECT_ROOT / "datasets" / "disease_detection"

DESTINATION = PROJECT_ROOT / "datasets" / "processed"

TRAIN = 0.70
VAL = 0.15
TEST = 0.15

# =========================================================

print("=" * 70)
print("Dataset Splitting")
print("=" * 70)

for crop in sorted(SOURCE.iterdir()):

    if not crop.is_dir():
        continue

    print(f"\nCrop : {crop.name}")

    for disease in sorted(crop.iterdir()):

        if not disease.is_dir():
            continue

        images = []

        for ext in ("*.jpg", "*.jpeg", "*.png", "*.bmp", "*.tif", "*.tiff", "*.webp"):
            images.extend(disease.glob(ext))

        if len(images) == 0:
            continue

        train_imgs, temp_imgs = train_test_split(
            images,
            train_size=TRAIN,
            random_state=42,
            shuffle=True
        )

        val_imgs, test_imgs = train_test_split(
            temp_imgs,
            test_size=0.50,
            random_state=42,
            shuffle=True
        )

        for split_name, split_images in {
            "train": train_imgs,
            "val": val_imgs,
            "test": test_imgs
        }.items():

            save_folder = DESTINATION / crop.name / split_name / disease.name
            save_folder.mkdir(parents=True, exist_ok=True)

            for img in split_images:
                shutil.copy2(img, save_folder / img.name)

        print(
            f"{disease.name:30}"
            f" Train:{len(train_imgs):5}"
            f" Val:{len(val_imgs):5}"
            f" Test:{len(test_imgs):5}"
        )

print("\nDataset Split Completed Successfully!")