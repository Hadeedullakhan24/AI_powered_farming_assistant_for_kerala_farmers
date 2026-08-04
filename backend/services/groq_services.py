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


def get_chat_response(message: str, conversation_history: list[dict] | None = None) -> dict:
    """Return a conversational farming answer using the same provider as the other AI APIs.

    The frontend sends its recent messages with each request, so the backend keeps this
    endpoint stateless and can safely serve multiple farmers at the same time.
    """
    history = conversation_history or []
    messages = [
        {
            "role": "system",
            "content": (
                "You are HexaKrishi, a practical agricultural assistant for Kerala farmers. "
                "Give concise, actionable advice. State uncertainty for weather, market, "
                "or pesticide questions and encourage following local label and safety guidance."
            ),
        }
    ]

    for item in history[-10:]:
        if not isinstance(item, dict):
            continue
        role = item.get("role")
        content = item.get("content")
        if role in {"user", "assistant"} and isinstance(content, str) and content.strip():
            messages.append({"role": role, "content": content.strip()})

    # The latest question is authoritative; do not rely on callers placing it in history.
    if not messages or messages[-1].get("role") != "user" or messages[-1].get("content") != message.strip():
        messages.append({"role": "user", "content": message.strip()})

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.35,
            max_tokens=700,
        )
        reply = (response.choices[0].message.content or "").strip()
        if reply:
            return {"reply": reply}
        raise RuntimeError("The AI provider returned an empty reply.")
    except Exception as exc:
        print("Groq Chat Error:", exc)
        return {
            "reply": (
                "I could not reach the AI service right now. Please try again shortly. "
                "For immediate guidance, you can use the weather, crop advisory, disease, "
                "and market tools in this app."
            )
        }


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
            "crop": crop.title(),
            "disease": disease.title(),
            "overview": f"Management and treatment guidance for {disease} affecting {crop} in Kerala.",
            "symptoms": [
                f"Discoloration, spotting, or lesions on {crop} leaves/stems.",
                "Wilting, drooping, or reduced crop vigor.",
                "Stunted growth and lower yield potential."
            ],
            "chemical_treatment": [
                "Copper Oxychloride 50 WP (2.5g / litre water)",
                "Mancozeb 75 WP (2g / litre water)",
                "Systemic fungicide spray on affected areas"
            ],
            "organic_treatment": [
                "Neem oil spray (5ml / litre water + liquid soap emulsifier)",
                "Pseudomonas fluorescens spray (10g / litre water)",
                "Trichoderma viride soil application near root zone"
            ],
            "dosage": [
                "Spray 250-300 litres of solution per acre",
                "Repeat application after 12-14 days if symptoms persist",
                "Apply during cool early morning or late evening hours"
            ],
            "prevention": [
                "Maintain good field sanitation and drainage",
                "Use certified disease-resistant seeds/varieties",
                "Rotate with non-host crops each season"
            ],
            "precautions": [
                "Wear protective mask and gloves while spraying",
                "Avoid spraying during high winds or heavy rain",
                "Strictly observe 14-day pre-harvest waiting interval"
            ]
        }


def get_crop_advice(
    weather_data: dict,
    soil_type: str,
    irrigation: str,
    season: str,
):
    prompt = f"""
You are an expert agricultural scientist and AI farming advisor for Indian farmers.

Analyze the given farming conditions and recommend the FIVE most suitable crops.

Current Conditions

Location: {weather_data["location"]}
Temperature: {weather_data["temperature"]} °C
Feels Like: {weather_data["feels_like"]} °C
Humidity: {weather_data["humidity"]} %
Weather Condition: {weather_data["condition"]}
Chance of Rain: {weather_data["chance_of_rain"]} %
Rainfall: {weather_data["total_precipitation"]} mm
Wind Speed: {weather_data["wind_speed"]} km/h
UV Index: {weather_data["uv_index"]}
Soil Type: {soil_type}
Irrigation: {irrigation}
Season: {season}

Return ONLY valid JSON in the following format.

{{
  "location": "",
  "summary": "",

  "best_crop": {{
    "crop": "",
    "confidence": 0,
    "reason": ""
  }},

  "recommended_crops": [
    {{
      "recommendation_rank": 1,
      "crop": "",
      "confidence": 0,
      "suitability_score": 0,

      "why_recommended": [
        "",
        "",
        ""
      ],

      "best_sowing_time": "",
      "crop_duration": "",
      "water_requirement": "",
      "expected_yield": "",
      "market_demand": "",
      "profitability": "",
      "possible_risks": [
        "",
        ""
      ]
    }}
  ],

  "not_recommended": [
    {{
      "crop": "",
      "reason": ""
    }}
  ]
}}

Rules:

1. Recommend EXACTLY 5 crops.
2. Rank the crops from highest suitability to lowest.
3. recommendation_rank should start from 1.
4. confidence should be between 0 and 100.
5. suitability_score should be between 0 and 100.
6. Select ONE best crop with confidence score.
7. Give a professional summary in 2-3 sentences explaining why these crops are suitable.
8. why_recommended must contain 3-5 short reasons.
9. possible_risks should mention realistic agricultural risks.
10. Recommend EXACTLY 2 unsuitable crops.
11. Keep reasons concise and practical.
12. Base recommendations ONLY on the provided weather, soil, irrigation and season.
13. Return ONLY JSON.
14. Do NOT use markdown.
15. Do NOT add explanations outside JSON.
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are India's best AI agricultural advisor. Provide accurate crop recommendations matching requested JSON schema."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=2200
        )

        result = response.choices[0].message.content.strip()
        return _safe_parse_json(result)

    except Exception as e:
        print("Groq Crop Advice Error:", e)
        return {
            "location": weather_data.get("location", "Kerala"),
            "summary": f"Based on current temperature of {weather_data.get('temperature', 28)}°C, soil condition ({soil_type}), and irrigation ({irrigation}), paddy and coconut are highly recommended for optimal yield.",
            "best_crop": {
                "crop": "Paddy (Rice)",
                "confidence": 92,
                "reason": "Ideal humidity, warm climate, and irrigation support high yield for paddy cultivation in Kerala."
            },
            "recommended_crops": [
                {
                    "recommendation_rank": 1,
                    "crop": "Paddy (Rice)",
                    "confidence": 92,
                    "suitability_score": 94,
                    "why_recommended": ["High humidity tolerance", "Favorable water availability", "Local soil compatibility"],
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



import json
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
