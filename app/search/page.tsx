'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import ThemeToggle from '@/components/ThemeToggle'
import BrandFilter from '@/components/BrandFilter'
import LocationCard from '@/components/LocationCard'
import SearchBar from '@/components/SearchBar'
import { LocationWithDistance, Brand, detectLanguage, getStrings, DistanceUnit, Strings } from '@/types'
import dynamic from 'next/dynamic'

const SlushyMap = dynamic(() => import('@/components/map/SlushyMap'), { ssr: false })

function SearchPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const lat = parseFloat(params.get('lat') ?? '0')
  const lng = parseFloat(params.get('lng') ?? '0')
  const label = params.get('label') ?? ''
  const country = params.get('country') ?? ''
  const initUnit = (params.get('unit') ?? 'km') as DistanceUnit
  const [locations, setLocations] = useState<LocationWithDistance[]>([])
  const [loading, setLoading] = useState(true)
  const [brand, setBrand] = useState<Brand|'all'>('all')
  const [radius, setRadius] = useState(25)
  const [openNow, setOpenNow] = useState(false)
  const [sortBy, setSortBy] = useState<'nearest'|'popular'>('nearest')
  const [unit, setUnit] = useState<DistanceUnit>(initUnit)
  const [strings, setStrings] = useState<Strings>(getStrings('en'))
  const [collapsed, setCollapsed] = useState(false)
  const [detectedCountry, setDetectedCountry] = useState(country)

  useEffect(() => {
    if (!country && lat && lng) {
      // Detect country from coordinates using reverse geocoding
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
        headers: { 'User-Agent': 'SlushFinder/1.0' }
      })
        .then(r => r.json())
        .then(d => { if (d.address?.country_code) setDetectedCountry(d.address.country_code.toUpperCase()) })
        .catch(() => {})
    } else if (country) {
      setDetectedCountry(country)
    }
  }, [country, lat, lng])

  useEffect(() => { setStrings(getStrings(detectLanguage())) }, [])

  const fetchLocations = useCallback(async () => {
    if (!lat || !lng) { setLoading(false); return }
    setLoading(true)
    try {
      const qs = new URLSearchParams({ lat: lat.toString(), lng: lng.toString(), radius: radius.toString(), ...(brand !== 'all' ? { brand } : {}), ...(openNow ? { open_now: 'true' } : {}), ...(country ? { country } : {}) })
      const res = await fetch('/api/search?' + qs)
      const data = await res.json()
      setLocations(data.locations ?? [])
    } catch { setLocations([]) }
    finally { setLoading(false) }
  }, [lat, lng, radius, brand, openNow, country])

  useEffect(() => { fetchLocations() }, [fetchLocations])

  const handleNewSearch = useCallback((nlat: number, nlng: number, nlabel: string, ncc?: string) => {
    const p = new URLSearchParams({ lat: nlat.toString(), lng: nlng.toString(), label: nlabel, unit, ...(ncc ? { country: ncc } : {}) })
    router.push('/search?' + p)
  }, [router, unit])

  const handleGps = () => {
    if (!navigator.geolocation) { alert('Location is not supported by your browser.'); return }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const p = new URLSearchParams({ lat: pos.coords.latitude.toString(), lng: pos.coords.longitude.toString(), label: 'Current location', unit: 'km' })
        router.push('/search?' + p)
      },
      err => {
        if (err.code === err.PERMISSION_DENIED) alert('Location permission was denied. Please allow location access in your browser settings and try again.')
        else if (err.code === err.POSITION_UNAVAILABLE) alert('Your location could not be determined right now. Please try again.')
        else if (err.code === err.TIMEOUT) alert('Getting your location timed out. Please try again.')
        else alert('Could not get your location.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  return (
    <div style={{ background:'#0b0f10', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'"Space Grotesk",system-ui,sans-serif', color:'#e0e3e4', overflow:'hidden' }}>

      {/* Aurora glows */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', width:300, height:300, top:80, left:-80, background:'radial-gradient(circle,rgba(182,0,248,0.10),transparent 70%)', filter:'blur(60px)' }}/>
        <div style={{ position:'absolute', width:300, height:300, bottom:160, right:-80, background:'radial-gradient(circle,rgba(0,219,231,0.15),transparent 70%)', filter:'blur(60px)' }}/>
      </div>

      {/* TOPBAR */}
      <header style={{ position:'fixed', top:0, left:0, width:'100%', zIndex:50, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 20px', height:64, background:'rgba(16,20,21,0.40)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.10)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <a href="/" style={{display:"inline-flex",lineHeight:0}}><Image src="/logo.png" alt="Home" width={43} height={43} className="rounded-lg logo-blend"/></a>
          <span style={{ fontSize:18, fontWeight:700, letterSpacing:'-.02em', color:'#00dbe7' }}>SlushFinder</span>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <ThemeToggle/>
          <button onClick={()=>setUnit(u=>u==='km'?'mi':'km')} style={{ fontSize:10, fontWeight:700, padding:'4px 10px', borderRadius:999, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(28,32,33,0.6)', color:'#b9cacb', cursor:'pointer', fontFamily:'inherit' }}>{unit}</button>
        </div>
      </header>

      {/* MAIN */}
      <main style={{ flex:1, position:'relative', marginTop:64, overflow:'hidden' }}>

        {/* MAP BACKGROUND */}
        <div style={{ position:'absolute', inset:0, zIndex:0 }}>
          <SlushyMap locations={locations} center={{ lat, lng }}/>
        </div>

        {/* SEARCH OVERLAY */}
        <div className="search-overlay" style={{ position:'absolute', top:16, left:0, right:0, padding:'0 20px', zIndex:40, display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ background:'rgba(28,32,33,0.4)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:999, padding:'10px 16px', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ color:'#74f5ff', fontSize:18, flexShrink:0 }}>🔍</span>
            <div style={{ flex:1 }}>
              <SearchBar onSearch={handleNewSearch} strings={strings} compact initialValue={label}/>
            </div>
            <span style={{ color:'#849495', fontSize:16, flexShrink:0 }}>⚙</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div onClick={handleGps} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(39,43,44,0.80)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:999, padding:'5px 12px', cursor:'pointer' }}>
              <span style={{ fontSize:12, color:'#74f5ff' }}>📍</span>
              <span style={{ fontSize:11, fontWeight:600, letterSpacing:'.05em', color:'#74f5ff', fontFamily:'"JetBrains Mono",monospace' }}>{label || 'Current Location'}</span>
            </div>
            <button onClick={handleGps} style={{ fontSize:11, fontWeight:500, color:'#ebb2ff', background:'none', border:'none', cursor:'pointer', fontFamily:'"JetBrains Mono",monospace', textDecoration:'underline', letterSpacing:'.05em' }}>
              Use my current location
            </button>
          </div>
        </div>

        {/* BOTTOM SHEET */}
        <div className="results-sheet" style={{
          position:'absolute', bottom:0, left:0, right:0, zIndex:40,
          background:'rgba(11,15,16,0.80)', backdropFilter:'blur(24px)',
          borderTop:'1px solid rgba(255,255,255,0.10)',
          borderRadius:'2.5rem 2.5rem 0 0',
          boxShadow:'0 -20px 50px rgba(0,0,0,0.5)',
          transform: collapsed ? 'translateY(calc(100% - 140px))' : 'translateY(0)',
          transition:'transform 0.4s cubic-bezier(0.33,1,0.68,1)',
          maxHeight:'85vh',
          display:'flex', flexDirection:'column',
        }}>
          {/* Handle */}
          <div onClick={()=>setCollapsed(c=>!c)} style={{ padding:'16px 0 8px', display:'flex', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
            <div style={{ width:48, height:4, background:'rgba(255,255,255,0.20)', borderRadius:999 }}/>
          </div>

          {/* Sheet header */}
          <div style={{ padding:'0 20px 12px', display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexShrink:0 }}>
            <div>
              <h2 style={{ fontSize:24, fontWeight:700, color:'#e0e3e4', margin:0, fontFamily:'"Space Grotesk",system-ui,sans-serif' }}>
                {loading ? 'Scanning...' : locations.length + ' Machine' + (locations.length !== 1 ? 's' : '') + ' Nearby'}
              </h2>
              <p style={{ fontSize:11, color:'rgba(185,202,203,0.7)', margin:'2px 0 0', fontFamily:'"JetBrains Mono",monospace', letterSpacing:'.05em' }}>
                {label || 'Current location'}
              </p>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <select value={radius} onChange={e=>setRadius(Number(e.target.value))} style={{ background:'rgba(49,53,54,0.5)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:10, color:'#b9cacb', fontSize:11, padding:'6px 10px', cursor:'pointer', fontFamily:'inherit' }}>
                <option value={10}>10 km</option><option value={25}>25 km</option><option value={50}>50 km</option>
              </select>
              <button onClick={()=>setOpenNow(o=>!o)} style={{ padding:'6px 12px', borderRadius:10, fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit', border:'1px solid '+(openNow?'#74f5ff':'rgba(255,255,255,0.10)'), background:openNow?'rgba(116,245,255,0.10)':'rgba(49,53,54,0.5)', color:openNow?'#74f5ff':'#b9cacb' }}>
                Open now
              </button>
              <button onClick={()=>setSortBy(s=>s==='nearest'?'popular':'nearest')} style={{ padding:'6px 12px', borderRadius:10, fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit', border:'1px solid '+(sortBy==='popular'?'#ebb2ff':'rgba(255,255,255,0.10)'), background:sortBy==='popular'?'rgba(235,178,255,0.10)':'rgba(49,53,54,0.5)', color:sortBy==='popular'?'#ebb2ff':'#b9cacb' }}>
                {sortBy==='popular'?'★ Popular':'⌖ Nearest'}
              </button>
            </div>
          </div>

          {/* Brand filter */}
          <div style={{ flexShrink:0, marginBottom:8 }}>
            <BrandFilter active={brand} onChange={setBrand} country={detectedCountry}/>
          </div>

          {/* List */}
          <div style={{ overflowY:'auto', padding:'0 20px 40px', flex:1 }}>
            {loading ? (
              [1,2,3].map(i=>(
                <div key={i} style={{ background:'rgba(28,32,33,0.4)', borderRadius:16, padding:16, marginBottom:16, height:100, opacity:.4, animation:'pulse 1.5s ease infinite' }}/>
              ))
            ) : locations.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 16px', color:'#849495' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>❄️</div>
                <p style={{ fontSize:16, fontWeight:700, color:'#e0e3e4', marginBottom:6 }}>No machines found nearby.</p>
                <p style={{ fontSize:13, lineHeight:1.6 }}>Try expanding your radius or <a href="/add" style={{ color:'#74f5ff' }}>add a location</a>.</p>
              </div>
            ) : (
              [...locations].sort((a,b)=> sortBy==='popular' ? ((b as any).checkin_count??0)-((a as any).checkin_count??0) : 0).map((loc, i) => (
                <div key={loc.id} style={{
                  background:'rgba(28,32,33,0.40)', backdropFilter:'blur(12px)',
                  border:'1px solid rgba(255,255,255,0.10)',
                  borderLeft: '2px solid ' + (i%2===0 ? '#74f5ff' : '#ebb2ff'),
                  borderRadius:16, padding:16, marginBottom:16,
                  display:'flex', gap:16, cursor:'pointer',
                  transition:'all 0.2s ease',
                }}>
                  {/* Icon */}
                  <div style={{ width:80, height:80, borderRadius:12, background:'rgba(0,219,231,0.08)', border:'1px solid rgba(0,219,231,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, flexShrink:0 }}>
                    {loc.brand==='7-Eleven'?'🧊':loc.brand==='Circle K'?'❄️':loc.brand==='ICEE'?'🌀':loc.brand==='Slush Puppie'?'🐶':loc.brand==='Frazil'?'🌊':loc.brand==='Restaurant'?'🍽️':'🥤'}
                  </div>
                  {/* Info */}
                  <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize:16, fontWeight:600, color: i%2===0?'#74f5ff':'#ebb2ff', margin:0, lineHeight:1.2, fontFamily:'"Space Grotesk",system-ui,sans-serif' }}>{loc.name}</h3>
                        <p style={{ fontSize:11, color:'#849495', margin:'3px 0 0', fontFamily:'"JetBrains Mono",monospace', letterSpacing:'.05em' }}>{loc.brand} • {loc.distance_km} km away{((loc as any).checkin_count??0)>0 ? ' • 📍 '+(loc as any).checkin_count+' check-in'+((loc as any).checkin_count!==1?'s':'') : ''}</p>
                      </div>
                      <span style={{
                        fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:999,
                        letterSpacing:'.05em', fontFamily:'"JetBrains Mono",monospace',
                        background: loc.machine_status==='operational' ? 'rgba(116,245,255,0.10)' : 'rgba(255,180,171,0.10)',
                        color: loc.machine_status==='operational' ? '#74f5ff' : '#ffb4ab',
                        border: '1px solid ' + (loc.machine_status==='operational' ? 'rgba(116,245,255,0.20)' : 'rgba(255,180,171,0.20)'),
                      }}>
                        {loc.machine_status==='operational' ? 'ALL GOOD' : 'ISSUE'}
                      </span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:8 }}>
                      {loc.flavours && <span style={{ fontSize:11, color:'#849495', fontFamily:'"JetBrains Mono",monospace' }}>🍒 {loc.flavours.split(',').slice(0,2).join(', ')}</span>}
                      {!(loc as any).is_verified && <span style={{ fontSize:9, color:'#ffb400', fontFamily:'"JetBrains Mono",monospace', letterSpacing:'.04em' }}>⚠ Not verified</span>}
                    </div>
                    <div style={{ display:'flex', gap:8, marginTop:12 }}>
                      <button onClick={()=>window.open('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(loc.name+' '+loc.address+' '+loc.city), '_blank')}
                        style={{ flex:1, padding:'8px', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', border:'1px solid rgba(255,255,255,0.12)', background:'rgba(49,53,54,0.5)', color:'#b9cacb' }}>
                        ↗ Directions
                      </button>
                      <button onClick={()=>router.push('/location/'+loc.id)}
                        style={{ flex:1, padding:'8px', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', border:'none', background:'var(--grad, linear-gradient(90deg,#00e5ff,#9c27ff))', color:'#fff' }}>
                        📍 Check in
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* BOTTOM NAV */}
      <nav style={{ position:'fixed', bottom:0, left:0, width:'100%', zIndex:50, display:'flex', justifyContent:'space-around', alignItems:'center', padding:'0 16px 8px', height:80, background:'rgba(11,15,16,0.60)', backdropFilter:'blur(16px)', borderTop:'1px solid rgba(255,255,255,0.05)', borderRadius:'2rem 2rem 0 0' }}>
        {[{label:'Home',icon:'⌂',href:'/',active:false},{label:'Search',icon:'🔍',href:'/search',active:true},{label:'Add Spot',icon:'➕',href:'/add',active:false},{label:'Profile',icon:'👤',href:'/profile',active:false}].map(n=>(
          <a key={n.label} href={n.href} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textDecoration:'none', color:n.active?'#74f5ff':'rgba(185,202,203,0.7)', gap:4, padding:'4px 12px', borderRadius:12, background:n.active?'rgba(116,245,255,0.10)':'transparent', transition:'all .15s' }}>
            <span style={{ fontSize:22, lineHeight:1 }}>{n.icon}</span>
            <span style={{ fontSize:9, fontWeight:500, letterSpacing:'.05em', fontFamily:'"JetBrains Mono",monospace' }}>{n.label.toUpperCase()}</span>
          </a>
        ))}
      </nav>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.2} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(116,245,255,0.2); border-radius:10px; }
      `}</style>
    </div>
  )
}

export default function SearchPage() {
  const { Suspense } = require('react')
  return <Suspense><SearchPageInner/></Suspense>
}
