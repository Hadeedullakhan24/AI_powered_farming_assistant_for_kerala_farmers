import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle, CheckCircle, Pill, FlaskConical, Leaf, Ruler, ArrowLeft
} from 'lucide-react'
import { PageTransition } from '../components/shared/PageTransition'
import { SkeletonCard } from '../components/shared/SkeletonCard'
import { ErrorCard } from '../components/shared/ErrorCard'
import { getTreatment } from '../api/endpoints'
import { formatDiseaseName, parseDoesage } from '../lib/utils'
import { CROP_EMOJIS } from '../lib/constants'

const TABS = [
  { key: 'treatment_tab_symptoms',   field: 'symptoms',           icon: AlertTriangle, color: '#F57F17' },
  { key: 'treatment_tab_chemical',   field: 'chemical_treatment', icon: Pill,          color: '#0D47A1' },
  { key: 'treatment_tab_organic',    field: 'organic_treatment',  icon: Leaf,          color: '#2E7D32' },
  { key: 'treatment_tab_dosage',     field: 'dosage',             icon: Ruler,         color: '#6A1B9A' },
  { key: 'treatment_tab_prevention', field: 'prevention',         icon: CheckCircle,   color: '#00695C' },
  { key: 'treatment_tab_precautions',field: 'precautions',        icon: AlertTriangle, color: '#C62828' },
] as const

type TabField = typeof TABS[number]['field']

export const TreatmentRecommendation = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = location.state as { crop?: string; disease?: string } | null
  const [activeTab, setActiveTab] = useState<TabField>('symptoms')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['treatment', routeState?.crop, routeState?.disease],
    queryFn: () => getTreatment({ crop: routeState?.crop, disease: routeState?.disease }),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const tabData = data ? (data[activeTab] as string[]) : []
  const activeTabMeta = TABS.find((t) => t.field === activeTab)!

  return (
    <PageTransition>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        {/* Back */}
        <button id="back-to-disease-btn" onClick={() => navigate('/disease')} className="btn btn-outline" style={{ marginBottom: 20, padding: '7px 14px', fontSize: '0.85rem' }}>
          <ArrowLeft size={14} /> Back to Detection
        </button>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.8rem', color: 'var(--color-primary)', marginBottom: 6 }}>
            💊 {t('treatment_title')}
          </h1>
          {(routeState?.crop || data) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.5rem' }}>{CROP_EMOJIS[routeState?.crop ?? data?.crop ?? ''] ?? '🌱'}</span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', textTransform: 'capitalize' }}>
                  {routeState?.crop ?? data?.crop}
                </p>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  {formatDiseaseName(routeState?.disease ?? data?.disease ?? '')}
                </p>
              </div>
            </div>
          )}
        </div>

        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SkeletonCard rows={3} />
            <SkeletonCard rows={6} />
          </div>
        )}

        {error && <ErrorCard message={(error as Error).message} onRetry={refetch} />}

        {data && (
          <div className="card" style={{ overflow: 'hidden' }}>
            {/* Overview always visible */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', background: '#F9FBF9' }}>
              <p style={{ margin: 0, color: 'var(--color-text)', lineHeight: 1.7, fontSize: '0.9rem' }}>
                {data.overview}
              </p>
            </div>

            {/* Badge groups */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {data.chemical_treatment.slice(0, 3).map((c) => (
                <span key={c} className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                  <Pill size={10} /> {c.split(' ')[0]}
                </span>
              ))}
              {data.organic_treatment.slice(0, 3).map((c) => (
                <span key={c} className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                  <Leaf size={10} /> {c.split(' ')[0]}
                </span>
              ))}
            </div>

            {/* Tab Bar */}
            <div style={{ padding: '12px 24px 0', background: '#fff' }}>
              <div className="tab-bar">
                {TABS.map(({ key, field, icon: Icon, color }) => (
                  <button key={field} id={`tab-${field}`}
                    className={`tab-item${activeTab === field ? ' active' : ''}`}
                    onClick={() => setActiveTab(field)}
                    style={{ position: 'relative' }}
                  >
                    {activeTab === field && (
                      <motion.div layoutId="treatment-tab-pill"
                        style={{ position: 'absolute', inset: 0, background: 'var(--color-primary)', borderRadius: 9, zIndex: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      />
                    )}
                    <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Icon size={13} color={activeTab === field ? '#fff' : color} />
                      {t(key)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                style={{ padding: '24px' }}
              >
                {activeTab === 'dosage' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {data.dosage.map((d, i) => {
                      const { name, amount } = parseDoesage(d)
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#F5F0E8', borderRadius: 10 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>{name}</span>
                          {amount && <span className="badge badge-amber">{amount}</span>}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {tabData.map((item, i) => (
                      <motion.li key={i}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 14px', background: '#FDFAF4', borderRadius: 10 }}
                      >
                        <activeTabMeta.icon size={16} color={activeTabMeta.color} style={{ marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text)' }}>{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
