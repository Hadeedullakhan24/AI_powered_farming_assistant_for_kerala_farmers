import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  Leaf, FlaskConical, Sprout, CloudSun, TrendingUp, ArrowRight,
  ShieldCheck, MapPin, Zap, CheckCircle2, Sparkles, Bot, Landmark,
  ChevronRight, Award, Compass, Shield, Activity, Wrench
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
    badge: 'Vision AI',
    highlights: ['Multi-crop analysis', 'Instant diagnosis', '95%+ Accuracy']
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
    badge: 'Curative',
    highlights: ['Organic remedies', 'Exact spray dosage', 'Preventive rules']
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
    badge: 'Agronomy',
    highlights: ['Soil type match', 'Seasonal advisory', 'Water requirements']
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
    badge: 'Live Weather',
    highlights: ['Hyper-local GPS', 'Spray windows', 'Rain alerts']
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
    badge: 'Live Prices',
    highlights: ['Gov. Ecostat data', '14 Districts price', 'Optimal sell timing']
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
    badge: 'Chat AI',
    highlights: ['Voice & Text', 'Malayalam native', '24/7 Agri Expert']
  },
  {
    key: 'nav_government',
    path: '/government',
    icon: Landmark,
    title: 'Gov. Schemes & Finance',
    tagline: 'AI Financial Advisory',
    desc: 'Personalized government scheme matching, loan advisory & financial strength scoring for Kerala farmers.',
    color: '#E8F5E9',
    iconColor: '#1B5E20',
    badge: 'Schemes AI',
    highlights: ['Subsidy matching', 'KCC Loan helper', 'Financial score']
  },
  {
    key: 'nav_equipment',
    path: '/equipment',
    icon: Wrench,
    title: 'Equipment Sharing',
    tagline: 'Peer-to-Peer Rental',
    desc: 'Borrow or lend farm equipment like tillers, sprayers, harvesters & water pumps with local farmers.',
    color: '#FFF3E0',
    iconColor: '#E65100',
    badge: 'Sharing Hub',
    highlights: ['Borrow & Lend', 'Panchayat search', 'Direct contact']
  },
]

const QUICK_BADGES = [
  { label: '🔬 Disease Diagnosis', path: '/disease' },
  { label: '💊 Treatment Plans', path: '/treatment' },
  { label: '🌱 Crop Advisory', path: '/crop' },
  { label: '⛅ Weather Alerts', path: '/weather' },
  { label: '📈 Live Market Prices', path: '/market' },
  { label: '🤖 AI Chat Assistant', path: '/assistant' },
  { label: '🏛️ Gov. Schemes', path: '/government' },
  { label: '🚜 Equipment Sharing', path: '/equipment' },
]

const STATS = [
  { label: 'Farming & AI Services', value: 8, icon: Bot },
  { label: 'Kerala Districts Covered', value: 14, icon: MapPin },
  { label: 'Supported Crops', value: 12, icon: Sprout },
  { label: 'Free for Farmers', value: 100, icon: Award },
]

