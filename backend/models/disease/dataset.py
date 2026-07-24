"""
PyTorch Dataset Loader

Author : Yamuna KN
"""

import torch
from torchvision.datasets import ImageFolder
from torch.utils.data import DataLoader

from backend.models.disease.transforms import (
    train_transform,
    val_transform,
    test_transform
)

from backend.models.disease.config import (
    PROCESSED_DATASET_DIR,
    BATCH_SIZE,
    NUM_WORKERS
)


def get_dataloaders(crop_name):

    crop_path = PROCESSED_DATASET_DIR / crop_name

    train_dataset = ImageFolder(
        crop_path / "train",
        transform=train_transform
    )

    val_dataset = ImageFolder(
        crop_path / "val",
        transform=val_transform
    )

    test_dataset = ImageFolder(
        crop_path / "test",
        transform=test_transform
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=BATCH_SIZE,
        shuffle=True,
        num_workers=NUM_WORKERS,
        pin_memory=torch.cuda.is_available()
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=NUM_WORKERS,
        pin_memory=torch.cuda.is_available()
    )

    test_loader = DataLoader(
        test_dataset,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=NUM_WORKERS,
        pin_memory=torch.cuda.is_available()
    )

    return (
        train_loader,
        val_loader,
        test_loader,
        train_dataset.classes
    )