import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

type RecordState = 'idle' | 'recording' | 'processing'

const BROWSER_LANG_MAP: Record<string, string> = {
  en: 'en-IN',
  ml: 'ml-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  te: 'te-IN',
}

export const VoiceInput = ({ onTranscript, disabled = false }: VoiceInputProps) => {
  const { t } = useTranslation()
  const [state, setState] = useState<RecordState>('idle')
  const [error, setError] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const activeRecognitionRef = useRef<any>(null)

  const startRecording = useCallback(async () => {
    setError('')
    const targetLang = i18n.language || 'en'
    const browserLang = BROWSER_LANG_MAP[targetLang] || 'en-IN'

    // 1. Try Browser Native SpeechRecognition first (Instant & zero latency!)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition()
        recognition.lang = browserLang
        recognition.interimResults = false
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
          setState('recording')
        }

        recognition.onresult = (event: any) => {
          const text = event.results[0]?.[0]?.transcript
          if (text) {
            onTranscript(text)
          }
          setState('idle')
        }

        recognition.onerror = (event: any) => {
          console.warn('[VoiceInput] WebSpeech error, trying backend fallback...', event.error)
          activeRecognitionRef.current = null
          // Fall back to backend recording
          fallbackBackendRecording(targetLang)
        }

        recognition.onend = () => {
          setState('idle')
          activeRecognitionRef.current = null
        }

        activeRecognitionRef.current = recognition
        recognition.start()
        return
      } catch (e) {
        console.warn('[VoiceInput] SpeechRecognition failed to initialize:', e)
      }
    }

    // 2. Fallback to MediaRecorder + Backend API
    fallbackBackendRecording(targetLang)
  }, [onTranscript, i18n.language, t])

  const fallbackBackendRecording = async (targetLang: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setState('processing')
        try {
          const form = new FormData()
          form.append('audio', blob, 'recording.webm')
          form.append('lang', targetLang)
          const res = await fetch(`${API_BASE}/api/transcribe`, {
            method: 'POST',
            body: form,
          })
          if (!res.ok) throw new Error(`Server error ${res.status}`)
          const data = await res.json()
          if (data.text) onTranscript(data.text)
        } catch (err: any) {
          setError(t('voice_error'))
          console.error('[VoiceInput] Transcription error:', err)
        } finally {
          setState('idle')
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setState('recording')
    } catch (err: any) {
      setError(t('voice_error'))
      console.error('[VoiceInput] Mic access error:', err)
      setState('idle')
    }
  }

  const stopRecording = useCallback(() => {
    if (activeRecognitionRef.current) {
      try {
        activeRecognitionRef.current.stop()
      } catch (e) {}
      activeRecognitionRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setState('idle')
  }, [])

  const handleClick = () => {
    if (disabled || state === 'processing') return
    if (state === 'recording') stopRecording()
    else startRecording()
  }

  const isRecording = state === 'recording'
  const isProcessing = state === 'processing'

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        id="voice-input-btn"
        type="button"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        title={isRecording ? t('voice_stop') : t('voice_listening')}
        style={{
          width: 40, height: 40, borderRadius: '50%', border: 'none',
          cursor: disabled || isProcessing ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isRecording
            ? 'linear-gradient(135deg, #c62828, #e53935)'
            : '#f0f0f0',
          color: isRecording ? '#fff' : '#555',
          transition: 'all 0.2s',
          boxShadow: isRecording ? '0 0 0 4px rgba(198,40,40,0.2)' : 'none',
          animation: isRecording ? 'mic-pulse 1.2s ease-in-out infinite' : 'none',
        }}
      >
        {isProcessing
          ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
          : isRecording
            ? <MicOff size={18} />
            : <Mic size={18} />}
      </button>

      {isRecording && (
        <span style={{
          position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)',
          fontSize: '0.65rem', color: '#c62828', whiteSpace: 'nowrap', fontWeight: 600,
        }}>
          {t('voice_listening')}
        </span>
      )}

      {error && (
        <span style={{
          position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)',
          fontSize: '0.65rem', color: '#c62828', whiteSpace: 'nowrap',
        }}>
          {error}
        </span>
      )}

      <style>{`
        @keyframes mic-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(198,40,40,0.35); }
          50% { box-shadow: 0 0 0 8px rgba(198,40,40,0); }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default VoiceInput
