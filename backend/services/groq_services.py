import os
import json
import re
from pathlib import Path
from groq import Groq
from dotenv import load_dotenv

# Load backend/.env
BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


# ── Language-aware system prompt ────────────────────────────────────────────
LANGUAGE_NAMES = {
    "en": "English",
    "ml": "Malayalam",
    "hi": "Hindi",
    "ta": "Tamil",
    "kn": "Kannada",
    "te": "Telugu",
}


def build_system_prompt(base_prompt: str, lang: str) -> str:
    """Inject a language instruction so the LLM generates directly in the target
    language without a separate translation step."""
    lang_name = LANGUAGE_NAMES.get(lang, "English")
    if lang == "en":
        return base_prompt  # No extra instruction needed for English
    return (
        f"{base_prompt}\n\n"
        f"IMPORTANT: Respond ONLY in {lang_name}, written in {lang_name} "
        f"script (not transliterated). Keep farming/agricultural terms "
        f"clear and simple, as the user may have limited literacy."
    )


# ── Optional RAG Knowledge Base Singleton ──
_rag_chatbot = None

def _get_rag_chatbot():
    global _rag_chatbot
    if _rag_chatbot is None:
        try:
            from backend.models.chatbot.chatbot import FarmingChatbot
            _rag_chatbot = FarmingChatbot()
        except Exception as err:
            print("[RAG] Could not initialize RAG chatbot:", err)
            _rag_chatbot = False
    return _rag_chatbot if _rag_chatbot is not False else None


def get_chat_response(message: str, conversation_history: list[dict] | None = None, lang: str = "en") -> dict:
    """Delegates chat processing to the unified HybridChatService."""
    from backend.assistant.chat.service import get_chat_service
    service = get_chat_service()
    res = service.generate_response(
        message=message,
        conversation_history=conversation_history,
        lang=lang
    )
    return {"reply": res["reply"]}


def _safe_parse_json(result_text: str) -> dict:
    text = result_text.strip()
    if "```" in text:
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        text = text[start:end+1]
    return json.loads(text)


def get_treatment(crop: str, disease: str):
    prompt = f"""
You are an expert agricultural assistant.

Crop: {crop}
Disease: {disease}

Provide the following in JSON format only:

{{
  "crop": "",
  "disease": "",
  "overview": "",
  "symptoms": [],
  "chemical_treatment": [],
  "organic_treatment": [],
  "dosage": [],
  "prevention": [],
  "precautions": []
}}

Return ONLY valid JSON.
"""
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an agricultural expert."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
        )

        result = response.choices[0].message.content.strip()
        return _safe_parse_json(result)

    except Exception as e:
        print("Groq Treatment Error:", e)
        return {
            "crop": crop,
            "disease": disease,
            "overview": f"Treatment guidance for {disease} in {crop}.",
            "symptoms": ["Leaf damage", "Reduced growth"],
            "chemical_treatment": ["Fungicide spray"],
            "organic_treatment": ["Neem oil spray"],
            "dosage": ["Follow package instructions"],
            "prevention": ["Crop rotation", "Good drainage"],
            "precautions": ["Wear protective gear"]
        }


