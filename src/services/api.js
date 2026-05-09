import { coalesceRequest, coalescePhotoList, coalescePhotoDetail } from './coalesce'

const BASE = import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('lumora_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { ...options.headers }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg = data?.error || data?.errors?.[0]?.msg || `HTTP ${res.status}`
    throw new Error(msg)
  }
  return data
}

// ── Auth ─────────────────────────────────────────────────────
export const auth = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body) => request('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  // Coalesced: multiple components calling me() simultaneously share one request
  me: () => coalesceRequest('auth:me', () => request('/auth/me')),
}

// ── Photos ───────────────────────────────────────────────────
export const photos = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== 'All')
    ).toString()
    // 30 s TTL: identical queries reuse cached result across components
    return coalescePhotoList(`photos:list:${qs}`, () => request(`/photos${qs ? '?' + qs : ''}`))
  },

  // 60 s TTL: opening the same photo twice in quick succession skips re-fetch
  get: (id) => coalescePhotoDetail(`photos:${id}`, () => request(`/photos/${id}`)),

  // Mutations bust relevant cache keys so stale data is never served
  create: (formData) => {
    coalescePhotoList.invalidate()
    return request('/photos', { method: 'POST', body: formData })
  },

  update: (id, body) => {
    coalescePhotoDetail.invalidate(`photos:${id}`)
    coalescePhotoList.invalidate()
    return request(`/photos/${id}`, { method: 'PUT', body: JSON.stringify(body) })
  },

  remove: (id) => {
    coalescePhotoDetail.invalidate(`photos:${id}`)
    coalescePhotoList.invalidate()
    return request(`/photos/${id}`, { method: 'DELETE' })
  },

  like:  (id)        => request(`/photos/${id}/like`, { method: 'POST' }),
  rate:  (id, value) => request(`/photos/${id}/rate`, { method: 'POST', body: JSON.stringify({ value }) }),

  // Per-photo coalescing: safe to call from multiple components on the same page
  myRating: (id) => coalesceRequest(`photos:${id}:myRating`, () => request(`/photos/${id}/my-rating`)),
}

// ── Comments ─────────────────────────────────────────────────
export const comments = {
  // Coalesced: opening the same modal twice won't double-fetch
  list: (photoId) => coalesceRequest(`comments:${photoId}`, () => request(`/photos/${photoId}/comments`)),

  create: (photoId, text) => {
    coalesceRequest.invalidate(`comments:${photoId}`)
    return request(`/photos/${photoId}/comments`, { method: 'POST', body: JSON.stringify({ text }) })
  },

  remove: (photoId, commentId) => {
    coalesceRequest.invalidate(`comments:${photoId}`)
    return request(`/photos/${photoId}/comments/${commentId}`, { method: 'DELETE' })
  },
}
