"""
backend/services/disease_intelligence_service.py
─────────────────────────────────────────────────
Regional Crop Disease Intelligence Service.

Provides verified agronomic disease risk data for major Kerala crops
(Black Pepper, Paddy, Coconut, Banana, Rubber) by region/district.
"""

from __future__ import annotations
import logging
from typing import Dict, List, Any

logger = logging.getLogger("hexakrishi.disease_intelligence")

# Static verified agronomic disease risk intelligence catalog for Kerala
KERALA_CROP_DISEASES: Dict[str, Dict[str, Any]] = {
    "black pepper": {
        "crop_display": "Black Pepper",
        "regional_summaries": {
            "kozhikode": "High monsoon rainfall and humidity in Kozhikode make Black Pepper highly susceptible to Phytophthora Quick Wilt and Pollu Disease.",
            "wayanad": "High-altitude humid climate in Wayanad increases risk of Quick Wilt and Slow Decline in pepper plantations.",
            "idukki": "Cool humid hill climate in Idukki favors Phytophthora foot rot during rainy season.",
            "default": "Kerala's humid tropical climate creates seasonal vulnerability for Phytophthora foot rot and Pollu beetle in Black Pepper."
        },
        "diseases": [
            {
                "name": "Quick Wilt (Phytophthora Foot Rot)",
                "risk_level": "High",
                "affected_crop": "Black Pepper",
                "season": "South-West Monsoon (June - September)",
                "description": "Fungal pathogen Phytophthora capsici causes dark water-soaked lesions on leaves and rapid rotting of vine roots during heavy rainfall.",
                "prevention": "Ensure deep field drainage; apply Trichoderma harzianum enriched compost and spray 1% Bordeaux mixture before monsoon onset."
            },
            {
                "name": "Pollu Disease (Flea Beetle)",
                "risk_level": "High",
                "affected_crop": "Black Pepper",
                "season": "Post-Monsoon & Berry Formation (July - October)",
                "description": "Flea beetle (Longitarsus nigripennis) grubs bore into tender berries, causing them to turn hollow, dry, and dark.",
                "prevention": "Spray Quinalphos 0.05% or Neem seed kernel extract (5%) during berry formation stages in July and October."
            },
            {
                "name": "Slow Decline",
                "risk_level": "Medium",
                "affected_crop": "Black Pepper",
                "season": "Dry Season (January - May)",
                "description": "Fungal-nematode complex (Radopholus similis) leading to gradual foliar yellowing, root necrosis, and reduced vine vigor.",
                "prevention": "Apply neem cake @ 1kg/vine alongside bio-agent Pochonia chlamydosporia around vine basins."
            },
            {
                "name": "Yellow Mottle Virus",
                "risk_level": "Medium",
                "affected_crop": "Black Pepper",
                "season": "Year-round (Insect Vector)",
                "description": "Badnavirus causing characteristic yellow mottling, leaf crinkling, and stunted vine growth.",
                "prevention": "Use virus-free certified planting material; control vector insects using Neem oil spray."
            },
            {
                "name": "Leaf Blight (Anthracnose)",
                "risk_level": "Low",
                "affected_crop": "Black Pepper",
                "season": "High Humidity Periods",
                "description": "Colletotrichum gloeosporioides causing dark brownish spots with yellow halos on pepper leaves.",
                "prevention": "Prune excess shade trees to increase sunlight; spray Carbendazim 0.1% if leaf spots spread."
            }
        ]
    },
    "paddy (rice)": {
        "crop_display": "Paddy (Rice)",
        "regional_summaries": {
            "palakkad": "Palakkad's major rice belts experience high incidence of Stem Borer (Dead Heart) and Blast during Kharif and Rabi seasons.",
            "alappuzha": "Kuttanad waterlogged rice fields in Alappuzha are vulnerable to Bacterial Leaf Blight and Brown Spot.",
            "default": "Humid monsoon weather in Kerala rice fields promotes fungal blast and stem borer pest infestation."
        },
        "diseases": [
            {
                "name": "Rice Blast (Pyricularia oryzae)",
                "risk_level": "High",
                "affected_crop": "Paddy (Rice)",
                "season": "Monsoon & High Humidity (June - August)",
                "description": "Fungal lesions on leaves, nodes, and panicles causing spindle-shaped spots and severe crop lodging.",
                "prevention": "Use resistant varieties (e.g. Uma, Jyothi); spray Tricyclazole 75 WP @ 0.6g/L upon early symptom detection."
            },
            {
                "name": "Bacterial Leaf Blight (Xanthomonas)",
                "risk_level": "High",
                "affected_crop": "Paddy (Rice)",
                "season": "Heavy Rain & Flooding (July - September)",
                "description": "Water-soaked streaks starting from leaf margins turning yellow-white and causing leaf drying.",
                "prevention": "Avoid excess nitrogen fertilizer; spray Streptocycline (0.15g/L) + Copper Oxychloride (2.5g/L)."
            },
            {
                "name": "Dead Heart / Stem Borer (Scirpophaga)",
                "risk_level": "Medium",
                "affected_crop": "Paddy (Rice)",
                "season": "Tillering & Flowering Stage",
                "description": "Larvae bore into stem central shoot causing drying of tillers (Dead Heart) and empty white panicles.",
                "prevention": "Set up pheromone traps @ 8/acre; release Trichogramma egg parasitoids @ 20,000/acre."
            },
            {
                "name": "Brown Spot (Bipolaris oryzae)",
                "risk_level": "Medium",
                "affected_crop": "Paddy (Rice)",
                "season": "Nutrient Deficient / Sandy Soils",
                "description": "Oval dark brown spots on leaves and glumes indicating potassic and micronutrient deficiency.",
                "prevention": "Apply balanced NPK with Potassium and zinc sulfate; spray Mancozeb @ 2g/L."
            },
            {
                "name": "Tungro Virus",
                "risk_level": "Low",
                "affected_crop": "Paddy (Rice)",
                "season": "Vector Infestation (Green Leafhopper)",
                "description": "Viral stunting, orange-yellow leaf discoloration, and delayed flowering spread by leafhoppers.",
                "prevention": "Control green leafhopper vectors using Neem oil 3% or Imidacloprid."
            }
        ]
    },
    "coconut": {
        "crop_display": "Coconut",
        "regional_summaries": {
            "kannur": "Coastal humid tracts in Kannur show elevated incidence of Root Wilt disease and Rhinoceros beetle attack.",
            "thiruvananthapuram": "Southern coastal palms frequently encounter Root Wilt and Bud Rot during heavy rains.",
            "default": "Kerala coconut groves require active monitoring for Root Wilt disease and Rhinoceros beetle pests."
        },
        "diseases": [
            {
                "name": "Root Wilt (WCLWD)",
                "risk_level": "High",
                "affected_crop": "Coconut",
                "season": "Perennial / Year-round",
                "description": "Phytoplasma disease transmitted by lace bugs causing flaccidity, ribbing of leaflets, and marginal necrosis.",
                "prevention": "Apply balanced NPK fertilizer + 500g Magnesium Sulfate per palm; plant tolerant varieties like Chowghat Orange Dwarf."
            },
            {
                "name": "Coconut Caterpillar (Opisina arenosella)",
                "risk_level": "High",
                "affected_crop": "Coconut",
                "season": "Dry Summer Months (March - May)",
                "description": "Caterpillars feed on lower frond green parenchyma, turning fronds burnt-brown and reducing nut yield.",
                "prevention": "Release larval parasitoids (Goniozus nephantidis) @ 20/palm; maintain palm crown cleanliness."
            },
            {
                "name": "Bud Rot (Phytophthora palmivora)",
                "risk_level": "Medium",
                "affected_crop": "Coconut",
                "season": "Monsoon Season (June - September)",
                "description": "Fungal rotting of spear leaf spindle and central bud tissue leading to foul odor and frond collapse.",
                "prevention": "Apply Bordeaux paste to central palm crown before monsoon; remove affected dead tissue."
            },
            {
                "name": "Stem Bleeding (Thielaviopsis paradoxa)",
                "risk_level": "Low",
                "affected_crop": "Coconut",
                "season": "High Rainfall & Poor Drainage",
                "description": "Exudation of dark reddish-brown liquid from trunk cracks leading to tissue decay.",
                "prevention": "Chisel affected bark, apply Coal Tar or Calixin (5ml/L) paste, and ensure field drainage."
            }
        ]
    },
    "banana (nendran)": {
        "crop_display": "Banana (Nendran)",
        "regional_summaries": {
            "thrissur": "Humid banana growing belts in Thrissur encounter Black Sigatoka and Panama Wilt during rainy season.",
            "wayanad": "High rain zones in Wayanad require vigilance against Sigatoka leaf spot and Erwinia soft rot.",
            "default": "Banana plantations in Kerala are susceptible to leaf spot fungal diseases during monsoon humidity."
        },
        "diseases": [
            {
                "name": "Black Sigatoka (Mycosphaerella fijiensis)",
                "risk_level": "High",
                "affected_crop": "Banana (Nendran)",
                "season": "Monsoon & High Humidity (June - November)",
                "description": "Dark reddish-brown streaks expanding into large necrotic leaf spots causing premature leaf death.",
                "prevention": "De-leaf affected lower fronds; spray Propiconazole 0.1% or Mineral Oil emulsion."
            },
            {
                "name": "Panama Wilt (Fusarium oxysporum)",
                "risk_level": "High",
                "affected_crop": "Banana (Nendran)",
                "season": "Warm Humid Soils / Waterlogged Condition",
                "description": "Soil-borne vascular wilt causing leaf yellowing, petiole buckling, and longitudinal pseudostem splitting.",
                "prevention": "Use tissue culture plants; apply Trichoderma harzianum @ 50g/plant with organic manure."
            },
            {
                "name": "Anthracnose (Colletotrichum musae)",
                "risk_level": "Medium",
                "affected_crop": "Banana (Nendran)",
                "season": "Fruit Maturity & Storage Stage",
                "description": "Sunken black lesions on ripening fruit fingers reducing marketability and shelf life.",
                "prevention": "Field sanitation; spray Carbendazim 0.1% on developing bunches 30 days before harvest."
            },
            {
                "name": "Banana Bunchy Top Virus (BBTV)",
                "risk_level": "Low",
                "affected_crop": "Banana (Nendran)",
                "season": "Aphid Vector Transmission",
                "description": "Stunted narrow upright leaves forming a bunchy rosette crown with dark green streak virus symptoms.",
                "prevention": "Eradicate virus-infected mats; spray Neem oil to control banana aphid vectors."
            }
        ]
    },
    "rubber": {
        "crop_display": "Rubber",
        "regional_summaries": {
            "kottayam": "Kottayam rubber plantations experience seasonal risk of Phytophthora Abnormal Leaf Fall during heavy monsoons.",
            "pathanamthitta": "Humid rubber belts in Pathanamthitta require preventative spraying against Leaf Fall and Corynespora.",
            "default": "Monsoon humidity in Kerala rubber plantations promotes Phytophthora abnormal leaf fall and Oidium powdery mildew."
        },
        "diseases": [
            {
                "name": "Abnormal Leaf Fall (Phytophthora)",
                "risk_level": "High",
                "affected_crop": "Rubber",
                "season": "South-West Monsoon (July - August)",
                "description": "Heavy dull green leaf fall with latex droplets on petioles causing canopy defoliation.",
                "prevention": "Prophylactic aerial or high-pressure spray with 1% Bordeaux mixture before monsoon onset."
            },
            {
                "name": "Powdery Mildew (Oidium heveae)",
                "risk_level": "Medium",
                "affected_crop": "Rubber",
                "season": "Refoliation Period (February - March)",
                "description": "White powdery coating on tender refoliating leaves leading to crinkling and leaf drop.",
                "prevention": "Dust Sulphur @ 11kg/ha during tender leaf refoliation phase."
            },
            {
                "name": "Dry Leaf / Corynespora Leaf Spot",
                "risk_level": "Medium",
                "affected_crop": "Rubber",
                "season": "Humid Weather & New Foliage Stage",
                "description": "Circular lesions with dark brown margins and railway-track vein necrosis on rubber fronds.",
                "prevention": "Apply Mancozeb 0.2% or Carbendazim 0.05% spray on young foliage."
            },
            {
                "name": "Pink Disease (Corticium salmonicolor)",
                "risk_level": "Low",
                "affected_crop": "Rubber",
                "season": "High Rainfall & Dense Shade",
                "description": "Pink cobweb-like fungal growth on branch fork bark causing dieback of young rubber trees.",
                "prevention": "Prune infected branches and apply Bordeaux paste (10%) to affected fork joints."
            }
        ]
    }
}


