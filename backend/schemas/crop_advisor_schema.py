from typing import List, Optional
from pydantic import BaseModel, Field


class CropAdvisorRequest(BaseModel):
    latitude: float
    longitude: float
    soil_type: str
    irrigation: str


class CropVariety(BaseModel):
    name: str
    suitability_note: str
    expected_yield: Optional[str] = ""


class BestCrop(BaseModel):
    crop: str
    name: Optional[str] = None
    confidence: int = Field(default=90, ge=0, le=100)
    reason: str
    varieties: Optional[List[CropVariety]] = []


class RecommendedCrop(BaseModel):
    recommendation_rank: int = Field(default=1, ge=1)
    rank: Optional[int] = None
    crop: str
    name: Optional[str] = None
    confidence: int = Field(default=85, ge=0, le=100)
    suitability_score: int = Field(default=85, ge=0, le=100)
    why_recommended: List[str] = []
    varieties: Optional[List[CropVariety]] = []
    best_sowing_time: str = "Optimal Season"
    crop_duration: str = "Standard"
    water_requirement: str = "Moderate"
    expected_yield: str = "High"
    market_demand: str = "High"
    profitability: str = "High"
    possible_risks: List[str] = []


class NotRecommendedCrop(BaseModel):
    crop: str
    name: Optional[str] = None
    reason: str


class CropAdvisoryResponse(BaseModel):
    location: str
    summary: str
    best_crop: BestCrop
    recommended_crops: List[RecommendedCrop]
    not_recommended: List[NotRecommendedCrop]


class DiseaseIntelligenceRequest(BaseModel):
    location: str
    crop: str


class RegionalDiseaseItem(BaseModel):
    name: str
    risk_level: str  # "High", "Medium", "Low"
    affected_crop: str
    season: str
    description: str
    prevention: str


class DiseaseIntelligenceResponse(BaseModel):
    location: str
    crop: str
    region_summary: str
    diseases: List[RegionalDiseaseItem]