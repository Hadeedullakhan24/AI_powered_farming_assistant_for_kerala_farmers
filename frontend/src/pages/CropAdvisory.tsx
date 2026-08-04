import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, AlertTriangle, Trophy } from 'lucide-react'
import { PageTransition } from '../components/shared/PageTransition'
import { LocationPicker } from '../components/shared/LocationPicker'
import type { LocationPickerData } from '../components/shared/LocationPicker'
import { ConfidenceRing } from '../components/shared/ConfidenceRing'
import { SkeletonGrid } from '../components/shared/SkeletonCard'
import { ErrorCard } from '../components/shared/ErrorCard'
import { getCropAdvisory } from '../api/endpoints'
import type { CropAdvisoryResponse, RecommendedCrop } from '../api/types'
import { SOIL_TYPES, IRRIGATION_TYPES } from '../lib/constants'

const CropCard = ({ crop, index }: { crop: RecommendedCrop; index: number }) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  const INFO_FIELDS = [
    { key: 'crop_sow_time',  val: crop.best_sowing_time },
    { key: 'crop_duration',  val: crop.crop_duration },
    { key: 'crop_water',     val: crop.water_requirement },
    { key: 'crop_yield',     val: crop.expected_yield },
    { key: 'crop_demand',    val: crop.market_demand },
    { key: 'crop_profit',    val: crop.profitability },
  ]

  return (
    <motion.div className="card" style={{ minWidth: 280, maxWidth: 320, flexShrink: 0, overflow: 'hidden' }}
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}>
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>#{crop.rank}</span>
          <ConfidenceRing value={crop.confidence} size={64} strokeWidth={6} />
        </div>
        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, marginBottom: 10, textTransform: 'capitalize', fontSize: '1.1rem' }}>
          {crop.name}
        </h3>
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>{t('crop_suitability')}</span>
            <span style={{ fontWeight: 600 }}>{crop.suitability_score}%</span>
          </div>
          <div className="progress-track" style={{ height: 8 }}>
            <motion.div className="progress-fill"
              style={{ background: 'var(--color-primary)', height: '100%' }}
              initial={{ width: 0 }}
              animate={{ width: `${crop.suitability_score}%` }}
              transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
            />
          </div>
        </div>
      </div>

      <button id={`expand-crop-${index}`} onClick={() => setExpanded(!expanded)}
        style={{ width: '100%', padding: '12px 20px', background: '#F5F0E8', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)' }}>
        {expanded ? 'Hide Details' : 'Show Details'}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {crop.why_recommended.length > 0 && (
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 6 }}>{t('crop_why')}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {crop.why_recommended.map((w, i) => <span key={i} className="badge badge-green" style={{ fontSize: '0.7rem' }}>{w}</span>)}
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {INFO_FIELDS.map(({ key, val }) => (
                  <div key={key} style={{ background: '#F5F0E8', borderRadius: 8, padding: '8px 10px' }}>
                    <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{t(key)}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', fontWeight: 600 }}>{val}</p>
                  </div>
                ))}
              </div>
              {crop.possible_risks.length > 0 && (
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 6 }}>{t('crop_risks')}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {crop.possible_risks.map((r, i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem' }} className="badge badge-red">
                        <AlertTriangle size={10} />{r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export const CropAdvisory = () => {
  const { t } = useTranslation()
  const [location, setLocation] = useState<LocationPickerData | null>(null)
  const [soil, setSoil] = useState('')
  const [irrigation, setIrrigation] = useState('')
  const [result, setResult] = useState<CropAdvisoryResponse | null>(null)
  // Store the display name the user actually selected so we show it in results
  const [submittedPlaceName, setSubmittedPlaceName] = useState<string>('')

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: () => getCropAdvisory({
      latitude: location!.lat, longitude: location!.lng, soil_type: soil, irrigation,
    }),
    onSuccess: (data) => setResult(data),
  })

  const handleSubmit = () => {
    reset()
    setSubmittedPlaceName(location?.placeName ?? '')
    mutate()
  }

  return (
    <PageTransition>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.8rem', color: 'var(--color-primary)', marginBottom: 6 }}>
            🌱 {t('crop_title')}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>{t('crop_desc')}</p>
        </div>

        {/* Input card */}
        <div className="card" style={{ padding: 24, marginBottom: 28 }}>
          <LocationPicker onLocationChange={setLocation} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.875rem' }}>{t('crop_select_soil')}</label>
              <select id="soil-select" className="form-select" value={soil} onChange={(e) => setSoil(e.target.value)}>
                <option value="">— {t('crop_select_soil')} —</option>
                {SOIL_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.875rem' }}>{t('crop_select_irrigation')}</label>
              <select id="irrigation-select" className="form-select" value={irrigation} onChange={(e) => setIrrigation(e.target.value)}>
                <option value="">— {t('crop_select_irrigation')} —</option>
                {IRRIGATION_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button id="get-crop-btn" className="btn btn-primary" disabled={!location || !soil || !irrigation || isPending}
            onClick={handleSubmit}
            style={{ width: '100%', padding: '13px', fontSize: '1rem', marginTop: 16 }}>
            {isPending ? '⚙️ Analyzing...' : `🌿 ${t('crop_get_btn')}`}
          </button>
        </div>

        {isPending && <SkeletonGrid count={4} />}
        {error && <ErrorCard message={(error as Error).message} onRetry={() => mutate()} />}

        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Summary + Best crop */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 28 }}>
              <div className="card" style={{ padding: 24 }}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>📍 {submittedPlaceName || result.location}</p>
                <p style={{ lineHeight: 1.7, fontSize: '0.9rem' }}>{result.summary}</p>
              </div>
              <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, #FFF8E1, #FFFDE7)', border: '2px solid #F9A825' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Trophy size={18} color="#F57F17" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#F57F17' }}>{t('crop_top_rec')}</span>
                </div>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.6rem', textTransform: 'capitalize', marginBottom: 8 }}>{result.best_crop.name}</h2>
                <ConfidenceRing value={result.best_crop.confidence} size={72} />
                <p style={{ marginTop: 10, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{result.best_crop.reason}</p>
              </div>
            </div>

            {/* Ranked crop cards */}
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.2rem', marginBottom: 16 }}>Recommended Crops</h2>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x mandatory' }}>
              {result.recommended_crops.map((crop, i) => (
                <div key={i} style={{ scrollSnapAlign: 'start' }}>
                  <CropCard crop={crop} index={i} />
                </div>
              ))}
            </div>

            {/* Not recommended strip */}
            {result.not_recommended.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.95rem', color: 'var(--color-text-secondary)', marginBottom: 10 }}>{t('crop_not_rec')}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {result.not_recommended.map((c, i) => (
                    <div key={i} title={c.reason} style={{ padding: '6px 14px', background: '#F5F5F5', borderRadius: 99, fontSize: '0.8rem', color: '#9E9E9E', cursor: 'default', border: '1px solid #E0E0E0' }}>
                      {c.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </PageTransition>
  )
}
