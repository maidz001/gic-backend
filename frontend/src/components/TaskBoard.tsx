import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core'
import { Task } from '../hooks/useTasks'
import TaskCard from './TaskCard'
import { InboxIcon, Loader, CheckCircle2 } from 'lucide-react'

interface Props {
  tasks: Task[]
  onUpdateStatus: (id: string, status: Task['status']) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

const COLUMNS = [
  { id: 'TODO', label: '📋 Todo', className: 'column-todo' },
  { id: 'IN_PROGRESS', label: '🔄 In Progress', className: 'column-inprogress' },
  { id: 'DONE', label: '✅ Done', className: 'column-done' },
]

export default function TaskBoard({ tasks, onUpdateStatus, onEdit, onDelete }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const getTasksByStatus = (status: string) => tasks.filter(t => t.status === status)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id as string
    if (overId && COLUMNS.some(c => c.id === overId)) {
      setDragOverColumn(overId)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    setDragOverColumn(null)

    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as string

    // Only update if dropped on a column
    if (COLUMNS.some(c => c.id === newStatus)) {
      const task = tasks.find(t => t.id === taskId)
      if (task && task.status !== newStatus) {
        onUpdateStatus(taskId, newStatus as Task['status'])
      }
    }
  }

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="board-container">
        {COLUMNS.map(col => {
          const columnTasks = getTasksByStatus(col.id)
          return (
            <div key={col.id} className={`kanban-column ${col.className}`}>
              <div className="column-header">
                <h2>{col.label}</h2>
                <span className="count">{columnTasks.length}</span>
              </div>
              <DroppableColumn
                id={col.id}
                isDragOver={dragOverColumn === col.id}
              >
                {columnTasks.length === 0 ? (
                  <div className="empty-state">
                    <InboxIcon size={28} />
                    <span>Không có task</span>
                  </div>
                ) : (
                  columnTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => onEdit(task)}
                      onDelete={() => onDelete(task.id)}
                      onComplete={() => onUpdateStatus(task.id, 'DONE')}
                      onStart={() => onUpdateStatus(task.id, 'IN_PROGRESS')}
                      isDragging={false}
                    />
                  ))
                )}
              </DroppableColumn>
            </div>
          )
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            onEdit={() => {}}
            onDelete={() => {}}
            onComplete={() => {}}
            onStart={() => {}}
            isDragging={false}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

// Droppable column wrapper
import { useDroppable } from '@dnd-kit/core'
import { ReactNode } from 'react'

function DroppableColumn({ id, isDragOver, children }: { id: string; isDragOver: boolean; children: ReactNode }) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`column-tasks ${isDragOver ? 'drag-over' : ''}`}
    >
      {children}
    </div>
  )
}
