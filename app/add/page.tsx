'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import ThemeToggle from '@/components/ThemeToggle'
import { SubmitLocationPayload } from '@/types'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const COUNTRIES = [
  {code:'CA',name:'Canada'},{code:'US',name:'United States'},{code:'GB',name:'United Kingdom'},
  {code:'AU',name:'Australia'},{code:'JP',name:'Japan'},{code:'KR',name:'South Korea'},
  {code:'DE',name:'Germany'},{code:'FR',name:'France'},{code:'NL',name:'Netherlands'},
  {code:'BR',name:'Brazil'},{code:'MX',name:'Mexico'},{code:'IN',name:'India'},
  {code:'SG',name:'Singapore'},{code:'ZA',name:'South Africa'},{code:'AE',name:'UAE'},
]

const FLAVOURS = [
  {label:'Cherry',color:'#ff4560'},{label:'Blue Raspberry',color:'#3b82f6'},
  {label:'Lemon',color:'#eab308'},{label:'Strawberry',color:'#ec4899'},
  {label:'Watermelon',color:'#22c55e'},{label:'Cola',color:'#b45309'},
  {label:'Grape',color:'#a855f7'},{label:'Arctic Mint',color:'#06b6d4'},
]

const CONDITIONS = [
  '\u2705 All good \u2014 Working great',
  '\u26a0\ufe0f Too liquidy \u2014 Watery or warm',
  '\ud83e\udd76 Too frozen \u2014 Hard to pour',
  '\u274c Out of order \u2014 Machine down',
]

