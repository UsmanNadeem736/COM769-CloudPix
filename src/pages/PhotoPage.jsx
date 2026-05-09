import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { PHOTOS } from '../data/mockData'
import Nav from '../components/Nav'
import StarRating from '../components/StarRating'
import { fmtNum, formatDate, picsum } from '../utils/helpers'
import { useState } from 'react'

export default function PhotoPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const { user, liked, toggleLike, ratings, setRating, addToast, comments, addComment } = useApp()
  const [commentText, setCommentText] = useState('')

  const photo = PHOTOS.find(p => p.id === +id)

  useEffect(() => {
    if (photo) document.title = `Lumora — ${photo.title}`
    return () => { document.title = 'Lumora — Where Moments Become Art' }
  }, [photo])

  if (!photo) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', flexDirection:'column', gap:16 }}>
      <h2 style={{ fontFamily:'var(--font-d)', fontSize:32 }}>Photo not found</h2>
      <Link to="/feed" className="btn btn-gold">Back to Feed</Link>
    </div>
  )

  const isLiked    = liked.has(photo.id)
  const userRating = ratings[photo.id] || 0
  const photoComments = comments[photo.id] || []
  const related = PHOTOS.filter(p => p.id !== photo.id && p.tags.some(t => photo.tags.includes(t))).slice(0, 6)

  const handleLike = () => {
    toggleLike(photo.id)
    if (!isLiked) addToast('Added to your likes ♥', 'success')
  }

  const handleRate = (val) => {
    setRating(photo.id, val)
    addToast(`You rated this ${val} ★`, 'success')
  }

  const handleComment = () => {
    if (!commentText.trim()) return
    addComment(photo.id, commentText.trim(), user?.name || 'Guest', user?.avatar || 'demo_c')
    setCommentText('')
    addToast('Comment posted!', 'success')
  }

  return (
    <div style={{ background:'var(--bg)' }}>
      <Nav variant="solid" />

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'84px 24px 64px', display:'grid', gridTemplateColumns:'1fr 400px', gap:40, alignItems:'start' }}>

        {/* Hero image (sticky) */}
        <div style={{ position:'sticky', top:84 }}>
          <div style={{ borderRadius:'var(--r4)', overflow:'hidden', boxShadow:'var(--s5)', background:'var(--bg-2)' }}>
            <img src={picsum(photo.seed, photo.w, photo.h)} alt={photo.title} style={{ width:'100%', height:'auto', display:'block' }} />
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
                <img src={picsum(photo.creator.seed, 100, 100)} alt="" />
              </div>
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:16 }}>{photo.creator.name}</div>
              <div style={{ fontSize:13, color:'var(--text-3)' }}>{photo.creator.handle}</div>
            </div>
            <div style={{ marginLeft:'auto', textAlign:'right', fontSize:12, color:'var(--text-3)' }}>
              <span style={{ display:'block', fontSize:18, fontWeight:700, color:'var(--text-1)' }}>47</span>photos
            </div>
            <button className="btn btn-gold btn-sm" onClick={() => addToast(`Following ${photo.creator.name}!`, 'success')}>Follow</button>
          </div>

          {/* Title & caption */}
          <h1 style={{ fontFamily:'var(--font-d)', fontSize:36, fontWeight:600, lineHeight:1.1, marginBottom:10 }}>{photo.title}</h1>
          <p style={{ fontSize:15, color:'var(--text-2)', lineHeight:1.7, marginBottom:12 }}>{photo.caption}</p>
          <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:20 }}>{formatDate(photo.date)}</div>

          {/* Metadata */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border-2)', borderRadius:'var(--r3)', padding:18, marginBottom:20, boxShadow:'var(--s1)' }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--text-3)', marginBottom:12 }}>Photo Details</div>
            <div className="meta-row"><span className="meta-icon">📍</span><strong>{photo.location}</strong></div>
            {photo.people.length > 0 && (
              <div className="meta-row" style={{ alignItems:'flex-start', marginTop:8 }}>
                <span className="meta-icon">👤</span>
                <div className="people-chips">{photo.people.map(p => <span key={p} className="person-chip">{p}</span>)}</div>
              </div>
            )}
            <div className="meta-row" style={{ marginTop:8 }}>
              <span className="meta-icon">🏷</span>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {photo.tags.map(t => (
                  <button key={t} className="filter-pill" style={{ padding:'4px 12px', fontSize:12 }} onClick={() => navigate('/feed')}># {t}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Engagement */}
          <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
            {[
              { icon:'♥', val: fmtNum(photo.likes + (isLiked?1:0)), label:'Likes',    onClick:handleLike,   active:isLiked,  activeStyle:{ background:'var(--rose-pale)', borderColor:'var(--rose-light)' } },
              { icon:'💬', val: photoComments.length,                 label:'Comments', onClick:() => document.getElementById('commentInp').focus() },
              { icon:'★',  val: photo.rating,                         label:'Rating' },
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
            <StarRating value={userRating} avg={photo.rating} count={photo.ratingCount} onRate={handleRate} />
          </div>

          {/* Comments */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border-2)', borderRadius:'var(--r3)', boxShadow:'var(--s1)', overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border-2)', fontWeight:600, fontSize:15 }}>
              Comments ({photoComments.length})
            </div>
            <div style={{ padding:'8px 20px', maxHeight:320, overflowY:'auto' }}>
              {photoComments.map((c, i) => (
                <div key={i} className="comment-item" style={{ padding:'8px 0', borderBottom: i < photoComments.length-1 ? '1px solid var(--border-2)' : 'none' }}>
                  <div className="avatar" style={{ width:32, height:32, flexShrink:0 }}>
                    <img src={picsum(c.avatar, 60, 60)} alt="" />
                  </div>
                  <div className="comment-body">
                    <div className="comment-author">{c.author}</div>
                    <div className="comment-text">{c.text}</div>
                    <div className="comment-time">{c.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding:'14px 20px', borderTop:'1px solid var(--border-2)', display:'flex', gap:10 }}>
              <div className="avatar" style={{ width:32, height:32, flexShrink:0 }}>
                <img src={picsum(user.avatar, 60, 60)} alt="" />
              </div>
              <input id="commentInp" className="comment-input" placeholder="Share your thoughts…"
                value={commentText} onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComment()} />
              <button className="btn btn-gold btn-sm" onClick={handleComment}>Post</button>
            </div>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px 64px' }}>
          <div className="eyebrow" style={{ marginBottom:16 }}>Related Photos</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            {related.map(p => (
              <div key={p.id} style={{ borderRadius:'var(--r2)', overflow:'hidden', cursor:'pointer', aspectRatio:'4/3' }}
                onClick={() => navigate(`/photo/${p.id}`)}>
                <img src={picsum(p.seed, 480, 360)} alt={p.title} loading="lazy"
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
