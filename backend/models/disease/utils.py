"""
Utility Functions

Project : AI Powered Farming Assistant for Kerala Farmers
Author  : Yamuna KN
"""

import random
import numpy as np
import torch


def set_seed(seed=42):
    """
    Makes training reproducible.
    """

    random.seed(seed)

    np.random.seed(seed)

    torch.manual_seed(seed)

    if torch.cuda.is_available():
        torch.cuda.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)


def calculate_accuracy(outputs, labels):

    predictions = outputs.argmax(dim=1)

    correct = (predictions == labels).sum().item()

    accuracy = correct / labels.size(0)

    return accuracy


def save_model(model, path):

    torch.save(model.state_dict(), path)


def load_model(model, path, device):

    model.load_state_dict(
        torch.load(path, map_location=device)
    )

    return model