export default function AddPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [flavours, setFlavours] = useState<string[]>([])
  const [condition, setCondition] = useState<string|null>(null)
  const [form, setForm] = useState<Partial<SubmitLocationPayload>>({ brand:'7-Eleven', country_code:'CA', country_name:'Canada' })

  const set = (k: keyof SubmitLocationPayload, v: string) => setForm(f=>({...f,[k]:v}))
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [showSug, setShowSug] = useState(false)
  const searchTimer = (globalThis as any)._sfTimer

  const onAddressType = (v: string) => {
    set('address', v)
    setShowSug(true)
    if ((globalThis as any)._sfTimer) clearTimeout((globalThis as any)._sfTimer)
    if (v.trim().length < 4) { setSuggestions([]); return }
    ;(globalThis as any)._sfTimer = setTimeout(async () => {
      setSearching(true)
      try {
        const cc = form.country_code || ''
        const res = await fetch(`/api/address-search?q=${encodeURIComponent(v)}&cc=${cc}`)
        const d = await res.json()
        setSuggestions(d.results || [])
      } catch { setSuggestions([]) }
      setSearching(false)
    }, 500)
  }

  const pickSuggestion = (sug: any) => {
    setForm(f => ({ ...f,
      address: sug.address || f.address,
      city: sug.city || f.city,
      region: sug.region || f.region,
      postal_code: sug.postal_code || f.postal_code,
      country_code: sug.country_code || f.country_code,
      country_name: sug.country_name || f.country_name,
      latitude: sug.latitude,
      longitude: sug.longitude,
    }))
    setSuggestions([])
    setShowSug(false)
  }
  const toggleFlavour = (f: string) => setFlavours(prev=>prev.includes(f)?prev.filter(x=>x!==f):[...prev,f])

  const handleSubmit = async () => {
    if (!form.name || !form.city || !form.country_code || !form.brand) { setError('Please fill in all required fields'); return }
    setLoading(true); setError('')
    try {
      const { data:{ user } } = await sb.auth.getUser()
      const res = await fetch('/api/submit-location', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...form, flavours:flavours.join(', '), machine_condition:condition, added_by:user?.id ?? null}) })
      const data = await res.json()
      if (data.success) setSubmitted(true)
      else setError(data.error ?? 'Submission failed')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  const F: React.CSSProperties = { width:'100%', height:48, background:'var(--s-base)', border:'1.5px solid var(--out-v)', borderRadius:12, padding:'0 14px', color:'var(--t1)', fontSize:14, boxSizing:'border-box', outline:'none', fontFamily:'inherit' }
  const L: React.CSSProperties = { display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--pri)', marginBottom:5, marginTop:14 }
  const nav = [{label:'Home',icon:'\u2302',href:'/'},{label:'Search',icon:'\ud83d\udd0d',href:'/search'},{label:'Add Spot',icon:'+',href:'/add',active:true},{label:'Profile',icon:'\ud83d\udc64',href:'/profile'}]

  if (submitted) return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'inherit', color:'var(--t1)' }}>
      <div style={{ fontSize:64, marginBottom:16 }}>&#x1F9CA;</div>
      <h1 style={{ fontSize:24, fontWeight:800, color:'var(--pri)', marginBottom:8 }}>Station Added!</h1>
      <p style={{ fontSize:14, color:'var(--t2)', textAlign:'center', maxWidth:280, marginBottom:24, lineHeight:1.6 }}>Your location is now live on the map!</p>
      <button onClick={()=>router.push('/')} style={{ height:48, padding:'0 32px', background:'var(--grad)', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Back to Home</button>
    </div>
  )

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', display:'flex', flexDirection:'column', fontFamily:'"Space Grotesk",system-ui,sans-serif', color:'var(--t1)' }}>
      <header className="topbar px-4 sticky top-0 z-20 flex items-center justify-between h-16">
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={()=>router.back()} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--t2)', fontSize:20, padding:4 }}>&#x2190;</button>
          <a href="/" style={{display:"inline-flex",lineHeight:0}}><Image src="/logo.png" alt="Home" width={43} height={43} className="rounded-lg logo-blend"/></a>
          <span style={{ fontSize:15, fontWeight:800, color:'var(--pri)' }}>Add a Station</span>
        </div>
        <ThemeToggle/>
      </header>
      <main style={{ flex:1, padding:'20px 16px 100px', maxWidth:480, margin:'0 auto', width:'100%' }}>
        <h1 style={{ fontSize:26, fontWeight:800, color:'var(--t1)', marginBottom:6 }}>Add a Station</h1>
        <p style={{ fontSize:13, color:'var(--t2)', marginBottom:20, lineHeight:1.6 }}>Know a slushy machine not on the map? Add it here.</p>
        <div style={{ display:'flex', gap:6, marginBottom:20 }}>
          {['Location','Machine','Condition'].map((s,i)=>(
            <div key={s} style={{ flex:1 }}>
              <div style={{ height:4, borderRadius:999, background:i<=step?'var(--grad)':' var(--out-v)', cursor:i<step?'pointer':'default' }} onClick={()=>i<step&&setStep(i)}/>
              <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:i<=step?'var(--pri)':'var(--t3)', marginTop:4 }}>{s}</div>
            </div>
          ))}
        </div>
        {step===0&&(
          <div style={{ background:'var(--s-low)', border:'1px solid var(--out-v)', borderRadius:16, padding:20 }}>
            <div style={{ borderLeft:'3px solid var(--pri)', paddingLeft:10, marginBottom:4 }}>
              <span style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--pri)' }}>Store Identity</span>
            </div>
            <label style={L}>Store Name *</label>
            <input value={form.name??''} onChange={e=>set('name',e.target.value)} placeholder="e.g. 7-Eleven Shibuya" style={F}/>
            <label style={L}>Street Address</label>
            <div style={{ position:'relative' }}>
              <input value={form.address??''} onChange={e=>onAddressType(e.target.value)} onFocus={()=>setShowSug(true)} placeholder="Start typing address…" style={F} autoComplete="off"/>
              {showSug && (suggestions.length>0 || searching) && (
                <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:50, background:'var(--s-base)', border:'1px solid var(--out-v)', borderRadius:10, marginTop:4, overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }}>
                  {searching && <div style={{ padding:'10px 12px', fontSize:12, color:'var(--t3)' }}>Searching…</div>}
                  {!searching && suggestions.map((sug,i)=>(
                    <div key={i} onClick={()=>pickSuggestion(sug)} style={{ padding:'10px 12px', fontSize:12, color:'var(--t1)', cursor:'pointer', borderBottom:'1px solid var(--out-v)' }}
                      onMouseDown={e=>e.preventDefault()}>
                      📍 {sug.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div><label style={L}>City *</label><input value={form.city??''} onChange={e=>set('city',e.target.value)} placeholder="Tokyo" style={F}/></div>
              <div><label style={L}>Postal / ZIP</label><input value={form.postal_code??''} onChange={e=>set('postal_code',e.target.value)} placeholder="L3Y 4Z1" style={F}/></div>
            </div>
            <label style={L}>State / Province</label>
            <input value={form.region??''} onChange={e=>set('region',e.target.value)} placeholder="Ontario, California..." style={F}/>
            <label style={L}>Country *</label>
            <select value={form.country_code??'CA'} onChange={e=>{const c=COUNTRIES.find(x=>x.code===e.target.value);set('country_code',e.target.value);if(c)set('country_name',c.name)}} style={{...F,cursor:'pointer'}}>
              {COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
        )}
        {step===1&&(
          <div style={{ background:'var(--s-low)', border:'1px solid var(--out-v)', borderRadius:16, padding:20 }}>
            <div style={{ borderLeft:'3px solid var(--sec-dim)', paddingLeft:10, marginBottom:4 }}>
              <span style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--sec-dim)' }}>Machine Specs</span>
            </div>
            <label style={{...L,color:'var(--sec-dim)'}}>Machine Brand *</label>
            <select value={form.brand??'7-Eleven'} onChange={e=>set('brand',e.target.value)} style={{...F,cursor:'pointer'}}>
              <option value="7-Eleven">7-Eleven (Slurpee)</option>
              <option value="Circle K">Circle K (Froster)</option>
              <option value="Couche-Tard">Couche-Tard (Sloche)</option>
              <option value="ICEE">ICEE</option>
              <option value="Slush Puppie">Slush Puppie</option>
              <option value="Frazil">Frazil</option>
              <option value="Restaurant">Restaurant (makes their own)</option>
              <option value="Slurpee Japan">Slurpee Japan</option>
              <option value="Frosty">Frosty</option>
              <option value="Other">Other</option>
            </select>
            <label style={{...L,color:'var(--sec-dim)'}}>Available Flavours</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
              {FLAVOURS.map(f=>(
                <button key={f.label} onClick={()=>toggleFlavour(f.label)} style={{ padding:'6px 14px', borderRadius:999, fontSize:12, fontWeight:600, cursor:'pointer', background:flavours.includes(f.label)?f.color+'22':'var(--s-base)', border:`1.5px solid ${flavours.includes(f.label)?f.color:'var(--out-v)'}`, color:flavours.includes(f.label)?f.color:'var(--t2)', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit' }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:f.color, display:'inline-block' }}/>{f.label}
                </button>
              ))}
            </div>
            <label style={{...L,color:'var(--sec-dim)'}}>Notes (optional)</label>
            <input value={form.notes??''} onChange={e=>set('notes',e.target.value)} placeholder="Location in store, access tips..." style={F}/>
          </div>
        )}
        {step===2&&(
          <div style={{ background:'var(--s-low)', border:'1px solid var(--out-v)', borderRadius:16, padding:20 }}>
            <div style={{ borderLeft:'3px solid var(--t3)', paddingLeft:10, marginBottom:12 }}>
              <span style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--t2)' }}>Machine Condition</span>
            </div>
            <p style={{ fontSize:13, color:'var(--t2)', marginBottom:12 }}>How is the machine right now?</p>
            {CONDITIONS.map(c=>(
              <button key={c} onClick={()=>setCondition(c)} style={{ width:'100%', padding:'12px 16px', borderRadius:12, textAlign:'left', cursor:'pointer', background:condition===c?'rgba(0,242,255,0.08)':'var(--s-base)', border:`1.5px solid ${condition===c?'var(--pri)':'var(--out-v)'}`, fontSize:13, fontWeight:600, color:'var(--t1)', fontFamily:'inherit', marginBottom:8, display:'block' }}>{c}</button>
            ))}
          </div>
        )}
        {error&&<p style={{ color:'var(--err)', fontSize:12, marginTop:12 }}>{error}</p>}
        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{ flex:1, height:48, background:'var(--s-base)', border:'1.5px solid var(--out-v)', borderRadius:12, fontSize:14, fontWeight:700, color:'var(--t2)', cursor:'pointer', fontFamily:'inherit' }}>&#x2190; Back</button>}
          {step<2
            ?<button onClick={()=>setStep(s=>s+1)} style={{ flex:2, height:48, background:'var(--grad)', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Continue &#x2192;</button>
            :<button onClick={handleSubmit} disabled={loading} style={{ flex:2, height:48, background:'var(--grad)', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', opacity:loading?0.6:1 }}>{loading ? 'Adding...' : 'Add to SlushFinder'}</button>
          }
        </div>
        <div style={{ marginTop:16, padding:14, background:'var(--s-base)', borderRadius:12, border:'1px solid var(--out-v)', display:'flex', gap:10 }}>
          <span style={{ fontSize:18, flexShrink:0 }}>&#x2139;&#xFE0F;</span>
          <p style={{ fontSize:12, color:'var(--t3)', lineHeight:1.5 }}>Your submission goes live instantly. Users can report incorrect info.</p>
        </div>
      </main>
      <nav className="botnav flex px-2 pb-2 pt-1 sticky bottom-0 z-20">
        {nav.map(n=>(
          <a key={n.label} href={n.href} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'6px 4px', textDecoration:'none', color:(n as any).active?'var(--pri)':'var(--t3)' }}>
            <span style={{ fontSize:22, lineHeight:1 }}>{n.icon}</span>
            <span style={{ fontSize:9, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase' }}>{n.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
