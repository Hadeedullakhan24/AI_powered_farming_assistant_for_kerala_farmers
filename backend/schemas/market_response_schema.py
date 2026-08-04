from typing import List
from pydantic import BaseModel


class PriceData(BaseModel):
    commodity: str
    average_price: float
    market_price: float
    min_price: float
    max_price: float
    unit: str
    date: str


class AIInsight(BaseModel):
    summary: str
    recommendation: str
    price_trend: str
    demand: str
    supply: str
    best_selling_time: str
    market_score: int
    market_sentiment: str = ""
    price_forecast: str = ""
    key_reason: str = ""


class Profitability(BaseModel):
    level: str
    confidence: str
    expected_margin: str


class FarmerDecision(BaseModel):
    action: str
    confidence: str
    priority: str
    reasons: List[str]


class PricePrediction(BaseModel):
    today: float
    tomorrow: float
    next_week: float
    trend: str


class MarketRisk(BaseModel):
    level: str
    risk_score: int
    reason: str


class MarketHealth(BaseModel):
    score: int
    label: str
    color: str


class BestMarketOpportunity(BaseModel):
    commodity: str
    price: float
    reason: str


class SellingWindow(BaseModel):
    from_date: str
    to_date: str
    recommendation: str

class MarketScoreCard(BaseModel):

    price_strength: int

    demand_strength: int

    supply_health: int

    profit_potential: int

    risk_index: int

    ai_confidence: int

class DistrictComparison(BaseModel):

    district: str

    commodity: str

    market_price: float

    average_price: float

    rank: int
class MarketResponse(BaseModel):

    crop: str
    district: str

    price_data: List[PriceData]

    highest_priced_commodity: str
    highest_price: float
    district_comparison: List[DistrictComparison]

    ai_insight: AIInsight

    market_score: int
    market_status: str
    score_color: str

    profitability: Profitability

    market_scorecard: MarketScoreCard
    market_health: MarketHealth

    farmer_decision: FarmerDecision

    price_prediction: PricePrediction

    market_risk: MarketRisk

    best_market_opportunity: BestMarketOpportunity

    selling_window: SellingWindow

    market_alerts: List[str]

    last_updated: str