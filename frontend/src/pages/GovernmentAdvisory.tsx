import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import {
  ShieldCheck, TrendingUp, FileText, Bell, LayoutDashboard,
  ExternalLink, Phone, Calendar, Award, AlertTriangle,
  CheckCircle2, ChevronDown, ChevronUp, Landmark, BadgeIndianRupee,
} from 'lucide-react'
import { PageTransition } from '../components/shared/PageTransition'
import { SkeletonCard } from '../components/shared/SkeletonCard'
import { ErrorCard } from '../components/shared/ErrorCard'
import { getGovernmentAdvisory } from '../api/endpoints'
import type { GovernmentResponse, SchemeCard, LoanCard } from '../api/types'
import { CROPS, KERALA_DISTRICTS } from '../lib/constants'

// ── Constants ─────────────────────────────────────────────────────────────────

const GOV_TABS = [
  'gov_tab_overview',
  'gov_tab_schemes',
  'gov_tab_loans',
  'gov_tab_documents',
  'gov_tab_alerts',
] as const
type GovTab = typeof GOV_TABS[number]

const LAND_OWNERSHIPS = ['Owned', 'Leased', 'Tenant', 'Sharecropper'] as const
const FARMER_CATEGORIES = [
  'Marginal/Small (<5 acres)',
  'Medium',
  'Large',
  'Women Farmer',
  'SC/ST',
  'General',
] as const

const TAB_ICONS: Record<GovTab, React.ReactNode> = {
  gov_tab_overview: <LayoutDashboard size={14} />,
  gov_tab_schemes: <ShieldCheck size={14} />,
  gov_tab_loans: <Landmark size={14} />,
  gov_tab_documents: <FileText size={14} />,
  gov_tab_alerts: <Bell size={14} />,
}

// ── Financial Score Gauge ─────────────────────────────────────────────────────

const ScoreGauge = ({ score, level }: { score: number; level: string }) => {
  const color =
    level === 'High' ? '#2E7D32' :
    level === 'Medium' ? '#F57F17' : '#C62828'

  const circumference = 2 * Math.PI * 48
  const dash = (score / 100) * circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle cx="60" cy="60" r="48" fill="none" stroke="#E8E0D0" strokeWidth="10" />
          {/* Score arc */}
          <motion.circle
            cx="60" cy="60" r="48"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - dash }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.6rem', color, lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>/ 100</span>
        </div>
      </div>
      <span
        className={`badge ${level === 'High' ? 'badge-green' : level === 'Medium' ? 'badge-amber' : 'badge-red'}`}
        style={{ fontSize: '0.8rem' }}
      >
        {level} Strength
      </span>
    </div>
  )
}

// ── Scheme Card Component ─────────────────────────────────────────────────────

