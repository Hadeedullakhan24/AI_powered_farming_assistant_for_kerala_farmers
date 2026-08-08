import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, AlertTriangle, Trophy, ShieldAlert, Search, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { PageTransition } from '../components/shared/PageTransition'
import { LocationPicker } from '../components/shared/LocationPicker'
import type { LocationPickerData } from '../components/shared/LocationPicker'
import { ConfidenceRing } from '../components/shared/ConfidenceRing'
import { SkeletonGrid } from '../components/shared/SkeletonCard'
import { ErrorCard } from '../components/shared/ErrorCard'
import { getCropAdvisory, getCropDiseaseIntelligence } from '../api/endpoints'
import type { CropAdvisoryResponse, RecommendedCrop, DiseaseIntelligenceResponse } from '../api/types'
import { SOIL_TYPES, IRRIGATION_TYPES } from '../lib/constants'

const RISK_NUMERIC_MAP: Record<string, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
}

const RISK_COLOR_MAP: Record<string, string> = {
  High: '#D32F2F',
  Medium: '#F57C00',
  Low: '#388E3C',
}

const RegionalDiseaseSection = ({
  locationName,
  recommendedCrops,
}: {
  locationName: string
  recommendedCrops: RecommendedCrop[]
}) => {
  const navigate = useNavigate()
  const cropList = recommendedCrops.map((c) => c.name || c.crop || 'Crop')
  const [selectedCrop, setSelectedCrop] = useState<string>(cropList[0] || 'Black Pepper')
  const [data, setData] = useState<DiseaseIntelligenceResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedCrop || !locationName) return
    let isSubscribed = true
    setLoading(true)
    getCropDiseaseIntelligence({ location: locationName, crop: selectedCrop })
      .then((res) => {
        if (isSubscribed) setData(res)
      })
      .catch((err) => console.warn('[DiseaseIntelligence] Error:', err))
      .finally(() => {
        if (isSubscribed) setLoading(false)
      })
    return () => {
      isSubscribed = false
    }
  }, [selectedCrop, locationName])

  if (!recommendedCrops || recommendedCrops.length === 0) return null

  const chartData = (data?.diseases || []).map((d) => ({
    name: d.name.length > 22 ? d.name.slice(0, 20) + '...' : d.name,
    fullName: d.name,
    riskLevel: d.risk_level,
    riskValue: RISK_NUMERIC_MAP[d.risk_level] || 2,
  }))

  return (
    <div className="card" style={{ padding: 24, marginTop: 32, background: '#FAF7F2' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.4rem', color: 'var(--color-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            🦠 Regional Disease Intelligence
          </h2>
          <span className="badge badge-gold" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
            {selectedCrop} • {locationName}
          </span>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: 6, marginBottom: 0 }}>
          Diseases commonly associated with this crop and region in Kerala
        </p>
      </div>

      {/* Crop Selector Tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 20 }}>
        {cropList.map((cropName) => (
          <button
            key={cropName}
            type="button"
            onClick={() => setSelectedCrop(cropName)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: '0.8rem',
              fontWeight: 600,
              border: selectedCrop === cropName ? '2px solid var(--color-primary)' : '1px solid #E0D6C8',
              background: selectedCrop === cropName ? 'var(--color-primary)' : '#FFF',
              color: selectedCrop === cropName ? '#FFF' : 'var(--color-text)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {cropName}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          ⏳ Loading regional disease risk data...
        </div>
      ) : data && data.diseases.length > 0 ? (
        <>
          {/* Summary Box */}
          <div style={{ background: '#FFF', padding: '14px 18px', borderRadius: 10, borderLeft: '4px solid var(--color-primary)', marginBottom: 24, fontSize: '0.88rem', color: 'var(--color-text)' }}>
            <p style={{ margin: 0, lineHeight: 1.6 }}>{data.region_summary}</p>
          </div>

          {/* Recharts Horizontal Bar Chart */}
          <div style={{ background: '#FFF', padding: 20, borderRadius: 12, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '0.92rem', fontFamily: 'Poppins, sans-serif', color: 'var(--color-text)' }}>
              Regional Disease Vulnerability & Categorical Risk Levels
            </h4>
            <div style={{ width: '100%', height: Math.max(220, chartData.length * 45) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EFEBE4" />
                  <XAxis
                    type="number"
                    domain={[0, 3]}
                    ticks={[1, 2, 3]}
                    tickFormatter={(val) => (val === 3 ? 'High Risk' : val === 2 ? 'Medium Risk' : val === 1 ? 'Low Risk' : '')}
                    tick={{ fontSize: 11, fill: '#666' }}
                  />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: '#333', fontWeight: 500 }} />
                  <Tooltip
                    content={({ payload }) => {
                      if (!payload || !payload.length) return null
                      const item = payload[0].payload
                      return (
                        <div style={{ background: '#333', color: '#FFF', padding: '6px 12px', borderRadius: 6, fontSize: '0.78rem' }}>
                          <p style={{ margin: 0, fontWeight: 700 }}>{item.fullName}</p>
                          <p style={{ margin: '2px 0 0', color: RISK_COLOR_MAP[item.riskLevel] || '#FFF' }}>
                            Risk Level: {item.riskLevel}
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="riskValue" radius={[0, 6, 6, 0]} barSize={20}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RISK_COLOR_MAP[entry.riskLevel] || '#8884d8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Disease Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
            {data.diseases.map((d, i) => {
              const badgeClass = d.risk_level === 'High' ? 'badge-red' : d.risk_level === 'Medium' ? 'badge-gold' : 'badge-green'
              return (
                <div key={i} style={{ background: '#FFF', padding: 18, borderRadius: 12, border: '1px solid #EFEBE4', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)' }}>{d.name}</h4>
                      <span className={`badge ${badgeClass}`} style={{ fontSize: '0.7rem', flexShrink: 0 }}>
                        {d.risk_level} Risk
                      </span>
                    </div>

                    {d.season && (
                      <div style={{ fontSize: '0.74rem', color: '#558B2F', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} /> {d.season}
                      </div>
                    )}

                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>{d.description}</p>
                  </div>

                  {d.prevention && (
                    <div style={{ background: '#F5F9F6', padding: '10px 12px', borderRadius: 8, fontSize: '0.78rem', borderLeft: '3px solid #388E3C' }}>
                      <span style={{ fontWeight: 700, color: '#1B5E20', display: 'block', marginBottom: 2 }}>Shield Prevention:</span>
                      <span style={{ color: '#2E7D32', lineHeight: 1.4 }}>{d.prevention}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* CTA Bar */}
          <div style={{ background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)', padding: '16px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, border: '1px solid #A5D6A7' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldAlert size={22} color="#2E7D32" />
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#1B5E20' }}>
                  Have a suspected disease on your {selectedCrop}?
                </p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#33691E' }}>
                  Upload a leaf image to get instant AI disease detection & treatment steps.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/disease')}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, background: '#2E7D32', border: 'none' }}
            >
              <Search size={14} /> Detect Disease
            </button>
          </div>
        </>
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
          No regional disease information is currently available for this crop and location.
        </div>
      )}
    </div>
  )
}

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
              {crop.varieties && crop.varieties.length > 0 && (
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 6 }}>Key Varieties</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {crop.varieties.map((v, i) => (
                      <div key={i} style={{ background: '#E8F5E9', padding: '6px 10px', borderRadius: 6, fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#1B5E20' }}>{v.name}</span>
                          {v.expected_yield && <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#2E7D32' }}>{v.expected_yield}</span>}
                        </div>
                        <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>{v.suitability_note}</p>
                      </div>
                    ))}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 28, alignItems: 'start' }}>
              <div className="card" style={{ padding: 24, alignSelf: 'start' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>📍 {submittedPlaceName || result.location}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {soil && <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>🪨 {soil}</span>}
                    {irrigation && <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>💧 {irrigation}</span>}
                  </div>
                </div>
                <p style={{ lineHeight: 1.7, fontSize: '0.9rem', margin: 0 }}>{result.summary}</p>
              </div>
              <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, #FFF8E1, #FFFDE7)', border: '2px solid #F9A825' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Trophy size={18} color="#F57F17" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#F57F17' }}>{t('crop_top_rec')}</span>
                </div>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.6rem', textTransform: 'capitalize', marginBottom: 8 }}>{result.best_crop.name || result.best_crop.crop}</h2>
                <ConfidenceRing value={result.best_crop.confidence} size={72} />
                <p style={{ marginTop: 10, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{result.best_crop.reason}</p>
                {result.best_crop.varieties && result.best_crop.varieties.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #FFE082' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.8rem', color: '#B78103', marginBottom: 6 }}>🌾 Top Varieties:</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {result.best_crop.varieties.map((v, idx) => (
                        <div key={idx} style={{ background: 'rgba(255, 243, 224, 0.9)', padding: '8px 10px', borderRadius: 8, fontSize: '0.78rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, color: '#E65100' }}>{v.name}</span>
                            {v.expected_yield && <span style={{ fontWeight: 600, color: '#2E7D32', fontSize: '0.72rem' }}>{v.expected_yield}</span>}
                          </div>
                          <p style={{ margin: '2px 0 0', color: '#4E342E', fontSize: '0.72rem' }}>{v.suitability_note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

            {/* Regional Crop Disease Intelligence Section */}
            <RegionalDiseaseSection
              locationName={submittedPlaceName || result.location}
              recommendedCrops={result.recommended_crops}
            />
          </motion.div>
        )}
      </div>
    </PageTransition>
  )
}
