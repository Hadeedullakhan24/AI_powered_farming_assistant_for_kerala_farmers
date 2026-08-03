import axios, { type AxiosError } from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL,
  timeout: 60000, // 60s for AI endpoints
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

// Response interceptor — unwrap data
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error.response?.status, error.config?.url)
    const responseData = (error as AxiosError<{ detail?: unknown }>).response?.data
    const detail = responseData?.detail
    const message =
      typeof detail === 'string' ? detail :
      typeof detail === 'object' && detail !== null ? JSON.stringify(detail) :
      error.message ?? 'Unable to complete the request. Please try again.'
    return Promise.reject(new Error(message))
  }
)

export default apiClient
