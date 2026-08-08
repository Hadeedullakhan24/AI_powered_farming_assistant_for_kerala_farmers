import apiClient from './client'
import type {
  DiseaseResponse,
  TreatmentResponse,
  WeatherRequest,
  WeatherResponse,
  CropAdvisoryRequest,
  CropAdvisoryResponse,
  DiseaseIntelligenceRequest,
  DiseaseIntelligenceResponse,
  MarketRequest,
  MarketResponse,
  ChatRequest,
  ChatResponse,
} from './types'

// ─── Module 1: Disease Detection ─────────────────────────────────────────────
export const predictDisease = async (
  crop: string,
  imageFile: File
): Promise<DiseaseResponse> => {
  const form = new FormData()
  form.append('crop', crop)
  form.append('image', imageFile)

  const res = await apiClient.post<DiseaseResponse>('/api/disease/predict', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

// ─── Module 2: Treatment Recommendation ──────────────────────────────────────
// NOTE: This endpoint reads server-side state from the last /predict call.
// Always call predictDisease first, then immediately call getTreatment.
export const getTreatment = async (params?: {
  crop?: string
  disease?: string
}): Promise<TreatmentResponse> => {
  const res = await apiClient.get<TreatmentResponse>('/api/treatment', { params })
  return res.data
}

// ─── Module 3: Crop Advisory ─────────────────────────────────────────────────
export const getCropAdvisory = async (
  body: CropAdvisoryRequest
): Promise<CropAdvisoryResponse> => {
  const res = await apiClient.post<CropAdvisoryResponse>('/api/crop-advisor', body)
  return res.data
}

export const getCropDiseaseIntelligence = async (
  body: DiseaseIntelligenceRequest
): Promise<DiseaseIntelligenceResponse> => {
  const res = await apiClient.post<DiseaseIntelligenceResponse>('/api/crop-disease-intelligence', body)
  return res.data
}

// ─── Module 4: Weather Advisory ──────────────────────────────────────────────
export const getWeatherAdvisory = async (
  body: WeatherRequest
): Promise<WeatherResponse> => {
  const res = await apiClient.post<WeatherResponse>('/api/weather', body)
  return res.data
}

// ─── Module 5: Market Intelligence ───────────────────────────────────────────
// NOTE: Double-prefix endpoint confirmed from market_api.py: router prefix /market + route /market
export const getMarketIntelligence = async (
  body: MarketRequest
): Promise<MarketResponse> => {
  const res = await apiClient.post<MarketResponse>('/market/market', body)
  return res.data
}

// ─── Module 6: AI Assistant (RAG – to be integrated) ─────────────────────────
export const sendChatMessage = async (
  body: ChatRequest
): Promise<ChatResponse> => {
  const res = await apiClient.post<ChatResponse>('/api/assistant/chat', body)
  return res.data
}

// ─── Module 7: Government Schemes & Financial Advisory ────────────────────────
export const getGovernmentAdvisory = async (
  body: import('./types').GovernmentRequest
): Promise<import('./types').GovernmentResponse> => {
  const res = await apiClient.post<import('./types').GovernmentResponse>(
    '/api/government/advisory',
    body
  )
  return res.data
}
