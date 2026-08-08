import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import i18n from '../i18n'

export interface User {
  id?: string
  _id?: string
  name: string
  email: string
  preferredLanguage?: string
  role?: string
  [key: string]: any
}

export interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  authModalOpen: boolean
  authModalMode: 'login' | 'signup'
  openAuthModal: (mode?: 'login' | 'signup') => void
  closeAuthModal: () => void
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string) => Promise<User>
  logout: () => void
  updateLanguage: (preferredLanguage: string) => Promise<void>
  setUser: React.Dispatch<React.SetStateAction<User | null>>
}

const AuthContext = createContext<AuthContextType | null>(null)

const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 2, delay = 1000): Promise<Response> => {
  const urlsToTry = [url]
  if (url.includes('localhost')) {
    urlsToTry.push(url.replace('localhost', '127.0.0.1'))
  }

  let lastError: any = null

  for (const targetUrl of urlsToTry) {
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await fetch(targetUrl, options)
        return res
      } catch (err) {
        lastError = err
        if (i < retries) {
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }
  }

  throw lastError || new Error(`Failed to connect to ${url}`)
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Clear persistent legacy localStorage so previous names don't linger across app runs
  useEffect(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('hk_user')
  }, [])

  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('token'))
  // Pre-populate user from session cache so ProtectedRoute doesn't flash a redirect
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = sessionStorage.getItem('hk_user')
      return cached ? JSON.parse(cached) : null
    } catch { return null }
  })
  const [loading, setLoading] = useState<boolean>(() => !!sessionStorage.getItem('token'))
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login')

  const openAuthModal = useCallback((mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode)
    setAuthModalOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false)
  }, [])

  // Restore session on app load
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = sessionStorage.getItem('token')
      if (!savedToken) {
        setLoading(false)
        return
      }
      try {
        const res = await fetchWithRetry(`${DEFAULT_API_BASE}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${savedToken}`,
            'Content-Type': 'application/json',
          },
        }, 0, 0).catch(() => null)  // no retries — fail fast

        if (res && res.ok) {
          const data = await res.json()
          const currentUser = data.user || data
          setUser(currentUser)
          setToken(savedToken)
          sessionStorage.setItem('hk_user', JSON.stringify(currentUser))
          if (currentUser?.preferredLanguage) {
            i18n.changeLanguage(currentUser.preferredLanguage)
          }
        } else {
          sessionStorage.removeItem('token')
          sessionStorage.removeItem('hk_user')
          localStorage.removeItem('token')
          localStorage.removeItem('hk_user')
          setToken(null)
          setUser(null)
        }
      } catch (err) {
        console.warn('Could not restore session:', err)
      }
      setLoading(false)
    }

    restoreSession()
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    let res: Response
    try {
      res = await fetchWithRetry(`${DEFAULT_API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }, 0, 0)
    } catch (netErr) {
      throw new Error(`Unable to connect to backend at ${DEFAULT_API_BASE}. Please wait a moment while the FastAPI backend finishes starting up.`)
    }

    const data = await res.json()

    if (!res.ok) {
      const errorMsg = data.message || data.detail || data.error || 'Login failed. Please check your credentials.'
      throw new Error(errorMsg)
    }

    const jwtToken = data.token
    const userData = data.user || data

    sessionStorage.setItem('token', jwtToken)
    sessionStorage.setItem('hk_user', JSON.stringify(userData))
    localStorage.removeItem('token')
    localStorage.removeItem('hk_user')
    setToken(jwtToken)
    setUser(userData)

    if (userData?.preferredLanguage) {
      i18n.changeLanguage(userData.preferredLanguage)
    }

    closeAuthModal()
    return userData
  }

  const register = async (name: string, email: string, password: string): Promise<User> => {
    let res: Response
    try {
      res = await fetchWithRetry(`${DEFAULT_API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      }, 0, 0)
    } catch (netErr) {
      throw new Error(`Unable to connect to backend at ${DEFAULT_API_BASE}. Please wait a moment while the FastAPI backend finishes starting up.`)
    }

    const data = await res.json()

    if (!res.ok) {
      const errorMsg = data.message || data.detail || data.error || 'Registration failed. Please try again.'
      throw new Error(errorMsg)
    }

    const jwtToken = data.token
    const userData = data.user || data

    sessionStorage.setItem('token', jwtToken)
    sessionStorage.setItem('hk_user', JSON.stringify(userData))
    localStorage.removeItem('token')
    localStorage.removeItem('hk_user')
    setToken(jwtToken)
    setUser(userData)

    if (userData?.preferredLanguage) {
      i18n.changeLanguage(userData.preferredLanguage)
    }

    closeAuthModal()
    return userData
  }

  const logout = useCallback(() => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('hk_user')
    localStorage.removeItem('token')
    localStorage.removeItem('hk_user')
    setToken(null)
    setUser(null)
  }, [])

  const updateLanguage = async (preferredLanguage: string): Promise<void> => {
    const currentToken = sessionStorage.getItem('token') || token
    if (!currentToken) return
    try {
      const res = await fetchWithRetry(`${DEFAULT_API_BASE}/api/auth/language`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ preferredLanguage }),
      }, 1, 500).catch(() => null)

      if (res && res.ok) {
        const data = await res.json()
        const updatedUser = data.user || data
        setUser(updatedUser)
      }
    } catch (err) {
      console.error('Failed to update language preference:', err)
    }
  }

  const value: AuthContextType = {
    user,
    token,
    loading,
    authModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    logout,
    updateLanguage,
    setUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
