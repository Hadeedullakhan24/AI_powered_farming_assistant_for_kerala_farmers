// ─── Disease Detection ────────────────────────────────────────────────────────
export interface DiseaseResponse {
  crop: string
  prediction: string
  confidence: number
}

// ─── Treatment Recommendation ─────────────────────────────────────────────────
export interface TreatmentResponse {
  crop: string
  disease: string
  overview: string
  symptoms: string[]
  chemical_treatment: string[]
  organic_treatment: string[]
  dosage: string[]
  prevention: string[]
  precautions: string[]
}

// ─── Weather Advisory ─────────────────────────────────────────────────────────
export interface WeatherRequest {
  latitude: number
  longitude: number
  crop: string
}

export interface IrrigationAdvice {
  required: boolean
  reason: string
}

export interface SprayingAdvice {
  recommended: boolean
  reason: string
}

export interface HarvestingAdvice {
  recommended: boolean
  reason: string
}

export interface WeatherAdvice {
  weather_summary: string
  today_action_plan: string[]
  irrigation_advice: IrrigationAdvice
  spraying_advice: SprayingAdvice
  harvesting_advice: HarvestingAdvice
  weather_alerts: string[]
  next_3_day_outlook: string[]
  overall_farming_risk: string
}

export interface WeatherResponse {
  weather: Record<string, unknown>
  advice: WeatherAdvice
}

// ─── Crop Advisory ────────────────────────────────────────────────────────────
export interface CropAdvisoryRequest {
  latitude: number
  longitude: number
  soil_type: string
  irrigation: string
}

export interface CropVariety {
  name: string
  suitability_note: string
  expected_yield?: string
}

export interface BestCrop {
  crop?: string
  name: string
  confidence: number
  reason: string
  varieties?: CropVariety[]
}

export interface RecommendedCrop {
  rank: number
  recommendation_rank?: number
  crop?: string
  name: string
  confidence: number
  suitability_score: number
  why_recommended: string[]
  varieties?: CropVariety[]
  best_sowing_time: string
  crop_duration: string
  water_requirement: string
  expected_yield: string
  market_demand: string
  profitability: string
  possible_risks: string[]
}

export interface CropAdvisoryResponse {
  location: string
  summary: string
  best_crop: BestCrop
  recommended_crops: RecommendedCrop[]
  not_recommended: Array<{ crop?: string; name: string; reason: string }>
}

// ─── Market Intelligence ──────────────────────────────────────────────────────
export interface MarketRequest {
  crop: string
  district: string
}

export interface PriceData {
  commodity: string
  average_price: number
  market_price: number
  min_price: number
  max_price: number
  unit: string
  date: string
}

export interface AIInsight {
  summary: string
  recommendation: string
  price_trend: string
  demand: string
  supply: string
  best_selling_time: string
  market_score: number
}

export interface Profitability {
  level: string
  confidence: string
  expected_margin: string
}

export interface FarmerDecision {
  action: string
  confidence: string
  priority: string
  reasons: string[]
}

export interface PricePrediction {
  today: number
  tomorrow: number
  next_week: number
  trend: string
}

export interface MarketRisk {
  level: string
  risk_score: number
  reason: string
}

export interface MarketHealth {
  score: number
  label: string
  color: string
}

export interface BestMarketOpportunity {
  commodity: string
  price: number
  reason: string
}

export interface SellingWindow {
  from_date: string
  to_date: string
  recommendation: string
}

export interface MarketScorecard {
  price_strength: number
  demand_strength: number
  supply_health: number
  profit_potential: number
  risk_index: number
  ai_confidence: number
}

export interface DistrictComparison {
  district: string
  commodity: string
  market_price: number
  average_price: number
  rank: number
}

export interface MarketResponse {
  crop: string
  district: string
  price_data: PriceData[]
  highest_priced_commodity: string
  highest_price: number
  district_comparison: DistrictComparison[]
  ai_insight: AIInsight
  market_score: number
  market_status: string
  score_color: string
  profitability: Profitability
  market_scorecard: MarketScorecard
  market_health: MarketHealth
  farmer_decision: FarmerDecision
  price_prediction: PricePrediction
  market_risk: MarketRisk
  best_market_opportunity: BestMarketOpportunity
  selling_window: SellingWindow
  market_alerts: string[]
  last_updated: string
}

// ─── AI Assistant ──────────────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  message: string
  conversation_history?: ChatMessage[]
  lang?: string
}

export interface ChatResponse {
  reply: string
}

// ─── Government Schemes & Financial Advisory ─────────────────────────────────
export interface GovernmentRequest {
  district: string
  crop: string
  land_area: number
  land_ownership: string
  farmer_category: string
  annual_income: number
  loan_required: string
  current_loan?: string
  language?: string
}

export interface SchemeCard {
  scheme_id: string
  scheme_name: string
  description?: string
  benefits: string
  eligibility?: string
  required_documents?: string[]
  applicable_crops?: string[]
  applicable_categories?: string[]
  state?: string
  district?: string | string[]
  official_website: string
  official_apply_link: string
  helpline?: string
  deadline?: string
  priority?: string
  estimated_financial_impact?: string
  reason?: string
}

export interface LoanCard {
  loan_id: string
  loan_name: string
  bank_organization: string
  maximum_amount: string
  interest_rate: string
  eligibility?: string
  required_documents?: string[]
  official_website: string
  official_apply_link: string
  repayment_details?: string
  repayment?: string
  risk_level?: string
}

export interface AIExplanation {
  why_best_scheme: string
  why_best_loan: string
  financial_benefit_breakdown: string
  other_schemes_note: string
}

export interface GovernmentResponse {
  profile_summary: {
    district: string
    crop: string
    land_area: string
    category: string
    income: string
  }
  financial_score: number
  financial_score_level: string
  best_scheme: SchemeCard
  eligible_schemes: SchemeCard[]
  best_loan: LoanCard
  loan_options: LoanCard[]
  documents_required: string[]
  government_alerts: string[]
  next_steps: string[]
  ai_explanation: AIExplanation
  // Freshness summary attached by backend fetcher services
  data_freshness?: {
    oldest_verified?: string
    newest_verified?: string
    sources_ok?: number
    sources_stale?: number
    note?: string
  }
}

