import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import Nav from '../components/Nav'
import UploadZone from '../components/UploadZone'
import { picsum, fmtNum } from '../utils/helpers'

function useCountUp(target) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const [active, setActive] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setActive(true); io.disconnect() } }, { threshold:.3 })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!active) return
    const dur = 1400, start = performance.now()
    const tick = now => {
      const p = Math.min((now - start)/dur, 1), ease = 1-Math.pow(1-p,3)
      setVal(Math.floor(ease*target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [active, target])
  return [val, ref]
}

function StatCard({ label, target, suffix='', sub, trend }) {
  const [val, ref] = useCountUp(target)
  const fmt = n => n >= 1000 ? (n/1000).toFixed(n>=10000?0:1)+'K' : String(n)
  return (
    <div ref={ref} className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{target ? fmt(val) : suffix}</div>
      <div className="stat-card-sub">{trend && <span className="trend-up">{trend} </span>}{sub}</div>
    </div>
  )
}

const ACTIVITY = [
  { icon:'♥', text:<><strong>Elena V.</strong> liked <strong>Golden Hour Reflections</strong></>, time:'2h ago' },
  { icon:'💬', text:<><strong>Marcus T.</strong> commented on <strong>Desert Dunes</strong></>, time:'3h ago' },
  { icon:'★',  text:<><strong>Sara J.</strong> rated <strong>Kyoto in Bloom</strong> 5 stars</>, time:'1d ago' },
  { icon:'♥', text:<><strong>Raj P.</strong> liked <strong>Urban Geometry</strong></>, time:'1d ago' },
]
const GEO = [['United Kingdom','38%'],['United States','24%'],['Germany','14%'],['Japan','9%'],['France','7%'],['Other','8%']]

export default function Creator() {
  const { user, fetchPhotos, createPhoto, deletePhoto, addToast, logout } = useApp()

  const [section,    setSection]    = useState('upload')
  const [people,     setPeople]     = useState([])
  const [tagInput,   setTagInput]   = useState('')
  const [titleLen,   setTitleLen]   = useState(0)
  const [captionLen, setCaptionLen] = useState(0)
  const [publishing, setPublishing] = useState(false)
  const [imageFile,  setImageFile]  = useState(null)
  const [myPhotos,   setMyPhotos]   = useState([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const formRef = useRef(null)

  const loadMyPhotos = async () => {
    setLoadingPhotos(true)
    try {
      const { photos } = await fetchPhotos({ creator: user.id, limit: 50 })
      setMyPhotos(photos)
    } catch {
      addToast('Failed to load gallery', 'error')
    } finally {
      setLoadingPhotos(false)
    }
  }

  useEffect(() => {
    if (section === 'gallery') loadMyPhotos()
  }, [section])

  const handlePublish = async (e) => {
    e.preventDefault()
    if (!imageFile) { addToast('Please select an image first', 'error'); return }
    setPublishing(true)

    const fd = new FormData(e.target)
    fd.set('image', imageFile)
    if (people.length) fd.set('people', people.join(','))

    try {
      await createPhoto(fd)
      addToast('Photo published successfully! ✓', 'success')
      formRef.current?.reset()
      setTitleLen(0); setCaptionLen(0); setPeople([]); setImageFile(null)
    } catch (err) {
      addToast(err.message || 'Failed to publish photo', 'error')
    } finally {
      setPublishing(false)
    }
  }

  const handleDelete = async (photoId) => {
    try {
      await deletePhoto(photoId)
      setMyPhotos(prev => prev.filter(p => p._id !== photoId))
      addToast('Photo deleted', 'info')
    } catch {
      addToast('Failed to delete photo', 'error')
    }
  }

  const addPerson = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const handle = tagInput.trim().replace(/^@?/,'@')
      setPeople(prev => [...prev, handle])
      setTagInput('')
    }
  }

  const NAV_ITEMS = [
    { id:'upload',    icon:'⬆', label:'Upload'    },
    { id:'gallery',   icon:'◻', label:'My Gallery' },
    { id:'analytics', icon:'◈', label:'Analytics' },
    { id:'activity',  icon:'🔔', label:'Activity'  },
  ]

  const displayName = user.name || `${user.firstName} ${user.lastName}`

  return (
    <div style={{ background:'var(--bg)' }}>
      <Nav variant="solid" />

      <div className="creator-layout">
        {/* Sidebar */}
        <aside className="creator-sidebar">
          <div style={{ padding:'0 16px 20px', display:'flex', alignItems:'center', gap:10 }}>
            <div className="avatar" style={{ width:44, height:44 }}>
              <img src={picsum(user.avatar || 'p10', 100, 100)} alt="" />
            </div>
            <div>
              <div style={{ fontWeight:600, fontSize:'13.5px' }}>{displayName}</div>
              <div style={{ fontSize:12, color:'var(--text-3)' }}>Creator</div>
            </div>
          </div>
          <div className="sidebar-divider" />
          <nav className="sidebar-nav" style={{ marginTop:8 }}>
            {NAV_ITEMS.map(item => (
              <div key={item.id} className={`sidebar-nav-item ${section===item.id?'active':''}`}
                onClick={() => setSection(item.id)}>
                <span className="nav-icon">{item.icon}</span> {item.label}
              </div>
            ))}
            <div className="sidebar-divider" />
            <div className="sidebar-nav-item" onClick={() => { logout(); setTimeout(() => window.location.href='/', 200) }}>
              <span className="nav-icon">→</span> Sign Out
            </div>
          </nav>
        </aside>

        {/* Main */}
        <main className="creator-main">

          {/* ── UPLOAD ────────────────────────────── */}
          {section === 'upload' && (
            <div>
              <div className="creator-header">
                <div className="creator-header-left">
                  <h1>Upload a Photo</h1>
                  <p>Share your work with the Lumora community</p>
                </div>
              </div>
              <div className="stat-cards">
                <StatCard label="Total Photos"  target={myPhotos.length || 0} sub="published" />
                <StatCard label="Total Views"   target={82400} sub="this week" trend="+1.2K" />
                <StatCard label="Total Likes"   target={9341}  sub="this week" trend="+214" />
                <StatCard label="Avg. Rating"   target={0} suffix="4.8★" sub="across all photos" />
              </div>

              <div style={{ background:'var(--surface)', borderRadius:'var(--r4)', border:'1px solid var(--border-2)', boxShadow:'var(--s1)', overflow:'hidden' }}>
                <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border-2)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:16, fontWeight:600 }}>New Upload</span>
                  <span style={{ fontSize:13, color:'var(--text-3)' }}>Supported: JPG, PNG, WEBP · Max 20 MB</span>
                </div>
                <form ref={formRef} style={{ padding:24, display:'grid', gridTemplateColumns:'1fr 1fr', gap:28 }} onSubmit={handlePublish}>
                  <div>
                    <UploadZone onFile={setImageFile} />
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    <div className="form-group">
                      <label>Photo Title <span style={{ color:'var(--rose)' }}>*</span></label>
                      <div style={{ position:'relative' }}>
                        <input name="title" className="form-input" style={{ paddingRight:48 }}
                          placeholder="Give your photo a meaningful title" maxLength={80} required
                          onChange={e => setTitleLen(e.target.value.length)} />
                        <span style={{ position:'absolute', right:12, bottom:10, fontSize:11, color:'var(--text-4)' }}>{titleLen}/80</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Caption</label>
                      <div style={{ position:'relative' }}>
                        <textarea name="caption" className="form-textarea" style={{ paddingRight:48 }}
                          placeholder="Tell the story behind this photo…" maxLength={500} rows={3}
                          onChange={e => setCaptionLen(e.target.value.length)} />
                        <span style={{ position:'absolute', right:12, top:10, fontSize:11, color:'var(--text-4)' }}>{captionLen}/500</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>📍 Location</label>
                      <input name="location" className="form-input" placeholder="City, Country (e.g. Venice, Italy)" list="loc-suggestions" />
                      <datalist id="loc-suggestions">
                        {['Venice, Italy','Kyoto, Japan','New York, USA','Paris, France','Tokyo, Japan'].map(l => <option key={l}>{l}</option>)}
                      </datalist>
                    </div>

                    <div className="form-group">
                      <label>👤 People Present</label>
                      <div className="tags-input-wrap">
                        {people.map((p,i) => (
                          <span key={i} className="tag-chip">
                            {p}
                            <button type="button" onClick={() => setPeople(prev => prev.filter((_,j)=>j!==i))}>×</button>
                          </span>
                        ))}
                        <input className="tags-input" placeholder="@handle + Enter" value={tagInput}
                          onChange={e => setTagInput(e.target.value)} onKeyDown={addPerson} />
                      </div>
                      <span className="form-hint">Press Enter after each handle</span>
                    </div>

                    <div className="form-group">
                      <label>Tags</label>
                      <input name="tags" className="form-input" placeholder="landscape, travel, golden-hour…" />
                      <span className="form-hint">Comma-separated tags help discovery</span>
                    </div>

                    <div style={{ display:'flex', gap:12, marginTop:4 }}>
                      <button type="submit" className="btn btn-gold btn-lg" style={{ flex:1 }} disabled={publishing}>
                        {publishing ? 'Publishing…' : 'Publish Photo'}
                      </button>
                      <button type="reset" className="btn btn-outline"
                        onClick={() => { setTitleLen(0); setCaptionLen(0); setPeople([]); setImageFile(null) }}>
                        Clear
                      </button>
                    </div>
                    <p className="form-note" style={{ textAlign:'center' }}>Stored in Azure Blob Storage + MongoDB Atlas</p>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── GALLERY ───────────────────────────── */}
          {section === 'gallery' && (
            <div>
              <div className="creator-header">
                <div className="creator-header-left"><h1>My Gallery</h1><p>Manage your published photos</p></div>
                <button className="btn btn-gold" onClick={() => setSection('upload')}>+ Upload New</button>
              </div>
              {loadingPhotos ? (
                <div style={{ padding:60, textAlign:'center', color:'var(--text-3)' }}>Loading gallery…</div>
              ) : (
                <div className="gallery-grid">
                  {myPhotos.map(p => (
                    <div key={p._id} className="gallery-item">
                      <img src={p.imageUrl} alt={p.title} loading="lazy" />
                      <div className="gallery-item-overlay">
                        <button className="card-action-btn" onClick={() => addToast('Edit coming soon', 'info')}>✎</button>
                        <button className="card-action-btn" onClick={() => handleDelete(p._id)}>🗑</button>
                      </div>
                    </div>
                  ))}
                  {myPhotos.length === 0 && (
                    <div style={{ gridColumn:'1/-1', padding:60, textAlign:'center', color:'var(--text-3)' }}>
                      No photos yet. Upload your first photo!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── ANALYTICS ─────────────────────────── */}
          {section === 'analytics' && (
            <div>
              <div className="creator-header">
                <div className="creator-header-left"><h1>Analytics</h1><p>Understand your audience</p></div>
              </div>
              <div className="stat-cards">
                <StatCard label="Views (30d)"    target={24800} sub="vs last month" trend="+18%" />
                <StatCard label="Likes (30d)"    target={3120}  sub="vs last month" trend="+24%" />
                <StatCard label="Comments (30d)" target={418}   sub="vs last month" trend="+11%" />
                <StatCard label="Followers"      target={1892}  sub="this week"     trend="+47" />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginTop:24 }}>
                <div style={{ background:'var(--surface)', borderRadius:'var(--r3)', border:'1px solid var(--border-2)', boxShadow:'var(--s1)', overflow:'hidden' }}>
                  <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border-2)', fontWeight:600, fontSize:14 }}>Audience Geography</div>
                  <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:10 }}>
                    {GEO.map(([country, pct]) => (
                      <div key={country} style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:'13.5px', flex:1 }}>{country}</span>
                        <div style={{ flex:2, height:6, background:'var(--border)', borderRadius:'var(--rf)', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:pct, background:'var(--gold-grad)', borderRadius:'var(--rf)' }} />
                        </div>
                        <span style={{ fontSize:12, color:'var(--text-3)', width:36, textAlign:'right' }}>{pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ACTIVITY ──────────────────────────── */}
          {section === 'activity' && (
            <div>
              <div className="creator-header">
                <div className="creator-header-left"><h1>Activity</h1><p>Likes, comments, and follows</p></div>
              </div>
              <div style={{ background:'var(--surface)', borderRadius:'var(--r3)', border:'1px solid var(--border-2)', boxShadow:'var(--s1)' }}>
                <div style={{ padding:'16px 20px' }}>
                  {ACTIVITY.map((a, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom: i < ACTIVITY.length-1 ? '1px solid var(--border-2)' : 'none' }}>
                      <div style={{ width:36, height:36, borderRadius:'var(--rf)', background:'var(--gold-pale)', color:'var(--gold-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{a.icon}</div>
                      <div style={{ flex:1, fontSize:'13.5px', lineHeight:1.5 }}>{a.text}</div>
                      <div style={{ fontSize:12, color:'var(--text-3)' }}>{a.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
