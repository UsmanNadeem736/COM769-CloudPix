import { useApp } from '../context/AppContext'

export default function Toast() {
  const { toasts, removeToast } = useApp()
  if (!toasts.length) return null
  const icons = { success:'✓', error:'✕', info:'◈' }
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-icon">{icons[t.type] || '◈'}</span>
          <span className="toast-msg">{t.msg}</span>
          <button className="toast-close" onClick={() => removeToast(t.id)}>×</button>
        </div>
      ))}
    </div>
  )
}
