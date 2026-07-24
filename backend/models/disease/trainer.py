
import torch

from backend.models.disease.metrics import calculate_metrics


class Trainer:

    def __init__(
        self,
        model,
        optimizer,
        criterion,
        device,
    ):

        self.model = model
        self.optimizer = optimizer
        self.criterion = criterion
        self.device = device

    # ---------------------------------------------------------
    # Training
    # ---------------------------------------------------------

    def train_one_epoch(self, dataloader):

        self.model.train()

        running_loss = 0.0

        all_predictions = []
        all_labels = []

        for images, labels in dataloader:

            images = images.to(self.device)
            labels = labels.to(self.device)

            self.optimizer.zero_grad()

            outputs = self.model(images)

            loss = self.criterion(outputs, labels)

            loss.backward()

            self.optimizer.step()

            running_loss += loss.item()

            predictions = torch.argmax(outputs, dim=1)

            all_predictions.extend(predictions.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

        epoch_loss = running_loss / len(dataloader)

        metrics = calculate_metrics(
            all_labels,
            all_predictions
        )

        return epoch_loss, metrics

    # ---------------------------------------------------------
    # Validation
    # ---------------------------------------------------------

    def validate_one_epoch(self, dataloader):

        self.model.eval()

        running_loss = 0.0

        all_predictions = []
        all_labels = []

        with torch.no_grad():

            for images, labels in dataloader:

                images = images.to(self.device)
                labels = labels.to(self.device)

                outputs = self.model(images)

                loss = self.criterion(outputs, labels)

                running_loss += loss.item()

                predictions = torch.argmax(outputs, dim=1)

                all_predictions.extend(predictions.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())

        epoch_loss = running_loss / len(dataloader)

        metrics = calculate_metrics(
            all_labels,
            all_predictions
        )

        return epoch_loss, metrics