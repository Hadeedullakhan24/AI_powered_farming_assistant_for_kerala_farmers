import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { Send, MessageCircle, Sparkles, Zap, Bot, RotateCcw, Copy, Check } from 'lucide-react'
import { PageTransition } from '../components/shared/PageTransition'
import { VoiceInput } from '../components/VoiceInput'
import { SpeakButton } from '../components/SpeakButton'
import { sendChatMessage } from '../api/endpoints'
import type { ChatMessage } from '../api/types'

const WELCOME_MESSAGES: Record<string, string> = {
  ml: '🌿 നമസ്കാരം! ഞാൻ **HexaKrishi AI Assistant** ആണ്, കേരളത്തിലെ കർഷകർക്കുള്ള AI കൃഷി സഹായി.\n\nഞാൻ ഇവ ഉൾക്കൊള്ളുന്നു:\n• 🦠 വിള രോഗ കണ്ടുപിടിത്തം\n• 🌤️ കാലാവസ്ഥ അടിസ്ഥാനമാക്കിയ കൃഷി ഉപദേശം\n• 📈 വിപണി വിലകൾ\n• 🌱 വിള തിരഞ്ഞെടുക്കൽ\n\nഎന്തും ചോദിക്കൂ!',
  ta: '🌿 வணக்கம்! நான் **HexaKrishi AI Assistant**, உங்கள் விவசாய உதவியாளர்.\n\nநான் உதவக்கூடிய தலைப்புகள்:\n• 🦠 பயிர் நோய் கண்டறிதல் மற்றும் சிகிச்சைகள்\n• 🌤️ வானிலை பற்றிய விவசாய ஆலோசனைகள்\n• 📈 சந்தை விலைகள் மற்றும் விற்பனை உத்திகள்\n• 🌱 பயிர் தேர்வு மற்றும் நடவு வழிகாட்டல்\n\nஎதையும் கேளுங்கள்!',
  hi: '🌿 नमस्ते! मैं **HexaKrishi AI Assistant** हूँ, आपका कृषि सहायक।\n\nमैं इन चीज़ों में आपकी मदद कर सकता हूँ:\n• 🦠 फसल रोग पहचान और उपचार\n• 🌤️ मौसम आधारित कृषि सलाह\n• 📈 बाज़ार मूल्य और बिक्री रणनीति\n• 🌱 फसल चयन और रोपण मार्गदर्शन\n\nकुछ भी पूछें!',
  kn: '🌿 ನಮಸ್ಕಾರ! ನಾನು **HexaKrishi AI Assistant**, ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯಕ.\n\nನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ:\n• 🦠 ಬೆಳೆ ರೋಗ ಪತ್ತೆ ಮತ್ತು ಚಿಕಿತ್ಸೆಗಳು\n• 🌤️ ಹವಾಮಾನ ಆಧಾರಿತ ಕೃಷಿ ಸಲಹೆ\n• 📈 ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು\n• 🌱 ಬೆಳೆ ಆಯ್ಕೆ\n\nಏನನ್ನಾದರೂ ಕೇಳಿ!',
  te: '🌿 నమస్కారం! నేను **HexaKrishi AI Assistant**, మీ వ్యవసాయ సహాయకుడిని.\n\nనేను సహాయం చేయగల విషయాలు:\n• 🦠 పంట వ్యాధి గుర్తింపు మరియు చికిత్సలు\n• 🌤️ వాతావరణ ఆధారిత వ్యవసాయ సలహాలు\n• 📈 మార్కెట్ ధరలు\n• 🌱 పంట ఎంపిక\n\nఏదైనా అడగండి!',
  en: '🌿 Hello! I am **HexaKrishi AI Assistant**, your intelligent farming companion for Kerala.\n\nI can help you with:\n• 🦠 Crop disease identification and treatments\n• 🌤️ Weather-based farming advice\n• 📈 Market prices and selling strategies\n• 🌱 Crop selection and planting guidance\n\nAsk me anything!',
}

