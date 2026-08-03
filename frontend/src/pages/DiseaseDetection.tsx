import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Upload, Camera, X, Leaf, ArrowRight, RotateCcw } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { PageTransition } from '../components/shared/PageTransition'
import { ConfidenceRing } from '../components/shared/ConfidenceRing'
import { ErrorCard } from '../components/shared/ErrorCard'
import { predictDisease } from '../api/endpoints'
import type { DiseaseResponse } from '../api/types'
import { DISEASE_CROPS, CROP_EMOJIS } from '../lib/constants'
import { formatDiseaseName } from '../lib/utils'

type Step = 'upload' | 'result'

export const DiseaseDetection = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('upload')
  const [selectedCrop, setSelectedCrop] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [result, setResult] = useState<DiseaseResponse | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: () => predictDisease(selectedCrop, imageFile!),
    onSuccess: (data) => {
      setResult(data)
      setStep('result')
    },
  })

  const handleFile = useCallback((file: File) => {
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) handleFile(file)
  }

  const handleReset = () => {
    setStep('upload'); setResult(null); setImageFile(null); setPreviewUrl(null); setSelectedCrop(''); reset()
  }

  return (
    <PageTransition>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.8rem', color: 'var(--color-primary)', marginBottom: 6 }}>
            🔬 {t('disease_title')}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>{t('disease_desc')}</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'upload' ? (
            <motion.div key="upload" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
              {/* Crop Selector */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontFamily: 'Poppins, sans-serif', fontSize: '0.9rem' }}>
                  {t('disease_select_crop')}
                </label>
                <select id="crop-select" className="form-select" value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}>
                  <option value="">— {t('disease_select_crop')} —</option>
                  {DISEASE_CROPS.map((c) => (
                    <option key={c} value={c}>{CROP_EMOJIS[c] ?? '🌱'} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Drop zone */}
              <div
                id="drop-zone"
                className={`drop-zone${dragOver ? ' drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !previewUrl && inputRef.current?.click()}
                style={{ marginBottom: 20 }}
              >
                <input ref={inputRef} id="image-input" type="file" accept="image/*" capture="environment"
                  style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                {previewUrl ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={previewUrl} alt="Preview" style={{ maxHeight: 240, maxWidth: '100%', borderRadius: 10, objectFit: 'contain' }} />
                    <button id="remove-image-btn" onClick={(e) => { e.stopPropagation(); setImageFile(null); setPreviewUrl(null) }}
                      style={{ position: 'absolute', top: -8, right: -8, background: '#C62828', color: '#fff', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Upload size={24} color="var(--color-primary)" />
                    </div>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text)' }}>{t('disease_step1_title')}</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{t('disease_step1_sub')}</p>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      <button id="browse-btn" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}>
                        <Upload size={14} /> Browse Files
                      </button>
                      <button id="camera-btn" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}>
                        <Camera size={14} /> Take Photo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {error && <ErrorCard message={(error as Error).message} onRetry={() => reset()} />}

              <button
                id="scan-btn"
                className="btn btn-primary"
                disabled={!imageFile || !selectedCrop || isPending}
                onClick={() => mutate()}
                style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
              >
                {isPending ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⚙️</motion.span>
                    Analyzing...
                  </span>
                ) : (
                  <><Leaf size={16} /> {t('disease_scan_btn')}</>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div key="result"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 180, damping: 18 }}
            >
              {result && (
                <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                  <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    style={{ fontSize: '3.5rem', marginBottom: 8 }}>
                    {CROP_EMOJIS[result.crop] ?? '🌱'}
                  </motion.div>
                  <p style={{ color: 'var(--color-text-secondary)', marginBottom: 4, textTransform: 'capitalize', fontWeight: 500 }}>
                    {result.crop}
                  </p>
                  <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.6rem', color: 'var(--color-text)', marginBottom: 24 }}>
                    {formatDiseaseName(result.prediction)}
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 28 }}>
                    <ConfidenceRing value={result.confidence} size={120} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{t('disease_confidence')}</span>
                  </div>

                  {previewUrl && (
                    <img src={previewUrl} alt="Crop" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12, marginBottom: 24 }} />
                  )}

                  <button id="view-treatment-btn" className="btn btn-primary" style={{ width: '100%', padding: '13px', fontSize: '1rem', marginBottom: 12 }}
                    onClick={() => navigate('/treatment', { state: { crop: result.crop, disease: result.prediction } })}>
                    {t('disease_view_treatment')} <ArrowRight size={16} />
                  </button>
                  <button id="scan-another-btn" className="btn btn-outline" style={{ width: '100%', padding: '11px' }} onClick={handleReset}>
                    <RotateCcw size={14} /> {t('disease_scan_another')}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
