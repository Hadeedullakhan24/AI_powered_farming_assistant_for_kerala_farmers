import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  Leaf, FlaskConical, Sprout, CloudSun, TrendingUp, ArrowRight,
  ShieldCheck, MapPin, Zap, CheckCircle2, Sparkles, Bot
} from 'lucide-react'
import { PageTransition } from '../components/shared/PageTransition'

// Count-up hook
const useCountUp = (target: number, duration = 2000, start = false) => {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number
    const step = (time: number) => {
      if (!startTime) startTime = time
      const progress = Math.min((time - startTime) / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
      else setCount(target)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

const MODULES = [
  {
    key: 'nav_disease',
    path: '/disease',
    icon: Leaf,
    title: 'Disease Detection',
    tagline: 'Computer Vision AI',
    desc: 'Instant AI photo diagnosis for Banana, Coconut, Paddy, Pepper & Rubber.',
    color: '#E8F5E9',
    iconColor: '#2E7D32',
    badge: 'Vision AI'
  },
  {
    key: 'nav_treatment',
    path: '/treatment',
    icon: FlaskConical,
    title: 'Treatment Recommendation',
    tagline: 'Organic & Chemical',
    desc: 'Tailored spray dosages, organic remedies, symptoms & preventive care.',
    color: '#FFF8E1',
    iconColor: '#F57F17',
    badge: 'Curative'
  },
  {
    key: 'nav_crop',
    path: '/crop',
    icon: Sprout,
    title: 'Crop Advisory',
    tagline: 'Location & Soil Matching',
    desc: 'Smart crop recommendations matched to your specific soil, season & water.',
    color: '#F3E5F5',
    iconColor: '#7B1FA2',
    badge: 'Agronomy'
  },
  {
    key: 'nav_weather',
    path: '/weather',
    icon: CloudSun,
    title: 'Weather Advisory',
    tagline: 'Farm-Level Forecasts',
    desc: 'Real-time weather alerts, irrigation scheduling & spraying advisories.',
    color: '#E3F2FD',
    iconColor: '#1565C0',
    badge: 'Live Weather'
  },
  {
    key: 'nav_market',
    path: '/market',
    icon: TrendingUp,
    title: 'Market Intelligence',
    tagline: 'Ecostat Prices & Decisions',
    desc: 'Live Kerala commodity prices, top district rankings & AI selling windows.',
    color: '#FBE9E7',
    iconColor: '#BF360C',
    badge: 'Live Prices'
  },
  {
    key: 'nav_assistant',
    path: '/assistant',
    icon: Bot,
    title: 'AI Chat Assistant',
    tagline: 'Conversational AI',
    desc: 'Ask any farming question in natural language — diseases, weather, crops, or markets.',
    color: '#E8EAF6',
    iconColor: '#283593',
    badge: 'Chat AI'
  },
]

const QUICK_BADGES = [
  { label: '🔬 Disease Diagnosis', path: '/disease' },
  { label: '💊 Treatment Plans', path: '/treatment' },
  { label: '🌱 Crop Advisory', path: '/crop' },
  { label: '⛅ Weather Alerts', path: '/weather' },
  { label: '📈 Live Market Prices', path: '/market' },
  { label: '🤖 AI Chat Assistant', path: '/assistant' },
]

const STATS = [
  { label: 'AI Farming Modules', value: 6 },
  { label: 'Kerala Districts Covered', value: 14 },
  { label: 'Supported Crops', value: 12 },
  { label: 'Free for Farmers', value: 100 },
]

const StatItem = ({ label, value, started }: { label: string; value: number; started: boolean }) => {
  const count = useCountUp(value, 1500, started)
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="count-number" style={{ fontSize: '2.5rem', fontFamily: 'Poppins, sans-serif', fontWeight: 800, color: '#fff' }}>
        {value === 100 ? `${count}%` : `${count}+`}
      </div>
      <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500, marginTop: 4 }}>{label}</div>
    </div>
  )
}

