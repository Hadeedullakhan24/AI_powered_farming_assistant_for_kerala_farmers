"""
government_schema.py (enhanced)
──────────────────────────────
Pydantic schemas for the Government Schemes & Financial Advisory module.
Adds DataFreshness and data_freshness field to GovernmentAdvisoryResponse.
"""

from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional


class FarmerProfileRequest(BaseModel):
    district: str = Field(..., example="Palakkad")
    crop: str = Field(..., example="Paddy")
    land_area: float = Field(..., example=2.5, description="Land area in acres")
    land_ownership: str = Field(
        ..., example="Owned",
        description="Owned | Leased | Tenant | Sharecropper"
    )
    farmer_category: str = Field(
        ..., example="Marginal/Small (<5 acres)",
        description="Marginal/Small | Medium | Large | Women Farmer | SC/ST | General"
    )
    annual_income: float = Field(..., example=120000.0, description="Annual income in INR")
    loan_required: str = Field("Yes", example="Yes", description="Yes or No")
    current_loan: Optional[str] = Field(
        "None", example="None",
        description="Details of current ongoing loan if any"
    )
    language: Optional[str] = Field(
        "English", example="English",
        description="Optional language for advisory output"
    )


class SchemeItem(BaseModel):
    scheme_id: str
    scheme_name: str
    description: str
    benefits: str
    eligibility: str
    required_documents: List[str]
    applicable_crops: List[str]
    applicable_categories: List[str]
    state: str
    district: Any
    official_website: str
    official_apply_link: str
    helpline: str
    deadline: str
    priority: Optional[str] = "High"
    estimated_financial_impact: Optional[str] = "Subsidies & Direct Financial Assistance"
    # Freshness metadata
    source_url: Optional[str] = None
    last_verified: Optional[str] = None
    freshness_ok: Optional[bool] = None


class LoanItem(BaseModel):
    loan_id: str
    loan_name: str
    bank_organization: str
    maximum_amount: str
    interest_rate: str
    eligibility: str
    required_documents: List[str]
    official_website: str
    official_apply_link: str
    repayment_details: str
    risk_level: Optional[str] = "Low"
    # Freshness metadata
    source_url: Optional[str] = None
    last_verified: Optional[str] = None
    freshness_ok: Optional[bool] = None


class AIExplanation(BaseModel):
    why_best_scheme: str
    why_best_loan: str
    financial_benefit_breakdown: str
    other_schemes_note: str


class DataFreshnessSummary(BaseModel):
    """Per-source freshness record returned by /freshness endpoint."""
    scheme_id: Optional[str] = None
    loan_id: Optional[str] = None
    scheme_name: Optional[str] = None
    loan_name: Optional[str] = None
    source_url: str
    last_verified: str
    freshness_ok: Optional[bool] = None


class GovernmentAdvisoryResponse(BaseModel):
    profile_summary: Dict[str, Any]
    financial_score: int
    financial_score_level: str
    best_scheme: Dict[str, Any]
    eligible_schemes: List[Dict[str, Any]]
    best_loan: Dict[str, Any]
    loan_options: List[Dict[str, Any]]
    documents_required: List[str]
    government_alerts: List[str]
    next_steps: List[str]
    ai_explanation: Dict[str, Any]
    # New: data freshness summary (populated from fetcher services)
    data_freshness: Optional[Dict[str, Any]] = None
