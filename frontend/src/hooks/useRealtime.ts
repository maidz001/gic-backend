import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface ChatMessage {
  id: string
  user_id: string
  task_id: string
  content: string
  isAi: boolean
  created_at: string
}

export function useRealtime(taskId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // Helper để normalize message từ bất kỳ nguồn nào (API hoặc Realtime)
  const normalizeMessage = useCallback((m: any): ChatMessage => ({
    id: m.id,
    user_id: m.user_id ?? m.userId ?? '',
    task_id: m.task_id ?? m.taskId ?? '',
    content: m.content,
    // Xử lý mọi dạng field name có thể có
    isAi: m.isAi ?? m.is_ai ?? m.ai ?? false,
    created_at: m.created_at ?? m.createdAt ?? new Date().toISOString(),
  }), [])

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev
      return [...prev, msg]
    })
  }, [])

  const setNormalizedMessages = useCallback((rawMessages: any[]) => {
    setMessages(rawMessages.map(normalizeMessage))
  }, [normalizeMessage])

  useEffect(() => {
    if (!taskId) {
      setMessages([])
      return
    }

    // Lắng nghe INSERT mới qua Supabase Realtime
    const channel = supabase
      .channel(`messages-${taskId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          const newMsg = normalizeMessage(payload.new)
          addMessage(newMsg)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [taskId, normalizeMessage, addMessage])

  return { messages, setMessages: setNormalizedMessages, addMessage }
}
