"""
Disease Detection Metrics
"""

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
)


def calculate_metrics(labels, predictions):
    """
    Calculate classification metrics for an entire epoch.
    """

    metrics = {

        "accuracy": accuracy_score(
            labels,
            predictions
        ),

        "precision": precision_score(
            labels,
            predictions,
            average="weighted",
            zero_division=0
        ),

        "recall": recall_score(
            labels,
            predictions,
            average="weighted",
            zero_division=0
        ),

        "f1_score": f1_score(
            labels,
            predictions,
            average="weighted",
            zero_division=0
        )

    }

    return metrics