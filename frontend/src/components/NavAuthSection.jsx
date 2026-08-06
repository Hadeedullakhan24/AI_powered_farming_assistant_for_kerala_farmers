import React from 'react'
import { useAuth } from '../context/AuthContext.tsx'
import { LogOut, User } from 'lucide-react'

export const NavAuthSection = () => {
  const { user, openAuthModal, logout } = useAuth()

  if (!user) {
    return (
      <button
        id="nav-login-btn"
        type="button"
        onClick={() => openAuthModal('login')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 18px',
          borderRadius: 9999,
          background: 'linear-gradient(135deg, var(--color-primary, #2E7D32), var(--color-accent, #F9A825))',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '0.85rem',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(46,125,50,0.25)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          fontFamily: 'Inter, sans-serif',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
      >
        <User size={14} />
        <span>Login</span>
      </button>
    )
  }

  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Circular Avatar */}
      <div
        id="nav-user-avatar"
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary, #2E7D32), var(--color-accent, #F9A825))',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
          textTransform: 'uppercase',
          userSelect: 'none',
          fontFamily: 'Inter, sans-serif',
        }}
        title={user.name || user.email}
      >
        {initial}
      </div>

      {/* User Name */}
      <span
        id="nav-user-name"
        style={{
          fontWeight: 600,
          fontSize: '0.85rem',
          color: 'var(--color-text, #1C1C1C)',
          fontFamily: 'Inter, sans-serif',
          maxWidth: 120,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {user.name || 'User'}
      </span>

      {/* Logout Link */}
      <button
        id="nav-logout-btn"
        type="button"
        onClick={logout}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-secondary, #6D4C31)',
          fontSize: '0.82rem',
          fontWeight: 500,
          padding: '4px 8px',
          borderRadius: 6,
          transition: 'color 0.2s',
          fontFamily: 'Inter, sans-serif',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#C62828')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary, #6D4C31)')}
        title="Logout"
      >
        <LogOut size={14} />
        <span>Logout</span>
      </button>
    </div>
  )
}

export default NavAuthSection