const QUICK_PROMPTS: Record<string, string[]> = {
  ml: [
    'എന്റെ ടൊമാറ്റോ ചെടി എന്തുകൊണ്ട് ഉണങ്ങുന്നു?',
    'കേരളത്തിൽ കുരുമുളക് വിൽക്കാൻ ഏറ്റവും നല്ല സമയം?',
    'ഈ ആഴ്ച വയനാട്ടിൽ മഴ പെയ്യുമോ?',
    'ടൊമാറ്റോയിലെ ഇലക്കരൾ തടയാൻ എന്ത് ചെയ്യണം?',
    'ഈ സീസണിൽ ഏത് വിള നടണം?',
  ],
  ta: [
    'என் தக்காளி செடி ஏன் வாடுகிறது?',
    'மிளகு விற்க சிறந்த நேரம் எது?',
    'இந்த வாரம் மழை பெய்யுமா?',
    'தக்காளி நோயை எப்படி தடுப்பது?',
    'இந்த பருவத்தில் எந்த பயிர் நடலாம்?',
  ],
  hi: [
    'मेरी टमाटर की फसल क्यों सूख रही है?',
    'काली मिर्च बेचने का सबसे अच्छा समय?',
    'क्या इस सप्ताह बारिश होगी?',
    'फसल रोग से बचाव कैसे करें?',
    'इस मौसम में कौन सी फसल उगाएं?',
  ],
  kn: [
    'ನನ್ನ ಟೊಮೆಟೊ ಸಸ್ಯ ಏಕೆ ಒಣಗುತ್ತಿದೆ?',
    'ಕಾಳುಮೆಣಸು ಮಾರಾಟ ಮಾಡಲು ಸೂಕ್ತ ಸಮಯ?',
    'ಈ ವಾರ ಮಳೆ ಬರುವುದೇ?',
    'ಬೆಳೆ ರೋಗ ತಡೆಗಟ್ಟುವುದು ಹೇಗೆ?',
    'ಈ ಋತುವಿನಲ್ಲಿ ಯಾವ ಬೆಳೆ ಬೆಳೆಯಬೇಕು?',
  ],
  te: [
    'నా టమోటా మొక్క ఎందుకు ఎండిపోతోంది?',
    'మిరియాలు అమ్మడానికి మంచి సమయం?',
    'ఈ వారం వర్షం పడుతుందా?',
    'పంట వ్యాధి నివారణ ఎలా?',
    'ఈ సీజన్‌లో ఏ పంట వేయాలి?',
  ],
  en: [
    'Why is my crop turning yellow?',
    'Best time to sell pepper in Kerala?',
    'Will it rain this week in Wayanad?',
    'How to prevent leaf blight in tomato?',
    'Which crop should I plant this season?',
    'How to control stem borer in paddy?',
  ],
}

function getQuickPrompts(lang: string) {
  return QUICK_PROMPTS[lang] || QUICK_PROMPTS.en
}

const TypingIndicator = () => (
  <div style={{ display: 'flex', gap: 4, padding: '12px 16px', alignItems: 'center' }}>
    {[0, 1, 2].map((i) => (
      <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
    ))}
  </div>
)

/** Render text with **bold** markers and line breaks */
function renderMessage(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part.split('\n').map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ))
  })
}

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      title="Copy message"
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--color-text-secondary)', padding: '2px 4px',
        borderRadius: 4, opacity: 0.6, transition: 'opacity 0.15s',
        display: 'flex', alignItems: 'center',
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
    >
      {copied ? <Check size={12} color="#2E7D32" /> : <Copy size={12} />}
    </button>
  )
}

