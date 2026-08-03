import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Send, MessageCircle, Sparkles, Zap, Bot, RotateCcw, Copy, Check } from 'lucide-react'
import { PageTransition } from '../components/shared/PageTransition'
import { sendChatMessage } from '../api/endpoints'
import type { ChatMessage } from '../api/types'

const QUICK_PROMPTS = [
  'Why is my crop turning yellow?',
  'Best time to sell pepper in Kerala?',
  'Will it rain this week in Wayanad?',
  'How to prevent leaf blight in tomato?',
  'Which crop should I plant this season?',
  'How to control stem borer in paddy?',
]

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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '🌿 Hello! I am **HexaKrishi AI Assistant**, your intelligent farming companion for Kerala.\n\nI can help you with:\n• 🦠 Crop disease identification and treatments\n• 🌤️ Weather-based farming advice\n• 📈 Market prices and selling strategies\n• 🌱 Crop selection and planting guidance\n\nAsk me anything!',
    },
  ])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
      })
      setMessages([...history, { role: 'assistant', content: res.reply }])
    } catch {
      setMessages([
        ...history,
        {
          role: 'assistant',
          content:
            '⚠️ I could not reach the AI service right now. Please try again in a moment.\n\nIn the meantime, explore our other AI modules for immediate help with disease detection, crop advisory, weather, and market intelligence!',
        },
      ])
    } finally {
      setIsThinking(false)
    }
  }

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content: '🌿 Chat cleared! How can I help you with your farming today?',
      },
    ])
  }

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
                AI Assistant · Online
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
                <RotateCcw size={13} /> Clear
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
              Ask any question or pick a quick prompt below
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
            {/* Quick prompts shown when conversation is fresh */}
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
                  Suggested Questions:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {QUICK_PROMPTS.map((prompt) => (
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
                          bottom: -18,
                          left: 4,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <CopyButton text={msg.content} />
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
                    HexaKrishi AI is thinking…
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
              gap: 10,
              alignItems: 'center',
            }}
          >
            <input
              id="assistant-chat-input"
              ref={inputRef}
              className="form-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask a farming question… (e.g. 'Why is my tomato plant wilting?')"
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
          AI responses are advisory. Always consult local agricultural experts for critical decisions.
        </p>
      </div>
    </PageTransition>
  )
}
