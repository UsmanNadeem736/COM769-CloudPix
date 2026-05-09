import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { auth as authApi } from '../services/api'

export default function AuthModal({ open, onClose }) {
  const { setUser, addToast } = useApp()
  const navigate = useNavigate()

  const [tab,       setTab]      = useState('login')
  const [role,      setRole]     = useState('consumer')
  const [firstName, setFirst]    = useState('')
  const [lastName,  setLast]     = useState('')
  const [email,     setEmail]    = useState('')
  const [password,  setPassword] = useState('')
  const [loading,   setLoading]  = useState(false)
  const [error,     setError]    = useState('')

  const afterLogin = (user, token) => {
    setUser(user, token)
    addToast(`Welcome${user.role === 'creator' ? ', Creator' : ''}! ${user.firstName} 👋`, 'success')
    onClose()
    setTimeout(() => navigate(user.role === 'creator' ? '/creator' : '/feed'), 300)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await authApi.login({ email, password })
      afterLogin(user, token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await authApi.register({ firstName, lastName, email, password, role })
      afterLogin(user, token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (demoRole) => {
    setError('')
    setLoading(true)
    try {
      const demoEmail = demoRole === 'creator' ? 'alex@lumora.dev' : 'demo@lumora.dev'
      const { token, user } = await authApi.login({ email: demoEmail, password: 'lumora123' })
      afterLogin(user, token)
    } catch (err) {
      setError('Demo account unavailable — please register.')
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (t) => { setTab(t); setRole('consumer'); setError('') }

  return (
    <>
      <div className={`modal-backdrop ${open ? 'open' : ''}`} onClick={onClose} />
      <div className={`auth-modal ${open ? 'open' : ''}`}>
        <button className="auth-close" onClick={onClose}>×</button>
        <div className="auth-brand">
          <span className="logo-mark">◈</span>
          <span>Lumora</span>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab==='login'?'active':''}`}    onClick={() => switchTab('login')}>Sign In</button>
          <button className={`auth-tab ${tab==='register'?'active':''}`} onClick={() => switchTab('register')}>Create Account</button>
        </div>

        {error && (
          <div style={{ margin:'0 0 12px', padding:'10px 14px', borderRadius:'var(--r2)', background:'#FFF0F0', border:'1px solid #FFCDD2', color:'#C62828', fontSize:13 }}>
            {error}
          </div>
        )}

        {/* ── LOGIN ─────────────────────────────── */}
        {tab === 'login' && (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" className="form-input" placeholder="your@email.com" required
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" className="form-input" placeholder="••••••••" required
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-gold btn-full btn-lg" disabled={loading}>
              {loading ? 'Signing In…' : 'Sign In to Lumora'}
            </button>
            <p className="auth-divider"><span>or continue as demo user</span></p>
            <div className="demo-btns">
              <button type="button" className="btn btn-outline" style={{flex:1}} disabled={loading}
                onClick={() => handleDemoLogin('consumer')}>
                👁 Consumer
              </button>
              <button type="button" className="btn btn-outline" style={{flex:1}} disabled={loading}
                onClick={() => handleDemoLogin('creator')}>
                📸 Creator
              </button>
            </div>
          </form>
        )}

        {/* ── REGISTER ──────────────────────────── */}
        {tab === 'register' && (
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input type="text" className="form-input" placeholder="First name" required
                  value={firstName} onChange={e => setFirst(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" className="form-input" placeholder="Last name" required
                  value={lastName} onChange={e => setLast(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" className="form-input" placeholder="your@email.com" required
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" className="form-input" placeholder="Create a strong password" required minLength={6}
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Account Type</label>
              <div style={{ display:'flex', gap:10 }}>
                {['consumer','creator'].map(r => (
                  <label key={r} style={{ flex:1, cursor:'pointer' }}>
                    <input type="radio" name="role" value={r} style={{ display:'none' }}
                      checked={role === r} onChange={() => setRole(r)} />
                    <div style={{
                      padding:'14px 16px', borderRadius:'var(--r2)',
                      border:`2px solid ${role===r?'var(--gold)':'var(--border)'}`,
                      background: role===r ? 'var(--gold-pale)' : 'var(--surface)',
                      transition:'all var(--t-norm)', textAlign:'center',
                    }}>
                      <div style={{ fontSize:26, marginBottom:6 }}>{r==='consumer'?'👁':'📸'}</div>
                      <div style={{ fontWeight:600, fontSize:13.5, color: role===r ? 'var(--gold-dark)' : 'var(--text-1)' }}>
                        {r.charAt(0).toUpperCase()+r.slice(1)}
                      </div>
                      <div style={{ fontSize:12, color:'var(--text-3)', marginTop:3 }}>
                        {r==='consumer'?'Browse & discover photos':'Upload & share photos'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {role === 'creator' && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:'var(--r2)', background:'#FFF8E7', border:'1px solid #F0D9A0', marginTop:8 }}>
                  <span style={{ fontSize:15 }}>✦</span>
                  <span style={{ fontSize:12.5, color:'#7A5C1E' }}>Creator accounts have full upload access and a dedicated studio dashboard.</span>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-gold btn-full btn-lg" disabled={loading}>
              {loading ? 'Creating Account…' : `Create ${role === 'creator' ? 'Creator' : 'Consumer'} Account`}
            </button>
          </form>
        )}
      </div>
    </>
  )
}
