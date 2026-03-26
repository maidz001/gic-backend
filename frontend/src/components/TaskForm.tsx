import { useState, FormEvent, useEffect } from 'react'
import { Task } from '../hooks/useTasks'
import { X, Plus } from 'lucide-react'

interface Props {
  task?: Task
  onSubmit: (task: Partial<Task>) => Promise<void>
  onClose: () => void
}

export default function TaskForm({ task, onSubmit, onClose }: Props) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [priority, setPriority] = useState<Task['priority']>(task?.priority || 'MEDIUM')
  const [deadline, setDeadline] = useState(
    task?.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ''
  )
  const [scheduledStartTime, setScheduledStartTime] = useState(
    task?.scheduledStartTime ? new Date(task.scheduledStartTime).toISOString().slice(0, 16) : ''
  )
  const [tags, setTags] = useState(task?.tags?.join(', ') || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Đóng modal khi nhấn Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Vui lòng nhập tiêu đề task')
      return
    }

    setError('')
    setLoading(true)

    try {
      const taskData: Partial<Task> = {
        title: trimmedTitle,
        description: description.trim(),
        priority,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime).toISOString() : null,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        status: task?.status || 'TODO',
      }
      await onSubmit(taskData)
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Có lỗi xảy ra, thử lại!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? '✏️ Chỉnh sửa Task' : '➕ Tạo Task Mới'}</h2>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="error-msg" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Tiêu đề */}
          <div className="form-group">
            <label htmlFor="task-title">Tiêu đề *</label>
            <input
              id="task-title"
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề task..."
              required
              autoFocus
            />
          </div>

          {/* Mô tả */}
          <div className="form-group">
            <label htmlFor="task-desc">Mô tả</label>
            <textarea
              id="task-desc"
              className="form-textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Mô tả chi tiết (tùy chọn)..."
              rows={3}
            />
          </div>

          {/* Priority */}
          <div className="form-group">
            <label htmlFor="task-priority">Mức độ ưu tiên</label>
            <select
              id="task-priority"
              className="form-select"
              value={priority}
              onChange={e => setPriority(e.target.value as Task['priority'])}
            >
              <option value="LOW">🟢 Thấp</option>
              <option value="MEDIUM">🟡 Trung bình</option>
              <option value="HIGH">🔴 Cao</option>
            </select>
          </div>

          {/* Schedule & Deadline */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="task-schedule">Giờ thực hiện</label>
              <input
                id="task-schedule"
                type="datetime-local"
                className="form-input"
                value={scheduledStartTime}
                onChange={e => setScheduledStartTime(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="task-deadline">Deadline</label>
              <input
                id="task-deadline"
                type="datetime-local"
                className="form-input"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label htmlFor="task-tags">Tags <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(phân cách bằng dấu phẩy)</span></label>
            <input
              id="task-tags"
              className="form-input"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="frontend, urgent, design..."
            />
          </div>

          {/* Buttons */}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !title.trim()}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                  Đang lưu...
                </span>
              ) : task ? '💾 Cập nhật' : '✅ Tạo task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