const StatItem = ({ label, value, started, icon: Icon }: { label: string; value: number; started: boolean; icon: any }) => {
  const count = useCountUp(value, 1500, started)
  return (
    <div style={{
      textAlign: 'center',
      padding: '20px 16px',
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(10px)',
      borderRadius: 18,
      border: '1px solid rgba(255, 255, 255, 0.15)'
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px'
      }}>
        <Icon size={22} color="#FFE082" />
      </div>
      <div className="count-number" style={{ fontSize: '2.5rem', fontFamily: 'Poppins, sans-serif', fontWeight: 800, color: '#FFE082', lineHeight: 1 }}>
        {value === 100 ? `${count}%` : `${count}+`}
      </div>
      <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500, marginTop: 6 }}>{label}</div>
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
        background: 'linear-gradient(140deg, #052614 0%, #0F4522 35%, #196C37 70%, #258D49 100%)',
        padding: '88px 24px 80px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient Radial Lighting Overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(249,168,37,0.22) 0%, transparent 40%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 45%), radial-gradient(circle at 50% 50%, rgba(46,125,50,0.3) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Decorative Floating Subtle Particles */}
        <div style={{ position: 'absolute', top: '15%', left: '8%', opacity: 0.15, pointerEvents: 'none' }} className="animate-float">
          <Sprout size={72} color="#fff" />
        </div>
        <div style={{ position: 'absolute', bottom: '18%', right: '7%', opacity: 0.15, pointerEvents: 'none' }} className="animate-float">
          <Leaf size={80} color="#FFE082" />
        </div>

        <div style={{ maxWidth: 880, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="hero-glass-badge"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '8px 20px', borderRadius: 99,
              color: '#fff', fontSize: '0.88rem', fontWeight: 600, marginBottom: 24,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF50', boxShadow: '0 0 10px #4CAF50' }} />
            <Sparkles size={15} color="#FFE082" />
            <span>AI-Powered Agricultural Platform for Kerala Farmers</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ color: '#fff', fontSize: 'clamp(2.3rem, 5vw, 4rem)', marginBottom: 22, lineHeight: 1.15, fontWeight: 800, letterSpacing: '-0.02em' }}
          >
            Smart Farming Solutions <br />
            <span style={{
              background: 'linear-gradient(135deg, #FFE082 0%, #FFC107 60%, #FFD54F 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
              For Every Kerala Farmer
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ color: 'rgba(255,255,255,0.92)', fontSize: '1.125rem', marginBottom: 36, lineHeight: 1.75, maxWidth: 720, margin: '0 auto 36px', fontWeight: 400 }}
          >
            Comprehensive AI assistance for disease diagnosis, organic & chemical treatments, crop selection, hyper-local weather alerts, and daily market intelligence.
          </motion.p>

          {/* Quick Module Badges */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}
          >
            {QUICK_BADGES.map((b) => (
              <button
                key={b.label}
                onClick={() => navigate(b.path)}
                className="hero-quick-pill"
                style={{
                  padding: '8px 16px', borderRadius: 99,
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                {b.label}
              </button>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 44 }}
          >
            <button
              id="hero-cta-primary"
              onClick={() => document.getElementById('modules-section')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                padding: '16px 36px', fontSize: '1.05rem', fontWeight: 700, borderRadius: 14,
                background: 'linear-gradient(135deg, #FFB300 0%, #F57F17 100%)',
                color: '#211202', border: 'none', cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(245, 127, 23, 0.4)',
                display: 'inline-flex', alignItems: 'center', gap: 10,
                fontFamily: 'Poppins, sans-serif', transition: 'all 0.25s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0) scale(1)')}
            >
              Explore All AI Services <ArrowRight size={18} />
            </button>

            <button
              id="hero-cta-secondary"
              onClick={() => navigate('/market')}
              style={{
                padding: '16px 32px', fontSize: '1.05rem', fontWeight: 600, borderRadius: 14,
                border: '1.5px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.12)',
                color: '#fff', cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
                backdropFilter: 'blur(10px)', display: 'inline-flex', alignItems: 'center', gap: 8,
                transition: 'all 0.25s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            >
              📈 Live Kerala Markets
            </button>
          </motion.div>

          {/* Telemetry Strip */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12,
            background: 'rgba(0, 0, 0, 0.18)', backdropFilter: 'blur(12px)',
            borderRadius: 16, padding: '14px 20px', border: '1px solid rgba(255,255,255,0.15)'
          }}>
            {[
              { icon: MapPin, text: '14 Districts Synced' },
              { icon: Zap, text: 'Computer Vision AI' },
              { icon: ShieldCheck, text: 'Official Ecostat Data' },
              { icon: Bot, text: 'Malayalam Native Chat' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.9)', fontSize: '0.82rem', fontWeight: 500, justifyContent: 'center' }}>
                <Icon size={15} color="#FFE082" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Core AI Modules Grid ── */}
      <section id="modules-section" style={{ maxWidth: 1140, margin: '0 auto', padding: '72px 24px 56px' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 99, background: '#E8F5E9', color: '#1B5E20', fontSize: '0.8rem', fontWeight: 700, marginBottom: 12 }}
          >
            <Sparkles size={14} /> Comprehensive Farming Suite
          </motion.div>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '2.2rem', marginTop: 4, color: 'var(--color-text)', fontWeight: 800 }}>
            Eight Integrated Farming Services Built For Kerala Agriculture
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: 640, margin: '10px auto 0', fontSize: '1rem', lineHeight: 1.6 }}>
            Select any module to get instant real-time AI guidance tailored to your specific crop, district, and soil.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 28 }}>
          {MODULES.map(({ key, path, icon: Icon, title, tagline, desc, color, iconColor, badge, highlights }, i) => (
            <motion.div
              key={key}
              className="landing-module-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              onClick={() => navigate(path)}
              style={{ padding: 30, cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              id={`module-card-${key}`}
            >
              <div>
                {/* Header Icon + Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <motion.div
                    style={{
                      width: 56, height: 56, borderRadius: 18, background: color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 6px 16px ${color}`
                    }}
                    whileHover={{ scale: 1.1, rotate: 3 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Icon size={28} color={iconColor} />
                  </motion.div>
                  <span className="badge" style={{ background: color, color: iconColor, fontWeight: 700, fontSize: '0.78rem', padding: '4px 12px' }}>
                    {badge}
                  </span>
                </div>

                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: iconColor, textTransform: 'uppercase', letterSpacing: 0.9 }}>
                  {tagline}
                </span>

                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, margin: '6px 0 12px', fontSize: '1.25rem', color: 'var(--color-text)' }}>
                  {title}
                </h3>

                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.92rem', lineHeight: 1.65, margin: '0 0 18px' }}>
                  {desc}
                </p>

                {/* Sub-feature Pills */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {highlights.map((h) => (
                    <span key={h} style={{ fontSize: '0.72rem', fontWeight: 600, background: '#F4F7F4', color: '#2E7D32', padding: '3px 9px', borderRadius: 6, border: '1px solid #E0EBE0' }}>
                      ✓ {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Footer */}
              <div style={{
                marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                color: iconColor, fontSize: '0.88rem', fontWeight: 700
              }}>
                <span>Launch {title}</span>
                <ArrowRight size={18} />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 4. Module Spotlight Highlights ── */}
      <section style={{ background: 'linear-gradient(180deg, #F4F7F4 0%, #EBF3EB 100%)', padding: '72px 24px', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 1 }}>Deep Integration</span>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '2.1rem', marginTop: 4, color: 'var(--color-text)', fontWeight: 800 }}>
              Integrated Real-Time Agricultural Intelligence
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: 620, margin: '8px auto 0', fontSize: '0.95rem' }}>
              Combining computer vision, live meteorological feeds, peer-to-peer machinery sharing, and official Ecostat pricing data.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            <div className="card" style={{ padding: 28, background: '#fff', borderRadius: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FBE9E7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <TrendingUp size={22} color="#BF360C" />
              </div>
              <h4 style={{ margin: '0 0 10px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>Market Intelligence</h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                Directly connected to Kerala Government Ecostat daily commodity pricing API with AI district rankings and optimal selling window decisions.
              </p>
            </div>

            <div className="card" style={{ padding: 28, background: '#fff', borderRadius: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <CloudSun size={22} color="#1565C0" />
              </div>
              <h4 style={{ margin: '0 0 10px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>Farm Weather Alerts</h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                Live GPS weather forecasts analyzing rain chances, humidity, and wind speed to deliver exact irrigation and pesticide spraying windows.
              </p>
            </div>

            <div className="card" style={{ padding: 28, background: '#fff', borderRadius: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: '#F3E5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Sprout size={22} color="#7B1FA2" />
              </div>
              <h4 style={{ margin: '0 0 10px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>Location & Soil Advisor</h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                Recommends optimal crop options matched to your district, soil classification (Laterite, Alluvial, Red, Coastal), and irrigation system.
              </p>
            </div>

            <div className="card" style={{ padding: 28, background: '#fff', borderRadius: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FFF8E1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <FlaskConical size={22} color="#F57F17" />
              </div>
              <h4 style={{ margin: '0 0 10px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>Organic & Chemical Care</h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                Comprehensive treatment plans providing chemical fungicides/pesticides alongside eco-friendly organic remedies and exact spray dosages.
              </p>
            </div>

            <div className="card" style={{ padding: 28, background: '#fff', borderRadius: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Wrench size={22} color="#E65100" />
              </div>
              <h4 style={{ margin: '0 0 10px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>Equipment & Tool Sharing</h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                Community machinery sharing hub enabling Kerala farmers to borrow or lend tillers, sprayers, harvesters, and water pumps by panchayat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Key Advantages ── */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '72px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 1 }}>Empowering Farmers</span>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '2.1rem', marginTop: 4, color: 'var(--color-text)', fontWeight: 800 }}>
            Why Kerala Farmers Trust HexaKrishi
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 24 }}>
          {[
            { icon: MapPin, title: '100% Kerala Focused', desc: 'Customized for Kerala crops (Banana, Coconut, Paddy, Pepper, Rubber, Cardamom).' },
            { icon: Zap, title: 'Real-Time AI Processing', desc: 'Powered by advanced AI and Computer Vision models for instant responses.' },
            { icon: ShieldCheck, title: 'Verified Government Data', desc: 'Integrates official Ecostat market prices and live meteorological forecasts.' },
            { icon: CheckCircle2, title: 'Multilingual Support', desc: 'Available in Malayalam, English, Tamil, and Hindi.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{
              textAlign: 'center', padding: '28px 20px', borderRadius: 20,
              background: '#FAF7F0', border: '1.5px solid var(--color-border)',
              transition: 'transform 0.2s', cursor: 'default'
            }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 12px rgba(46,125,50,0.12)' }}>
                <Icon size={26} color="var(--color-primary)" />
              </div>
              <h4 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.05rem', fontWeight: 700, marginBottom: 8, color: 'var(--color-text)' }}>{title}</h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Stats Bar ── */}
      <section ref={statsRef} style={{
        background: 'linear-gradient(140deg, #092C1A 0%, #1B5E20 50%, #2E7D32 100%)',
        padding: '64px 24px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, position: 'relative', zIndex: 1 }}>
          {STATS.map(({ label, value, icon }) => (
            <StatItem key={label} label={label} value={value} started={statsVisible} icon={icon} />
          ))}
        </div>
      </section>

      {/* ── 7. Footer ── */}
      <footer style={{ background: '#09210E', color: 'rgba(255,255,255,0.78)', padding: '48px 24px 36px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
            <Sprout size={24} color="#4CAF50" />
            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#fff' }}>HexaKrishi AI</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 24, fontSize: '0.88rem' }}>
            {MODULES.map(({ path, title }) => (
              <a key={path} href={path} style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}>
                {title}
              </a>
            ))}
          </div>

          <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.8 }}>
            HexaKrishi AI · Built with ❤️ for Kerala Farmers · Version 2.0
          </p>
        </div>
      </footer>
    </PageTransition>
  )
}