def get_crop_advice(
    weather_data: dict,
    soil_type: str,
    irrigation: str,
    season: str,
):
    resolved_place_name = weather_data.get("location", "Kerala, India")
    lat = weather_data.get("latitude", "")
    lng = weather_data.get("longitude", "")
    temp = weather_data.get("temperature", 28)

    additional_weather = (
        f"Feels like: {weather_data.get('feels_like', temp)}°C, "
        f"Humidity: {weather_data.get('humidity', 75)}%, "
        f"Condition: {weather_data.get('condition', 'Tropical')}, "
        f"Rainfall: {weather_data.get('total_precipitation', 0)}mm, "
        f"Season: {season}"
    )

    system_prompt = """You are an agricultural advisory engine for Indian farmers. Given a farm's location, soil type,
irrigation method, and current weather conditions, you recommend the best crops to grow and
return your answer as a single JSON object — nothing else, no markdown, no commentary outside
the JSON.

RULES:
1. Base every recommendation on real agronomic knowledge for the given region — soil type,
   irrigation availability, climate, and typical cropping patterns actually used there. Do not
   invent crops, varieties, or figures that would not realistically apply to that region.
2. If the resolved location name looks incorrect, unusual, or outside India for what should be
   an Indian farm, still generate your best answer based on the coordinates/soil/irrigation
   given, but do not fabricate a fictional regional context to match a wrong location name.
3. Confidence and suitability_score are integers 0-100, reflecting how well-suited the crop
   genuinely is to the given soil, irrigation, and climate inputs — vary these meaningfully
   across crops, don't cluster every crop near the same score.
4. Always return exactly 5 crops in "recommended_crops", ranked 1-5 by suitability, and exactly
   2 crops in "not_recommended" with a genuine agronomic reason each is unsuitable.
5. For EVERY crop in "recommended_crops" and in "best_crop", include a "varieties" array of
   2-4 real, commonly grown varieties for that crop in that region, each with a short
   suitability_note tied to the specific soil/irrigation/climate given — not a generic
   description of the crop itself. If uncertain a named variety is truly appropriate for the
   region, say so honestly in the note rather than inventing a plausible-sounding name.
6. All narrative fields (summary, reason, why_recommended, suitability_note) must be concise,
   farmer-readable, and specific to the actual inputs — avoid generic filler sentences that
   could apply to any location.
7. Output ONLY valid JSON matching the exact schema below. No trailing commas, no comments,
   no text before or after the JSON object.

OUTPUT SCHEMA (return exactly this structure and these field names):
{
  "location": string,                         // resolved place name, e.g. "Kannur, Kerala"
  "summary": string,                          // 1-2 sentences tying soil+irrigation+climate to the recommendation
  "best_crop": {
    "crop": string,
    "confidence": integer,                    // 0-100
    "reason": string,
    "varieties": [
      { "name": string, "suitability_note": string, "expected_yield": string }
    ]
  },
  "recommended_crops": [
    {
      "recommendation_rank": integer,         // 1-5
      "crop": string,
      "confidence": integer,
      "suitability_score": integer,
      "why_recommended": [string],            // 2-4 short bullet reasons
      "varieties": [
        { "name": string, "suitability_note": string, "expected_yield": string }
      ],
      "best_sowing_time": string,
      "crop_duration": string,
      "water_requirement": string,
      "expected_yield": string,
      "market_demand": "Low" | "Medium" | "High",
      "profitability": "Low" | "Moderate" | "High" | "Very High",
      "possible_risks": [string]               // 2-3 realistic pest/disease/weather risks
    }
    // exactly 5 of these, rank 1 to 5
  ],
  "not_recommended": [
    { "crop": string, "reason": string }
    // exactly 2 of these
  ]
}

Do not add extra top-level or nested fields beyond this schema. Do not duplicate fields under
different names (e.g. do not also add "name" or "rank" alongside "crop" and
"recommendation_rank" — use only the field names given above)."""

    user_prompt = f"""Generate a crop advisory for the following farm:

Location: {resolved_place_name}   (resolved from lat {lat}, lng {lng})
Soil type: {soil_type}
Irrigation type: {irrigation}
Current temperature: {temp}°C
{additional_weather}

Return the JSON object as specified in the system prompt, with recommendations genuinely
tailored to this soil, irrigation, and climate combination."""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],
            temperature=0.3,
            max_tokens=2500
        )

        result = response.choices[0].message.content.strip()
        return _safe_parse_json(result)

    except Exception as e:
        print("Groq Crop Advice Error:", e)
        return {
            "location": resolved_place_name,
            "summary": f"Based on current temperature of {temp}°C, soil condition ({soil_type}), and irrigation ({irrigation}), paddy and coconut are highly recommended for optimal yield.",
            "best_crop": {
                "crop": "Paddy (Rice)",
                "confidence": 92,
                "reason": "Ideal humidity, warm climate, and irrigation support high yield for paddy cultivation in Kerala.",
                "varieties": [
                    {"name": "Uma (MO 16)", "suitability_note": "High yielding, flood tolerant variety widely grown in Kerala.", "expected_yield": "3.2 tons/acre"},
                    {"name": "Jyothi", "suitability_note": "Short duration, pest resistant rice suitable for wet soil.", "expected_yield": "2.8 tons/acre"}
                ]
            },
            "recommended_crops": [
                {
                    "recommendation_rank": 1,
                    "crop": "Paddy (Rice)",
                    "confidence": 92,
                    "suitability_score": 94,
                    "why_recommended": ["High humidity tolerance", "Favorable water availability", "Local soil compatibility"],
                    "varieties": [
                        {"name": "Uma (MO 16)", "suitability_note": "High yielding, flood tolerant variety widely grown in Kerala.", "expected_yield": "3.2 tons/acre"},
                        {"name": "Jyothi", "suitability_note": "Short duration, pest resistant rice suitable for wet soil.", "expected_yield": "2.8 tons/acre"}
                    ],
                    "best_sowing_time": "June - July (Kharif)",
                    "crop_duration": "110-130 days",
                    "water_requirement": "1200-1400 mm",
                    "expected_yield": "2.5-3.5 tons/acre",
                    "market_demand": "High",
                    "profitability": "High",
                    "possible_risks": ["Stem borer pest", "Bacterial leaf blight during heavy rain"]
                },
                {
                    "recommendation_rank": 2,
                    "crop": "Coconut",
                    "confidence": 88,
                    "suitability_score": 90,
                    "why_recommended": ["Tropical climate match", "Consistent market pricing", "Perennial yield"],
                    "varieties": [
                        {"name": "West Coast Tall", "suitability_note": "Traditional hardy variety suited for all Kerala soils.", "expected_yield": "80 nuts/tree/year"},
                        {"name": "Chowghat Orange Dwarf", "suitability_note": "Early bearing tender coconut variety.", "expected_yield": "110 nuts/tree/year"}
                    ],
                    "best_sowing_time": "May - June",
                    "crop_duration": "Perennial (5-6 years to fruit)",
                    "water_requirement": "1000-1200 mm",
                    "expected_yield": "70-100 nuts/tree/year",
                    "market_demand": "High",
                    "profitability": "High",
                    "possible_risks": ["Rhinoceros beetle", "Bud rot during monsoon"]
                },
                {
                    "recommendation_rank": 3,
                    "crop": "Black Pepper",
                    "confidence": 84,
                    "suitability_score": 85,
                    "why_recommended": ["Excellent cash crop", "High export value", "Thrives in humid climate"],
                    "varieties": [
                        {"name": "Panniyur 1", "suitability_note": "High yielding hybrid suitable for shaded agroforestry.", "expected_yield": "2.2 kg dry pepper/vine"},
                        {"name": "Karimunda", "suitability_note": "Popular local landrace with strong disease resistance.", "expected_yield": "1.8 kg dry pepper/vine"}
                    ],
                    "best_sowing_time": "June - August",
                    "crop_duration": "Perennial (3 years to yield)",
                    "water_requirement": "1500-2000 mm",
                    "expected_yield": "1.5-2.5 kg dry pepper/vine",
                    "market_demand": "High",
                    "profitability": "Very High",
                    "possible_risks": ["Quick wilt disease", "Pollu beetle"]
                },
                {
                    "recommendation_rank": 4,
                    "crop": "Banana (Nendran)",
                    "confidence": 80,
                    "suitability_score": 82,
                    "why_recommended": ["High domestic demand", "Short crop cycle", "Good market liquidity"],
                    "varieties": [
                        {"name": "Nendran", "suitability_note": "Premium plantain variety for chips and culinary use.", "expected_yield": "14 kg/bunch"},
                        {"name": "Grand Naine", "suitability_note": "High yielding Cavendish table banana.", "expected_yield": "25 kg/bunch"}
                    ],
                    "best_sowing_time": "September - October",
                    "crop_duration": "10-12 months",
                    "water_requirement": "1200-1500 mm",
                    "expected_yield": "12-15 kg/bunch",
                    "market_demand": "High",
                    "profitability": "High",
                    "possible_risks": ["Sigatoka leaf spot", "Wind damage"]
                },
                {
                    "recommendation_rank": 5,
                    "crop": "Tapioca (Cassava)",
                    "confidence": 75,
                    "suitability_score": 78,
                    "why_recommended": ["Low maintenance", "Drought tolerant", "Good soil adaptability"],
                    "varieties": [
                        {"name": "M4", "suitability_note": "Popular non-bitter culinary variety.", "expected_yield": "12 tons/acre"},
                        {"name": "Sree Padmanabha", "suitability_note": "Mosaic virus resistant cassava variety.", "expected_yield": "14 tons/acre"}
                    ],
                    "best_sowing_time": "April - May",
                    "crop_duration": "8-10 months",
                    "water_requirement": "800-1000 mm",
                    "expected_yield": "10-12 tons/acre",
                    "market_demand": "Medium",
                    "profitability": "Moderate",
                    "possible_risks": ["Mosaic virus", "Tuber rot in waterlogged soil"]
                }
            ],
            "not_recommended": [
                {
                    "crop": "Wheat",
                    "reason": "Requires cold winter temperatures not prevalent in Kerala tropical climate."
                },
                {
                    "crop": "Cotton",
                    "reason": "High humidity and rainfall lead to boll rot and poor fiber quality."
                }
            ]
        }


