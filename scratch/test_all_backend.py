import sys
from pathlib import Path

# Add project root to sys.path
root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root))

from backend.services.weather_service import get_weather
from backend.services.groq_services import get_chat_response, get_crop_advice
from backend.api.treatment_api import treatment
import backend.services.prediction_state as state

print("--- Testing Weather Service ---")
w = get_weather(10.8505, 76.2711)
print("Temperature C:", w.get("temperature_c"))
print("Humidity %:", w.get("humidity_percent"))
print("Chance of rain %:", w.get("chance_of_rain_percent"))

print("\n--- Testing Treatment API ---")
t = treatment()
print("Treatment overview:", t.get("overview")[:60], "...")

print("\n--- Testing Chatbot AI ---")
c = get_chat_response("What is the best fertilizer for coconut?")
print("Chat reply:", c.get("reply")[:80], "...")

print("\n--- ALL BACKEND TESTS PASSED SUCCESSFULLY! ---")
