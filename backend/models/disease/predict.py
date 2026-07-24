
from pathlib import Path

import torch
from PIL import Image
from torchvision import transforms

import backend.models.disease.config as config

from backend.models.disease.model import build_model
from backend.models.disease.checkpoint import ModelCheckpoint
from backend.models.disease.dataset import get_dataloaders


class DiseasePredictor:
    """
    Predict disease from a single image.
    """

    def __init__(self, crop_name="banana"):

        self.crop_name = crop_name

        # Load class names
        _, _, _, self.classes = get_dataloaders(crop_name)

        # Build model
        self.model = build_model(
            num_classes=len(self.classes)
        ).to(config.DEVICE)

        checkpoint = ModelCheckpoint(
            config.SAVE_MODEL_DIR / crop_name
        )

        self.model = checkpoint.load(
            self.model,
            "best_model.pth",
            config.DEVICE
        )

        self.model.eval()

        # Prediction Transform
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

    def predict(self, image_path):

        image_path = Path(image_path)

        image = Image.open(image_path).convert("RGB")

        image = self.transform(image)

        image = image.unsqueeze(0).to(config.DEVICE)

        with torch.no_grad():

            outputs = self.model(image)

            probabilities = torch.softmax(outputs, dim=1)

            confidence, prediction = torch.max(
                probabilities,
                dim=1
            )

        predicted_class = self.classes[prediction.item()]

        return {
            "crop": self.crop_name,
            "prediction": predicted_class,
            "confidence": round(confidence.item() * 100, 2)
        }


import argparse

if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description="Disease Prediction"
    )

    parser.add_argument(
        "--crop",
        type=str,
        default="banana",
        choices=config.CROPS,
        help="Crop name"
    )

    parser.add_argument(
        "--image",
        type=str,
        required=True,
        help="Path to image"
    )

    args = parser.parse_args()

    predictor = DiseasePredictor(args.crop)

    result = predictor.predict(args.image)

    print("\n" + "=" * 40)
    print("Disease Prediction Result")
    print("=" * 40)

    print(f"Crop       : {result['crop'].capitalize()}")
    print(f"Disease    : {result['prediction']}")
    print(f"Confidence : {result['confidence']}%")
    print("=" * 40)