def _to_bool(val, default=False):
    if isinstance(val, bool):
        return val
    if isinstance(val, str):
        return val.strip().lower() in ["true", "yes", "recommended", "required", "1"]
    return default


def get_weather_advice(weather_data: dict, crop: str):

    prompt = f"""
You are an expert agricultural scientist and AI farming advisor.

A farmer is growing {crop}.

Analyze the following weather conditions and provide accurate farming recommendations.

Current Weather

Location: {weather_data.get('location', 'Kerala')}

Current Temperature: {weather_data.get('temperature', 28)} °C
Feels Like: {weather_data.get('feels_like', 29)} °C
Maximum Temperature: {weather_data.get('max_temp', 31)} °C
Minimum Temperature: {weather_data.get('min_temp', 24)} °C
Average Temperature: {weather_data.get('avg_temp', 27)} °C

Weather Condition: {weather_data.get('condition', 'Clear')}
Forecast: {weather_data.get('forecast', 'Clear')}

Humidity: {weather_data.get('humidity', 75)} %
Cloud Cover: {weather_data.get('cloud_cover', 40)} %

Chance of Rain: {weather_data.get('chance_of_rain', 30)} %
Expected Rainfall: {weather_data.get('total_precipitation', 0)} mm

Wind Speed: {weather_data.get('wind_speed', 12)} km/h
Wind Gust: {weather_data.get('gust_speed', 18)} km/h
Maximum Wind Speed: {weather_data.get('max_wind', 20)} km/h

UV Index: {weather_data.get('uv_index', 6)}
Pressure: {weather_data.get('pressure_mb', 1012)} mb
Visibility: {weather_data.get('visibility_km', 10)} km

Sunrise: {weather_data.get('sunrise', '06:15 AM')}
Sunset: {weather_data.get('sunset', '06:45 PM')}

Provide today's farming advisory.

Return ONLY valid JSON in the following format:

{{
    "weather_summary": "",

    "today_action_plan": [
        "",
        "",
        ""
    ],

    "irrigation_advice": {{
        "required": true,
        "reason": ""
    }},

    "spraying_advice": {{
        "recommended": false,
        "reason": ""
    }},

    "harvesting_advice": {{
        "recommended": false,
        "reason": ""
    }},

    "weather_alerts": [
        "",
        ""
    ],

    "next_3_day_outlook": [
        "",
        "",
        ""
    ],

    "overall_farming_risk": ""
}}

Rules:

1. Advice must be specific for {crop}.
2. Give exactly 3 action plan points.
3. Weather risk must be only one of: Low, Medium, High.
4. Base every recommendation ONLY on the supplied weather data.
5. Never invent storms, floods, cyclones, heavy rain or strong winds unless supported by the data.
6. If chance of rain is above 50%, pesticide spraying should normally NOT be recommended.
7. If rainfall is expected, prioritize drainage, fungal disease prevention and field inspection.
8. Recommend irrigation only when rainfall is insufficient.
9. Recommend harvesting only if weather conditions are favorable.
10. Weather alerts must exactly match the supplied weather data.
11. Next 3-day outlook must be consistent with the weather forecast.
12. Recommendations must be practical and immediately useful for farmers.
13. Avoid generic farming advice.
14. Keep every sentence short and professional.
15. Return ONLY valid JSON.
16. Do NOT use markdown.
17. Do NOT include explanations outside the JSON.
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are India's best AI agricultural weather advisor. Return valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=1800
        )

        result = response.choices[0].message.content.strip()
        parsed = _safe_parse_json(result)

        # Normalize booleans
        if "irrigation_advice" in parsed and isinstance(parsed["irrigation_advice"], dict):
            parsed["irrigation_advice"]["required"] = _to_bool(parsed["irrigation_advice"].get("required"), False)
        if "spraying_advice" in parsed and isinstance(parsed["spraying_advice"], dict):
            parsed["spraying_advice"]["recommended"] = _to_bool(parsed["spraying_advice"].get("recommended"), True)
        if "harvesting_advice" in parsed and isinstance(parsed["harvesting_advice"], dict):
            parsed["harvesting_advice"]["recommended"] = _to_bool(parsed["harvesting_advice"].get("recommended"), True)

        return parsed

    except Exception as e:
        print("Groq Weather Advice Error:", e)
        rain_chance = weather_data.get("chance_of_rain", 30)
        high_rain = rain_chance >= 50
        return {
            "weather_summary": f"Current weather in {weather_data.get('location', 'Kerala')} shows {weather_data.get('condition', 'partly cloudy')} with temperature {weather_data.get('temperature', 28)}°C and humidity {weather_data.get('humidity', 75)}%.",
            "today_action_plan": [
                f"Inspect {crop} field drainage to prevent waterlogging during rains.",
                f"Monitor humidity levels for fungal outbreak risks on {crop}.",
                "Ensure proper field ventilation and weed control."
            ],
            "irrigation_advice": {
                "required": not high_rain,
                "reason": "Light irrigation recommended unless sufficient rainfall occurs." if not high_rain else "Rainfall expected; additional irrigation not required."
            },
            "spraying_advice": {
                "recommended": not high_rain,
                "reason": "Clear conditions permit safe foliar spraying." if not high_rain else "Postpone pesticide/fungicide spray due to high chance of rain."
            },
            "harvesting_advice": {
                "recommended": not high_rain,
                "reason": "Good dry window for crop harvest." if not high_rain else "Delay harvest to prevent damp grain or crop spoilage."
            },
            "weather_alerts": [
                f"Rain probability: {rain_chance}%",
                f"Humidity: {weather_data.get('humidity', 75)}%"
            ],
            "next_3_day_outlook": [
                "Day 1: Warm and humid conditions with light breeze.",
                "Day 2: Scattered cloud cover and mild temperature variations.",
                "Day 3: Typical monsoon season humidity with localized showers."
            ],
            "overall_farming_risk": "Medium" if high_rain else "Low"
        }


def get_market_insight(crop: str, district: str, price_data: list):

    prompt = f"""
