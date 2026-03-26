import { useState, FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CheckSquare, AlertTriangle } from 'lucide-react'

export default function LoginPage() {
  const { signIn, signUp, configured } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = isRegister
        ? await signUp(email, password)
        : await signIn(email, password)

      if (error) {
        setError(error.message)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
          <CheckSquare size={36} color="#8b5cf6" />
        </div>
        <h1>Task Manager</h1>
        <p className="subtitle">Quản lý công việc thông minh với AI</p>

        {!configured && (
          <div className="error-msg" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} />
            <span>Chưa cấu hình Supabase. Hãy tạo file <code>.env</code> với VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.</span>
          </div>
        )}

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading || !configured}>
            {loading ? 'Đang xử lý...' : isRegister ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </form>

        <div className="toggle-auth">
          {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
          <button onClick={() => { setIsRegister(!isRegister); setError('') }}>
            {isRegister ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </div>
      </div>
    </div>
  )
}
