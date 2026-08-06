import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import {
  Home, Leaf, FlaskConical, Sprout, CloudSun, TrendingUp,
  Globe, Menu, X, ChevronDown, MessageCircle,
} from 'lucide-react'
import { LANGUAGES } from '../../lib/constants'
import { useAuth } from '../../context/AuthContext.tsx'
import { NavAuthSection } from '../NavAuthSection'

const NAV_ITEMS = [
  { key: 'nav_home',      path: '/',          icon: Home },
  { key: 'nav_disease',   path: '/disease',   icon: Leaf },
  { key: 'nav_treatment', path: '/treatment', icon: FlaskConical },
  { key: 'nav_crop',      path: '/crop',      icon: Sprout },
  { key: 'nav_weather',   path: '/weather',   icon: CloudSun },
  { key: 'nav_market',    path: '/market',    icon: TrendingUp },
  { key: 'nav_assistant', path: '/assistant', icon: MessageCircle },
]

const MOBILE_NAV_ITEMS = [...NAV_ITEMS.slice(0, 5), NAV_ITEMS[NAV_ITEMS.length - 1]]

const LanguageSwitcher = () => {
  const [open, setOpen] = useState(false)
  const { user, updateLanguage } = useAuth()
  const currentLang = i18n.language
  const current = LANGUAGES.find((l) => l.code === currentLang) ?? LANGUAGES[0]

  const handleLanguageSelect = (langCode: string) => {
    i18n.changeLanguage(langCode)
    setOpen(false)
    if (user) {
      updateLanguage(langCode)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        id="lang-switcher-btn"
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)',
          background: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
          color: 'var(--color-text)', fontFamily: 'Inter, sans-serif',
        }}
      >
        <Globe size={14} />
        <span>{current.flag} {current.label}</span>
        <ChevronDown size={12} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              position: 'absolute', right: 0, top: '110%', background: '#fff',
              borderRadius: 10, boxShadow: 'var(--shadow-hover)', border: '1px solid var(--color-border)',
              minWidth: 160, zIndex: 200, overflow: 'hidden',
            }}
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                id={`lang-${lang.code}`}
                onClick={() => handleLanguageSelect(lang.code)}
                style={{
                  display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left',
                  background: lang.code === currentLang ? '#F0F7F0' : 'transparent',
                  border: 'none', cursor: 'pointer', fontSize: '0.875rem',
                  color: lang.code === currentLang ? 'var(--color-primary)' : 'var(--color-text)',
                  fontWeight: lang.code === currentLang ? 600 : 400, fontFamily: 'Inter, sans-serif',
                }}
              >
                {lang.flag} {lang.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const Navbar = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      {/* ── Desktop Top Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64,
      }} className="hidden-mobile">
        {/* Logo */}
        <NavLink to="/" id="navbar-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.5rem' }}>🌿</span>
          <span style={{
            fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.1rem',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            HexaKrishi AI
          </span>
        </NavLink>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
          {NAV_ITEMS.map(({ key, path, icon: Icon }) => {
            const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
            return (
              <NavLink
                key={path}
                to={path}
                id={`nav-${key}`}
                style={{ textDecoration: 'none', position: 'relative' }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
                  borderRadius: 8, fontSize: '0.82rem', fontWeight: active ? 600 : 500,
                  color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  transition: 'color 0.2s',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  <Icon size={15} />
                  <span style={{ whiteSpace: 'nowrap' }}>{t(key)}</span>
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      style={{
                        position: 'absolute', bottom: -2, left: 8, right: 8,
                        height: 2.5, borderRadius: 99,
                        background: 'var(--color-accent)',
                      }}
                    />
                  )}
                </div>
              </NavLink>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LanguageSwitcher />
          <NavAuthSection />
        </div>
      </nav>

      {/* ── Mobile Top Bar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 56,
      }} className="mobile-only">
        <NavLink to="/" id="navbar-logo-mobile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>🌿</span>
          <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary)' }}>
            HexaKrishi AI
          </span>
        </NavLink>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <LanguageSwitcher />
          <button id="hamburger-btn" onClick={() => setDrawerOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)', padding: 4 }}>
            <Menu size={22} />
          </button>
        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, width: 260,
                background: '#fff', zIndex: 201, padding: '24px 16px',
                boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: 'var(--color-primary)' }}>Menu</span>
                <button id="drawer-close-btn" onClick={() => setDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
                <NavAuthSection />
              </div>
              {NAV_ITEMS.map(({ key, path, icon: Icon }) => {
                const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
                return (
                  <NavLink
                    key={path} to={path} id={`drawer-nav-${key}`}
                    onClick={() => setDrawerOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      borderRadius: 10, textDecoration: 'none',
                      background: active ? '#F0F7F0' : 'transparent',
                      color: active ? 'var(--color-primary)' : 'var(--color-text)',
                      fontWeight: active ? 600 : 400, fontSize: '0.9rem',
                    }}
                  >
                    <Icon size={18} />
                    {t(key)}
                  </NavLink>
                )
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile Bottom Tab Bar ── */}
      <div className="bottom-nav mobile-only">
        {MOBILE_NAV_ITEMS.map(({ key, path, icon: Icon }) => {
          const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
          return (
            <NavLink
              key={path} to={path} id={`bottom-nav-${key}`}
              className={`bottom-nav-item${active ? ' active' : ''}`}
            >
              <Icon size={20} />
              <span>{t(key).split(' ')[0]}</span>
            </NavLink>
          )
        })}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
          .bottom-nav  { display: none !important; }
        }
      `}</style>
    </>
  )
}
