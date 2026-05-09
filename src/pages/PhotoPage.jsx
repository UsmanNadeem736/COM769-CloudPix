import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { photos as photosApi } from '../services/api'
import Nav from '../components/Nav'
import StarRating from '../components/StarRating'
import { fmtNum, formatDate, picsum } from '../utils/helpers'

const SENTIMENT_ICON = { positive: '😊', neutral: '😐', negative: '😟' }

export default function PhotoPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { user, toggleLike, setRating, fetchComments, addComment, addToast } = useApp()

  const [photo,       setPhoto]      = useState(null)
  const [related,     setRelated]    = useState([])
  const [commentList, setComments]   = useState([])
  const [commentText, setComment]    = useState('')
  const [liked,       setLiked]      = useState(false)
  const [likesCount,  setLikesCount] = useState(0)
  const [userRating,  setUserRating] = useState(0)
  const [posting,     setPosting]    = useState(false)
  const [notFound,    setNotFound]   = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    photosApi.get(id)
      .then(({ photo: p }) => {
        if (cancelled) return
        setPhoto(p)
        setLikesCount(p.likesCount || p.likes?.length || 0)
        document.title = `Lumora — ${p.title}`
      })
      .catch(() => setNotFound(true))

    fetchComments(id).then(({ comments }) => {
      if (!cancelled) setComments(comments)
    }).catch(() => {})

    if (user) {
      photosApi.myRating(id).then(({ rating }) => {
        if (!cancelled) setUserRating(rating)
      }).catch(() => {})
    }

    // Load related photos by same tag
    photosApi.list({ limit: 6 }).then(({ photos }) => {
      if (!cancelled && photos) {
        setRelated(photos.filter(p => p._id !== id).slice(0, 3))
      }
    }).catch(() => {})

    return () => {
      cancelled = true
      document.title = 'Lumora — Where Moments Become Art'
    }
  }, [id, user])

  const handleLike = async () => {
    try {
      const res = await toggleLike(id)
      setLiked(res.liked)
      setLikesCount(res.likesCount)
      if (res.liked) addToast('Added to your likes ♥', 'success')
    } catch {
      addToast('Please sign in to like photos', 'info')
    }
  }

  const handleRate = async (val) => {
    try {
      const res = await setRating(id, val)
      setUserRating(val)
      setPhoto(prev => ({ ...prev, ratingAverage: res.ratingAverage, ratingCount: res.ratingCount }))
      addToast(`You rated this ${val} ★`, 'success')
    } catch {
      addToast('Failed to submit rating', 'error')
    }
  }

  const handleComment = async () => {
    if (!commentText.trim()) return
    setPosting(true)
    try {
      const c = await addComment(id, commentText.trim())
      setComments(prev => [c, ...prev])
      setComment('')
      addToast('Comment posted!', 'success')
    } catch (err) {
      addToast(err.message || 'Failed to post comment', 'error')
    } finally {
      setPosting(false)
    }
  }

  if (notFound) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', flexDirection:'column', gap:16 }}>
      <h2 style={{ fontFamily:'var(--font-d)', fontSize:32 }}>Photo not found</h2>
      <Link to="/feed" className="btn btn-gold">Back to Feed</Link>
    </div>
  )

  if (!photo) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', color:'var(--text-3)' }}>
      Loading…
    </div>
  )

  const creatorName = photo.creator?.firstName
    ? `${photo.creator.firstName} ${photo.creator.lastName}`
    : photo.creator?.name || 'Unknown'
  const creatorSeed = photo.creator?.avatar || 'p10'
  const imgSrc      = photo.imageUrl || picsum(photo.seed, photo.w || 600, photo.h || 800)

  return (
    <div style={{ background:'var(--bg)' }}>
      <Nav variant="solid" />

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'84px 24px 64px', display:'grid', gridTemplateColumns:'1fr 400px', gap:40, alignItems:'start' }}>

        {/* Hero image (sticky) */}
        <div style={{ position:'sticky', top:84 }}>
          <div style={{ borderRadius:'var(--r4)', overflow:'hidden', boxShadow:'var(--s5)', background:'var(--bg-2)' }}>
            <img src={imgSrc} alt={photo.title} style={{ width:'100%', height:'auto', display:'block' }} />
          </div>
          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <button className="btn btn-outline btn-sm" onClick={() => addToast('Saved to collection ✦', 'success')}>✦ Save</button>
            <button className="btn btn-outline btn-sm" onClick={() => addToast('Link copied!', 'success')}>↗ Share</button>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft:'auto' }} onClick={() => addToast('Reported', 'info')}>⚑ Report</button>
          </div>
        </div>

        {/* Info */}
        <div>
          {/* Creator card */}
          <div style={{ display:'flex', alignItems:'center', gap:14, padding:18, background:'var(--surface)', border:'1px solid var(--border-2)', borderRadius:'var(--r3)', boxShadow:'var(--s1)', marginBottom:24 }}>
            <div className="avatar avatar-ring" style={{ width:52, height:52 }}>
              <div className="avatar" style={{ width:48, height:48 }}>
                <img src={picsum(creatorSeed, 100, 100)} alt="" />
              </div>
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:16 }}>{creatorName}</div>
              <div style={{ fontSize:13, color:'var(--text-3)' }}>{photo.creator?.handle}</div>
            </div>
            <button className="btn btn-gold btn-sm" style={{ marginLeft:'auto' }}
              onClick={() => addToast(`Following ${creatorName}!`, 'success')}>Follow</button>
          </div>

          {/* Title & caption */}
          <h1 style={{ fontFamily:'var(--font-d)', fontSize:36, fontWeight:600, lineHeight:1.1, marginBottom:10 }}>{photo.title}</h1>
          {photo.caption && <p style={{ fontSize:15, color:'var(--text-2)', lineHeight:1.7, marginBottom:12 }}>{photo.caption}</p>}
          <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:20 }}>
            {formatDate(photo.createdAt || photo.date)}
          </div>

          {/* Metadata */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border-2)', borderRadius:'var(--r3)', padding:18, marginBottom:20, boxShadow:'var(--s1)' }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--text-3)', marginBottom:12 }}>Photo Details</div>
            {photo.location && <div className="meta-row"><span className="meta-icon">📍</span><strong>{photo.location}</strong></div>}
            {photo.people?.length > 0 && (
              <div className="meta-row" style={{ alignItems:'flex-start', marginTop:8 }}>
                <span className="meta-icon">👤</span>
                <div className="people-chips">{photo.people.map(p => <span key={p} className="person-chip">{p}</span>)}</div>
              </div>
            )}
            {photo.tags?.length > 0 && (
              <div className="meta-row" style={{ marginTop:8 }}>
                <span className="meta-icon">🏷</span>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {photo.tags.map(t => (
                    <button key={t} className="filter-pill" style={{ padding:'4px 12px', fontSize:12 }}
                      onClick={() => navigate('/feed')}># {t}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Engagement stats */}
          <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
            {[
              { icon:'♥', val: fmtNum(likesCount),              label:'Likes',    onClick: handleLike, active: liked, activeStyle:{ background:'var(--rose-pale)', borderColor:'var(--rose-light)' } },
              { icon:'💬', val: commentList.length,              label:'Comments', onClick: () => document.getElementById('commentInp')?.focus() },
              { icon:'★',  val: photo.ratingAverage?.toFixed(1) || '—', label:'Rating' },
            ].map(c => (
              <div key={c.label}
                style={{ flex:1, minWidth:100, padding:16, background:'var(--surface)', border:'1px solid var(--border-2)', borderRadius:'var(--r3)', textAlign:'center', cursor:'pointer', boxShadow:'var(--s1)', transition:'all var(--t-norm)', ...(c.active ? c.activeStyle : {}) }}
                onClick={c.onClick}>
                <span style={{ fontSize:22, display:'block', marginBottom:4 }}>{c.icon}</span>
                <div style={{ fontSize:18, fontWeight:700, fontFamily:'var(--font-d)' }}>{c.val}</div>
                <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em' }}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* Rating */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border-2)', borderRadius:'var(--r3)', padding:18, marginBottom:20, boxShadow:'var(--s1)' }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--text-3)', marginBottom:10 }}>Rate This Photo</div>
            <StarRating value={userRating} avg={photo.ratingAverage || 0} count={photo.ratingCount || 0} onRate={handleRate} />
          </div>

          {/* Comments */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border-2)', borderRadius:'var(--r3)', boxShadow:'var(--s1)', overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border-2)', fontWeight:600, fontSize:15 }}>
              Comments ({commentList.length})
            </div>
            <div style={{ padding:'8px 20px', maxHeight:320, overflowY:'auto' }}>
              {commentList.map((c) => {
                const authorName = c.author?.firstName ? `${c.author.firstName} ${c.author.lastName}` : c.author?.name || 'User'
                const authorSeed = c.author?.avatar || 'demo_c'
                return (
                  <div key={c._id} className="comment-item" style={{ padding:'8px 0', borderBottom:'1px solid var(--border-2)' }}>
                    <div className="avatar" style={{ width:32, height:32, flexShrink:0 }}>
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
                      <div className="comment-time">{c.createdAt ? formatDate(c.createdAt) : 'Just now'}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ padding:'14px 20px', borderTop:'1px solid var(--border-2)', display:'flex', gap:10 }}>
              <div className="avatar" style={{ width:32, height:32, flexShrink:0 }}>
                <img src={picsum(user?.avatar || 'demo_c', 60, 60)} alt="" />
              </div>
              <input id="commentInp" className="comment-input" placeholder="Share your thoughts…"
                value={commentText} onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComment()}
                disabled={posting} />
              <button className="btn btn-gold btn-sm" onClick={handleComment} disabled={posting}>
                {posting ? '…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Related photos */}
      {related.length > 0 && (
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px 64px' }}>
          <div className="eyebrow" style={{ marginBottom:16 }}>Related Photos</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            {related.map(p => (
              <div key={p._id} style={{ borderRadius:'var(--r2)', overflow:'hidden', cursor:'pointer', aspectRatio:'4/3' }}
                onClick={() => navigate(`/photo/${p._id}`)}>
                <img src={p.imageUrl || picsum(p.seed, 480, 360)} alt={p.title} loading="lazy"
                  style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform var(--t-norm)' }}
                  onMouseEnter={e => e.target.style.transform='scale(1.06)'}
                  onMouseLeave={e => e.target.style.transform='scale(1)'} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
