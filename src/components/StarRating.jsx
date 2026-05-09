import { useState } from 'react'

export default function StarRating({ value = 0, avg = 0, count = 0, onRate }) {
  const [hover, setHover] = useState(0)
  const display = hover || value || Math.round(avg)

  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <div className="star-rating">
        {[1,2,3,4,5].map(i => (
          <span
            key={i}
            className={`star ${i <= display ? 'active' : ''}`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onRate?.(i)}
          >★</span>
        ))}
      </div>
      <span className="rating-label">{avg.toFixed(1)} · {count.toLocaleString()} ratings</span>
    </div>
  )
}
