import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTasks, Task } from '../hooks/useTasks'
import TaskBoard from '../components/TaskBoard'
import TaskForm from '../components/TaskForm'
import GlobalChatBox from '../components/GlobalChatBox'
import { Plus, LogOut, Bot } from 'lucide-react'

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const { tasks, loading, createTask, updateTaskStatus, updateTask, deleteTask, fetchTasks } = useTasks()
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showGlobalChat, setShowGlobalChat] = useState(false)

  const handleCreateTask = async (task: Partial<Task>) => {
    await createTask(task)
    setShowForm(false)
  }

  const handleEditTask = async (task: Partial<Task>) => {
    if (editingTask) {
      await updateTask(editingTask.id, task)
      setEditingTask(null)
    }
  }

  return (
    <div className="dashboard">
      {/* Top Bar */}
      <header className="topbar">
        <div className="topbar-left">
          <span className="logo">📋 Task Manager</span>
        </div>
        <div className="topbar-right">
          <span className="user-email">{user?.email}</span>
          <button className="btn-secondary" onClick={() => setShowGlobalChat(!showGlobalChat)} title="Trợ lý AI tổng hợp" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Bot size={16} /> Chat AI
          </button>
          <button className="btn-add" onClick={() => setShowForm(true)} id="btn-new-task">
            <Plus size={16} /> Tạo task
          </button>
          <button className="btn-icon" onClick={signOut} title="Đăng xuất" id="btn-logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Kanban Board */}
      {loading ? (
        <div className="empty-state" style={{ flex: 1 }}>
          <div className="spinner" />
          <span>Đang tải tasks...</span>
        </div>
      ) : (
        <TaskBoard
          tasks={tasks}
          onUpdateStatus={updateTaskStatus}
          onEdit={(task) => setEditingTask(task)}
          onDelete={deleteTask}
        />
      )}

      {/* Create Task Modal */}
      {showForm && (
        <TaskForm
          onSubmit={handleCreateTask}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <TaskForm
          task={editingTask}
          onSubmit={handleEditTask}
          onClose={() => setEditingTask(null)}
        />
      )}

      {/* Global AI Chat Panel */}
      {showGlobalChat && (
        <GlobalChatBox
          onClose={() => setShowGlobalChat(false)}
          onTaskUpdated={() => fetchTasks()}
        />
      )}
    </div>
  )
}