export const AIAssistant = () => {
  const { t } = useTranslation()
  const currentLang = i18n.language || 'en'
  const welcomeMsg = WELCOME_MESSAGES[currentLang] || WELCOME_MESSAGES.en

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: welcomeMsg },
  ])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Update initial welcome message when language changes if conversation hasn't started
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length <= 1) {
        return [{ role: 'assistant', content: welcomeMsg }]
      }
      return prev
    })
  }, [currentLang, welcomeMsg])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const handleSend = async (msg?: string) => {
    const text = (msg ?? input).trim()
    if (!text || isThinking) return
    setInput('')

    const newMsg: ChatMessage = { role: 'user', content: text }
    const history = [...messages, newMsg]
    setMessages(history)
    setIsThinking(true)

    try {
      const res = await sendChatMessage({
        message: text,
        conversation_history: history.slice(-10),
        lang: i18n.language || 'en',
      })
      setMessages([...history, { role: 'assistant', content: res.reply }])
    } catch {
      setMessages([
        ...history,
        {
          role: 'assistant',
          content:
            '⚠️ Could not reach the AI service right now. Please try again in a moment.',
        },
      ])
    } finally {
      setIsThinking(false)
    }
  }

  const handleClear = () => {
    setMessages([{ role: 'assistant', content: welcomeMsg }])
  }

  const handleTranscript = (text: string) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text))
    inputRef.current?.focus()
  }

  const quickPrompts = getQuickPrompts(currentLang)

  return (
    <PageTransition>
      <div
        style={{
          maxWidth: 860,
          margin: '0 auto',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 100px)',
          minHeight: 560,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '1.75rem',
                  color: 'var(--color-primary)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                💬 {t('assistant_title', 'AI Assistant')}
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', margin: '4px 0 0', fontSize: '0.9rem' }}>
                {t('assistant_desc', 'Ask anything about farming, crops, weather, or markets in Kerala')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 99,
                  background: '#E8F5E9',
                  border: '1px solid #C8E6C9',
                  color: '#2E7D32',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#2E7D32',
                    display: 'inline-block',
                  }}
                />
                {t('assistant_online', 'AI Assistant · Online')}
              </div>
              <button
                id="assistant-clear-btn"
                onClick={handleClear}
                title="Clear conversation"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1.5px solid var(--color-border)',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  color: 'var(--color-text-secondary)',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)'
                  e.currentTarget.style.color = 'var(--color-primary)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                  e.currentTarget.style.color = 'var(--color-text-secondary)'
                }}
              >
                <RotateCcw size={13} /> {t('assistant_clear', 'Clear')}
              </button>
            </div>
          </div>
        </div>

        {/* Chat container */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
          {/* Top banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1B5E20, #2E7D32)',
              padding: '12px 20px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Bot size={20} color="#FFE082" />
            <div style={{ fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 700 }}>HexaKrishi Conversational AI</span>
              {' · '}
              {t('assistant_desc', 'Ask any question or pick a quick prompt below')}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
              <Zap size={13} color="#FFE082" />
              Instant AI Advisory
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {/* Quick prompts */}
            {messages.length <= 1 && (
              <div style={{ marginBottom: 4 }}>
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--color-text-secondary)',
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  {t('assistant_suggested', 'Suggested Questions:')}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      id={`quick-${prompt.slice(0, 10).replace(/\s/g, '-')}`}
                      onClick={() => handleSend(prompt)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 99,
                        border: '1.5px solid var(--color-border)',
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        color: 'var(--color-text)',
                        fontFamily: 'Inter, sans-serif',
                        transition: 'all 0.15s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                      onMouseEnter={e => {
                        const btn = e.currentTarget
                        btn.style.borderColor = 'var(--color-primary)'
                        btn.style.color = 'var(--color-primary)'
                        btn.style.background = '#F0F7F0'
                      }}
                      onMouseLeave={e => {
                        const btn = e.currentTarget
                        btn.style.borderColor = 'var(--color-border)'
                        btn.style.color = 'var(--color-text)'
                        btn.style.background = '#fff'
                      }}
                    >
                      <Sparkles size={12} color="var(--color-primary)" />
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {msg.role === 'assistant' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MessageCircle size={12} color="#fff" />
                      </div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-text-secondary)',
                          fontWeight: 600,
                        }}
                      >
                        HexaKrishi AI
                      </span>
                    </div>
                  )}
                  <div style={{ position: 'relative', maxWidth: msg.role === 'user' ? '75%' : '82%' }}>
                    <div
                      className={msg.role === 'user' ? 'bubble-user' : 'bubble-assistant'}
                      style={{ lineHeight: 1.55 }}
                    >
                      {renderMessage(msg.content)}
                    </div>
                    {msg.role === 'assistant' && i > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: -22,
                          left: 4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <CopyButton text={msg.content} />
                        <SpeakButton text={msg.content} />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isThinking && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ alignSelf: 'flex-start' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MessageCircle size={12} color="#fff" />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {t('assistant_thinking', 'Thinking...')}
                  </span>
                </div>
                <div className="bubble-assistant" style={{ padding: 0 }}>
                  <TypingIndicator />
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--color-border)',
              background: '#FAFAF7',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            {/* Voice input mic button */}
            <VoiceInput onTranscript={handleTranscript} disabled={isThinking} />

            <input
              id="assistant-chat-input"
              ref={inputRef}
              className="form-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={t('assistant_placeholder', 'Type your farming question...')}
              disabled={isThinking}
              style={{ flex: 1, background: '#fff' }}
            />
            <button
              id="assistant-send-btn"
              className="btn btn-primary"
              onClick={() => handleSend()}
              disabled={!input.trim() || isThinking}
              style={{ padding: '10px 20px', minWidth: 54 }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Footer hint */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '0.72rem',
            color: 'var(--color-text-secondary)',
            marginTop: 10,
          }}
        >
          {t('assistant_disclaimer', 'AI responses are advisory. Always consult local agricultural experts for critical decisions.')}
        </p>
      </div>
    </PageTransition>
  )
}
