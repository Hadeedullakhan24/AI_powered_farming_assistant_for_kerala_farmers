from pydantic import BaseModel
from typing import List


class WeatherRequest(BaseModel):
    latitude: float
    longitude: float
    crop: str


class IrrigationAdvice(BaseModel):
    required: bool
    reason: str


class SprayingAdvice(BaseModel):
    recommended: bool
    reason: str


class HarvestingAdvice(BaseModel):
    recommended: bool
    reason: str


class WeatherAdvice(BaseModel):
    weather_summary: str

    today_action_plan: List[str]

    irrigation_advice: IrrigationAdvice

    spraying_advice: SprayingAdvice

    harvesting_advice: HarvestingAdvice

    weather_alerts: List[str]

    next_3_day_outlook: List[str]

    overall_farming_risk: str


class WeatherResponse(BaseModel):
    weather: dict
    advice: WeatherAdvice