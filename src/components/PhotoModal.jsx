import { createPortal } from 'react-dom'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { photos as photosApi } from '../services/api'
import StarRating from './StarRating'
import { fmtNum, formatDate, picsum } from '../utils/helpers'

const SENTIMENT_ICON = { positive: '😊', neutral: '😐', negative: '😟' }

export default function PhotoModal({ photoId, onClose }) {
  const { user, toggleLike, setRating, fetchComments, addComment, addToast } = useApp()

  const [photo,        setPhoto]       = useState(null)
  const [commentList,  setComments]    = useState([])
  const [commentText,  setCommentText] = useState('')
  const [liked,        setLiked]       = useState(false)
  const [likesCount,   setLikesCount]  = useState(0)
  const [userRating,   setUserRating]  = useState(0)
  const [posting,      setPosting]     = useState(false)

  useEffect(() => {
    if (!photoId) return
    let cancelled = false

    photosApi.get(photoId).then(({ photo: p }) => {
      if (cancelled) return
      setPhoto(p)
      setLikesCount(p.likesCount || p.likes?.length || 0)
    }).catch(() => addToast('Failed to load photo', 'error'))

    fetchComments(photoId).then(({ comments }) => {
      if (!cancelled) setComments(comments)
    }).catch(() => {})

    if (user) {
      photosApi.myRating(photoId).then(({ rating }) => {
        if (!cancelled) setUserRating(rating)
      }).catch(() => {})
    }

    return () => { cancelled = true }
  }, [photoId, user, fetchComments, addToast])

  const handleLike = async () => {
    try {
      const res = await toggleLike(photoId)
      setLiked(res.liked)
      setLikesCount(res.likesCount)
      if (res.liked) addToast('Added to your likes ♥', 'success')
    } catch {
      addToast('Please sign in to like photos', 'info')
    }
  }

  const handleRate = async (val) => {
    try {
      const res = await setRating(photoId, val)
      setUserRating(val)
      if (photo) setPhoto(prev => ({ ...prev, ratingAverage: res.ratingAverage, ratingCount: res.ratingCount }))
      addToast(`You rated this ${val} ★`, 'success')
    } catch {
      addToast('Failed to submit rating', 'error')
    }
  }

  const handleComment = async () => {
    if (!commentText.trim()) return
    setPosting(true)
    try {
      const c = await addComment(photoId, commentText.trim())
      setComments(prev => [c, ...prev])
      setCommentText('')
      addToast('Comment posted!', 'success')
    } catch (err) {
      addToast(err.message || 'Failed to post comment', 'error')
    } finally {
      setPosting(false)
    }
  }

  if (!photo) return null

  const creatorName = photo.creator?.firstName
    ? `${photo.creator.firstName} ${photo.creator.lastName}`
    : photo.creator?.name || 'Unknown'
  const creatorSeed = photo.creator?.avatar || 'p10'
  const imgSrc      = photo.imageUrl || picsum(photo.seed, photo.w || 600, photo.h || 600)

  return createPortal(
    <>
      <div className="modal-backdrop open" onClick={onClose} />
      <div className="photo-modal open">
        <div className="photo-modal-inner">
          {/* Image */}
          <div className="photo-modal-img">
            <button className="photo-modal-close" onClick={onClose}>×</button>
            <img src={imgSrc} alt={photo.title} />
          </div>

          {/* Info panel */}
          <div className="photo-modal-info">
            <div className="photo-modal-header">
              <div className="avatar avatar-ring" style={{ width:40, height:40 }}>
                <div className="avatar" style={{ width:36, height:36 }}>
                  <img src={picsum(creatorSeed, 80, 80)} alt="" />
                </div>
              </div>
              <div>
                <div className="photo-modal-creator-name">{creatorName}</div>
                <div className="photo-modal-date">{formatDate(photo.createdAt || photo.date)}</div>
              </div>
              <Link to={`/photo/${photo._id || photo.id}`} className="btn btn-ghost btn-sm"
                onClick={onClose} style={{ marginLeft:'auto' }}>Open ↗</Link>
            </div>

            <div className="photo-modal-body">
              <h2 className="photo-modal-title">{photo.title}</h2>
              {photo.caption && <p className="photo-modal-caption">{photo.caption}</p>}
              {photo.location && (
                <div className="meta-row"><span className="meta-icon">📍</span><span>{photo.location}</span></div>
              )}
              {photo.people?.length > 0 && (
                <div className="meta-row" style={{ alignItems:'flex-start' }}>
                  <span className="meta-icon">👤</span>
                  <div className="people-chips">
                    {photo.people.map(p => <span key={p} className="person-chip">{p}</span>)}
                  </div>
                </div>
              )}
              {photo.tags?.length > 0 && (
                <div className="meta-row" style={{ flexWrap:'wrap', gap:4, marginTop:8 }}>
                  {photo.tags.map(t => (
                    <span key={t} style={{ fontSize:11, padding:'2px 8px', borderRadius:'var(--rf)', background:'var(--gold-pale)', color:'var(--gold-dark)' }}>#{t}</span>
                  ))}
                </div>
              )}
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:12, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-3)', marginBottom:6 }}>Your Rating</div>
                <StarRating value={userRating} avg={photo.ratingAverage || 0} count={photo.ratingCount || 0} onRate={handleRate} />
              </div>
            </div>

            {/* Like row */}
            <div className="like-section">
              <button className={`like-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
                <span className="heart">♥</span>
                <span>{fmtNum(likesCount)}</span>
                <span>likes</span>
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => addToast('Link copied!', 'success')}>Share ↗</button>
              <button className="btn btn-ghost btn-sm" onClick={() => addToast('Saved to collection ✦', 'success')}>Save ✦</button>
            </div>

            {/* Comments */}
            <div className="comments-section" style={{ flex:1, overflowY:'auto' }}>
              <div className="comments-title">Comments ({commentList.length})</div>
              {commentList.map((c) => {
                const authorName = c.author?.firstName
                  ? `${c.author.firstName} ${c.author.lastName}`
                  : c.author?.name || c.author
                const authorSeed = c.author?.avatar || 'demo_c'
                return (
                  <div key={c._id || Math.random()} className="comment-item">
                    <div className="avatar" style={{ width:30, height:30, flexShrink:0 }}>
                      <img src={picsum(authorSeed, 60, 60)} alt="" />
                    </div>
                    <div className="comment-body">
                      <div className="comment-author">
                        {authorName}
                        {c.sentimentLabel && (
                          <span title={`Sentiment: ${c.sentimentLabel}`} style={{ marginLeft:4, fontSize:13 }}>
                            {SENTIMENT_ICON[c.sentimentLabel]}
                          </span>
                        )}
                      </div>
                      <div className="comment-text">{c.text}</div>
                      <div className="comment-time">
                        {c.createdAt ? formatDate(c.createdAt) : 'Just now'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Comment input */}
            <div className="comment-input-row">
              <input
                className="comment-input"
                placeholder="Add a comment…"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComment()}
                disabled={posting}
              />
              <button className="btn btn-gold btn-sm" onClick={handleComment} disabled={posting}>
                {posting ? '…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
