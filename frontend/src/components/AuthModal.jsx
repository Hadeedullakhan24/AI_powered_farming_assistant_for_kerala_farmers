import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, Loader2, Lock, Mail, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext.tsx'

export const AuthModal = () => {
  const { authModalOpen, authModalMode, closeAuthModal, login, register } = useAuth()

  const [mode, setMode] = useState(authModalMode || 'login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setMode(authModalMode || 'login')
    setError('')
  }, [authModalMode, authModalOpen])

  const handleToggleMode = (newMode) => {
    setMode(newMode)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all required fields.')
      return
    }

    if (mode === 'signup' && !name) {
      setError('Please enter your full name.')
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(name, email, password)
      }
      setName('')
      setEmail('')
      setPassword('')
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {authModalOpen && (
        <div
          key="auth-modal-wrapper"
          style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuthModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
          }}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 420,
            background: '#FFFFFF',
            borderRadius: 24,
            padding: '32px 28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 2px 10px rgba(27,94,32,0.1)',
            zIndex: 1001,
            border: '1px solid var(--color-border, #E8E0D0)',
          }}
        >
          {/* Close Button */}
          <button
            id="auth-modal-close-btn"
            onClick={closeAuthModal}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: '#F0F7F0',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--color-text-secondary, #6D4C31)',
              transition: 'background 0.2s',
            }}
          >
            <X size={18} />
          </button>

          {/* Modal Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: '2rem', marginBottom: 4 }}>🌿</div>
            <h2
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--color-primary, #2E7D32)',
                margin: 0,
              }}
            >
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--color-text-secondary, #6D4C31)',
                marginTop: 4,
              }}
            >
              {mode === 'login'
                ? 'Sign in to access your agricultural assistant'
                : 'Join HexaKrishi AI for personalized farming insights'}
            </p>
          </div>

          {/* Mode Switcher Toggle */}
          <div
            style={{
              display: 'flex',
              background: '#F0F7F0',
              padding: 4,
              borderRadius: 9999,
              marginBottom: 20,
              border: '1px solid #E0EED8',
            }}
          >
            <button
              id="auth-toggle-login"
              type="button"
              onClick={() => handleToggleMode('login')}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: 9999,
                border: 'none',
                cursor: 'pointer',
                fontWeight: mode === 'login' ? 700 : 500,
                fontSize: '0.875rem',
                fontFamily: 'Inter, sans-serif',
                background:
                  mode === 'login'
                    ? 'linear-gradient(135deg, #2E7D32 0%, #F9A825 100%)'
                    : 'transparent',
                color: mode === 'login' ? '#ffffff' : 'var(--color-text-secondary, #6D4C31)',
                boxShadow: mode === 'login' ? '0 2px 8px rgba(46,125,50,0.2)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Login
            </button>
            <button
              id="auth-toggle-signup"
              type="button"
              onClick={() => handleToggleMode('signup')}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: 9999,
                border: 'none',
                cursor: 'pointer',
                fontWeight: mode === 'signup' ? 700 : 500,
                fontSize: '0.875rem',
                fontFamily: 'Inter, sans-serif',
                background:
                  mode === 'signup'
                    ? 'linear-gradient(135deg, #2E7D32 0%, #F9A825 100%)'
                    : 'transparent',
                color: mode === 'signup' ? '#ffffff' : 'var(--color-text-secondary, #6D4C31)',
                boxShadow: mode === 'signup' ? '0 2px 8px rgba(46,125,50,0.2)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Inline Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 12,
                background: '#FFEBEE',
                border: '1px solid #FFCDD2',
                color: '#C62828',
                fontSize: '0.82rem',
                marginBottom: 16,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="auth-name-input"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--color-text, #1C1C1C)',
                    marginBottom: 4,
                  }}
                >
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9E9E9E',
                    }}
                  />
                  <input
                    id="auth-name-input"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={mode === 'signup'}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 40px',
                      borderRadius: 9999,
                      border: '1.5px solid var(--color-border, #E8E0D0)',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'Inter, sans-serif',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary, #2E7D32)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--color-border, #E8E0D0)')}
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email-input"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--color-text, #1C1C1C)',
                  marginBottom: 4,
                }}
              >
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9E9E9E',
                  }}
                />
                <input
                  id="auth-email-input"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 40px',
                    borderRadius: 9999,
                    border: '1.5px solid var(--color-border, #E8E0D0)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary, #2E7D32)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--color-border, #E8E0D0)')}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="auth-password-input"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--color-text, #1C1C1C)',
                  marginBottom: 4,
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9E9E9E',
                  }}
                />
                <input
                  id="auth-password-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 40px',
                    borderRadius: 9999,
                    border: '1.5px solid var(--color-border, #E8E0D0)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary, #2E7D32)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--color-border, #E8E0D0)')}
                />
              </div>
            </div>

            {/* Submit Pill Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: 8,
                width: '100%',
                padding: '12px 24px',
                borderRadius: 9999,
                border: 'none',
                background: 'linear-gradient(135deg, #2E7D32 0%, #F9A825 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                fontFamily: 'Inter, sans-serif',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.8 : 1,
                boxShadow: '0 4px 14px rgba(46,125,50,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Login' : 'Create Account'}</span>
              )}
            </button>
          </form>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  )
}

export default AuthModal
