import os
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load backend/.env
BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

API_KEY = os.getenv("WEATHER_API_KEY")


def get_weather(latitude: float, longitude: float):
    """
    Fetch current weather and 3-day forecast
    using GPS coordinates.
    """

    url = (
        f"https://api.weatherapi.com/v1/forecast.json"
        f"?key={API_KEY}"
        f"&q={latitude},{longitude}"
        f"&days=3"
        f"&aqi=no"
        f"&alerts=no"
    )

    response = requests.get(url)

    if response.status_code != 200:
        raise Exception("Failed to fetch weather data.")

    data = response.json()

    # Extract required sections
    location = f"{data['location']['name']}, {data['location']['region']}"
    current = data["current"]
    forecast = data["forecast"]["forecastday"][0]
    forecast_day = forecast["day"]
    astro = forecast["astro"]

    return {
        # Location
        "location": location,

        # Temperature
        "temperature": current["temp_c"],
        "feels_like": current["feelslike_c"],
        "max_temp": forecast_day["maxtemp_c"],
        "min_temp": forecast_day["mintemp_c"],
        "avg_temp": forecast_day["avgtemp_c"],

        # Humidity
        "humidity": current["humidity"],

        # Rain
        "chance_of_rain": forecast_day["daily_chance_of_rain"],
        "precipitation_mm": current["precip_mm"],
        "total_precipitation": forecast_day["totalprecip_mm"],

        # Wind
        "wind_speed": current["wind_kph"],
        "gust_speed": current["gust_kph"],
        "max_wind": forecast_day["maxwind_kph"],

        # Sky
        "condition": current["condition"]["text"],
        "forecast": forecast_day["condition"]["text"],
        "cloud_cover": current["cloud"],

        # Environment
        "uv_index": current["uv"],
        "pressure_mb": current["pressure_mb"],
        "visibility_km": current["vis_km"],

        # Astronomy
        "sunrise": astro["sunrise"],
        "sunset": astro["sunset"],
    }
