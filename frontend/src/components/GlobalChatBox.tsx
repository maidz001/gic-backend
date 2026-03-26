import { useState, useEffect, useRef, FormEvent } from 'react'
import api from '../lib/api'
import { X, Send, Bot } from 'lucide-react'

interface ChatMessage {
  id: string
  content: string
  isAi: boolean
  createdAt: string
}

interface Props {
  onClose: () => void
  onTaskUpdated: () => void
}

export default function GlobalChatBox({ onClose, onTaskUpdated }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150)
  }, [])

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    const content = input.trim()
    if (!content || sending) return
    setInput('')
    
    const userMsg: ChatMessage = {
      id: Date.now().toString() + '-user',
      content,
      isAi: false,
      createdAt: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMsg])
    setSending(true)

    try {
      const historyStr = messages.map(m => `${m.isAi ? 'AI' : 'User'}: ${m.content}`).join('\n')
      const { data } = await api.post<{ reply: string, taskUpdated: boolean }>('/api/ai/global-chat', { 
        message: content,
        history: historyStr
      })
      const aiMsg: ChatMessage = {
        id: Date.now().toString() + '-ai',
        content: data.reply || 'Đã xử lý xong!',
        isAi: true,
        createdAt: new Date().toISOString()
      }
      setMessages(prev => [...prev, aiMsg])
      
      if (data.taskUpdated) {
        onTaskUpdated()
      }
    } catch (err) {
      console.error('Global Chat Send failed:', err)
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-err',
        content: 'Xin lỗi, đã xảy ra lỗi kết nối với máy chủ AI.',
        isAi: true,
        createdAt: new Date().toISOString()
      }])
    } finally {
      setSending(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  return (
    <div style={{ position: 'fixed', right: '1.5rem', bottom: '1.5rem', width: '380px', height: '550px', maxHeight: 'calc(100vh - 6rem)', zIndex: 9999, borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--bg-body)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
        <Bot size={20} color="var(--accent-purple)" />
        <h3 style={{ flex: 1, margin: 0, fontSize: '1rem', fontWeight: 600 }}>Trợ lý AI Tổng hợp</h3>
        <button className="btn-icon" onClick={onClose} title="Đóng" type="button">
          <X size={18} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', opacity: 0.7 }}>
            <Bot size={48} style={{ opacity: 0.2 }} />
            <span style={{ fontWeight: 500 }}>Chưa có tin nhắn</span>
            <span style={{ fontSize: '0.85rem', textAlign: 'center' }}>
              Hãy giao việc cho tôi!<br />
              Ví dụ: &quot;Tạo task làm báo cáo quý 1&quot;, hoặc &quot;Hoàn thành task đầu tiên&quot;
            </span>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} style={{ alignSelf: msg.isAi ? 'flex-start' : 'flex-end', maxWidth: '85%', padding: '0.75rem', borderRadius: '12px', backgroundColor: msg.isAi ? 'var(--bg-body)' : 'var(--accent-primary)', color: msg.isAi ? 'inherit' : 'white' }}>
              <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem', opacity: 0.8 }}>
                {msg.isAi ? '🤖 AI' : '👤 Bạn'} • {formatTime(msg.createdAt)}
              </div>
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.9rem' }}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div style={{ alignSelf: 'flex-start', padding: '0.75rem', borderRadius: '12px', backgroundColor: 'var(--bg-body)' }}>
            <div className="spinner" style={{ width: 14, height: 14, borderTopColor: 'var(--accent-purple)' }} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', padding: '1rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Yêu cầu AI thao tác..."
          disabled={sending}
          autoComplete="off"
          style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '999px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-card)', color: 'inherit' }}
        />
        <button type="submit" disabled={sending || !input.trim()} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: (sending || !input.trim()) ? 0.5 : 1 }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