def _normalize_crop_key(crop_name: str) -> str:
    """Normalize user/model crop name to catalog key."""
    c = crop_name.lower().strip()
    if "pepper" in c:
        return "black pepper"
    if "paddy" in c or "rice" in c:
        return "paddy (rice)"
    if "coconut" in c:
        return "coconut"
    if "banana" in c or "nendran" in c:
        return "banana (nendran)"
    if "rubber" in c:
        return "rubber"
    return "black pepper"


def get_regional_disease_intelligence(location: str, crop: str) -> Dict[str, Any]:
    """
    Retrieve static, verified regional disease risk intelligence for a crop and location.
    Does NOT manufacture fake statistical percentages. Returns qualitative risk levels (High, Medium, Low).
    """
    crop_key = _normalize_crop_key(crop)
    catalog_entry = KERALA_CROP_DISEASES.get(crop_key, KERALA_CROP_DISEASES["black pepper"])

    loc_lower = location.lower()
    regional_summaries = catalog_entry.get("regional_summaries", {})

    summary = regional_summaries.get("default")
    for district, sum_text in regional_summaries.items():
        if district in loc_lower:
            summary = sum_text
            break

    return {
        "location": location,
        "crop": catalog_entry["crop_display"],
        "region_summary": summary,
        "diseases": catalog_entry["diseases"]
    }
