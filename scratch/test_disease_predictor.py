import sys
from pathlib import Path
root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root))

from backend.models.disease.predict import DiseasePredictor
from PIL import Image
import tempfile

# Create dummy image
with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
    img = Image.new("RGB", (224, 224), color="green")
    img.save(tmp.name)
    dummy_path = tmp.name

for crop in ["banana", "coconut", "paddy", "pepper", "rubber"]:
    print(f"\n--- Testing crop: {crop} ---")
    try:
        predictor = DiseasePredictor(crop)
        res = predictor.predict(dummy_path)
        print(f"Success for {crop}:", res)
    except Exception as e:
        print(f"FAILED for {crop}:", type(e).__name__, e)
