import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'

export interface Task {
  id: string
  userId: string
  title: string
  description: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  deadline: string | null
  tags: string[]
  createdAt: string
  startedAt?: string
  completedAt?: string
  scheduledStartTime?: string | null
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await api.get<Task[]>('/api/tasks')
      setTasks(data)
    } catch (err: any) {
      console.error('Failed to fetch tasks:', err)
      setError(err?.response?.data?.error || 'Không thể tải danh sách task')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const createTask = async (taskData: Partial<Task>) => {
    const { data } = await api.post<Task>('/api/tasks', taskData)
    setTasks(prev => [data, ...prev])
    return data
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    await api.patch(`/api/tasks/${taskId}/status`, { status })
    setTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, status: status as Task['status'] } : t)
    )
  }

  const updateTask = async (taskId: string, taskData: Partial<Task>) => {
    await api.put(`/api/tasks/${taskId}`, taskData)
    setTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, ...taskData } : t)
    )
  }

  const deleteTask = async (taskId: string) => {
    await api.delete(`/api/tasks/${taskId}`)
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  return { tasks, loading, error, fetchTasks, createTask, updateTaskStatus, updateTask, deleteTask }
}
