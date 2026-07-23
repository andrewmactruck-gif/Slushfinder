'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import ThemeToggle from '@/components/ThemeToggle'
import { geocodeQuery } from '@/lib/geocode'
import { detectLanguage, getStrings, detectUnit, Strings } from '@/types'

export default function HomePage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [error, setError] = useState('')
  const [strings, setStrings] = useState<Strings>(getStrings('en'))
  const [topUsers, setTopUsers] = useState<any[]>([])
  const [spotCount, setSpotCount] = useState<number|null>(null)
  useEffect(()=>{ fetch('/api/spot-count').then(r=>r.json()).then(d=>setSpotCount(d.count)).catch(()=>{}) },[])
  useEffect(()=>{ fetch('/api/leaderboard').then(r=>r.json()).then(d=>setTopUsers((d.leaderboard||[]).slice(0,10))).catch(()=>{}) },[])
  useEffect(() => { setStrings(getStrings(detectLanguage())) }, [])
  const handleSearch = useCallback(async () => {
    const q = query.trim()
    if (!q) { setError('Enter a postal code, ZIP, or city'); return }
    setError(''); setSearching(true)
    const geo = await geocodeQuery(q)
    setSearching(false)
    if (!geo) { setError('Location not found — try a city name or postal code'); return }
    const u = detectUnit(geo.countryCode)
    const p = new URLSearchParams({ lat: geo.lat.toString(), lng: geo.lng.toString(), label: geo.city ? `${geo.city}, ${geo.country}` : q, unit: u, ...(geo.countryCode ? { country: geo.countryCode } : {}) })
    router.push(`/search?${p}`)
  }, [query, router])
  const handleGps = useCallback(() => {
    if (!navigator.geolocation) { setError('GPS not available on this device'); return }
    setGpsLoading(true); setError('')
    navigator.geolocation.getCurrentPosition(
      pos => { setGpsLoading(false); const p = new URLSearchParams({ lat: pos.coords.latitude.toString(), lng: pos.coords.longitude.toString(), label: 'Current location', unit: 'km' }); router.push(`/search?${p}`) },
      () => { setGpsLoading(false); setError('Could not get location — try typing a postal code') },
      { timeout: 8000 }
    )
  }, [router])
  return (
    <div style={{ background:'var(--bg)', color:'var(--t1)', fontFamily:'"Space Grotesk",system-ui,sans-serif', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0 }}>
        <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', top:-100, right:-80, background:'radial-gradient(circle,rgba(0,242,255,0.10),transparent 65%)', filter:'blur(60px)' }}/>
        <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', bottom:100, left:-60, background:'radial-gradient(circle,rgba(182,0,248,0.07),transparent 65%)', filter:'blur(50px)' }}/>
      </div>
      <header className="topbar px-4 sticky top-0 z-20 flex items-center justify-between h-16">
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <a href="/" style={{display:"inline-flex",lineHeight:0}}><Image src="/logo.png" alt="Home" width={48} height={48} className="rounded-lg logo-blend" /></a>
          <span style={{ fontSize:18, fontWeight:800, color:'var(--pri)' }}>SlushFinder</span>
        </div>
        <ThemeToggle />
      </header>
      <main style={{ flex:1, display:'flex', flexDirection:'column', position:'relative', zIndex:1 }}>
        <div style={{ padding:'20px 16px 12px' }}>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:'var(--t3)', fontSize:16, pointerEvents:'none' }}>🔍</span>
            <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearch()} placeholder="Scan for slushy stations..." style={{ width:'100%', height:52, paddingLeft:46, paddingRight:60, background:'var(--s-base)', border:'1.5px solid var(--out-v)', borderRadius:16, fontSize:15, color:'var(--t1)', fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
            <button onClick={handleSearch} disabled={searching} style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', height:40, padding:'0 16px', borderRadius:12, background:'var(--grad)', color:'#fff', border:'none', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{searching?'…':'GO'}</button>
          </div>
          {error && <p style={{ fontSize:12, color:'var(--err)', marginTop:6 }}>{error}</p>}
        </div>
        <div style={{ padding:'0 16px 16px' }}>
          <div style={{ borderRadius:20, overflow:'hidden', position:'relative', background:'linear-gradient(160deg,rgba(0,242,255,0.08),rgba(182,0,248,0.06))', border:'1px solid var(--frost)', padding:24, minHeight:200, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,rgba(0,242,255,0.05) 0%,rgba(182,0,248,0.08) 100%)', borderRadius:20 }}/>
            <div style={{ position:'absolute', top:20, right:20, maxWidth:280, textAlign:'right', zIndex:2 }}>
              <div style={{ fontSize:15, fontWeight:800, color:'var(--t1)', lineHeight:1.35, marginBottom:8 }}>🍧 The more you share, the sweeter the map!</div>
              <div style={{ fontSize:12, color:'var(--t2)', lineHeight:1.4, marginBottom:8 }}>Slush Finder is crowd-sourced — every spot you add makes it better.</div>
              {spotCount!==null && <div style={{ display:'inline-block', fontSize:12, fontWeight:700, color:'var(--pri)', background:'rgba(0,242,255,0.10)', border:'1px solid var(--frost)', borderRadius:999, padding:'4px 12px' }}>❄️ {spotCount} spot{spotCount!==1?'s':''} and growing!</div>}
            </div>
            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.1em', color:'var(--pri)', textTransform:'uppercase', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--pri)', display:'inline-block', animation:'blink 1.5s ease infinite' }}/>LIVE FEED
              </div>
              <h2 style={{ fontSize:26, fontWeight:800, color:'var(--t1)', lineHeight:1.2, marginBottom:6 }}>Find your <span style={{ color:'var(--pri)' }}>slushie.</span></h2>
              <p style={{ fontSize:13, color:'var(--t2)', marginBottom:16, lineHeight:1.5 }}>Discover slushy machines anywhere in the world.</p>
              <button onClick={handleGps} disabled={gpsLoading} style={{ height:44, padding:'0 24px', borderRadius:12, background:'var(--grad)', color:'#fff', border:'none', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8 }}>
                <span>📍</span>{gpsLoading?'Getting location…':'USE MY LOCATION'}
              </button>
            </div>
          </div>
        </div>
        <div style={{ padding:'0 16px 16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <button onClick={()=>router.push('/add')} style={{ borderRadius:16, padding:20, textAlign:'left', cursor:'pointer', background:'linear-gradient(135deg,rgba(0,242,255,0.10),rgba(0,242,255,0.03))', border:'1px solid rgba(0,242,255,0.20)' }}>
            <div style={{ fontSize:28, marginBottom:10 }}>📍</div>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--pri)', marginBottom:2 }}>Add a Spot</div>
            <div style={{ fontSize:12, color:'var(--t3)' }}>Mark a station</div>
          </button>
          <button onClick={handleGps} style={{ borderRadius:16, padding:20, textAlign:'left', cursor:'pointer', background:'linear-gradient(135deg,rgba(182,0,248,0.10),rgba(182,0,248,0.03))', border:'1px solid rgba(182,0,248,0.20)' }}>
            <div style={{ fontSize:28, marginBottom:10 }}>🧭</div>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--sec-dim)', marginBottom:2 }}>Find a Spot</div>
            <div style={{ fontSize:12, color:'var(--t3)' }}>Navigate now</div>
          </button>
        </div>
        {topUsers.length>0 && (
          <div style={{ padding:'0 16px 24px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:15, fontWeight:800, color:'var(--pri)' }}>🏆 Top Slushers</span>
              <a href="/leaderboard" style={{ fontSize:11, color:'var(--cyan,#00b4cc)', textDecoration:'none' }}>View all →</a>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {topUsers.map((u:any)=>(
                <div key={u.user_id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:12, background:'var(--s1,rgba(28,32,33,0.5))', border:'1px solid var(--b1,rgba(255,255,255,0.06))' }}>
                  <span style={{ width:22, textAlign:'center', fontWeight:800, fontSize:u.rank<=3?16:12, color:'var(--t2)' }}>{u.rank===1?'🥇':u.rank===2?'🥈':u.rank===3?'🥉':u.rank}</span>
                  <div style={{ width:30, height:30, borderRadius:'50%', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--s-base,#222)', fontSize:15 }}>
                    {u.avatar_url ? <img src={u.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : u.emoji}
                  </div>
                  <span style={{ flex:1, fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.username}</span>
                  <span style={{ fontSize:14, fontWeight:800, color:'var(--cyan,#00b4cc)' }}>{u.points}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <nav className="botnav flex px-2 pb-2 pt-1 sticky bottom-0 z-20">
        {[{label:'Home',icon:'⌂',href:'/',active:true},{label:'Search',icon:'🔍',href:'/search'},{label:'Add Spot',icon:'➕',href:'/add'},{label:'Profile',icon:'👤',href:'/profile'}].map(n=>(
          <a key={n.label} href={n.href} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'6px 4px', textDecoration:'none', color:(n as any).active?'var(--pri)':'var(--t3)' }}>
            <span style={{ fontSize:22, lineHeight:1 }}>{n.icon}</span>
            <span style={{ fontSize:9, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase' }}>{n.label}</span>
          </a>
        ))}
      </nav>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  )
}
