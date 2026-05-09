import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import Nav from '../components/Nav'
import PhotoCard from '../components/PhotoCard'
import PhotoModal from '../components/PhotoModal'
import { picsum } from '../utils/helpers'

const ALL_TAGS = ['All','landscape','travel','portrait','urban','architecture','nature','japan','bw','night','africa','coastal']

const STORIES = [
  { id:'s1', name:'alex.kane',  seed:'p10', hasNew:true  },
  { id:'s2', name:'james.ok',   seed:'p20', hasNew:true  },
  { id:'s3', name:'chloe.r',    seed:'p30', hasNew:false },
  { id:'s4', name:'nuala.f',    seed:'p40', hasNew:true  },
  { id:'s5', name:'marta.v',    seed:'p50', hasNew:false },
  { id:'s6', name:'lee.photo',  seed:'p60', hasNew:true  },
]

function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) } })
    }, { threshold:.08, rootMargin:'0px 0px -40px 0px' })
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => io.observe(el))
    return () => io.disconnect()
  })
}

export default function Feed() {
  const { user, fetchPhotos, addToast } = useApp()

  const [photos,       setPhotos]      = useState([])
  const [loading,      setLoading]     = useState(true)
  const [activeTag,    setActiveTag]   = useState('All')
  const [searchQuery,  setSearchQuery] = useState('')
  const [openPhotoId,  setOpenPhotoId] = useState(null)
  const [following,    setFollowing]   = useState(new Set())
  const [page,         setPage]        = useState(1)
  const [hasMore,      setHasMore]     = useState(true)
  const [loadingMore,  setLoadingMore] = useState(false)

  useReveal()

  const load = useCallback(async (tag, q, pg) => {
    if (pg === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const params = { page: pg, limit: 12 }
      if (tag && tag !== 'All') params.tag = tag
      if (q) params.q = q
      const data = await fetchPhotos(params)
      setPhotos(prev => pg === 1 ? data.photos : [...prev, ...data.photos])
      setHasMore(pg < data.pages)
    } catch {
      addToast('Failed to load photos', 'error')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [fetchPhotos, addToast])

  useEffect(() => {
    setPage(1)
    load(activeTag, searchQuery, 1)
  }, [activeTag, searchQuery, load])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    load(activeTag, searchQuery, next)
  }

  const handleTagChange = (t) => { setActiveTag(t); setSearchQuery('') }

  const toggleFollow = (handle) => {
    setFollowing(prev => {
      const next = new Set(prev)
      if (next.has(handle)) next.delete(handle); else next.add(handle)
      addToast(next.has(handle) ? `Following ${handle}` : `Unfollowed ${handle}`, 'info')
      return next
    })
  }

  const TRENDING = [['landscape',815],['travel',643],['portrait',512],['japan',448],['urban',334]]
  const CREATORS = [
    { name:'Alexandra Kane', handle:'@alex.kane', seed:'p10', photos:47 },
    { name:'James Okafor',   handle:'@james.ok',  seed:'p20', photos:38 },
    { name:'Chloe Renard',   handle:'@chloe.r',   seed:'p30', photos:62 },
    { name:'Nuala Fitzroy',  handle:'@nuala.f',   seed:'p40', photos:29 },
  ]

  return (
    <div style={{ background:'var(--bg)' }}>
      <Nav variant="solid" showSearch onSearch={setSearchQuery} />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:32, maxWidth:1300, margin:'0 auto', padding:'84px 24px 48px' }}>
        <main>
          {/* Stories */}
          <div className="stories-bar">
            {STORIES.map(s => (
              <div key={s.id} className="story-item" onClick={() => addToast('Story viewer — Azure CDN in production', 'info')}>
                <div className={`story-ring ${s.hasNew ? '' : 'no-new'}`}>
                  <div className="avatar" style={{ width:'100%', height:'100%' }}>
                    <img src={picsum(s.seed, 120, 120)} alt={s.name} />
                  </div>
                </div>
                <span className="story-name">{s.name}</span>
              </div>
            ))}
          </div>

          {/* Tag filters */}
          <div className="filter-bar">
            {ALL_TAGS.map(t => (
              <button key={t} className={`filter-pill ${activeTag === t ? 'active' : ''}`}
                onClick={() => handleTagChange(t)}>{t}</button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ padding:80, textAlign:'center', color:'var(--text-3)' }}>Loading photos…</div>
          ) : photos.length > 0 ? (
            <>
              <div className="masonry">
                {photos.map(p => (
                  <PhotoCard key={p._id} photo={p} onOpen={setOpenPhotoId} />
                ))}
              </div>
              {hasMore && (
                <div style={{ textAlign:'center', marginTop:32 }}>
                  <button className="btn btn-outline btn-lg" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? 'Loading…' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding:80, textAlign:'center', color:'var(--text-3)', fontSize:15 }}>
              No photos match your search.
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside style={{ paddingTop:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:16, background:'var(--surface)', borderRadius:'var(--r3)', border:'1px solid var(--border-2)', boxShadow:'var(--s1)', marginBottom:28 }}>
            <div className="avatar" style={{ width:48, height:48 }}>
              <img src={picsum(user.avatar || 'demo_c', 100, 100)} alt="" />
            </div>
            <div>
              <div style={{ fontWeight:600, fontSize:14 }}>{user.name || `${user.firstName} ${user.lastName}`}</div>
              <div style={{ fontSize:12, color:'var(--text-3)' }}>{user.handle}</div>
            </div>
          </div>

          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', color:'var(--text-3)', marginBottom:14 }}>Suggested Creators</div>
            {CREATORS.map(c => (
              <div key={c.handle} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', cursor:'pointer' }}>
                <div className="avatar" style={{ width:36, height:36 }}><img src={picsum(c.seed, 80, 80)} alt="" /></div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'13.5px', fontWeight:600 }}>{c.name}</div>
                  <div style={{ fontSize:12, color:'var(--text-3)' }}>{c.photos} photos</div>
                </div>
                <button
                  style={{ padding:'5px 14px', borderRadius:'var(--rf)', fontSize:'12.5px', fontWeight:600,
                    border:`1.5px solid ${following.has(c.handle)?'transparent':'var(--gold)'}`,
                    color: following.has(c.handle)?'#fff':'var(--gold)',
                    background: following.has(c.handle)?'var(--gold-grad)':'transparent',
                    transition:'all var(--t-norm)', cursor:'pointer' }}
                  onClick={() => toggleFollow(c.handle)}
                >
                  {following.has(c.handle) ? 'Following ✓' : 'Follow'}
                </button>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', color:'var(--text-3)', marginBottom:14 }}>Trending</div>
            {TRENDING.map(([tag, count]) => (
              <div key={tag} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border-2)', cursor:'pointer' }}
                onClick={() => handleTagChange(tag)}>
                <span style={{ fontSize:14, fontWeight:500 }}><span style={{ color:'var(--gold)' }}>#</span>{tag}</span>
                <span style={{ fontSize:12, color:'var(--text-3)' }}>{count} photos</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {openPhotoId && <PhotoModal photoId={openPhotoId} onClose={() => setOpenPhotoId(null)} />}
    </div>
  )
}
