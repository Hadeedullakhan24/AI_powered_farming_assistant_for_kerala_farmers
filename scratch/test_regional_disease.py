import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root))

from backend.services.disease_intelligence_service import get_regional_disease_intelligence
from backend.schemas.crop_advisor_schema import DiseaseIntelligenceResponse

print("--- Testing Disease & Fertilizer Intelligence Service ---")

test_crops = ["Paddy (Rice)", "Black Pepper", "Coconut", "Banana (Nendran)", "Tapioca (Cassava)", "Cardamom"]

for crop in test_crops:
    res = get_regional_disease_intelligence("Kozhikode, Kerala", crop)
    validated = DiseaseIntelligenceResponse.model_validate(res)
    print(f"\nCrop: {validated.crop}")
    print(f"Summary: {validated.region_summary}")
    print(f"Fertilizer Advisory: {validated.fertilizer_advisory}")
    print(f"Diseases Count: {len(validated.diseases)}")
    for d in validated.diseases:
        print(f"  - {d.name} [{d.risk_level} Risk]")
        print(f"    Prevention: {d.prevention}")
        print(f"    Fertilizer: {d.fertilizer_recommendation}")

print("\n--- ALL REGIONAL DISEASE & FERTILIZER TESTS PASSED ---")
