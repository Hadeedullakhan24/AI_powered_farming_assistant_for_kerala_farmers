from pathlib import Path
import torch


class ModelCheckpoint:
    """
    Saves and loads trained models.
    """

    def __init__(self, save_dir):

        self.save_dir = Path(save_dir)

        self.save_dir.mkdir(
            parents=True,
            exist_ok=True
        )

    def save(self, model, filename):

        save_path = self.save_dir / filename

        torch.save(
            model.state_dict(),
            save_path
        )

        print(f"\n✅ Model saved at: {save_path}")

    def load(self, model, filename, device):

        load_path = self.save_dir / filename

        state_dict = torch.load(
            load_path,
            map_location=device,
            weights_only=True
        )

        model.load_state_dict(state_dict)

        print(f"\n✅ Model loaded from: {load_path}")

        return model