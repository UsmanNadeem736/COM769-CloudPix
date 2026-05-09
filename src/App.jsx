import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Toast from './components/Toast'
import AuthModal from './components/AuthModal'
import Landing from './pages/Landing'
import Feed from './pages/Feed'
import Creator from './pages/Creator'
import PhotoPage from './pages/PhotoPage'

function ProtectedRoute({ children, role }) {
  const { user } = useApp()
  if (!user) return <Navigate to="/" replace />
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'creator' ? '/creator' : '/feed'} replace />
  }
  return children
}

function GlobalModals() {
  const { authOpen, closeAuth } = useApp()
  return <AuthModal open={authOpen} onClose={closeAuth} />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toast />
      <GlobalModals />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
        <Route path="/creator" element={<ProtectedRoute role="creator"><Creator /></ProtectedRoute>} />
        <Route path="/photo/:id" element={<ProtectedRoute><PhotoPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
