import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Nav from '../components/Nav'
import { picsum } from '../utils/helpers'

function useCountUp(target, active) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    const dur = 1800, start = performance.now()
    const tick = now => {
      const p = Math.min((now - start) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.floor(ease * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [active, target])
  return val
}

function StatCounter({ target, label }) {
  const ref = useRef(null)
  const [active, setActive] = useState(false)
  const val = useCountUp(target, active)

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setActive(true); io.disconnect() } }, { threshold:.3 })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  const fmt = n => n >= 1_000_000 ? (n/1_000_000).toFixed(1)+'M' : n >= 1_000 ? (n/1_000).toFixed(n>=10_000?0:1)+'K' : String(n)

  return (
    <div ref={ref}>
      <span style={{ fontFamily:'var(--font-d)', fontSize:28, fontWeight:700, display:'block', lineHeight:1 }}>{fmt(val)}</span>
      <span style={{ fontSize:12, color:'var(--text-3)', fontWeight:500, marginTop:3 }}>{label}</span>
    </div>
  )
}

function RevealSection({ children, delay = 0 }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('visible'); io.disconnect() } }, { threshold:.08, rootMargin:'0px 0px -40px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <div ref={ref} className="reveal" style={{ transitionDelay:`${delay}ms` }}>{children}</div>
}

const MOSAIC = ['lumora90','lumora60','lumora70','lumora50','lumora30']
const FLOAT_CARDS = [
  { seed:'lumora10', title:'Golden Hour', loc:'Venice, Italy',  style:{ width:220, top:20,  right:60,  animation:'float-a 6s ease-in-out infinite' } },
  { seed:'lumora40', title:'Desert Dunes', loc:'Morocco',       style:{ width:180, top:180, right:270, animation:'float-b 7s ease-in-out 1.5s infinite' } },
  { seed:'lumora20', title:'Kyoto in Bloom', loc:'Japan',       style:{ width:200, top:330, right:100, animation:'float-c 8s ease-in-out .8s infinite' } },
]

