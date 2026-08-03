import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, MessageCircle, Bot, Minimize2, Sparkles, RotateCcw } from 'lucide-react'
import { sendChatMessage } from '../../api/endpoints'
import type { ChatMessage } from '../../api/types'
import { useLocation } from 'react-router-dom'

const QUICK_PROMPTS = [
  '🌾 Best crop for monsoon season?',
  '🦠 Yellow leaves on my paddy crop?',
  '💰 Pepper price trend in Wayanad?',
  '🌧️ Should I irrigate today?',
]

const TypingIndicator = () => (
  <div style={{ display: 'flex', gap: 4, padding: '10px 14px', alignItems: 'center' }}>
    {[0, 1, 2].map((i) => (
      <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
    ))}
  </div>
)

/** Render plain text with **bold** markers and newlines */
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

export const ChatWidget = () => {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        '🌿 Namaste! I am HexaKrishi AI. Ask me anything about farming — crops, diseases, weather, or market prices in Kerala.',
    },
  ])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const location = useLocation()

  // Don't show widget on the dedicated /assistant page
  const isAssistantPage = location.pathname === '/assistant'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open])

  const handleSend = useCallback(
    async (msg?: string) => {
      const text = (msg ?? input).trim()
      if (!text || isThinking) return
      setInput('')

      const userMsg: ChatMessage = { role: 'user', content: text }
      const history = [...messages, userMsg]
      setMessages(history)
      setIsThinking(true)

      try {
        const res = await sendChatMessage({
          message: text,
          conversation_history: history.slice(-10),
        })
        const updated = [...history, { role: 'assistant' as const, content: res.reply }]
        setMessages(updated)
        if (!open) setUnread((n) => n + 1)
      } catch {
        setMessages([
          ...history,
          {
            role: 'assistant',
            content:
              '⚠️ I could not reach the AI service right now. Please try again in a moment or explore the dedicated modules (Disease Detection, Crop Advisory, Weather, Market) for immediate help.',
          },
        ])
      } finally {
        setIsThinking(false)
      }
    },
    [input, isThinking, messages, open]
  )

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          '🌿 Chat cleared! Ask me anything about Kerala farming — crops, diseases, weather, or markets.',
      },
    ])
  }

  if (isAssistantPage) return null

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            id="chat-widget-fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="chat-widget-fab"
            aria-label="Open AI Assistant"
          >
            <Bot size={24} color="#fff" />
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="chat-widget-badge"
              >
                {unread}
              </motion.span>
            )}
            <span className="chat-widget-fab-label">Ask AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="chat-widget-panel"
            className="chat-widget-panel"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          >
            {/* Header */}
            <div className="chat-widget-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="chat-widget-avatar">
                  <Bot size={18} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                    HexaKrishi AI
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'rgba(255,255,255,0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#69F0AE',
                        display: 'inline-block',
                      }}
                    />
                    Online · AI Assistant
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  id="chat-widget-clear-btn"
                  onClick={handleClear}
                  title="Clear chat"
                  className="chat-widget-icon-btn"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  id="chat-widget-minimize-btn"
                  onClick={() => setOpen(false)}
                  title="Minimize"
                  className="chat-widget-icon-btn"
                >
                  <Minimize2 size={14} />
                </button>
                <button
                  id="chat-widget-close-btn"
                  onClick={() => setOpen(false)}
                  title="Close"
                  className="chat-widget-icon-btn"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Messages scroll area */}
            <div className="chat-widget-messages">
              {/* Quick prompts shown only when fresh */}
              {messages.length <= 1 && (
                <div style={{ marginBottom: 10 }}>
                  <p
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--color-text-secondary)',
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Quick questions:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => handleSend(p)}
                        className="chat-widget-quick-btn"
                      >
                        <Sparkles
                          size={11}
                          color="var(--color-primary)"
                          style={{ flexShrink: 0 }}
                        />
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {msg.role === 'assistant' && i > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          marginBottom: 3,
                        }}
                      >
                        <div
                          style={{
                            width: 17,
                            height: 17,
                            borderRadius: '50%',
                            background: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <MessageCircle size={9} color="#fff" />
                        </div>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            color: 'var(--color-text-secondary)',
                            fontWeight: 600,
                          }}
                        >
                          AI
                        </span>
                      </div>
                    )}
                    <div
                      className={
                        msg.role === 'user'
                          ? 'chat-widget-bubble-user'
                          : 'chat-widget-bubble-ai'
                      }
                    >
                      {renderMessage(msg.content)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isThinking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <div className="chat-widget-bubble-ai" style={{ padding: 0 }}>
                    <TypingIndicator />
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="chat-widget-input-bar">
              <input
                id="chat-widget-input"
                ref={inputRef}
                className="chat-widget-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask a farming question…"
                disabled={isThinking}
              />
              <button
                id="chat-widget-send-btn"
                onClick={() => handleSend()}
                disabled={!input.trim() || isThinking}
                className="chat-widget-send-btn"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