const SchemeCardUI = ({ scheme, index, isBest }: {
  scheme: SchemeCard
  index: number
  isBest?: boolean
}) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      className="card card-hover"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      style={{
        border: isBest ? '2px solid var(--color-primary)' : undefined,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isBest && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          background: 'var(--color-primary)', color: '#fff',
          padding: '3px 12px', fontSize: '0.7rem', fontWeight: 700,
          borderBottomLeftRadius: 8,
        }}>
          ⭐ BEST MATCH
        </div>
      )}

      <div style={{ padding: '20px 20px 0' }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {scheme.state && (
            <span className={`badge ${scheme.state === 'Kerala' ? 'badge-green' : 'badge-blue'}`}>
              {scheme.state}
            </span>
          )}
          {scheme.deadline && (
            <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
              <Calendar size={9} /> {scheme.deadline}
            </span>
          )}
        </div>

        <h3 style={{
          fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.95rem',
          marginBottom: 8, lineHeight: 1.4,
        }}>
          {scheme.scheme_name}
        </h3>

        {/* Benefits highlight */}
        <div style={{
          background: 'linear-gradient(135deg, #E8F5E9, #F1F8E9)',
          borderRadius: 8, padding: '10px 12px', marginBottom: 12,
          border: '1px solid #C8E6C9',
        }}>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#1B5E20', fontWeight: 500, lineHeight: 1.5 }}>
            💰 {scheme.benefits}
          </p>
        </div>

        {/* AI reason if available */}
        {scheme.reason && (
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', marginBottom: 12 }}>
            🤖 {scheme.reason}
          </p>
        )}
      </div>

      {/* Expand/Collapse toggle */}
      <button
        id={`scheme-expand-${scheme.scheme_id}`}
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', padding: '10px 20px',
          background: '#F5F0E8', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)',
        }}
      >
        {expanded ? 'Hide Details' : 'Show Details'}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {scheme.eligibility && (
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.78rem', marginBottom: 4, color: 'var(--color-text-secondary)' }}>
                    Eligibility
                  </p>
                  <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5 }}>{scheme.eligibility}</p>
                </div>
              )}

              {scheme.helpline && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
                  <Phone size={13} color="var(--color-primary)" />
                  <span style={{ fontWeight: 600 }}>{t('gov_helpline')}:</span>
                  <span>{scheme.helpline}</span>
                </div>
              )}

              {/* Apply Now CTA */}
              <a
                id={`scheme-apply-${scheme.scheme_id}`}
                href={scheme.official_apply_link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ textDecoration: 'none', justifyContent: 'center', marginTop: 4, fontSize: '0.85rem' }}
              >
                <ExternalLink size={14} />
                {t('gov_apply_now')}
              </a>
              <a
                href={scheme.official_website}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textAlign: 'center', textDecoration: 'underline' }}
              >
                {t('gov_official_source')}: {scheme.official_website}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Loan Card Component ───────────────────────────────────────────────────────

