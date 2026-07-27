import os
import json
from pathlib import Path
from groq import Groq
from dotenv import load_dotenv

# Load backend/.env
BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


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

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are an agricultural expert."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )

    result = response.choices[0].message.content.strip()

    if result.startswith("```"):
        result = result.replace("```json", "")
        result = result.replace("```", "")
        result = result.strip()

    return json.loads(result)


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

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": """
You are India's best AI agricultural advisor.

Provide accurate crop recommendations based only on the supplied farming conditions.

Always return valid JSON exactly matching the requested format.

Never return markdown.

Never return explanations outside JSON.
"""
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

    print("\n========== RAW GROQ RESPONSE ==========\n")
    print(result)
    print("\n=======================================\n")

    if result.startswith("```"):
        result = result.replace("```json", "")
        result = result.replace("```", "").strip()

    return json.loads(result)



import json


def get_weather_advice(weather_data: dict, crop: str):

    prompt = f"""
You are an expert agricultural scientist and AI farming advisor.

A farmer is growing {crop}.

Analyze the following weather conditions and provide accurate farming recommendations.

Current Weather

Location: {weather_data["location"]}

Current Temperature: {weather_data["temperature"]} °C
Feels Like: {weather_data["feels_like"]} °C
Maximum Temperature: {weather_data["max_temp"]} °C
Minimum Temperature: {weather_data["min_temp"]} °C
Average Temperature: {weather_data["avg_temp"]} °C

Weather Condition: {weather_data["condition"]}
Forecast: {weather_data["forecast"]}

Humidity: {weather_data["humidity"]} %
Cloud Cover: {weather_data["cloud_cover"]} %

Chance of Rain: {weather_data["chance_of_rain"]} %
Expected Rainfall: {weather_data["total_precipitation"]} mm

Wind Speed: {weather_data["wind_speed"]} km/h
Wind Gust: {weather_data["gust_speed"]} km/h
Maximum Wind Speed: {weather_data["max_wind"]} km/h

UV Index: {weather_data["uv_index"]}
Pressure: {weather_data["pressure_mb"]} mb
Visibility: {weather_data["visibility_km"]} km

Sunrise: {weather_data["sunrise"]}
Sunset: {weather_data["sunset"]}

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

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": """
You are India's best AI agricultural weather advisor.

Your recommendations must be based ONLY on the supplied weather data.

Never invent storms, heavy rain, floods, cyclones or strong winds unless the weather data clearly indicates them.

Provide practical and realistic farming recommendations.

Consider:
- Rainfall
- Humidity
- Temperature
- Wind
- UV Index
- Crop type

Always return valid JSON.

Never return markdown.

Never return explanations outside JSON.
"""
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

    print("\n========== RAW WEATHER RESPONSE ==========\n")
    print(result)
    print("\n==========================================\n")

    if result.startswith("```"):
        result = result.replace("```json", "")
        result = result.replace("```", "").strip()

    return json.loads(result)