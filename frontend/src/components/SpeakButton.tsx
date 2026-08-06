import { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

interface SpeakButtonProps {
  text: string
}

type PlayState = 'idle' | 'loading' | 'playing'

const BROWSER_LANG_MAP: Record<string, string> = {
  en: 'en-IN',
  ml: 'ml-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  te: 'te-IN',
}

export const SpeakButton = ({ text }: SpeakButtonProps) => {
  const { t } = useTranslation()
  const [state, setState] = useState<PlayState>('idle')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isWebSpeechPlayingRef = useRef(false)

  // Clean markdown symbols (e.g. **bold**, 🦠 emojis, etc.) before speaking
  const cleanTextForSpeech = (raw: string): string => {
    return raw
      .replace(/\*\*/g, '')
      .replace(/#/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // strip emojis
      .replace(/\s+/g, ' ')
      .trim()
  }

  const stopAllSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    isWebSpeechPlayingRef.current = false
    setState('idle')
  }

  useEffect(() => {
    return () => {
      stopAllSpeech()
    }
  }, [])

  const handleClick = async () => {
    if (state === 'playing') {
      stopAllSpeech()
      return
    }

    if (state === 'loading') return

    const targetLang = i18n.language || 'en'
    const browserLang = BROWSER_LANG_MAP[targetLang] || 'en-IN'
    const spokenText = cleanTextForSpeech(text)

    if (!spokenText) return

    // 1. Try Browser Web SpeechSynthesis (Instant, zero latency!)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel() // Stop any previous speech

      const utterance = new SpeechSynthesisUtterance(spokenText)
      utterance.lang = browserLang
      utterance.rate = 1.0

      // Match installed voice for target language if available
      const voices = window.speechSynthesis.getVoices()
      const matchedVoice = voices.find(v => v.lang.startsWith(targetLang) || v.lang.startsWith(browserLang))
      if (matchedVoice) {
        utterance.voice = matchedVoice
      }

      utterance.onstart = () => {
        isWebSpeechPlayingRef.current = true
        setState('playing')
      }

      utterance.onend = () => {
        isWebSpeechPlayingRef.current = false
        setState('idle')
      }

      utterance.onerror = (e) => {
        console.warn('[SpeakButton] WebSpeech error, trying backend TTS fallback...', e)
        isWebSpeechPlayingRef.current = false
        fallbackBackendTTS(spokenText, targetLang)
      }

      window.speechSynthesis.speak(utterance)

      // Fallback check if browser didn't fire onstart (e.g. Chrome empty voice list bug)
      setTimeout(() => {
        if (!window.speechSynthesis.speaking && !isWebSpeechPlayingRef.current && state === 'idle') {
          fallbackBackendTTS(spokenText, targetLang)
        }
      }, 300)

      return
    }

    // 2. Fallback to Backend TTS API
    fallbackBackendTTS(spokenText, targetLang)
  }

  const fallbackBackendTTS = async (spokenText: string, targetLang: string) => {
    setState('loading')
    try {
      const form = new FormData()
      form.append('text', spokenText)
      form.append('lang', targetLang)

      const res = await fetch(`${API_BASE}/api/speak`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio

      audio.onended = () => {
        setState('idle')
        URL.revokeObjectURL(url)
      }
      audio.onerror = () => {
        setState('idle')
        URL.revokeObjectURL(url)
      }

      await audio.play()
      setState('playing')
    } catch (err: any) {
      console.error('[SpeakButton] TTS error:', err)
      setState('idle')
    }
  }

  const isLoading = state === 'loading'
  const isPlaying = state === 'playing'

  return (
    <button
      id={`speak-btn-${text.slice(0, 8).replace(/\s/g, '-')}`}
      type="button"
      onClick={handleClick}
      title={isPlaying ? t('voice_stop') : t('voice_speak')}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: isPlaying ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        padding: '2px 4px', borderRadius: 4,
        opacity: isLoading ? 0.5 : 0.7,
        transition: 'opacity 0.15s, color 0.15s',
        display: 'flex', alignItems: 'center',
      }}
      onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.opacity = '1' }}
      onMouseLeave={(e) => { if (!isPlaying) e.currentTarget.style.opacity = '0.7' }}
    >
      {isLoading
        ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} />
        : isPlaying
          ? <VolumeX size={12} color="var(--color-primary)" />
          : <Volume2 size={12} />}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </button>
  )
}

export default SpeakButton