You are India's best agricultural economist and market intelligence expert.

Analyze the following Kerala agricultural market data.

Crop:
{crop}

District:
{district}

Market Data:
{json.dumps(price_data, indent=2)}

Your goal is to maximize the farmer's profit while minimizing risk.

Return ONLY valid JSON.

{{
    "summary":"",
    "recommendation":"",
    "price_trend":"",
    "demand":"",
    "supply":"",
    "best_selling_time":"",
    "market_score":0,
    "farmer_action":"",
    "market_sentiment":"",
    "profitability":"",
    "risk_level":"",
    "price_forecast":"",
    "key_reason":"",
    "market_alerts":[
        "",
        "",
        ""
    ]
}}

Rules:

1. Calculate a dynamic market_score between 35 and 95 based on price level, demand, export prospects for Kerala, and seasonal trend. Do not default to 60.

2. price_trend must be exactly one of:
Rising
Stable
Falling

3. demand must be:
High
Medium
Low

4. supply must be:
High
Medium
Low

5. farmer_action must be exactly one of:
SELL NOW
SELL THIS WEEK
WAIT
STORE CROP

6. market_sentiment:
Bullish
Neutral
Bearish

7. profitability:
High
Moderate
Low

8. risk_level:
Low
Medium
High

9. price_forecast:
Increasing
Stable
Decreasing

10. recommendation must be practical.

11. key_reason should explain the recommendation in one sentence.

12. Generate exactly 3 useful market alerts.

13. Return ONLY JSON.

14. Never use markdown.
"""

    try:

        response = client.chat.completions.create(

            model="llama-3.3-70b-versatile",

            messages=[

                {
                    "role": "system",
                    "content": "You are an expert agricultural market intelligence system."
                },

                {
                    "role": "user",
                    "content": prompt
                }

            ],

            temperature=0.2,

            max_tokens=1200

        )

        result = response.choices[0].message.content.strip()
        return _safe_parse_json(result)

    except Exception as e:

        print("Groq Error:", e)

        return {

            "summary": "Market analysis unavailable.",

            "recommendation": "Unable to generate AI recommendation at the moment.",

            "price_trend": "Stable",

            "demand": "Medium",

            "supply": "Medium",

            "best_selling_time": "Current Week",

            "market_score": 50,

            "farmer_action": "WAIT",

            "market_sentiment": "Neutral",

            "profitability": "Moderate",

            "risk_level": "Medium",

            "price_forecast": "Stable",

            "key_reason": "AI response could not be generated.",

            "market_alerts": [
                "No alerts available.",
                "Market data is limited.",
                "Please try again later."
            ]
        }
