import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, AlertTriangle, Star, Calendar, Trophy } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { PageTransition } from '../components/shared/PageTransition'
import { SkeletonCard } from '../components/shared/SkeletonCard'
import { ErrorCard } from '../components/shared/ErrorCard'
import { getMarketIntelligence } from '../api/endpoints'
import type { MarketResponse } from '../api/types'
import { CROPS, KERALA_DISTRICTS } from '../lib/constants'
import { riskBadgeClass } from '../lib/utils'

const MARKET_TABS = [
  'market_tab_overview', 'market_tab_prices', 'market_tab_prediction',
  'market_tab_rankings', 'market_tab_scorecard', 'market_tab_risk',
] as const

type MarketTab = typeof MARKET_TABS[number]

const GaugeBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div style={{ padding: '12px', background: '#F9FBF9', borderRadius: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem' }}>
      <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>{label}</span>
      <span style={{ fontWeight: 700, color }}>{value}</span>
    </div>
    <div className="progress-track" style={{ height: 8 }}>
      <motion.div className="progress-fill"
        style={{ background: color, height: '100%' }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1 }}
      />
    </div>
  </div>
)

export const MarketIntelligence = () => {
  const { t } = useTranslation()
  const [crop, setCrop] = useState('')
  const [district, setDistrict] = useState('')
  const [activeTab, setActiveTab] = useState<MarketTab>('market_tab_overview')
  const [result, setResult] = useState<MarketResponse | null>(null)

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: () => getMarketIntelligence({ crop, district }),
    onSuccess: (data) => setResult(data),
  })

  const predData = result ? [
    { label: 'Today',     price: result.price_prediction.today },
    { label: 'Tomorrow',  price: result.price_prediction.tomorrow },
    { label: 'Next Week', price: result.price_prediction.next_week },
  ] : []

  const scoreCardFields = result ? [
    { label: 'Price Strength',   value: result.market_scorecard.price_strength,   color: '#2E7D32' },
    { label: 'Demand Strength',  value: result.market_scorecard.demand_strength,  color: '#1565C0' },
    { label: 'Supply Health',    value: result.market_scorecard.supply_health,     color: '#00695C' },
    { label: 'Profit Potential', value: result.market_scorecard.profit_potential,  color: '#F57F17' },
    { label: 'Risk Index',       value: result.market_scorecard.risk_index,        color: '#C62828' },
    { label: 'AI Confidence',    value: result.market_scorecard.ai_confidence,     color: '#6A1B9A' },
  ] : []

  const heroBg = result ? (
    result.score_color === 'green' ? 'linear-gradient(135deg, #1B5E20, #2E7D32)' :
    result.score_color === 'amber' ? 'linear-gradient(135deg, #E65100, #F57F17)' :
    'linear-gradient(135deg, #B71C1C, #C62828)'
  ) : ''

  return (
    <PageTransition>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.8rem', color: 'var(--color-primary)', marginBottom: 6 }}>
            📈 {t('market_title')}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>{t('market_desc')}</p>
        </div>

        {/* Input */}
        <div className="card" style={{ padding: 24, marginBottom: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.875rem' }}>{t('market_select_crop')}</label>
              <select id="market-crop-select" className="form-select" value={crop} onChange={(e) => setCrop(e.target.value)}>
                <option value="">— {t('market_select_crop')} —</option>
                {CROPS.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.875rem' }}>{t('market_select_district')}</label>
              <select id="market-district-select" className="form-select" value={district} onChange={(e) => setDistrict(e.target.value)}>
                <option value="">— {t('market_select_district')} —</option>
                {KERALA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <button id="get-market-btn" className="btn btn-primary" disabled={!crop || !district || isPending}
            onClick={() => { reset(); mutate() }}
            style={{ width: '100%', padding: '13px', fontSize: '1rem' }}>
            {isPending ? '⚙️ Fetching market data...' : `📊 ${t('market_get_btn')}`}
          </button>
        </div>

        {isPending && <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}><SkeletonCard rows={4} /><SkeletonCard rows={6} /></div>}
        {error && <ErrorCard message={(error as Error).message} onRetry={() => mutate()} />}

        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Hero Status Banner */}
            <div style={{ background: heroBg, borderRadius: 16, padding: '24px', marginBottom: 24, color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <p style={{ margin: 0, opacity: 0.8, fontSize: '0.875rem' }}>Market Status</p>
                  <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.4rem', margin: '4px 0' }}>{result.market_status}</h2>
                  <p style={{ margin: 0, opacity: 0.75, fontSize: '0.85rem' }}>{result.crop} · {result.district}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '3rem', lineHeight: 1 }}>{result.market_score}</div>
                  <div style={{ opacity: 0.8, fontSize: '0.8rem' }}>Market Score / 100</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: 99, fontWeight: 700, fontSize: '1rem', backdropFilter: 'blur(4px)' }}>
                    {result.farmer_decision.action}
                  </span>
                  <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                    Priority: {result.farmer_decision.priority} · {result.farmer_decision.confidence}
                  </span>
                </div>
              </div>
            </div>

            {/* Tab Bar */}
            <div className="tab-bar" style={{ marginBottom: 20 }}>
              {MARKET_TABS.map((tab) => (
                <button key={tab} id={`market-tab-${tab}`} className={`tab-item${activeTab === tab ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab)} style={{ position: 'relative' }}>
                  {activeTab === tab && (
                    <motion.div layoutId="market-pill"
                      style={{ position: 'absolute', inset: 0, background: 'var(--color-primary)', borderRadius: 9, zIndex: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }} />
                  )}
                  <span style={{ position: 'relative', zIndex: 1 }}>{t(tab)}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>

                {/* OVERVIEW */}
                {activeTab === 'market_tab_overview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card" style={{ padding: 24 }}>
                      <p style={{ lineHeight: 1.8, color: 'var(--color-text)', fontSize: '0.95rem' }}>{result.ai_insight.summary}</p>
                    </div>
                    <div className="card" style={{ padding: 20, background: '#FFF8E1', border: '1px solid #FFE082' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#F57F17', marginBottom: 6 }}>💡 AI Recommendation</p>
                      <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.7 }}>{result.ai_insight.recommendation}</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                      {[
                        { label: 'Price Trend', val: result.ai_insight.price_trend },
                        { label: 'Demand', val: result.ai_insight.demand },
                        { label: 'Supply', val: result.ai_insight.supply },
                        { label: 'Best Selling Time', val: result.ai_insight.best_selling_time },
                      ].map(({ label, val }) => (
                        <div key={label} className="card" style={{ padding: 16 }}>
                          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{label}</p>
                          <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: '0.9rem' }}>{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PRICES */}
                {activeTab === 'market_tab_prices' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, #FFF8E1, #FFFDE7)', border: '1.5px solid #F9A825' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Trophy size={18} color="#F57F17" />
                        <span style={{ fontWeight: 700, color: '#F57F17' }}>Best Opportunity</span>
                      </div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem' }}>{result.best_market_opportunity.commodity}</p>
                      <p style={{ margin: '4px 0', fontSize: '1rem', color: 'var(--color-primary)', fontWeight: 600 }}>₹{result.best_market_opportunity.price}/kg</p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{result.best_market_opportunity.reason}</p>
                    </div>
                    <div className="card" style={{ overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ background: '#F5F0E8' }}>
                            {['Commodity', 'Market Price', 'Avg Price', 'Min', 'Max', 'Date'].map((h) => (
                              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.price_data.map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--color-border)', background: row.commodity === result.highest_priced_commodity ? '#F9FBE7' : 'white' }}>
                              <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                                {row.commodity}
                                {row.commodity === result.highest_priced_commodity && <span className="badge badge-gold" style={{ marginLeft: 6, fontSize: '0.65rem' }}>★ Top</span>}
                              </td>
                              <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--color-primary)' }}>₹{row.market_price}</td>
                              <td style={{ padding: '10px 14px' }}>₹{row.average_price}</td>
                              <td style={{ padding: '10px 14px', color: '#C62828' }}>₹{row.min_price}</td>
                              <td style={{ padding: '10px 14px', color: '#2E7D32' }}>₹{row.max_price}</td>
                              <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)', fontSize: '0.78rem' }}>{row.date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* PREDICTION */}
                {activeTab === 'market_tab_prediction' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      {predData.map(({ label, price }) => (
                        <div key={label} className="card" style={{ padding: 20, textAlign: 'center' }}>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{label}</p>
                          <p style={{ margin: '8px 0 0', fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'var(--color-primary)' }}>₹{price}</p>
                        </div>
                      ))}
                    </div>
                    <div className="card" style={{ padding: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        {result.price_prediction.trend === 'up' ? <TrendingUp size={20} color="#2E7D32" /> : <TrendingDown size={20} color="#C62828" />}
                        <span style={{ fontWeight: 600 }}>Trend: {result.price_prediction.trend}</span>
                      </div>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={predData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D0" />
                          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(v) => [`₹${v}`, 'Price']} />
                          <Line type="monotone" dataKey="price" stroke="#2E7D32" strokeWidth={3}
                            dot={{ fill: '#2E7D32', r: 5 }} activeDot={{ r: 7, fill: '#F9A825' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* RANKINGS */}
                {activeTab === 'market_tab_rankings' && (
                  <div className="card" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ background: '#F5F0E8' }}>
                          {['Rank', 'District', 'Commodity', 'Market Price', 'Avg Price'].map((h) => (
                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.district_comparison.map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '10px 14px' }}><span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>#{row.rank}</span></td>
                            <td style={{ padding: '10px 14px', fontWeight: 500 }}>{row.district}</td>
                            <td style={{ padding: '10px 14px' }}>{row.commodity}</td>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--color-primary)' }}>₹{row.market_price}</td>
                            <td style={{ padding: '10px 14px' }}>₹{row.average_price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* SCORECARD */}
                {activeTab === 'market_tab_scorecard' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                    {scoreCardFields.map(({ label, value, color }) => (
                      <GaugeBar key={label} label={label} value={value} color={color} />
                    ))}
                  </div>
                )}

                {/* RISK & ALERTS */}
                {activeTab === 'market_tab_risk' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="card" style={{ padding: 20 }}>
                        <p style={{ fontWeight: 700, marginBottom: 8 }}>Market Risk</p>
                        <span className={riskBadgeClass(result.market_risk.level)} style={{ marginBottom: 10, display: 'inline-block' }}>
                          {result.market_risk.level} (Score: {result.market_risk.risk_score})
                        </span>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{result.market_risk.reason}</p>
                      </div>
                      <div className="card" style={{ padding: 20 }}>
                        <p style={{ fontWeight: 700, marginBottom: 8 }}>Market Health</p>
                        <span className="badge" style={{ background: result.market_health.color, color: '#fff', marginBottom: 10, display: 'inline-block' }}>
                          {result.market_health.label} ({result.market_health.score}/100)
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                          <Calendar size={14} color="var(--color-text-secondary)" />
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                            Sell window: {result.selling_window.from_date} — {result.selling_window.to_date}
                          </span>
                        </div>
                        <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 500 }}>{result.selling_window.recommendation}</p>
                      </div>
                    </div>
                    <div className="card" style={{ padding: 20 }}>
                      <p style={{ fontWeight: 700, marginBottom: 12 }}>Decision Reasons</p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {result.farmer_decision.reasons.map((r, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.875rem' }}>
                            <Star size={14} color="#F9A825" style={{ marginTop: 2, flexShrink: 0 }} />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {result.market_alerts.length > 0 && (
                      <div className="card" style={{ padding: 20 }}>
                        <p style={{ fontWeight: 700, marginBottom: 10 }}>⚠️ Market Alerts</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {result.market_alerts.map((a, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', background: '#FFF8E1', borderRadius: 8, fontSize: '0.875rem' }}>
                              <AlertTriangle size={14} color="#F57F17" style={{ marginTop: 2, flexShrink: 0 }} />
                              {a}
                            </div>
                          ))}
                        </div>
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
