import { useDraggable } from '@dnd-kit/core'
import { Task } from '../hooks/useTasks'
import { Edit3, Trash2, MessageCircle, Clock, CheckCircle, PlayCircle } from 'lucide-react'

interface Props {
  task: Task
  onEdit: () => void
  onDelete: () => void
  onComplete: () => void
  onStart: () => void
  isDragging: boolean
}

export default function TaskCard({ task, onEdit, onDelete, onComplete, onStart, isDragging }: Props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  })

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  const getDeadlineClass = () => {
    if (!task.deadline) return ''
    const now = new Date()
    const deadline = new Date(task.deadline)
    const diff = deadline.getTime() - now.getTime()
    if (diff < 0) return 'overdue'
    if (diff < 24 * 60 * 60 * 1000) return 'soon'
    return ''
  }

  const formatDeadline = (deadline: string) => {
    const d = new Date(deadline)
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatDuration = (start: string, end: string) => {
    const ms = new Date(end).getTime() - new Date(start).getTime()
    const seconds = Math.floor((ms / 1000) % 60)
    const minutes = Math.floor((ms / 60000) % 60)
    const hours = Math.floor(ms / 3600000)
    return `${hours} giờ ${minutes} phút ${seconds} giây`
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-card ${isDragging ? 'dragging' : ''}`}
    >
      <div className="task-card-header">
        <span className="task-card-title">{task.title}</span>
        <div className="task-card-actions">
          {task.status === 'TODO' && (
            <button className="start-btn" onClick={(e) => { e.stopPropagation(); onStart() }} title="Bắt đầu thực hiện">
              <PlayCircle size={14} color="#3B82F6" />
            </button>
          )}
          {task.status !== 'DONE' && (
            <button className="complete-btn" onClick={(e) => { e.stopPropagation(); onComplete() }} title="Đánh dấu hoàn thành">
              <CheckCircle size={14} color="#10B981" />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onEdit() }} title="Chỉnh sửa">
            <Edit3 size={14} />
          </button>
          <button className="delete-btn" onClick={(e) => { e.stopPropagation(); onDelete() }} title="Xóa">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="task-card-desc">{task.description}</p>
      )}

      <div className="task-card-footer" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>
        {task.scheduledStartTime && task.status === 'TODO' && (
          <span className="deadline-text" style={{ color: '#3B82F6' }}>
            <Clock size={12} /> Bắt đầu: {formatDeadline(task.scheduledStartTime)}
          </span>
        )}
        {task.deadline && (
          <span className={`deadline-text ${getDeadlineClass()}`}>
            <Clock size={12} />
            {formatDeadline(task.deadline)}
          </span>
        )}
        {task.status === 'DONE' && task.startedAt && task.completedAt && (
          <span className="duration-text" style={{ fontSize: '0.75rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
            <Clock size={12} />
            Đã làm: {formatDuration(task.startedAt, task.completedAt)}
          </span>
        )}
      </div>

      {task.tags && task.tags.length > 0 && (
        <div className="task-tags">
          {task.tags.map((tag, i) => (
            <span key={i} className="tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
  )
}
