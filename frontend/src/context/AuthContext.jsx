import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import i18n from '../i18n'

const AuthContext = createContext(null)

const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Helper function to fetch with retry and localhost -> 127.0.0.1 fallback
const fetchWithRetry = async (url, options = {}, retries = 2, delay = 1000) => {
  const urlsToTry = [url]
  if (url.includes('localhost')) {
    urlsToTry.push(url.replace('localhost', '127.0.0.1'))
  }

  let lastError = null

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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState('login')

  const openAuthModal = useCallback((mode = 'login') => {
    setAuthModalMode(mode)
    setAuthModalOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false)
  }, [])

  // Restore session on app load
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('token')
      if (savedToken) {
        try {
          const res = await fetchWithRetry(`${DEFAULT_API_BASE}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${savedToken}`,
              'Content-Type': 'application/json',
            },
          }, 1, 500).catch(() => null)

          if (res && res.ok) {
            const data = await res.json()
            const currentUser = data.user || data
            setUser(currentUser)
            setToken(savedToken)
            if (currentUser?.preferredLanguage) {
              i18n.changeLanguage(currentUser.preferredLanguage)
            }
          } else {
            localStorage.removeItem('token')
            setToken(null)
            setUser(null)
          }
        } catch (err) {
          console.warn('Could not restore session:', err)
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        }
      }
      setLoading(false)
    }

    restoreSession()
  }, [])

  const login = async (email, password) => {
    let res
    try {
      res = await fetchWithRetry(`${DEFAULT_API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }, 2, 1000)
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

    localStorage.setItem('token', jwtToken)
    setToken(jwtToken)
    setUser(userData)

    if (userData?.preferredLanguage) {
      i18n.changeLanguage(userData.preferredLanguage)
    }

    closeAuthModal()
    return userData
  }

  const register = async (name, email, password) => {
    let res
    try {
      res = await fetchWithRetry(`${DEFAULT_API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      }, 2, 1000)
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

    localStorage.setItem('token', jwtToken)
    setToken(jwtToken)
    setUser(userData)

    if (userData?.preferredLanguage) {
      i18n.changeLanguage(userData.preferredLanguage)
    }

    closeAuthModal()
    return userData
  }

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  const updateLanguage = async (preferredLanguage) => {
    const currentToken = localStorage.getItem('token') || token
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

  const value = {
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

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
