import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Loader2, Mail, Lock, User, Eye, EyeOff, ArrowRight, Leaf, Sprout, Sun } from 'lucide-react'
import { useAuth } from '../context/AuthContext.tsx'

export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, login, register } = useAuth()
  const { t } = useTranslation()

  const from = (location.state as any)?.from?.pathname || '/'

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // If already logged in, redirect immediately
  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user, navigate, from])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) { setError('Please fill in all required fields.'); return }
    if (mode === 'signup' && !name) { setError('Please enter your full name.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }

    setIsSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(name, email, password)
      }
      setSuccess(true)
      setTimeout(() => navigate(from, { replace: true }), 600)
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const switchMode = (m: 'login' | 'signup') => {
    setMode(m)
    setError('')
    setName('')
    setEmail('')
    setPassword('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Inter', system-ui, sans-serif",
      background: '#FAF7F0',
      overflow: 'hidden',
    }}>
      {/* ── Left Panel: Brand & Visual ── */}
      <div style={{
        flex: '0 0 45%',
        background: 'linear-gradient(145deg, #1B5E20 0%, #2E7D32 45%, #388E3C 70%, #1a6b1a 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decorative circles */}
        <div style={{
          position: 'absolute', top: '-80px', left: '-80px',
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', right: '-60px',
          width: 250, height: 250, borderRadius: '50%',
          background: 'rgba(249,168,37,0.12)',
        }} />

        {/* Brand content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ textAlign: 'center', zIndex: 1 }}
        >
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            border: '2px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '2.4rem',
          }}>
            🌿
          </div>
          <h1 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: '2.4rem',
            fontWeight: 800,
            color: '#ffffff',
            margin: '0 0 8px',
            letterSpacing: '-0.5px',
            lineHeight: 1.1,
          }}>
            HexaKrishi AI
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.75)',
            margin: '0 0 40px',
            fontWeight: 400,
          }}>
            {t('home_sub', 'AI-powered insights for Kerala farmers')}
          </p>

          {/* Feature pills */}
          {[
            { emoji: '🌾', text: t('disease_title', 'Crop Disease Detection') },
            { emoji: '🌤️', text: t('weather_title', 'Real-time Weather Advisory') },
            { emoji: '📈', text: t('market_title', 'Market Price Intelligence') },
            { emoji: '🤖', text: t('assistant_title', 'AI Farming Assistant') },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 50,
                padding: '10px 20px',
                marginBottom: 10,
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{f.emoji}</span>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', fontWeight: 500 }}>{f.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Right Panel: Auth Form ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 48px',
        overflowY: 'auto',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: success ? 0 : 1, y: success ? -20 : 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 420 }}
        >
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '1.8rem',
              fontWeight: 700,
              color: '#1C1C1C',
              margin: '0 0 6px',
            }}>
              {mode === 'login' ? t('login_title', 'Welcome back 👋') : t('login_create', 'Create account')}
            </h2>
            <p style={{ color: '#6D4C31', fontSize: '0.9rem', margin: 0 }}>
              {mode === 'login'
                ? t('login_subtitle', 'Sign in to your HexaKrishi account')
                : t('home_sub', 'Join thousands of farmers using AI')}
            </p>
          </div>

          {/* Mode Toggle */}
          <div style={{
            display: 'flex',
            background: '#F0F7F0',
            padding: 4,
            borderRadius: 12,
            marginBottom: 28,
            border: '1px solid #E0EED8',
          }}>
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                id={`auth-toggle-${m}`}
                type="button"
                onClick={() => switchMode(m)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 9,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: mode === m ? 700 : 500,
                  fontSize: '0.875rem',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.2s',
                  background: mode === m
                    ? 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)'
                    : 'transparent',
                  color: mode === m ? '#fff' : '#6D4C31',
                  boxShadow: mode === m ? '0 2px 10px rgba(46,125,50,0.25)' : 'none',
                }}
              >
                {m === 'login' ? t('login_sign_in', 'Sign In') : t('login_sign_up', 'Sign Up')}
              </button>
            ))}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: '#FFEBEE',
                  border: '1px solid #FFCDD2',
                  color: '#C62828',
                  fontSize: '0.85rem',
                  overflow: 'hidden',
                }}
              >
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <InputField
                    id="auth-name-input"
                    label={t('login_name', 'Full Name')}
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={setName}
                    icon={<User size={16} />}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <InputField
              id="auth-email-input"
              label={t('login_email', 'Email Address')}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              icon={<Mail size={16} />}
            />

            <div>
              <label htmlFor="auth-password-input" style={labelStyle}>{t('login_password', 'Password')}</label>
              <div style={{ position: 'relative' }}>
                <span style={iconStyle}><Lock size={16} /></span>
                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={(e) => (e.target.style.borderColor = '#2E7D32')}
                  onBlur={(e) => (e.target.style.borderColor = '#E8E0D0')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 14, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#9E9E9E', display: 'flex', padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: 8,
                width: '100%',
                padding: '13px 24px',
                borderRadius: 12,
                border: 'none',
                background: isSubmitting
                  ? '#ccc'
                  : 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1rem',
                fontFamily: 'Inter, sans-serif',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: isSubmitting ? 'none' : '0 4px 16px rgba(46,125,50,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'all 0.2s',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) (e.currentTarget.style.transform = 'translateY(-1px)')
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {isSubmitting ? (
                <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /><span>{t('loading', 'Please wait...')}</span></>
              ) : (
                <><span>{mode === 'login' ? t('login_sign_in', 'Sign In') : t('login_create', 'Create Account')}</span><ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {/* Footer switch link */}
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: '#6D4C31' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#2E7D32', fontWeight: 700, fontSize: '0.875rem',
                fontFamily: 'Inter, sans-serif', padding: 0, textDecoration: 'underline',
              }}
            >
              {mode === 'login' ? t('login_sign_up', 'Sign Up') : t('login_sign_in', 'Sign In')}
            </button>
          </p>
        </motion.div>

        {/* Success overlay */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                position: 'absolute',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 16,
              }}
            >
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, #2E7D32, #43A047)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem',
                boxShadow: '0 8px 32px rgba(46,125,50,0.4)',
              }}>✓</div>
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#2E7D32' }}>
                Welcome to HexaKrishi!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .login-left { display: none !important; }
          .login-right { padding: 24px !important; }
        }
      `}</style>
    </div>
  )
}

/* ── Reusable Input Field ── */
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem', fontWeight: 600,
  color: '#1C1C1C', marginBottom: 6,
}

const iconStyle: React.CSSProperties = {
  position: 'absolute', left: 14, top: '50%',
  transform: 'translateY(-50%)', color: '#9E9E9E',
  display: 'flex', pointerEvents: 'none',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px 11px 42px',
  borderRadius: 10, border: '1.5px solid #E8E0D0',
  fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'Inter, sans-serif', transition: 'border-color 0.2s',
  background: '#fff', color: '#1C1C1C',
}

const InputField = ({
  id, label, type, placeholder, value, onChange, icon,
}: {
  id: string; label: string; type: string;
  placeholder: string; value: string;
  onChange: (v: string) => void; icon: React.ReactNode;
}) => (
  <div>
    <label htmlFor={id} style={labelStyle}>{label}</label>
    <div style={{ position: 'relative' }}>
      <span style={iconStyle}>{icon}</span>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        style={inputStyle}
        onFocus={(e) => (e.target.style.borderColor = '#2E7D32')}
        onBlur={(e) => (e.target.style.borderColor = '#E8E0D0')}
      />
    </div>
  </div>
)

export default LoginPage
