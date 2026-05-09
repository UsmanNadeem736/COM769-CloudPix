export function fmtNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 10_000)    return Math.round(n / 1_000) + 'K'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

export function formatDate(str) {
  return new Date(str).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
}

export function picsum(seed, w, h) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`
}
