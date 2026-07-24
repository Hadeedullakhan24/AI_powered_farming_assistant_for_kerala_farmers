"""
Disease Detection Model

Project : AI Powered Farming Assistant for Kerala Farmers
Author  : Yamuna KN
"""

import torch.nn as nn
import timm


class DiseaseClassifier(nn.Module):
    """
    EfficientNet-B0 based Disease Classification Model
    """

    def __init__(
        self,
        num_classes,
        model_name="efficientnet_b0",
        pretrained=True,
        dropout=0.3
    ):
        super().__init__()

        # Load pretrained backbone
        self.backbone = timm.create_model(
            model_name,
            pretrained=pretrained
        )

        # Get classifier input features
        in_features = self.backbone.classifier.in_features

        # Replace classifier
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(in_features, num_classes)
        )

    def forward(self, x):
        return self.backbone(x)


def build_model(num_classes):
    """
    Returns the model.
    """
    return DiseaseClassifier(num_classes=num_classes)