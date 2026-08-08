import sys
from pathlib import Path

# Add project root to sys.path
root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root))

from backend.schemas.crop_advisor_schema import CropAdvisorRequest, CropAdvisoryResponse
from backend.services.weather_service import get_weather
from backend.services.groq_services import get_crop_advice
from backend.api.crop_advisor_api import crop_advisor

print("--- 1. Testing Weather Service Location Resolution ---")
weather = get_weather(10.8505, 76.2711)
print("Resolved Location:", weather.get("location"))

print("\n--- 2. Testing Groq Crop Advice with System & User Prompts ---")
req = CropAdvisorRequest(
    latitude=10.8505,
    longitude=76.2711,
    soil_type="Red Laterite Soil",
    irrigation="Drip Irrigation"
)

res = crop_advisor(req)
print("API Location:", res.location)
print("Summary:", res.summary)
print("Best Crop:", res.best_crop.crop, f"(Confidence: {res.best_crop.confidence}%)")
print("Best Crop Varieties:", [v.name for v in res.best_crop.varieties])
print("Recommended Crops Count:", len(res.recommended_crops))
for rc in res.recommended_crops:
    print(f"  #{rc.recommendation_rank} {rc.crop} (Score: {rc.suitability_score}%) - Varieties: {[v.name for v in rc.varieties]}")
print("Not Recommended Crops:", [nr.crop for nr in res.not_recommended])

print("\n--- ALL CROP ADVISORY TESTS COMPLETED SUCCESSFULLY! ---")
