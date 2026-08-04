import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { Droplets, Wind, Eye, Gauge, Thermometer, Sun, CloudRain, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { PageTransition } from '../components/shared/PageTransition'
import { LocationPicker } from '../components/shared/LocationPicker'
import type { LocationPickerData } from '../components/shared/LocationPicker'
import { SkeletonCard } from '../components/shared/SkeletonCard'
import { ErrorCard } from '../components/shared/ErrorCard'
import { getWeatherAdvisory } from '../api/endpoints'
import type { WeatherResponse } from '../api/types'
import { CROPS } from '../lib/constants'
import { riskBadgeClass } from '../lib/utils'

const WEATHER_ICONS: Record<string, string> = {
  sunny: '☀️', clear: '☀️', cloudy: '☁️', overcast: '🌥️',
  rain: '🌧️', rainy: '🌧️', drizzle: '🌦️', thunderstorm: '⛈️',
  mist: '🌫️', fog: '🌫️', snow: '❄️', hail: '🌨️',
}

const safeStr = (value: unknown, fallback = '—'): string => {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

const getWeatherIcon = (condition: string) => {
  const key = condition.toLowerCase()
  for (const k of Object.keys(WEATHER_ICONS)) {
    if (key.includes(k)) return WEATHER_ICONS[k]
  }
  return '🌤️'
}

export const WeatherAdvisory = () => {
  const { t } = useTranslation()
  const [location, setLocation] = useState<LocationPickerData | null>(null)
  const [crop, setCrop] = useState('')
  const [result, setResult] = useState<WeatherResponse | null>(null)

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: () => getWeatherAdvisory({ latitude: location!.lat, longitude: location!.lng, crop }),
    onSuccess: (data) => setResult(data),
  })

  const w = result?.weather as Record<string, unknown> | undefined
  const adv = result?.advice

  const toBool = (v: unknown): boolean => {
    if (typeof v === 'boolean') return v
    if (typeof v === 'string') return ['true', 'yes', '1', 'recommended', 'required'].includes(v.trim().toLowerCase())
    return false
  }

  return (
    <PageTransition>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.8rem', color: 'var(--color-primary)', marginBottom: 6 }}>
            ⛅ {t('weather_title')}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>{t('weather_desc')}</p>
        </div>

        {/* Input */}
        <div className="card" style={{ padding: 24, marginBottom: 28 }}>
          <LocationPicker onLocationChange={setLocation} />
          <div style={{ marginTop: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.875rem' }}>{t('weather_select_crop')}</label>
            <select id="weather-crop-select" className="form-select" value={crop} onChange={(e) => setCrop(e.target.value)}>
              <option value="">— {t('weather_select_crop')} —</option>
              {CROPS.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <button id="get-weather-btn" className="btn btn-primary" disabled={!location || !crop || isPending}
            onClick={() => { reset(); setResult(null); mutate() }}
            style={{ width: '100%', padding: '13px', fontSize: '1rem', marginTop: 16 }}>
            {isPending ? '⚙️ Fetching...' : `⛅ ${t('weather_get_btn')}`}
          </button>
        </div>

        {isPending && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SkeletonCard rows={5} /> <SkeletonCard rows={8} /> <SkeletonCard rows={4} />
          </div>
        )}
        {error && <ErrorCard message={(error as Error).message} onRetry={() => mutate()} />}

        {result && w && adv && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* 1. Current Conditions */}
            <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, #E3F2FD, #E8F5E9)' }}>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', marginBottom: 20, fontSize: '1.1rem' }}>☁️ {t('weather_current')}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ fontSize: '4rem' }}>{getWeatherIcon(safeStr(w.condition))}</div>
                <div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '3.5rem', lineHeight: 1, color: 'var(--color-primary)' }}>
                    {safeStr(w.temperature_c)}°C
                  </div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    Feels like {safeStr(w.feels_like_c)}°C
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: 4 }}>{safeStr(w.condition)}</div>
                </div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginLeft: 'auto' }}>
                  <div className="stat-tile"><Droplets size={18} color="#1565C0" /><span style={{ fontWeight: 700 }}>{safeStr(w.humidity_percent)}%</span><span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Humidity</span></div>
                  <div className="stat-tile"><CloudRain size={18} color="#0D47A1" /><span style={{ fontWeight: 700 }}>{safeStr(w.chance_of_rain_percent)}%</span><span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Rain</span></div>
                </div>
              </div>
            </div>

            {/* 2. Details grid */}
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', marginBottom: 16, fontSize: '1.1rem' }}>📊 {t('weather_details')}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                {[
                  { icon: Thermometer, label: 'Max Temp', val: `${safeStr(w.max_temp_c)}°C` },
                  { icon: Thermometer, label: 'Min Temp', val: `${safeStr(w.min_temp_c)}°C` },
                  { icon: Wind, label: 'Wind', val: `${safeStr(w.wind_speed_kmh)} km/h` },
                  { icon: Wind, label: 'Gust', val: `${safeStr(w.gust_kmh)} km/h` },
                  { icon: Gauge, label: 'Pressure', val: `${safeStr(w.pressure_mb)} mb` },
                  { icon: Eye, label: 'Visibility', val: `${safeStr(w.visibility_km)} km` },
                  { icon: Sun, label: 'UV Index', val: safeStr(w.uv_index) },
                  { icon: CloudRain, label: 'Cloud Cover', val: `${safeStr(w.cloud_cover_percent)}%` },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="stat-tile">
                    <Icon size={16} color="var(--color-primary)" />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{val}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Sunrise/Sunset */}
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', marginBottom: 16, fontSize: '1.1rem' }}>🌅 {t('weather_sun')}</h2>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: '2rem' }}>🌅</span>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{safeStr(w.sunrise)}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Sunrise</span>
                </div>
                <div style={{ flex: 1, height: 6, background: 'linear-gradient(90deg, #F9A825, #FFE082, #F57F17)', borderRadius: 99, minWidth: 60 }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: '2rem' }}>🌇</span>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{safeStr(w.sunset)}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Sunset</span>
                </div>
              </div>
            </div>

            {/* 4. Farming Decisions */}
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', marginBottom: 16, fontSize: '1.1rem' }}>🚜 {t('weather_farming')}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                {[
                  { label: t('weather_irrigation'), ok: toBool(adv.irrigation_advice.required),  reason: adv.irrigation_advice.reason },
                  { label: t('weather_spraying'),   ok: toBool(adv.spraying_advice.recommended),  reason: adv.spraying_advice.reason },
                  { label: t('weather_harvesting'), ok: toBool(adv.harvesting_advice.recommended), reason: adv.harvesting_advice.reason },
                ].map(({ label, ok, reason }) => (
                  <div key={label} style={{ background: ok ? '#E8F5E9' : '#FFEBEE', borderRadius: 12, padding: '16px', border: `1px solid ${ok ? '#A5D6A7' : '#EF9A9A'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      {ok ? <CheckCircle size={20} color="#2E7D32" /> : <XCircle size={20} color="#C62828" />}
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{label}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Action Plan */}
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', marginBottom: 16, fontSize: '1.1rem' }}>📋 {t('weather_action')}</h2>
              <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {adv.today_action_plan.map((item, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text)' }}>
                    {item}
                  </motion.li>
                ))}
              </ol>
            </div>

            {/* 6. Alerts & Outlook */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem', margin: 0 }}>🚨 {t('weather_alerts')}</h2>
                <span className={riskBadgeClass(adv.overall_farming_risk)} style={{ fontSize: '0.8rem' }}>
                  Risk: {adv.overall_farming_risk}
                </span>
              </div>
              {adv.weather_alerts.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {adv.weather_alerts.map((a, i) => (
                    <span key={i} className="badge badge-amber" style={{ fontSize: '0.75rem' }}>
                      <AlertTriangle size={10} /> {a}
                    </span>
                  ))}
                </div>
              )}
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8 }}>Next 3-Day Outlook</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {adv.next_3_day_outlook.map((day, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#F5F0E8', borderRadius: 8, fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600, minWidth: 20, color: 'var(--color-primary)' }}>{i + 1}</span>
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </div>
    </PageTransition>
  )
}
