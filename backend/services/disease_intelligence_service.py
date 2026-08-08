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

# Static verified agronomic disease risk intelligence catalog by region/district
KERALA_CROP_DISEASES: Dict[str, Dict[str, Any]] = {
    "black pepper": {
        "crop_display": "Black Pepper",
        "fertilizer_advisory": "Apply 50g N, 50g P2O5, and 150g K2O per vine annually in two split doses (May-June & Sept-Oct). Apply 1kg Neem Cake & 10kg organic compost per vine to strengthen root immunity against wilt.",
        "regional_summaries": {
            "kozhikode": "High monsoon rainfall and humidity in Kozhikode make Black Pepper highly susceptible to Phytophthora Quick Wilt and Pollu Disease.",
            "wayanad": "High-altitude humid climate in Wayanad increases risk of Quick Wilt and Slow Decline in pepper plantations.",
            "idukki": "Cool humid hill climate in Idukki favors Phytophthora foot rot during rainy season.",
            "default": "Humid tropical weather conditions create seasonal vulnerability for Phytophthora foot rot and Pollu beetle in Black Pepper."
        },
        "diseases": [
            {
                "name": "Quick Wilt (Phytophthora Foot Rot)",
                "risk_level": "High",
                "affected_crop": "Black Pepper",
                "season": "South-West Monsoon (June - September)",
                "description": "Fungal pathogen Phytophthora capsici causes dark water-soaked lesions on leaves and rapid rotting of vine roots during heavy rainfall.",
                "prevention": "Ensure deep field drainage; apply Trichoderma harzianum enriched compost and spray 1% Bordeaux mixture before monsoon onset.",
                "fertilizer_recommendation": "Apply 1kg Neem cake enriched with Trichoderma harzianum bio-agent around vine basins before monsoon onset; avoid heavy nitrogenous top-dressing."
            },
            {
                "name": "Pollu Disease (Flea Beetle)",
                "risk_level": "High",
                "affected_crop": "Black Pepper",
                "season": "Post-Monsoon & Berry Formation (July - October)",
                "description": "Flea beetle (Longitarsus nigripennis) grubs bore into tender berries, causing them to turn hollow, dry, and dark.",
                "prevention": "Spray Quinalphos 0.05% or Neem seed kernel extract (5%) during berry formation stages in July and October.",
                "fertilizer_recommendation": "Apply Potash (MOP @ 150g/vine) to improve berry skin thickness and resistance against flea beetle damage."
            },
            {
                "name": "Slow Decline",
                "risk_level": "Medium",
                "affected_crop": "Black Pepper",
                "season": "Dry Season (January - May)",
                "description": "Fungal-nematode complex (Radopholus similis) leading to gradual foliar yellowing, root necrosis, and reduced vine vigor.",
                "prevention": "Apply neem cake @ 1kg/vine alongside bio-agent Pochonia chlamydosporia around vine basins.",
                "fertilizer_recommendation": "Incorporate 1kg Neem cake + 50g Pochonia chlamydosporia bio-nematicide per vine to suppress soil nematodes."
            },
            {
                "name": "Yellow Mottle Virus",
                "risk_level": "Medium",
                "affected_crop": "Black Pepper",
                "season": "Year-round (Insect Vector)",
                "description": "Badnavirus causing characteristic yellow mottling, leaf crinkling, and stunted vine growth.",
                "prevention": "Use virus-free certified planting material; control vector insects using Neem oil spray.",
                "fertilizer_recommendation": "Foliar spray of 0.5% Zinc Sulfate + 0.2% Boric Acid to improve vine vigor and virus tolerance."
            },
            {
                "name": "Leaf Blight (Anthracnose)",
                "risk_level": "Low",
                "affected_crop": "Black Pepper",
                "season": "High Humidity Periods",
                "description": "Colletotrichum gloeosporioides causing dark brownish spots with yellow halos on pepper leaves.",
                "prevention": "Prune excess shade trees to increase sunlight; spray Carbendazim 0.1% if leaf spots spread.",
                "fertilizer_recommendation": "Apply balanced NPK with organic compost; avoid excess foliage dampness and shaded nitrogen accumulation."
            }
        ]
    },
    "paddy (rice)": {
        "crop_display": "Paddy (Rice)",
        "fertilizer_advisory": "Recommended NPK dosage: 35:18:18 kg/acre for high-yielding varieties. Apply Nitrogen in 3 split doses (Basal, Tillering, Panicle Initiation) with Zinc Sulfate @ 10kg/acre.",
        "regional_summaries": {
            "palakkad": "Palakkad's major rice belts experience high incidence of Stem Borer (Dead Heart) and Blast during Kharif and Rabi seasons.",
            "alappuzha": "Kuttanad waterlogged rice fields in Alappuzha are vulnerable to Bacterial Leaf Blight and Brown Spot.",
            "default": "Humid monsoon weather in regional rice fields promotes fungal blast and stem borer pest infestation."
        },
        "diseases": [
            {
                "name": "Rice Blast (Pyricularia oryzae)",
                "risk_level": "High",
                "affected_crop": "Paddy (Rice)",
                "season": "Monsoon & High Humidity (June - August)",
                "description": "Fungal lesions on leaves, nodes, and panicles causing spindle-shaped spots and severe crop lodging.",
                "prevention": "Use resistant varieties (e.g. Uma, Jyothi); spray Tricyclazole 75 WP @ 0.6g/L upon early symptom detection.",
                "fertilizer_recommendation": "Split Nitrogen application into 3 equal doses; avoid top-dressing excess Urea during humid/cloudy weather. Apply Muriate of Potash (MOP) to strengthen crop silica layer."
            },
            {
                "name": "Bacterial Leaf Blight (Xanthomonas)",
                "risk_level": "High",
                "affected_crop": "Paddy (Rice)",
                "season": "Heavy Rain & Flooding (July - September)",
                "description": "Water-soaked streaks starting from leaf margins turning yellow-white and causing leaf drying.",
                "prevention": "Avoid excess nitrogen fertilizer; spray Streptocycline (0.15g/L) + Copper Oxychloride (2.5g/L).",
                "fertilizer_recommendation": "Suspend Nitrogen top-dressing immediately upon symptom appearance; top-dress Potash (MOP) @ 10kg/acre to restrict bacterial multiplication."
            },
            {
                "name": "Dead Heart / Stem Borer (Scirpophaga)",
                "risk_level": "Medium",
                "affected_crop": "Paddy (Rice)",
                "season": "Tillering & Flowering Stage",
                "description": "Larvae bore into stem central shoot causing drying of tillers (Dead Heart) and empty white panicles.",
                "prevention": "Set up pheromone traps @ 8/acre; release Trichogramma egg parasitoids @ 20,000/acre.",
                "fertilizer_recommendation": "Apply Neem cake @ 100kg/acre during basal soil preparation to reduce soil pupation."
            },
            {
                "name": "Brown Spot (Bipolaris oryzae)",
                "risk_level": "Medium",
                "affected_crop": "Paddy (Rice)",
                "season": "Nutrient Deficient / Sandy Soils",
                "description": "Oval dark brown spots on leaves and glumes indicating potassic and micronutrient deficiency.",
                "prevention": "Apply balanced NPK with Potassium and zinc sulfate; spray Mancozeb @ 2g/L.",
                "fertilizer_recommendation": "Indicates Potash and Zinc deficiency. Apply Zinc Sulfate @ 10kg/acre alongside MOP (Muriate of Potash) @ 15kg/acre."
            },
            {
                "name": "Tungro Virus",
                "risk_level": "Low",
                "affected_crop": "Paddy (Rice)",
                "season": "Vector Infestation (Green Leafhopper)",
                "description": "Viral stunting, orange-yellow leaf discoloration, and delayed flowering spread by leafhoppers.",
                "prevention": "Control green leafhopper vectors using Neem oil 3% or Imidacloprid.",
                "fertilizer_recommendation": "Apply balanced basal fertilizers; avoid late nitrogen spikes that attract green leafhopper vectors."
            }
        ]
    },
    "coconut": {
        "crop_display": "Coconut",
        "fertilizer_advisory": "Annual dosage per adult palm: 500g N, 320g P2O5, 1200g K2O in two split doses (May-June and Sept-Oct), along with 500g Magnesium Sulfate (Epsom Salt) and 50kg green manure.",
        "regional_summaries": {
            "kannur": "Coastal humid tracts in Kannur show elevated incidence of Root Wilt disease and Rhinoceros beetle attack.",
            "thiruvananthapuram": "Southern coastal palms frequently encounter Root Wilt and Bud Rot during heavy rains.",
            "default": "Coastal and tropical coconut groves require active monitoring for Root Wilt disease and Rhinoceros beetle pests."
        },
        "diseases": [
            {
                "name": "Root Wilt (WCLWD)",
                "risk_level": "High",
                "affected_crop": "Coconut",
                "season": "Perennial / Year-round",
                "description": "Phytoplasma disease transmitted by lace bugs causing flaccidity, ribbing of leaflets, and marginal necrosis.",
                "prevention": "Apply balanced NPK fertilizer + 500g Magnesium Sulfate per palm; plant tolerant varieties like Chowghat Orange Dwarf.",
                "fertilizer_recommendation": "Heavy Potash application (1.2kg K2O/palm) + 500g Magnesium Sulfate + 50kg green manure annually to boost disease tolerance."
            },
            {
                "name": "Coconut Caterpillar (Opisina arenosella)",
                "risk_level": "High",
                "affected_crop": "Coconut",
                "season": "Dry Summer Months (March - May)",
                "description": "Caterpillars feed on lower frond green parenchyma, turning fronds burnt-brown and reducing nut yield.",
                "prevention": "Release larval parasitoids (Goniozus nephantidis) @ 20/palm; maintain palm crown cleanliness.",
                "fertilizer_recommendation": "Apply organic compost and Neem cake (5kg/palm) to promote vigorous crown leaf recovery."
            },
            {
                "name": "Bud Rot (Phytophthora palmivora)",
                "risk_level": "Medium",
                "affected_crop": "Coconut",
                "season": "Monsoon Season (June - September)",
                "description": "Fungal rotting of spear leaf spindle and central bud tissue leading to foul odor and frond collapse.",
                "prevention": "Apply Bordeaux paste to central palm crown before monsoon; remove affected dead tissue.",
                "fertilizer_recommendation": "Apply 50kg farmyard manure + 1kg Bone meal per palm basin; ensure proper drainage around root zone."
            },
            {
                "name": "Stem Bleeding (Thielaviopsis paradoxa)",
                "risk_level": "Low",
                "affected_crop": "Coconut",
                "season": "High Rainfall & Poor Drainage",
                "description": "Exudation of dark reddish-brown liquid from trunk cracks leading to tissue decay.",
                "prevention": "Chisel affected bark, apply Coal Tar or Calixin (5ml/L) paste, and ensure field drainage.",
                "fertilizer_recommendation": "Apply 5kg Neem cake and 1.5kg MOP per palm to rebuild damaged stem vascular tissue."
            }
        ]
    },
    "banana (nendran)": {
        "crop_display": "Banana (Nendran)",
        "fertilizer_advisory": "Recommended per plant: 200g N, 50g P2O5, 300g K2O in 4 split doses (month 1, 2, 3, and 4 post-planting). Apply 10kg organic farmyard manure per pit.",
        "regional_summaries": {
            "thrissur": "Humid banana growing belts in Thrissur encounter Black Sigatoka and Panama Wilt during rainy season.",
            "wayanad": "High rain zones in Wayanad require vigilance against Sigatoka leaf spot and Erwinia soft rot.",
            "default": "Banana plantations are susceptible to leaf spot fungal diseases during high monsoon humidity."
        },
        "diseases": [
            {
                "name": "Black Sigatoka (Mycosphaerella fijiensis)",
                "risk_level": "High",
                "affected_crop": "Banana (Nendran)",
                "season": "Monsoon & High Humidity (June - November)",
                "description": "Dark reddish-brown streaks expanding into large necrotic leaf spots causing premature leaf death.",
                "prevention": "De-leaf affected lower fronds; spray Propiconazole 0.1% or Mineral Oil emulsion.",
                "fertilizer_recommendation": "High Potash (MOP @ 300g/plant) boosts leaf thickness and reduces fungal spore penetration during humid monsoon months."
            },
            {
                "name": "Panama Wilt (Fusarium oxysporum)",
                "risk_level": "High",
                "affected_crop": "Banana (Nendran)",
                "season": "Warm Humid Soils / Waterlogged Condition",
                "description": "Soil-borne vascular wilt causing leaf yellowing, petiole buckling, and longitudinal pseudostem splitting.",
                "prevention": "Use tissue culture plants; apply Trichoderma harzianum @ 50g/plant with organic manure.",
                "fertilizer_recommendation": "Apply Trichoderma harzianum @ 50g/plant mixed with 10kg Neem-enriched farmyard manure into planting pit."
            },
            {
                "name": "Anthracnose (Colletotrichum musae)",
                "risk_level": "Medium",
                "affected_crop": "Banana (Nendran)",
                "season": "Fruit Maturity & Storage Stage",
                "description": "Sunken black lesions on ripening fruit fingers reducing marketability and shelf life.",
                "prevention": "Field sanitation; spray Carbendazim 0.1% on developing bunches 30 days before harvest.",
                "fertilizer_recommendation": "Apply micro-nutrients (Zinc & Boron foliar spray @ 0.2%) during bunch development to enhance skin firmness."
            },
            {
                "name": "Banana Bunchy Top Virus (BBTV)",
                "risk_level": "Low",
                "affected_crop": "Banana (Nendran)",
                "season": "Aphid Vector Transmission",
                "description": "Stunted narrow upright leaves forming a bunchy rosette crown with dark green streak virus symptoms.",
                "prevention": "Eradicate virus-infected mats; spray Neem oil to control banana aphid vectors.",
                "fertilizer_recommendation": "Apply balanced organic manures to maintain plant vigor; avoid stress conditions."
            }
        ]
    },
    "rubber": {
        "crop_display": "Rubber",
        "fertilizer_advisory": "Apply NPK 12:12:6 mixture @ 300g/tree annually during April-May refoliation phase, supplemented with Rock Phosphate.",
        "regional_summaries": {
            "kottayam": "Kottayam rubber plantations experience seasonal risk of Phytophthora Abnormal Leaf Fall during heavy monsoons.",
            "pathanamthitta": "Humid rubber belts in Pathanamthitta require preventative spraying against Leaf Fall and Corynespora.",
            "default": "Monsoon humidity in rubber plantations promotes Phytophthora abnormal leaf fall and Oidium powdery mildew."
        },
        "diseases": [
            {
                "name": "Abnormal Leaf Fall (Phytophthora)",
                "risk_level": "High",
                "affected_crop": "Rubber",
                "season": "South-West Monsoon (July - August)",
                "description": "Heavy dull green leaf fall with latex droplets on petioles causing canopy defoliation.",
                "prevention": "Prophylactic aerial or high-pressure spray with 1% Bordeaux mixture before monsoon onset.",
                "fertilizer_recommendation": "Apply Rock Phosphate @ 150g/tree with organic manure pre-monsoon to enhance foliage resilience against Phytophthora."
            },
            {
                "name": "Powdery Mildew (Oidium heveae)",
                "risk_level": "Medium",
                "affected_crop": "Rubber",
                "season": "Refoliation Period (February - March)",
                "description": "White powdery coating on tender refoliating leaves leading to crinkling and leaf drop.",
                "prevention": "Dust Sulphur @ 11kg/ha during tender leaf refoliation phase.",
                "fertilizer_recommendation": "Dust Sulphur @ 11kg/ha during tender leaf refoliation phase (Feb-March)."
            },
            {
                "name": "Dry Leaf / Corynespora Leaf Spot",
                "risk_level": "Medium",
                "affected_crop": "Rubber",
                "season": "Humid Weather & New Foliage Stage",
                "description": "Circular lesions with dark brown margins and railway-track vein necrosis on rubber fronds.",
                "prevention": "Apply Mancozeb 0.2% or Carbendazim 0.05% spray on young foliage.",
                "fertilizer_recommendation": "Apply balanced NPK 12:12:6 to build cuticular wax layer on young tender fronds."
            },
            {
                "name": "Pink Disease (Corticium salmonicolor)",
                "risk_level": "Low",
                "affected_crop": "Rubber",
                "season": "High Rainfall & Dense Shade",
                "description": "Pink cobweb-like fungal growth on branch fork bark causing dieback of young rubber trees.",
                "prevention": "Prune infected branches and apply Bordeaux paste (10%) to affected fork joints.",
                "fertilizer_recommendation": "Prune dead wood and apply Bordeaux paste (10%) to branch forks; maintain adequate tree spacing."
            }
        ]
    },
    "tapioca (cassava)": {
        "crop_display": "Tapioca (Cassava)",
        "fertilizer_advisory": "Recommended dosage: NPK 50:50:50 kg/ha as basal application during planting, followed by top dressing of 50kg N and 50kg K2O per hectare at 45 days after planting.",
        "regional_summaries": {
            "default": "Tapioca crops are sensitive to Cassava Mosaic Virus and Tuber Rot during high monsoon moisture periods."
        },
        "diseases": [
            {
                "name": "Cassava Mosaic Virus (CMV)",
                "risk_level": "High",
                "affected_crop": "Tapioca (Cassava)",
                "season": "Warm Humid Vector Season",
                "description": "Mosaic mottling, leaf distortion, and stunted root yield spread by whiteflies.",
                "prevention": "Use virus-free disease-resistant varieties (e.g. Sree Padmanabha); roguing infected plants.",
                "fertilizer_recommendation": "Apply Neem cake @ 250kg/ha during soil preparation to suppress whitefly vectors and build tuber immunity."
            },
            {
                "name": "Tuber Rot (Phytophthora / Pythium)",
                "risk_level": "Medium",
                "affected_crop": "Tapioca (Cassava)",
                "season": "Heavy Monsoon & Waterlogging",
                "description": "Soft rotting and foul decay of underground cassava tubers in poorly drained soils.",
                "prevention": "Plant on raised ridges; ensure proper field drainage channels.",
                "fertilizer_recommendation": "Apply Wood Ash or Muriate of Potash @ 50kg/ha to improve tuber cell wall density and waterlogging resistance."
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
    if "tapioca" in c or "cassava" in c:
        return "tapioca (cassava)"
    return c


def get_groq_regional_disease_intelligence(location: str, crop: str) -> Dict[str, Any] | None:
    """
    Use Groq LLM to generate unbiased, location-specific and crop-specific regional disease intelligence.
    """
    try:
        from backend.services.groq_services import client, _safe_parse_json
        if not client:
            return None

        prompt = f"""You are an expert agricultural pathologist and agronomic advisor for farmers in India.

Location: {location}
Crop: {crop}

Provide real, specific, verified regional disease intelligence and fertilizer management tailored to growing {crop} in {location}.

Return ONLY valid JSON matching this exact structure:
{{
  "location": "{location}",
  "crop": "{crop}",
  "region_summary": "1-2 sentence real agronomic summary of disease risks and climate factors for {crop} in {location}.",
  "fertilizer_advisory": "Recommended fertilizer schedule (NPK ratios, organic compost, split doses, micronutrients) for {crop} in {location} to maintain soil health and build disease resistance.",
  "diseases": [
    {{
      "name": "Exact Disease Name (e.g. Phytophthora Foot Rot, Rice Blast, Black Sigatoka)",
      "risk_level": "High",
      "affected_crop": "{crop}",
      "season": "Seasonal occurrence (e.g. South-West Monsoon (June-Sept))",
      "description": "Short explanation of symptoms and cause.",
      "prevention": "Practical field prevention measures.",
      "fertilizer_recommendation": "Specific fertilizer/nutrient application to prevent or manage this disease."
    }}
  ]
}}

RULES:
1. Return 3 to 4 REAL, highly accurate diseases specific to {crop} in {location}. Vary risk_level (High, Medium, Low) accurately based on regional risk.
2. Include specific fertilizer recommendations for {crop} in {location} to prevent disease and optimize yield.
3. Do NOT output generic placeholder text or markdown formatting outside JSON.
"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are India's leading AI agricultural scientist and plant pathologist. Return valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=1800
        )

        result_text = response.choices[0].message.content.strip()
        parsed = _safe_parse_json(result_text)

        if isinstance(parsed, dict) and "diseases" in parsed and isinstance(parsed["diseases"], list) and len(parsed["diseases"]) > 0:
            parsed["location"] = location
            parsed["crop"] = crop
            return parsed

    except Exception as e:
        logger.warning(f"Groq Disease Intelligence error for {crop} in {location}: {e}")

    return None


def get_regional_disease_intelligence(location: str, crop: str) -> Dict[str, Any]:
    """
    Retrieve verified regional disease risk intelligence & fertilizer recommendations for a crop and location.
    Tries Groq AI first for unbiased location-specific disease intelligence, falling back to static catalog.
    """
    loc_display = location.strip() if location and location.strip() else "your region"

    # 1. Try Groq AI for dynamic, location-and-crop specific regional disease intelligence
    ai_result = get_groq_regional_disease_intelligence(loc_display, crop)
    if ai_result:
        return ai_result

    # 2. Fallback to catalog or structured catalog match
    crop_key = _normalize_crop_key(crop)
    
    if crop_key in KERALA_CROP_DISEASES:
        catalog_entry = KERALA_CROP_DISEASES[crop_key]
        fertilizer_adv = catalog_entry.get("fertilizer_advisory", "")
    else:
        # Dynamic fallback for any unlisted recommended crop
        catalog_entry = {
            "crop_display": crop,
            "fertilizer_advisory": f"Apply balanced NPK fertilizer with organic farmyard manure (10 tons/ha) tailored to {crop} in {loc_display} soil and climate conditions. Incorporate Neem cake @ 250kg/ha for root health.",
            "regional_summaries": {
                "default": f"Regional climate and humidity conditions in {loc_display} require seasonal disease monitoring and balanced nutrient application for {crop}."
            },
            "diseases": [
                {
                    "name": f"Foliar Blight & Leaf Spot ({crop})",
                    "risk_level": "Medium",
                    "affected_crop": crop,
                    "season": "Monsoon & High Humidity",
                    "description": f"Fungal leaf spot lesions caused by high atmospheric humidity in {loc_display} affecting {crop} canopy.",
                    "prevention": "Maintain proper plant spacing, field drainage, and spray Copper Oxychloride 0.25% if spots spread.",
                    "fertilizer_recommendation": f"Apply Potash (MOP) and Bio-fertilizers (Azospirillum & PSB) to strengthen foliar leaf resistance in {crop}."
                },
                {
                    "name": f"Root Rot & Damping-off ({crop})",
                    "risk_level": "Medium",
                    "affected_crop": crop,
                    "season": "Heavy Rainfall Period",
                    "description": f"Soil-borne root decay affecting {crop} in waterlogged or heavy soil in {loc_display}.",
                    "prevention": "Ensure field raised beds and apply Trichoderma harzianum enriched compost.",
                    "fertilizer_recommendation": f"Incorporate Trichoderma enriched organic compost and avoid excessive nitrogenous top-dressing during rainy seasons."
                }
            ]
        }
        fertilizer_adv = catalog_entry.get("fertilizer_advisory", "")

    loc_lower = loc_display.lower()
    regional_summaries = catalog_entry.get("regional_summaries", {})

    summary = None
    for district, sum_text in regional_summaries.items():
        if district != "default" and district in loc_lower:
            summary = sum_text
            break

    if not summary:
        default_sum = regional_summaries.get("default", f"Seasonal weather conditions in {loc_display} create vulnerability for common diseases in {crop}.")
        default_sum = default_sum.replace("Kerala's", f"{loc_display}'s").replace("Kerala", loc_display)
        summary = default_sum

    return {
        "location": loc_display,
        "crop": catalog_entry["crop_display"],
        "region_summary": summary,
        "fertilizer_advisory": fertilizer_adv,
        "diseases": catalog_entry["diseases"]
    }