const LoanCardUI = ({ loan, index, isBest }: {
  loan: LoanCard
  index: number
  isBest?: boolean
}) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  const riskColor =
    loan.risk_level === 'Low' ? 'badge-green' :
    loan.risk_level === 'Medium' ? 'badge-amber' : 'badge-red'

  return (
    <motion.div
      className="card card-hover"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      style={{
        border: isBest ? '2px solid #1565C0' : undefined,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isBest && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          background: '#1565C0', color: '#fff',
          padding: '3px 12px', fontSize: '0.7rem', fontWeight: 700,
          borderBottomLeftRadius: 8,
        }}>
          ⭐ BEST RATE
        </div>
      )}

      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <span className={`badge ${riskColor}`}>{loan.risk_level} Risk</span>
        </div>
        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.95rem', marginBottom: 8, lineHeight: 1.4 }}>
          {loan.loan_name}
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 10 }}>
          🏦 {loan.bank_organization}
        </p>

        {/* Key stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Max Amount', val: loan.maximum_amount },
            { label: 'Interest Rate', val: loan.interest_rate },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: '#E3F2FD', borderRadius: 8, padding: '10px 12px' }}>
              <p style={{ margin: 0, fontSize: '0.67rem', color: '#0D47A1', fontWeight: 600 }}>{label}</p>
              <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '0.8rem', color: '#1565C0', lineHeight: 1.3 }}>{val}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        id={`loan-expand-${loan.loan_id}`}
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', padding: '10px 20px',
          background: '#F5F0E8', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)',
        }}
      >
        {expanded ? 'Hide Details' : 'Show Details'}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(loan.repayment_details || loan.repayment) && (
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.78rem', marginBottom: 4, color: 'var(--color-text-secondary)' }}>
                    Repayment
                  </p>
                  <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5 }}>
                    {loan.repayment_details ?? loan.repayment}
                  </p>
                </div>
              )}
              <a
                id={`loan-apply-${loan.loan_id}`}
                href={loan.official_apply_link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{
                  background: '#1565C0', color: '#fff',
                  textDecoration: 'none', justifyContent: 'center',
                  fontSize: '0.85rem', borderRadius: 10,
                }}
              >
                <ExternalLink size={14} />
                {t('gov_apply_now')}
              </a>
              <a
                href={loan.official_website}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.75rem', color: '#1565C0', textAlign: 'center', textDecoration: 'underline' }}
              >
                {t('gov_official_source')}: {loan.official_website}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Freshness Badge ───────────────────────────────────────────────────────────

const FreshnessBadge = ({ freshness }: { freshness?: GovernmentResponse['data_freshness'] }) => {
  if (!freshness) return null
  const isStale = (freshness as any)?.sources_stale > 0
  const newestTs = (freshness as any)?.newest_verified
  const dateStr = newestTs
    ? new Date(newestTs).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Unknown'

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: isStale ? '#FFF8E1' : '#E8F5E9',
      border: `1px solid ${isStale ? '#FFE082' : '#C8E6C9'}`,
      borderRadius: 999, padding: '4px 12px', fontSize: '0.75rem',
    }}>
      {isStale
        ? <AlertTriangle size={12} color="#F57F17" />
        : <CheckCircle2 size={12} color="#2E7D32" />}
      <span style={{ fontWeight: 600, color: isStale ? '#E65100' : '#1B5E20' }}>
        Data verified: {dateStr}
      </span>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export const GovernmentAdvisory = () => {
  const { t } = useTranslation()

  // Form state
  const [district, setDistrict] = useState('')
  const [crop, setCrop] = useState('')
  const [landArea, setLandArea] = useState('')
  const [landOwnership, setLandOwnership] = useState('')
  const [farmerCategory, setFarmerCategory] = useState('')
  const [annualIncome, setAnnualIncome] = useState('')
  const [loanRequired, setLoanRequired] = useState('Yes')
  const [currentLoan, setCurrentLoan] = useState('')

  const [result, setResult] = useState<GovernmentResponse | null>(null)
  const [activeTab, setActiveTab] = useState<GovTab>('gov_tab_overview')
  const [checkedDocs, setCheckedDocs] = useState<Set<string>>(new Set())

  const isFormValid = district && crop && landArea && landOwnership && farmerCategory && annualIncome

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: () => getGovernmentAdvisory({
      district,
      crop,
      land_area: parseFloat(landArea),
      land_ownership: landOwnership,
      farmer_category: farmerCategory,
      annual_income: parseFloat(annualIncome),
      loan_required: loanRequired,
      current_loan: currentLoan || 'None',
    }),
    onSuccess: (data) => {
      setResult(data)
      setActiveTab('gov_tab_overview')
      setCheckedDocs(new Set())
    },
  })

  const toggleDoc = (doc: string) => {
    setCheckedDocs(prev => {
      const next = new Set(prev)
      next.has(doc) ? next.delete(doc) : next.add(doc)
      return next
    })
  }

  const scoreBg =
    result?.financial_score_level === 'High'
      ? 'linear-gradient(135deg, #1B5E20, #2E7D32)'
      : result?.financial_score_level === 'Medium'
      ? 'linear-gradient(135deg, #E65100, #F57F17)'
      : 'linear-gradient(135deg, #B71C1C, #C62828)'

  return (
    <PageTransition>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: 'Poppins, sans-serif', fontSize: '1.8rem',
            color: 'var(--color-primary)', marginBottom: 6,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            🏛️ {t('gov_title')}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>{t('gov_desc')}</p>
        </div>

        {/* ── Input Form Card ── */}
        <div className="card" style={{ padding: 24, marginBottom: 28 }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem', marginBottom: 4 }}>
              {t('gov_form_title')}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              {t('gov_form_subtitle')}
            </p>
          </div>

          {/* Row 1: District + Crop */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.875rem' }}>
                {t('gov_district')}
              </label>
              <select id="gov-district" className="form-select" value={district} onChange={e => setDistrict(e.target.value)}>
                <option value="">— Select District —</option>
                {KERALA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.875rem' }}>
                {t('gov_crop')}
              </label>
              <select id="gov-crop" className="form-select" value={crop} onChange={e => setCrop(e.target.value)}>
                <option value="">— Select Crop —</option>
                {CROPS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Land Area + Land Ownership */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.875rem' }}>
                {t('gov_land_area')}
              </label>
              <input
                id="gov-land-area"
                type="number"
                min="0.1"
                step="0.1"
                className="form-input"
                placeholder="e.g. 2.5"
                value={landArea}
                onChange={e => setLandArea(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.875rem' }}>
                {t('gov_land_ownership')}
              </label>
              <select id="gov-land-ownership" className="form-select" value={landOwnership} onChange={e => setLandOwnership(e.target.value)}>
                <option value="">— Select —</option>
                {LAND_OWNERSHIPS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3: Farmer Category + Annual Income */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.875rem' }}>
                {t('gov_farmer_category')}
              </label>
              <select id="gov-farmer-category" className="form-select" value={farmerCategory} onChange={e => setFarmerCategory(e.target.value)}>
                <option value="">— Select Category —</option>
                {FARMER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.875rem' }}>
                {t('gov_annual_income')}
              </label>
              <input
                id="gov-annual-income"
                type="number"
                min="0"
                step="1000"
                className="form-input"
                placeholder="e.g. 120000"
                value={annualIncome}
                onChange={e => setAnnualIncome(e.target.value)}
              />
            </div>
          </div>

          {/* Row 4: Loan Required + Current Loan */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.875rem' }}>
                {t('gov_loan_required')}
              </label>
              <select id="gov-loan-required" className="form-select" value={loanRequired} onChange={e => setLoanRequired(e.target.value)}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.875rem' }}>
                {t('gov_current_loan')}
              </label>
              <input
                id="gov-current-loan"
                type="text"
                className="form-input"
                placeholder="e.g. KCC loan of ₹1,00,000 from Kerala Bank"
                value={currentLoan}
                onChange={e => setCurrentLoan(e.target.value)}
              />
            </div>
          </div>

          <button
            id="gov-submit-btn"
            className="btn btn-primary"
            disabled={!isFormValid || isPending}
            onClick={() => { reset(); mutate() }}
            style={{ width: '100%', padding: '13px', fontSize: '1rem' }}
          >
            {isPending ? `⚙️ ${t('gov_submitting')}` : `🏛️ ${t('gov_submit_btn')}`}
          </button>
        </div>

        {/* Loading */}
        {isPending && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SkeletonCard rows={3} />
            <SkeletonCard rows={5} />
          </div>
        )}

        {/* Error */}
        {error && <ErrorCard message={(error as Error).message} onRetry={() => mutate()} />}

        {/* ── Results ── */}
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            {/* Hero Score Banner */}
            <div style={{
              background: scoreBg,
              borderRadius: 16, padding: '24px', marginBottom: 24, color: '#fff',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, opacity: 0.8, fontSize: '0.85rem', marginBottom: 4 }}>
                    {t('gov_financial_score')}
                  </p>
                  <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.2rem', margin: '0 0 6px' }}>
                    {result.financial_score_level === 'High' ? t('gov_score_high') :
                     result.financial_score_level === 'Medium' ? t('gov_score_medium') : t('gov_score_low')}
                  </h2>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', opacity: 0.85, fontSize: '0.82rem', marginBottom: 8 }}>
                    <span>📍 {result.profile_summary.district}</span>
                    <span>🌾 {result.profile_summary.crop}</span>
                    <span>📐 {result.profile_summary.land_area}</span>
                    <span>💰 {result.profile_summary.income}</span>
                  </div>
                  <FreshnessBadge freshness={result.data_freshness} />
                </div>
                <ScoreGauge score={result.financial_score} level={result.financial_score_level} />
              </div>
            </div>

            {/* Tab Bar */}
            <div className="tab-bar" style={{ marginBottom: 20 }}>
              {GOV_TABS.map(tab => (
                <button
                  key={tab}
                  id={`gov-tab-${tab}`}
                  className={`tab-item${activeTab === tab ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                  style={{ position: 'relative' }}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="gov-pill"
                      style={{
                        position: 'absolute', inset: 0,
                        background: 'var(--color-primary)',
                        borderRadius: 9, zIndex: 0,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  )}
                  <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {TAB_ICONS[tab]} {t(tab)}
                  </span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
              >

                {/* ══ TAB: OVERVIEW ══ */}
                {activeTab === 'gov_tab_overview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* AI Explanation */}
                    {result.ai_explanation && (
                      <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, #F3E5F5, #F8F0FF)', border: '1px solid #CE93D8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <Award size={18} color="#7B1FA2" />
                          <span style={{ fontWeight: 700, color: '#7B1FA2', fontSize: '0.9rem' }}>{t('gov_ai_explanation')}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {result.ai_explanation.why_best_scheme && (
                            <div>
                              <p style={{ fontWeight: 600, fontSize: '0.78rem', marginBottom: 4, color: '#4A148C' }}>Best Scheme Reason</p>
                              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6, color: '#311B92' }}>{result.ai_explanation.why_best_scheme}</p>
                            </div>
                          )}
                          {result.ai_explanation.financial_benefit_breakdown && (
                            <div>
                              <p style={{ fontWeight: 600, fontSize: '0.78rem', marginBottom: 4, color: '#4A148C' }}>Financial Benefit</p>
                              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6, color: '#311B92' }}>{result.ai_explanation.financial_benefit_breakdown}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Best Scheme + Best Loan side-by-side */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                      {result.best_scheme?.scheme_name && (
                        <div className="card" style={{ padding: 20, border: '2px solid var(--color-primary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <ShieldCheck size={18} color="var(--color-primary)" />
                            <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.9rem' }}>{t('gov_best_scheme')}</span>
                          </div>
                          <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.95rem', marginBottom: 8, lineHeight: 1.4 }}>
                            {result.best_scheme.scheme_name}
                          </h3>
                          <p style={{ fontSize: '0.82rem', color: '#1B5E20', fontWeight: 500, marginBottom: 12 }}>
                            💰 {result.best_scheme.benefits}
                          </p>
                          <a
                            id="gov-best-scheme-apply"
                            href={result.best_scheme.official_apply_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ textDecoration: 'none', fontSize: '0.82rem', justifyContent: 'center' }}
                          >
                            <ExternalLink size={13} /> {t('gov_apply_now')}
                          </a>
                        </div>
                      )}

                      {result.best_loan?.loan_name && (
                        <div className="card" style={{ padding: 20, border: '2px solid #1565C0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <Landmark size={18} color="#1565C0" />
                            <span style={{ fontWeight: 700, color: '#1565C0', fontSize: '0.9rem' }}>{t('gov_best_loan')}</span>
                          </div>
                          <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.95rem', marginBottom: 6, lineHeight: 1.4 }}>
                            {result.best_loan.loan_name}
                          </h3>
                          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                            🏦 {result.best_loan.bank_organization}
                          </p>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                            <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
                              <BadgeIndianRupee size={10} /> {result.best_loan.maximum_amount}
                            </span>
                            <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
                              {result.best_loan.interest_rate}
                            </span>
                          </div>
                          <a
                            id="gov-best-loan-apply"
                            href={result.best_loan.official_apply_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn"
                            style={{
                              background: '#1565C0', color: '#fff',
                              textDecoration: 'none', fontSize: '0.82rem',
                              justifyContent: 'center', borderRadius: 10,
                            }}
                          >
                            <ExternalLink size={13} /> {t('gov_apply_now')}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Next Steps */}
                    {result.next_steps?.length > 0 && (
                      <div className="card" style={{ padding: 20 }}>
                        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1rem', marginBottom: 14, color: 'var(--color-primary)' }}>
                          📋 {t('gov_next_steps')}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {result.next_steps.map((step, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.08 }}
                              style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}
                            >
                              <div style={{
                                minWidth: 24, height: 24, borderRadius: '50%',
                                background: 'var(--color-primary)', color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '0.75rem', flexShrink: 0, marginTop: 1,
                              }}>
                                {i + 1}
                              </div>
                              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6 }}>{step}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ══ TAB: SCHEMES ══ */}
                {activeTab === 'gov_tab_schemes' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                      {result.eligible_schemes.length} eligible scheme{result.eligible_schemes.length !== 1 ? 's' : ''} found for your profile
                    </p>
                    {result.eligible_schemes.length === 0 ? (
                      <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        {t('gov_no_schemes')}
                      </div>
                    ) : (
                      result.eligible_schemes.map((s, i) => (
                        <SchemeCardUI
                          key={s.scheme_id}
                          scheme={s}
                          index={i}
                          isBest={s.scheme_id === result.best_scheme?.scheme_id}
                        />
                      ))
                    )}
                  </div>
                )}

                {/* ══ TAB: LOANS ══ */}
                {activeTab === 'gov_tab_loans' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                      {result.loan_options.length} loan option{result.loan_options.length !== 1 ? 's' : ''} available
                    </p>
                    {result.ai_explanation?.why_best_loan && (
                      <div className="card" style={{ padding: 16, background: '#EDE7F6', border: '1px solid #B39DDB' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#311B92', lineHeight: 1.6 }}>
                          🤖 <strong>AI Recommendation:</strong> {result.ai_explanation.why_best_loan}
                        </p>
                      </div>
                    )}
                    {result.loan_options.length === 0 ? (
                      <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        {t('gov_no_loans')}
                      </div>
                    ) : (
                      result.loan_options.map((l, i) => (
                        <LoanCardUI
                          key={l.loan_id}
                          loan={l}
                          index={i}
                          isBest={l.loan_id === result.best_loan?.loan_id}
                        />
                      ))
                    )}
                  </div>
                )}

                {/* ══ TAB: DOCUMENTS ══ */}
                {activeTab === 'gov_tab_documents' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="card" style={{ padding: 20 }}>
                      <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1rem', marginBottom: 8 }}>
                        📄 Required Documents Checklist
                      </h3>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem', marginBottom: 16 }}>
                        {t('gov_documents_note')}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {result.documents_required.map((doc, i) => {
                          const isChecked = checkedDocs.has(doc)
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.06 }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '12px 16px', borderRadius: 10,
                                background: isChecked ? '#E8F5E9' : '#F5F0E8',
                                border: `1px solid ${isChecked ? '#C8E6C9' : 'var(--color-border)'}`,
                                cursor: 'pointer',
                                transition: 'all 200ms',
                              }}
                              onClick={() => toggleDoc(doc)}
                            >
                              <div style={{
                                width: 22, height: 22, borderRadius: 6,
                                border: `2px solid ${isChecked ? '#2E7D32' : 'var(--color-border)'}`,
                                background: isChecked ? '#2E7D32' : '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                              }}>
                                {isChecked && <CheckCircle2 size={14} color="#fff" />}
                              </div>
                              <span style={{
                                fontSize: '0.88rem', fontWeight: 500,
                                textDecoration: isChecked ? 'line-through' : 'none',
                                color: isChecked ? 'var(--color-text-secondary)' : 'var(--color-text)',
                              }}>
                                {doc}
                              </span>
                            </motion.div>
                          )
                        })}
                      </div>
                      {checkedDocs.size > 0 && (
                        <div style={{
                          marginTop: 16, padding: '10px 16px',
                          background: '#E8F5E9', borderRadius: 8,
                          fontSize: '0.82rem', color: '#1B5E20', fontWeight: 600,
                        }}>
                          ✅ {checkedDocs.size} of {result.documents_required.length} documents gathered
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ══ TAB: ALERTS ══ */}
                {activeTab === 'gov_tab_alerts' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {result.government_alerts.map((alert, i) => (
                      <motion.div
                        key={i}
                        className="card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        style={{
                          padding: 18,
                          borderLeft: '4px solid var(--color-warning)',
                          background: '#FFF8E1',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <AlertTriangle size={16} color="#F57F17" style={{ flexShrink: 0, marginTop: 2 }} />
                          <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6 }}>{alert}</p>
                        </div>
                      </motion.div>
                    ))}
                    {result.government_alerts.length === 0 && (
                      <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        No alerts at this time.
                      </div>
                    )}

                    {/* Other schemes note */}
                    {result.ai_explanation?.other_schemes_note && (
                      <div className="card" style={{ padding: 18, background: '#E3F2FD', border: '1px solid #90CAF9' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#0D47A1', lineHeight: 1.6 }}>
                          ℹ️ {result.ai_explanation.other_schemes_note}
                        </p>
                      </div>
                    )}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </PageTransition>
  )
}