export default function Landing() {
  const { user, openAuth } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate(user.role === 'creator' ? '/creator' : '/feed', { replace: true })
  }, [user, navigate])

  return (
    <div style={{ background:'var(--bg)' }}>
      <Nav variant="transparent" />

      {/* ── HERO ────────────────────────────────── */}
      <section style={{ minHeight:'100vh', display:'grid', gridTemplateColumns:'1fr 1fr', alignItems:'center', gap:40, padding:'100px 80px 60px', position:'relative', overflow:'hidden' }}>
        {/* Background orbs */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
          <div style={{ position:'absolute', width:500, height:500, background:'rgba(196,162,101,.12)', borderRadius:'50%', filter:'blur(90px)', top:-100, right:100, animation:'orb-pulse 6s ease-in-out infinite' }} />
          <div style={{ position:'absolute', width:360, height:360, background:'rgba(194,125,138,.10)', borderRadius:'50%', filter:'blur(90px)', bottom:100, right:0, animation:'orb-pulse 6s ease-in-out 2s infinite' }} />
          <div style={{ position:'absolute', width:280, height:280, background:'rgba(196,162,101,.09)', borderRadius:'50%', filter:'blur(90px)', top:'40%', left:-40, animation:'orb-pulse 6s ease-in-out 4s infinite' }} />
        </div>

        {/* Content */}
        <div style={{ position:'relative', zIndex:1, animation:'fadeUp .8s ease both' }}>
          <div className="eyebrow" style={{ marginBottom:20 }}>The Art of Visual Storytelling</div>
          <h1 style={{ fontFamily:'var(--font-d)', fontSize:'clamp(44px,5.5vw,80px)', fontWeight:600, lineHeight:1.05, marginBottom:22 }}>
            Where Moments<br />
            <em style={{ fontStyle:'italic', background:'var(--gold-grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Become Art.</em>
          </h1>
          <p style={{ fontSize:17, color:'var(--text-2)', lineHeight:1.7, maxWidth:420, marginBottom:36 }}>
            Lumora is a curated platform where photographers share their finest work and audiences discover beauty in every frame.
          </p>
          <div style={{ display:'flex', gap:12, marginBottom:48, flexWrap:'wrap' }}>
            <button className="btn btn-gold btn-lg" onClick={openAuth}>Start Exploring</button>
            <button className="btn btn-outline btn-lg" onClick={openAuth}>Sign In</button>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:28 }}>
            <StatCounter target={12400}   label="Creators" />
            <div style={{ width:1, height:36, background:'var(--border)' }} />
            <StatCounter target={847000}  label="Photos" />
            <div style={{ width:1, height:36, background:'var(--border)' }} />
            <StatCounter target={2800000} label="Monthly Views" />
          </div>
        </div>

        {/* Floating cards */}
        <div style={{ position:'relative', zIndex:1, height:540, animation:'fadeUp .9s .15s ease both' }}>
          {FLOAT_CARDS.map(c => (
            <div key={c.seed} style={{ position:'absolute', borderRadius:'var(--r4)', overflow:'hidden', boxShadow:'var(--s5)', background:'var(--bg-2)', ...c.style }}>
              <img src={picsum(c.seed, 440, 560)} alt={c.title} style={{ width:'100%', height:'auto', display:'block', objectFit:'cover' }} />
              <div style={{ padding:'12px 14px', background:'var(--surface)' }}>
                <div style={{ fontFamily:'var(--font-d)', fontSize:15, fontWeight:600 }}>{c.title}</div>
                <div style={{ fontSize:11.5, color:'var(--text-3)', marginTop:2 }}>{c.loc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ position:'absolute', bottom:32, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:6, color:'var(--text-3)', fontSize:11, letterSpacing:'.1em', textTransform:'uppercase', animation:'fadeUp 1s 1.2s ease both' }}>
          <span>Scroll</span>
          <span style={{ fontSize:20, animation:'float-c 2s ease-in-out infinite' }}>↓</span>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────── */}
      <section style={{ padding:'100px 0', background:'var(--surface)' }}>
        <div className="container">
          <RevealSection>
            <div style={{ textAlign:'center', marginBottom:64 }}>
              <p style={{ color:'var(--gold)', fontSize:12, fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase', marginBottom:14 }}>Designed for Visual Storytellers</p>
              <h2 style={{ fontFamily:'var(--font-d)', fontSize:'clamp(32px,3.5vw,52px)', fontWeight:600, lineHeight:1.15 }}>
                Everything you need to<br />share your vision
              </h2>
            </div>
          </RevealSection>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:28 }}>
            {[
              { icon:'📸', title:'Curated Galleries', text:'Present your work with full metadata — location, collaborators, and the story behind every shot.' },
              { icon:'✦',  title:'Discover & Explore', text:'Navigate thousands of photographs with intelligent search, location filters, and tag-based discovery.', featured:true },
              { icon:'★',  title:'Rate & Connect', text:'Rate, comment, and engage with a community of passionate visual artists around the world.' },
            ].map((f, i) => (
              <RevealSection key={f.title} delay={i * 60}>
                <div style={{ padding:36, borderRadius:'var(--r4)', border:`1px solid ${f.featured?'rgba(196,162,101,.3)':'var(--border-2)'}`, background:f.featured?'linear-gradient(145deg,var(--gold-pale),#fff)':'', transition:'all var(--t-norm)' }}
                  className="feature-card-hover">
                  <div style={{ width:52, height:52, borderRadius:'var(--r2)', background:'var(--gold-grad)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:'#fff', marginBottom:20, boxShadow:'var(--s-gold)' }}>{f.icon}</div>
                  <h3 style={{ fontFamily:'var(--font-d)', fontSize:22, marginBottom:10 }}>{f.title}</h3>
                  <p style={{ fontSize:14.5, color:'var(--text-2)', lineHeight:1.7 }}>{f.text}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREVIEW MOSAIC ───────────────────────── */}
      <section style={{ padding:'100px 0' }}>
        <div className="container">
          <RevealSection>
            <div style={{ textAlign:'center', marginBottom:48 }}>
              <h2 style={{ fontFamily:'var(--font-d)', fontSize:'clamp(32px,3.5vw,52px)', fontWeight:600, lineHeight:1.15 }}>
                A world of visual stories<br />awaiting your discovery
              </h2>
            </div>
          </RevealSection>
          <RevealSection delay={80}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gridTemplateRows:'240px 180px', gap:12, borderRadius:'var(--r4)', overflow:'hidden', marginBottom:48 }}>
              {MOSAIC.map((seed, i) => (
                <div key={seed} style={{ overflow:'hidden', borderRadius:'var(--r2)', ...(i===0?{gridColumn:'1/3',gridRow:'1/3',borderRadius:'var(--r3)'}:{}) }}>
                  <img src={picsum(seed, i===0?800:400, i===0?600:260)} alt="" loading="lazy"
                    style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform var(--t-slow)' }}
                    onMouseEnter={e => e.target.style.transform='scale(1.06)'}
                    onMouseLeave={e => e.target.style.transform='scale(1)'}
                  />
                </div>
              ))}
            </div>
          </RevealSection>
          <div style={{ textAlign:'center' }}>
            <button className="btn btn-gold btn-lg" onClick={openAuth}>Explore the Gallery</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────── */}
      <footer style={{ background:'var(--text-1)', color:'rgba(255,255,255,.5)', padding:'60px 0', textAlign:'center' }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:9, fontFamily:'var(--font-d)', fontSize:24, fontWeight:600, color:'#fff', marginBottom:10 }}>
            <span style={{ color:'var(--gold)' }}>◈</span>
            <span>Lumora</span>
          </div>
          <p style={{ fontFamily:'var(--font-d)', fontStyle:'italic', fontSize:16, color:'rgba(255,255,255,.35)', marginBottom:20 }}>Where moments become art.</p>
          <p style={{ fontSize:12 }}>© 2026 Lumora · COM769 Coursework · Ulster University · MSc Computer Science</p>
        </div>
      </footer>

    </div>
  )
}
