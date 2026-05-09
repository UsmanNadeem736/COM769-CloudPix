import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { picsum } from '../utils/helpers'

export default function Nav({ variant = 'transparent', onSearch, showSearch = false }) {
  const { user, logout, addToast, openAuth } = useApp()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(variant === 'solid')

  useEffect(() => {
    if (variant === 'solid') return
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [variant])

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to={user ? (user.role === 'creator' ? '/creator' : '/feed') : '/'} className="nav-logo">
          <span className="logo-mark">◈</span>
          <span>Lumora</span>
        </Link>

        {showSearch && (
          <div className="nav-center">
            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input
                className="search-input"
                type="search"
                placeholder="Search photos, places, creators…"
                onChange={e => onSearch?.(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="nav-right">
          {user ? (
            <>
              {user.role === 'consumer' && (
                <button
                  className="btn btn-icon btn-ghost"
                  style={{ fontSize:20, position:'relative' }}
                  onClick={() => addToast('Notifications — Azure Service Bus in production', 'info')}
                >
                  🔔
                  <span style={{ position:'absolute', top:7, right:7, width:8, height:8, background:'var(--rose)', borderRadius:'50%', border:'2px solid var(--bg)' }} />
                </button>
              )}
              {user.role === 'creator' && (
                <Link to="/feed" className="btn btn-ghost btn-sm">View Feed</Link>
              )}
              <div
                style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 10px 4px 4px', borderRadius:'var(--rf)', cursor:'pointer', transition:'all var(--t-norm)' }}
                onClick={handleLogout}
                title="Sign out"
              >
                <div className="avatar" style={{ width:32, height:32 }}>
                  <img src={picsum(user.avatar, 80, 80)} alt="" />
                </div>
                <span style={{ fontSize:'13.5px', fontWeight:500 }}>{user.name.split(' ')[0]}</span>
              </div>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={openAuth}>Sign In</button>
              <button className="btn btn-gold"  onClick={openAuth}>Join Free</button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
