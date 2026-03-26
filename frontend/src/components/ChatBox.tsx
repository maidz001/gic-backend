import { useState, useEffect, useRef, FormEvent } from 'react'
import api from '../lib/api'
import { X, Send, Bot, Loader2 } from 'lucide-react'

interface ChatMessage {
  id: string
  userId: string
  taskId: string
  content: string
  isAi: boolean
  createdAt: string
}

interface Props {
  taskId: string
  taskTitle: string
  onClose: () => void
}

export default function ChatBox({ taskId, taskTitle, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingHistory(true)
        const { data } = await api.get<ChatMessage[]>(`/api/chat/${taskId}`)
        setMessages(data)
      } catch (err) {
        console.error('Failed to load messages:', err)
      } finally {
        setLoadingHistory(false)
      }
    }
    load()
  }, [taskId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    const content = input.trim()
    if (!content || sending) return
    setInput('')
    setSending(true)
    try {
      const { data } = await api.post<ChatMessage[]>(`/api/chat/${taskId}`, { content })
      setMessages(data)
    } catch (err) {
      console.error('Send failed:', err)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const quickCommands = [
    { label: '🎯 Ưu tiên',  cmd: '/ai tôi nên làm gì tiếp theo?' },
    { label: '📅 Deadline', cmd: '/ai deadline tuần này có gì?' },
    { label: '📊 Tổng quan', cmd: '/ai tóm tắt tiến độ công việc' },
    { label: '✂️ Chia nhỏ', cmd: '/ai gợi ý cách chia nhỏ task này' },
  ]

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <Bot size={18} color="var(--accent-purple)" style={{ flexShrink: 0 }} />
        <h3 style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {taskTitle}
        </h3>
        <button className="btn-icon" onClick={onClose} title="Đóng (Esc)">
          <X size={18} />
        </button>
      </div>

      <div className="chat-quick-cmds">
        {quickCommands.map(q => (
          <button key={q.cmd} className="quick-cmd-btn" onClick={() => setInput(q.cmd)}>
            {q.label}
          </button>
        ))}
      </div>

      <div className="chat-messages">
        {loadingHistory ? (
          <div className="empty-state">
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Đang tải...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <Bot size={36} style={{ opacity: 0.25 }} />
            <span style={{ fontWeight: 500 }}>Chưa có tin nhắn</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Nhắn tin bình thường hoặc dùng nút gợi ý bên trên.<br />
              Gõ <strong style={{ color: 'var(--accent-purple)' }}>/ai</strong> + câu hỏi để hỏi AI.
            </span>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`chat-message ${msg.isAi ? 'ai' : 'user'}`}>
              <div className="msg-label">
                <span>{msg.isAi ? '🤖 AI Assistant' : '👤 Bạn'}</span>
                <span className="msg-time">{formatTime(msg.createdAt)}</span>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="chat-message ai">
            <div className="msg-label"><span>🤖 AI Assistant</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ width: 14, height: 14 }} />
              <span style={{ fontSize: '0.8rem' }}>Đang suy nghĩ...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-hint">
        💡 AI đọc tất cả tasks và trả lời theo context thực tế của bạn.
      </div>

      <form className="chat-input-area" onSubmit={handleSend}>
        <input
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Nhắn tin hoặc /ai [câu hỏi]..."
          disabled={sending}
          autoComplete="off"
        />
        <button className="chat-send" type="submit" disabled={sending || !input.trim()} title="Gửi (Enter)">
          {sending
            ? <div className="spinner" style={{ width: 16, height: 16 }} />
            : <Send size={16} />
          }
        </button>
      </form>
    </div>
  )
}
