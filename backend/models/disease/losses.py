


import torch.nn as nn


class DiseaseLoss:
    """
    Creates the loss function used during training.
    """

    def __init__(self, label_smoothing=0.1):
        self.label_smoothing = label_smoothing

    def get_loss(self):
        """
        Returns CrossEntropyLoss with optional label smoothing.
        """

        return nn.CrossEntropyLoss(
            label_smoothing=self.label_smoothing
        )