export const Home = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const statsRef = useRef<HTMLDivElement>(null)
  const [statsVisible, setStatsVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setStatsVisible(true)
    }, { threshold: 0.3 })
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <PageTransition>
      {/* ── 1. Hero Section ── */}
      <section style={{
        background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 35%, #388E3C 70%, #F9A825 100%)',
        padding: '84px 24px 72px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background Overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 15% 85%, rgba(249,168,37,0.2) 0%, transparent 45%), radial-gradient(circle at 85% 15%, rgba(255,255,255,0.1) 0%, transparent 45%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 840, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 99,
              background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
              color: '#fff', fontSize: '0.85rem', fontWeight: 600, marginBottom: 20,
              border: '1px solid rgba(255,255,255,0.25)'
            }}
          >
            <Sparkles size={14} color="#FFE082" />
            <span>AI-Powered Agricultural Platform for Kerala</span>
          </motion.div>

          <h1 style={{ color: '#fff', fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', marginBottom: 18, lineHeight: 1.15, fontWeight: 800 }}>
            Smart Farming Solutions <br />
            <span style={{ color: '#FFE082' }}>For Every Kerala Farmer</span>
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', marginBottom: 32, lineHeight: 1.7, maxWidth: 680, margin: '0 auto 32px' }}>
            Comprehensive AI assistance for disease diagnosis, organic & chemical treatments, crop selection, hyper-local weather alerts, and daily market intelligence.
          </p>

          {/* Quick Module Badges */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 36 }}>
            {QUICK_BADGES.map((b) => (
              <button key={b.label} onClick={() => navigate(b.path)}
                style={{
                  padding: '7px 14px', borderRadius: 99,
                  background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255,255,255,0.3)', color: '#fff',
                  cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500,
                  transition: 'all 0.2s', fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              >
                {b.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button id="hero-cta-primary" className="btn btn-accent" onClick={() => document.getElementById('modules-section')?.scrollIntoView({ behavior: 'smooth' })} style={{ padding: '14px 32px', fontSize: '1rem' }}>
              Explore All AI Services <ArrowRight size={16} />
            </button>
            <button id="hero-cta-secondary" onClick={() => navigate('/market')}
              style={{ padding: '14px 28px', fontSize: '1rem', borderRadius: 12, border: '2px solid rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
              📈 Live Kerala Markets
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. All 6 Core AI Modules Grid ── */}
      <section id="modules-section" style={{ maxWidth: 1140, margin: '0 auto', padding: '72px 24px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 1.2 }}>Comprehensive Farming Suite</span>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '2rem', marginTop: 6, color: 'var(--color-text)' }}>
            Six AI Modules Built For Kerala Agriculture
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: 600, margin: '8px auto 0', fontSize: '0.95rem' }}>
            Select any module to get instant real-time AI guidance tailored to your crop and district.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {MODULES.map(({ key, path, icon: Icon, title, tagline, desc, color, iconColor, badge }, i) => (
            <motion.div
              key={key}
              className="card card-hover"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              onClick={() => navigate(path)}
              style={{ padding: 28, cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1.5px solid var(--color-border)' }}
              id={`module-card-${key}`}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <motion.div
                    style={{ width: 52, height: 52, borderRadius: 16, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    whileHover={{ scale: 1.12, rotate: 4 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Icon size={26} color={iconColor} />
                  </motion.div>
                  <span className="badge" style={{ background: color, color: iconColor, fontWeight: 700, fontSize: '0.75rem' }}>{badge}</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: iconColor, textTransform: 'uppercase', letterSpacing: 0.8 }}>{tagline}</span>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, margin: '4px 0 10px', fontSize: '1.15rem', color: 'var(--color-text)' }}>
                  {title}
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </div>

              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: iconColor, fontSize: '0.85rem', fontWeight: 700 }}>
                <span>Launch {title}</span>
                <ArrowRight size={16} />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 3. Module Spotlight Highlights ── */}
      <section style={{ background: '#F4F7F4', padding: '64px 24px', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontFamily: 'Poppins, sans-serif', fontSize: '1.8rem', marginBottom: 40 }}>
            Integrated Real-Time Agricultural Intelligence
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            <div className="card" style={{ padding: 24, background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <TrendingUp size={20} color="#BF360C" />
                <h4 style={{ margin: 0, fontFamily: 'Poppins, sans-serif', fontWeight: 700 }}>Market Intelligence</h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Directly connected to Kerala Government Ecostat daily commodity pricing API with AI district rankings and optimal selling window decisions.
              </p>
            </div>

            <div className="card" style={{ padding: 24, background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <CloudSun size={20} color="#1565C0" />
                <h4 style={{ margin: 0, fontFamily: 'Poppins, sans-serif', fontWeight: 700 }}>Farm Weather Alerts</h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Live GPS weather forecasts analyzing rain chances, humidity, and wind speed to deliver exact irrigation and pesticide spraying windows.
              </p>
            </div>

            <div className="card" style={{ padding: 24, background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Sprout size={20} color="#7B1FA2" />
                <h4 style={{ margin: 0, fontFamily: 'Poppins, sans-serif', fontWeight: 700 }}>Location & Soil Advisor</h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Recommends optimal crop options matched to your district, soil classification (Laterite, Alluvial, Red, Coastal), and irrigation system.
              </p>
            </div>

            <div className="card" style={{ padding: 24, background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <FlaskConical size={20} color="#F57F17" />
                <h4 style={{ margin: 0, fontFamily: 'Poppins, sans-serif', fontWeight: 700 }}>Organic & Chemical Care</h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Comprehensive treatment plans providing chemical fungicides/pesticides alongside eco-friendly organic remedies and exact spray dosages.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Key Advantages ── */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '64px 24px' }}>
        <h2 style={{ textAlign: 'center', fontFamily: 'Poppins, sans-serif', fontSize: '1.8rem', marginBottom: 40 }}>
          Why Kerala Farmers Trust HexaKrishi
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
          {[
            { icon: MapPin, title: '100% Kerala Focused', desc: 'Customized for Kerala crops (Banana, Coconut, Paddy, Pepper, Rubber, Cardamom).' },
            { icon: Zap, title: 'Real-Time AI Processing', desc: 'Powered by advanced AI and Computer Vision models for instant responses.' },
            { icon: ShieldCheck, title: 'Verified Government Data', desc: 'Integrates official Ecostat market prices and live meteorological forecasts.' },
            { icon: CheckCircle2, title: 'Multilingual Support', desc: 'Available in Malayalam, English, Tamil, and Hindi.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ textAlign: 'center', padding: '16px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Icon size={24} color="var(--color-primary)" />
              </div>
              <h4 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1rem', marginBottom: 6 }}>{title}</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. Stats Bar ── */}
      <section ref={statsRef} style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', padding: '54px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32 }}>
          {STATS.map(({ label, value }) => (
            <StatItem key={label} label={label} value={value} started={statsVisible} />
          ))}
        </div>
      </section>

      {/* ── 6. Footer ── */}
      <footer style={{ background: '#134016', color: 'rgba(255,255,255,0.75)', padding: '36px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', marginBottom: 16, fontSize: '0.875rem' }}>
            {MODULES.map(({ path, title }) => (
              <a key={path} href={path} style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontWeight: 500 }}>{title}</a>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>HexaKrishi AI · Built with ❤️ for Kerala Farmers</p>
        </div>
      </footer>
    </PageTransition>
  )
}


