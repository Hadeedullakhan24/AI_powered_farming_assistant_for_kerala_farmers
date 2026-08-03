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

    if not API_KEY:
        raise RuntimeError("Weather service is not configured. Set WEATHER_API_KEY in backend/.env.")

    url = (
        f"https://api.weatherapi.com/v1/forecast.json"
        f"?key={API_KEY}"
        f"&q={latitude},{longitude}"
        f"&days=3"
        f"&aqi=no"
        f"&alerts=no"
    )

    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
    except requests.RequestException as exc:
        message = "Weather provider could not be reached. Please try again shortly."
        if exc.response is not None:
            try:
                provider_error = exc.response.json().get("error", {}).get("message")
                if provider_error:
                    message = f"Weather provider error: {provider_error}"
            except ValueError:
                pass
        raise RuntimeError(message) from exc

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
        "temperature_c": current["temp_c"],
        "feels_like": current["feelslike_c"],
        "feels_like_c": current["feelslike_c"],
        "max_temp": forecast_day["maxtemp_c"],
        "max_temp_c": forecast_day["maxtemp_c"],
        "min_temp": forecast_day["mintemp_c"],
        "min_temp_c": forecast_day["mintemp_c"],
        "avg_temp": forecast_day["avgtemp_c"],

        # Humidity
        "humidity": current["humidity"],
        "humidity_percent": current["humidity"],

        # Rain
        "chance_of_rain": forecast_day["daily_chance_of_rain"],
        "chance_of_rain_percent": forecast_day["daily_chance_of_rain"],
        "precipitation_mm": current["precip_mm"],
        "total_precipitation": forecast_day["totalprecip_mm"],

        # Wind
        "wind_speed": current["wind_kph"],
        "wind_speed_kmh": current["wind_kph"],
        "gust_speed": current["gust_kph"],
        "gust_kmh": current["gust_kph"],
        "max_wind": forecast_day["maxwind_kph"],

        # Sky
        "condition": current["condition"]["text"],
        "forecast": forecast_day["condition"]["text"],
        "cloud_cover": current["cloud"],
        "cloud_cover_percent": current["cloud"],

        # Environment
        "uv_index": current["uv"],
        "pressure_mb": current["pressure_mb"],
        "visibility_km": current["vis_km"],

        # Astronomy
        "sunrise": astro["sunrise"],
        "sunset": astro["sunset"],
    }
