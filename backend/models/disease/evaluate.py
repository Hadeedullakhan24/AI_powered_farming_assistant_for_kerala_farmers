"""
Disease Detection Evaluation Script

Project : AI Powered Farming Assistant for Kerala Farmers
Author  : Yamuna KN
"""

import torch
import torch.nn as nn
import matplotlib.pyplot as plt

from sklearn.metrics import (
    classification_report,
    confusion_matrix
)

import backend.models.disease.config as config

from backend.models.disease.dataset import get_dataloaders
from backend.models.disease.model import build_model
from backend.models.disease.metrics import calculate_metrics
from backend.models.disease.checkpoint import ModelCheckpoint


def evaluate(crop_name="banana"):
    """
    Evaluate a trained disease detection model.
    """

    # -----------------------------
    # Load Test Dataset
    # -----------------------------
    _, _, test_loader, classes = get_dataloaders(crop_name)

    # -----------------------------
    # Build Model
    # -----------------------------
    model = build_model(
        num_classes=len(classes)
    ).to(config.DEVICE)

    checkpoint = ModelCheckpoint(
        config.SAVE_MODEL_DIR / crop_name
    )

    model = checkpoint.load(
        model=model,
        filename="best_model.pth",
        device=config.DEVICE
    )

    model.eval()

    criterion = nn.CrossEntropyLoss()

    total_loss = 0.0

    all_predictions = []
    all_labels = []

    # -----------------------------
    # Evaluation Loop
    # -----------------------------
    with torch.no_grad():

        for images, labels in test_loader:

            images = images.to(config.DEVICE)
            labels = labels.to(config.DEVICE)

            outputs = model(images)

            loss = criterion(outputs, labels)

            total_loss += loss.item()

            predictions = torch.argmax(outputs, dim=1)

            all_predictions.extend(
                predictions.cpu().numpy()
            )

            all_labels.extend(
                labels.cpu().numpy()
            )

    avg_loss = total_loss / len(test_loader)

    metrics = calculate_metrics(
        all_labels,
        all_predictions
    )

    # -----------------------------
    # Print Results
    # -----------------------------
    print("\n" + "=" * 60)
    print("Disease Detection Evaluation")
    print("=" * 60)
    print(f"Crop       : {crop_name.capitalize()}")
    print(f"Test Loss  : {avg_loss:.4f}")
    print(f"Accuracy   : {metrics['accuracy']:.4f}")
    print(f"Precision  : {metrics['precision']:.4f}")
    print(f"Recall     : {metrics['recall']:.4f}")
    print(f"F1 Score   : {metrics['f1_score']:.4f}")
    print("=" * 60)

    # -----------------------------
    # Create Reports Folder
    # -----------------------------
    report_dir = config.REPORT_DIR

    report_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    # -----------------------------
    # Classification Report
    # -----------------------------
    report = classification_report(
        all_labels,
        all_predictions,
        target_names=classes,
        zero_division=0
    )

    report_path = report_dir / f"{crop_name}_classification_report.txt"

    with open(report_path, "w") as file:
        file.write(report)

    print("\nClassification Report\n")
    print(report)

    # -----------------------------
    # Confusion Matrix
    # -----------------------------
    cm = confusion_matrix(
        all_labels,
        all_predictions
    )

    fig, ax = plt.subplots(figsize=(8, 6))

    image = ax.imshow(cm, cmap="Blues")

    ax.set_title(
        f"{crop_name.capitalize()} Confusion Matrix"
    )

    fig.colorbar(image)

    ax.set_xticks(range(len(classes)))
    ax.set_yticks(range(len(classes)))

    ax.set_xticklabels(
        classes,
        rotation=45,
        ha="right"
    )

    ax.set_yticklabels(classes)

    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")

    # Display values inside cells
    for i in range(len(classes)):
        for j in range(len(classes)):
            ax.text(
                j,
                i,
                str(cm[i, j]),
                ha="center",
                va="center",
                color="black"
            )

    plt.tight_layout()

    cm_path = report_dir / f"{crop_name}_confusion_matrix.png"

    plt.savefig(
        cm_path,
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()

    print(f"\n✅ Classification Report Saved : {report_path}")
    print(f"✅ Confusion Matrix Saved      : {cm_path}")


import argparse

if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description="Evaluate Disease Detection Model"
    )

    parser.add_argument(
        "--crop",
        type=str,
        default="banana",
        choices=config.CROPS,
        help="Crop name to evaluate"
    )

    args = parser.parse_args()

    evaluate(args.crop)