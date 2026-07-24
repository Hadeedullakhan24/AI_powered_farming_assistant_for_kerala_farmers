"""
Disease Detection Training Script

Project : AI Powered Farming Assistant for Kerala Farmers
"""

import warnings
from pathlib import Path

import torch
from PIL import ImageFile

import backend.models.disease.config as config
from backend.models.disease.dataset import get_dataloaders
from backend.models.disease.model import build_model
from backend.models.disease.losses import DiseaseLoss
from backend.models.disease.trainer import Trainer
from backend.models.disease.checkpoint import ModelCheckpoint


# ---------------------------------------------------
# Ignore harmless PIL warnings
# ---------------------------------------------------
warnings.filterwarnings(
    "ignore",
    message="Truncated File Read"
)

warnings.filterwarnings(
    "ignore",
    message="Image appears to be a malformed MPO file"
)

ImageFile.LOAD_TRUNCATED_IMAGES = True


def train_crop(crop_name):

    train_loader, val_loader, test_loader, classes = get_dataloaders(
        crop_name
    )

    model = build_model(
        num_classes=len(classes)
    ).to(config.DEVICE)

    criterion = DiseaseLoss().get_loss()

    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=config.LEARNING_RATE,
        weight_decay=config.WEIGHT_DECAY
    )

    trainer = Trainer(
        model=model,
        optimizer=optimizer,
        criterion=criterion,
        device=config.DEVICE
    )

    checkpoint = ModelCheckpoint(
        f"saved/disease/{crop_name}"
    )

    print("\n" + "=" * 70)
    print(f"Training Crop : {crop_name.upper()}")
    print("=" * 70)

    print(f"Classes           : {classes}")
    print(f"Number of Classes : {len(classes)}")
    print(f"Training Images   : {len(train_loader.dataset)}")
    print(f"Validation Images : {len(val_loader.dataset)}")
    print(f"Testing Images    : {len(test_loader.dataset)}")
    print(f"Device            : {config.DEVICE}")

    best_accuracy = 0.0

    for epoch in range(config.EPOCHS):

        print("\n" + "=" * 60)
        print(f"Epoch [{epoch + 1}/{config.EPOCHS}]")
        print("=" * 60)

        train_loss, train_metrics = trainer.train_one_epoch(
            train_loader
        )

        val_loss, val_metrics = trainer.validate_one_epoch(
            val_loader
        )

        print("\nTraining Metrics")
        print(f"Loss      : {train_loss:.4f}")
        print(f"Accuracy  : {train_metrics['accuracy']:.4f}")
        print(f"Precision : {train_metrics['precision']:.4f}")
        print(f"Recall    : {train_metrics['recall']:.4f}")
        print(f"F1 Score  : {train_metrics['f1_score']:.4f}")

        print("\nValidation Metrics")
        print(f"Loss      : {val_loss:.4f}")
        print(f"Accuracy  : {val_metrics['accuracy']:.4f}")
        print(f"Precision : {val_metrics['precision']:.4f}")
        print(f"Recall    : {val_metrics['recall']:.4f}")
        print(f"F1 Score  : {val_metrics['f1_score']:.4f}")

        if val_metrics["accuracy"] > best_accuracy:

            best_accuracy = val_metrics["accuracy"]

            checkpoint.save(
                model,
                "best_model.pth"
            )

            print(
                f"\n✅ Best Model Saved "
                f"(Validation Accuracy: {best_accuracy:.4f})"
            )

    print(f"\n✅ {crop_name.upper()} Training Completed!")


def main():

    for crop_name in config.CROPS:

        model_path = Path(config.SAVE_MODEL_DIR) / crop_name / "best_model.pth"

        if model_path.exists():

            print(
                f"\n✅ Skipping {crop_name.upper()} "
                f"(best_model.pth already exists)"
            )

            continue

        try:

            train_crop(crop_name)

        except Exception as error:

            print("\n" + "=" * 70)
            print(f"❌ ERROR TRAINING {crop_name.upper()}")
            print(error)
            print("=" * 70)

            break

    print("\n🎉 Training Pipeline Finished!")


if __name__ == "__main__":
    main()