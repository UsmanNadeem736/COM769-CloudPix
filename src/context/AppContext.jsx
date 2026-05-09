import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { auth as authApi, photos as photosApi, comments as commentsApi } from '../services/api'

const AppContext = createContext(null)

function loadUser() {
  try { return JSON.parse(localStorage.getItem('lumora_user') || 'null') } catch { return null }
}

export function AppProvider({ children }) {
  const [user,     setUserState] = useState(loadUser)
  const [toasts,   setToasts]    = useState([])
  const [authOpen, setAuthOpen]  = useState(false)

  // ── Token / user persistence ───────────────────────────────
  const setUser = useCallback((u, token) => {
    setUserState(u)
    if (u) {
      localStorage.setItem('lumora_user', JSON.stringify(u))
      if (token) localStorage.setItem('lumora_token', token)
    } else {
      localStorage.removeItem('lumora_user')
      localStorage.removeItem('lumora_token')
    }
  }, [])

  const logout = useCallback(() => setUser(null), [setUser])

  // Re-validate token on mount
  useEffect(() => {
    const token = localStorage.getItem('lumora_token')
    if (!token) return
    authApi.me().then(({ user }) => setUser(user, token)).catch(() => setUser(null))
  }, [setUser])

  // ── Toasts ─────────────────────────────────────────────────
  const addToast = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3400)
  }, [])

  const removeToast = useCallback((id) =>
    setToasts(prev => prev.filter(t => t.id !== id)), [])

  // ── Photos ─────────────────────────────────────────────────
  const fetchPhotos = useCallback((params) => photosApi.list(params), [])

  const createPhoto = useCallback(async (formData) => {
    const { photo } = await photosApi.create(formData)
    return photo
  }, [])

  const updatePhoto = useCallback(async (id, body) => {
    const { photo } = await photosApi.update(id, body)
    return photo
  }, [])

  const deletePhoto = useCallback(async (id) => {
    await photosApi.remove(id)
  }, [])

  const toggleLike = useCallback(async (photoId) => {
    return photosApi.like(photoId)
  }, [])

  const setRating = useCallback(async (photoId, value) => {
    return photosApi.rate(photoId, value)
  }, [])

  const getMyRating = useCallback((photoId) => photosApi.myRating(photoId), [])

  // ── Comments ───────────────────────────────────────────────
  const fetchComments = useCallback((photoId) => commentsApi.list(photoId), [])

  const addComment = useCallback(async (photoId, text) => {
    const { comment } = await commentsApi.create(photoId, text)
    return comment
  }, [])

  const deleteComment = useCallback(async (photoId, commentId) => {
    await commentsApi.remove(photoId, commentId)
  }, [])

  // ── Auth modal ─────────────────────────────────────────────
  const openAuth  = useCallback(() => setAuthOpen(true),  [])
  const closeAuth = useCallback(() => setAuthOpen(false), [])

  return (
    <AppContext.Provider value={{
      user, setUser, logout,
      toasts, addToast, removeToast,
      fetchPhotos, createPhoto, updatePhoto, deletePhoto,
      toggleLike, setRating, getMyRating,
      fetchComments, addComment, deleteComment,
      authOpen, openAuth, closeAuth,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
