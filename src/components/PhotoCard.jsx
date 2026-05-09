import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { fmtNum, picsum } from '../utils/helpers'

export default function PhotoCard({ photo, onOpen }) {
  const { toggleLike, addToast } = useApp()
  const [liked, setLiked]   = useState(false)
  const [count, setCount]   = useState(photo.likesCount || photo.likes?.length || 0)

  const handleLike = async (e) => {
    e.stopPropagation()
    try {
      const res = await toggleLike(photo._id || photo.id)
      setLiked(res.liked)
      setCount(res.likesCount)
    } catch {
      addToast('Please sign in to like photos', 'info')
    }
  }

  const creatorName = photo.creator?.firstName
    ? `${photo.creator.firstName} ${photo.creator.lastName}`
    : photo.creator?.name || 'Unknown'

  const creatorSeed = photo.creator?.avatar || photo.creator?.seed || 'p10'
  const imgSrc      = photo.imageUrl || picsum(photo.seed, photo.w || 600, photo.h || 600)

  return (
    <div className="masonry-item reveal">
      <article className="photo-card" onClick={() => onOpen(photo._id || photo.id)}>
        <img src={imgSrc} alt={photo.title} loading="lazy" />
        <div className="photo-card-overlay">
          <div className="photo-card-title">{photo.title}</div>
          <div className="photo-card-meta">
            <span>📍 {(photo.location || '').split(',')[0]}</span>
            <span>♥ {fmtNum(count)}</span>
          </div>
        </div>
        <div className="photo-card-actions">
          <button
            className={`card-action-btn ${liked ? 'liked' : ''}`}
            onClick={handleLike}
            title={liked ? 'Unlike' : 'Like'}
          >♥</button>
          <button
            className="card-action-btn"
            onClick={e => { e.stopPropagation(); onOpen(photo._id || photo.id) }}
            title="Open"
          >↗</button>
        </div>
        <div className="photo-creator">
          <div className="avatar" style={{ width:26, height:26 }}>
            <img src={picsum(creatorSeed, 60, 60)} alt="" />
          </div>
          <span className="photo-creator-name">{creatorName}</span>
          <div className="photo-creator-stats">
            <span>♥ {fmtNum(count)}</span>
            <span>💬</span>
          </div>
        </div>
      </article>
    </div>
  )
}
