'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'
import ThemeToggle from '@/components/ThemeToggle'
import { PRESET_AVATARS } from '@/lib/avatars'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [myStats, setMyStats] = useState<any>(null)
  const [tab, setTab] = useState<'saved'|'flavours'|'activity'>('saved')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [authMode, setAuthMode] = useState<'login'|'signup'>('login')
  const [authErr, setAuthErr] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(()=>{ if(!user) return; fetch('/api/leaderboard').then(r=>r.json()).then(d=>{ const row=(d.leaderboard||[]).find((x:any)=>x.user_id===user.id); setMyStats(row||{points:0,checkins:0,adds:0,rank:null}) }).catch(()=>{}) },[user])

  useEffect(() => {
    sb.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) loadProfile(user.id)
      else setLoading(false)
    })
  }, [])

  const loadProfile = async (id: string) => {
    const { data } = await sb.from('profiles').select('*').eq('id', id).single()
    setProfile(data); setLoading(false)
  }

  const [uploading, setUploading] = useState(false)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) { alert('Please choose an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB.'); return }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      const { error: upErr } = await sb.storage.from('avatars').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: pub } = sb.storage.from('avatars').getPublicUrl(path)
      const url = pub.publicUrl + '?t=' + Date.now()
      const { error: dbErr } = await sb.from('profiles').update({ avatar_url: url }).eq('id', user.id)
      if (dbErr) throw dbErr
      loadProfile(user.id)
    } catch (err: any) {
      alert('Upload failed: ' + (err.message || 'unknown error'))
    } finally {
      setUploading(false)
    }
  }

  const handleEmojiPick = async (emoji: string) => {
    if (!user) return
    await sb.from('profiles').update({ emoji, avatar_url: null }).eq('id', user.id)
    loadProfile(user.id)
  }

  const handleAvatarPick = async (url: string) => {
    if (!user) return
    await sb.from('profiles').update({ avatar_url: url }).eq('id', user.id)
    loadProfile(user.id)
  }

  const handleAuth = async () => {
    setAuthErr('')
    if (!email || !pw) { setAuthErr('Please enter your email and password'); return }
    if (pw.length < 6) { setAuthErr('Password must be at least 6 characters'); return }
    const { data, error } = authMode === 'login'
      ? await sb.auth.signInWithPassword({ email, password: pw })
      : await sb.auth.signUp({ email, password: pw })
    if (error) { setAuthErr(error.message || error.status?.toString() || JSON.stringify(error)); return }
    if (data.session) {
      // Logged in immediately
      setUser(data.user); loadProfile(data.user!.id)
    } else if (data.user && !data.session) {
      // Email confirmation required
      setAuthErr('Account created! Check your email to confirm, then sign in.')
    }
  }

  const handleLogout = async () => { await sb.auth.signOut(); setUser(null); setProfile(null) }

  const nav = [{label:'Home',icon:'⌂',href:'/'},{label:'Search',icon:'🔍',href:'/search'},{label:'Add Spot',icon:'➕',href:'/add'},{label:'Ranks',icon:'🏆',href:'/leaderboard'},{label:'Profile',icon:'👤',href:'/profile',active:true}]
  const BottomNav = () => (
    <nav className="botnav flex px-2 pb-2 pt-1 sticky bottom-0 z-20">
      {nav.map(n=>(
        <a key={n.label} href={n.href} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'6px 4px', textDecoration:'none', color:(n as any).active?'var(--pri)':'var(--t3)' }}>
          <span style={{ fontSize:22, lineHeight:1 }}>{n.icon}</span>
          <span style={{ fontSize:9, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase' }}>{n.label}</span>
        </a>
      ))}
    </nav>
  )

  const base = { background:'var(--bg)', minHeight:'100vh', display:'flex', flexDirection:'column' as const, fontFamily:'"Space Grotesk",system-ui,sans-serif', color:'var(--t1)' }
  const header = (
    <header className="topbar px-4 sticky top-0 z-20 flex items-center justify-between h-16">
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Image src="/logo.png" alt="" width={32} height={32} className="rounded-lg logo-blend" />
        <span style={{ fontSize:18, fontWeight:800, color:'var(--pri)' }}>SlushFinder</span>
      </div>
      <ThemeToggle />
    </header>
  )

  if (loading) return <div style={{ ...base, alignItems:'center', justifyContent:'center' }}><div style={{ width:32, height:32, border:'3px solid var(--out-v)', borderTopColor:'var(--pri)', borderRadius:'50%', animation:'spin .7s linear infinite' }}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>

  if (!user) return (
    <div style={base}>
      {header}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ width:'100%', maxWidth:360, background:'var(--s-low)', border:'1px solid var(--out-v)', borderRadius:20, padding:28 }}>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🧊</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'var(--t1)', marginBottom:4 }}>{authMode==='login'?'Welcome back':'Join SlushFinder'}</h1>
            <p style={{ fontSize:13, color:'var(--t3)' }}>{authMode==='login'?'Sign in to your account':'Create your account to save spots'}</p>
          </div>
          {[{l:'Email',v:email,s:setEmail,t:'email',p:'your@email.com'},{l:'Password',v:pw,s:setPw,t:'password',p:'••••••••'}].map(f=>(
            <div key={f.l}>
              <label style={{ display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--t3)', marginBottom:4 }}>{f.l}</label>
              <input type={f.t} value={f.v} onChange={e=>f.s(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAuth()} placeholder={f.p}
                style={{ width:'100%', height:44, background:'var(--s-base)', border:'1.5px solid var(--out-v)', borderRadius:12, padding:'0 14px', color:'var(--t1)', fontSize:14, marginBottom:12, boxSizing:'border-box', outline:'none', fontFamily:'inherit' }}/>
            </div>
          ))}
          {authErr && <p style={{ color:'var(--err)', fontSize:12, marginBottom:10 }}>{authErr}</p>}
          <button onClick={handleAuth} style={{ width:'100%', height:46, background:'var(--grad)', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', marginBottom:14 }}>
            {authMode==='login'?'SIGN IN':'CREATE ACCOUNT'}
          </button>
          <p style={{ textAlign:'center', fontSize:12, color:'var(--t3)' }}>
            {authMode==='login'?"Don't have an account? ":"Already have an account? "}
            <button onClick={()=>setAuthMode(authMode==='login'?'signup':'login')} style={{ color:'var(--pri)', background:'none', border:'none', cursor:'pointer', fontWeight:700, fontSize:12, fontFamily:'inherit' }}>
              {authMode==='login'?'Sign up':'Sign in'}
            </button>
          </p>
        </div>
      </div>
      <BottomNav/>
    </div>
  )

  return (
    <div style={base}>
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0 }}>
        <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', top:-100, left:-80, background:'radial-gradient(circle,rgba(0,242,255,0.08),transparent 65%)', filter:'blur(60px)' }}/>
        <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', top:'50%', right:-80, background:'radial-gradient(circle,rgba(182,0,248,0.06),transparent 65%)', filter:'blur(50px)' }}/>
      </div>
      <header className="topbar px-4 sticky top-0 z-20 flex items-center justify-between h-16">
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Image src="/logo.png" alt="" width={32} height={32} className="rounded-lg logo-blend" />
          <span style={{ fontSize:18, fontWeight:800, color:'var(--pri)' }}>SlushFinder</span>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <ThemeToggle/>
          <button onClick={handleLogout} style={{ fontSize:11, color:'var(--t3)', background:'none', border:'1px solid var(--out-v)', borderRadius:8, padding:'4px 10px', cursor:'pointer', fontFamily:'inherit' }}>Sign out</button>
        </div>
      </header>
      <main style={{ flex:1, padding:'24px 16px 100px', maxWidth:480, margin:'0 auto', width:'100%', position:'relative', zIndex:1 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:24 }}>
          <div style={{ position:'relative', marginBottom:12 }}>
            <div style={{ width:96, height:96, borderRadius:'50%', background:'var(--grad)', padding:3, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:'var(--s-base)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, overflow:'hidden' }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : (profile?.emoji || '🧊')}
              </div>
            </div>
            <label style={{ position:'absolute', bottom:0, right:0, width:28, height:28, borderRadius:'50%', background:'var(--pri)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, border:'2px solid var(--bg)', cursor:'pointer' }}>
              {uploading ? '…' : '📷'}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display:'none' }}/>
            </label>
          </div>
          <div style={{ display:'flex', gap:8, marginBottom:12, overflowX:'auto', paddingBottom:4, maxWidth:'100%' }}>
            {PRESET_AVATARS.map(url => (
              <button key={url} onClick={()=>handleAvatarPick(url)}
                style={{ flexShrink:0, width:52, height:52, borderRadius:'50%', overflow:'hidden', cursor:'pointer', padding:0,
                  border:'2px solid ' + (profile?.avatar_url===url ? 'var(--cyan)' : 'var(--out-v)'), background:'var(--s-base)' }}>
                <img src={url} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              </button>
            ))}
          </div>
          <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap', justifyContent:'center' }}>
            {['🧊','🍒','🫐','🍋','🍇','🍉','🔥','⭐'].map(em => (
              <button key={em} onClick={()=>handleEmojiPick(em)} style={{ fontSize:18, width:34, height:34, borderRadius:8, border:'1px solid var(--out-v)', background: profile?.emoji===em && !profile?.avatar_url ? 'var(--pri)' : 'var(--s-base)', cursor:'pointer' }}>{em}</button>
            ))}
          </div>
          <h1 style={{ fontSize:20, fontWeight:800, color:'var(--t1)', marginBottom:2 }}>{profile?.username?`@${profile.username}`:user.email?.split('@')[0]}</h1>
          {profile?.city && <p style={{ fontSize:12, color:'var(--t3)', display:'flex', alignItems:'center', gap:4, marginBottom:8 }}>📍 {profile.city}</p>}
          <div style={{ background:'var(--s-base)', borderRadius:999, padding:'6px 16px', display:'inline-flex', alignItems:'center', gap:8, border:'1px solid var(--out-v)' }}>
            <span style={{ fontSize:10, fontWeight:700, color:'var(--sec-dim)', textTransform:'uppercase' }}>Level 1</span>
            <div style={{ width:80, height:4, background:'var(--out-v)', borderRadius:999, overflow:'hidden' }}>
              <div style={{ width:'5%', height:'100%', background:'var(--grad)', borderRadius:999 }}/>
            </div>
            <span style={{ fontSize:10, color:'var(--t3)' }}>0 XP</span>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
          {[{n:0,l:'Saved'},{n:0,l:'Favs'},{n:0,l:'Added'}].map(s=>(
            <div key={s.l} style={{ background:'var(--s-low)', border:'1px solid var(--out-v)', borderRadius:14, padding:14, textAlign:'center' }}>
              <div style={{ fontSize:24, fontWeight:800, color:'var(--pri)', lineHeight:1 }}>{s.n}</div>
              <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--t3)', marginTop:4 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', borderBottom:'1px solid var(--out-v)', marginBottom:16 }}>
          {(['saved','flavours','activity'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ flex:1, height:40, background:'none', border:'none', cursor:'pointer', fontSize:12, fontWeight:700, textTransform:'capitalize', color:tab===t?'var(--pri)':'var(--t3)', borderBottom:tab===t?'2px solid var(--pri)':'2px solid transparent', fontFamily:'inherit' }}>{t}</button>
          ))}
        </div>
        {tab==='saved'&&<div style={{ textAlign:'center', padding:'32px 0', color:'var(--t3)', fontSize:13 }}><div style={{ fontSize:32, marginBottom:8 }}>🧊</div>Save slushie spots to see them here.</div>}
        {tab==='flavours'&&<div style={{ textAlign:'center', padding:'32px 0', color:'var(--t3)', fontSize:13 }}><div style={{ fontSize:32, marginBottom:8 }}>🍒</div>Add favourite flavours for personalized picks.</div>}
        {tab==='activity'&&(myStats ? (
          <div style={{ padding:'8px 0' }}>
            <div style={{ display:'flex', gap:10, marginBottom:12 }}>
              <div style={{ flex:1, textAlign:'center', padding:'16px 8px', borderRadius:14, background:'rgba(0,219,231,0.06)', border:'1px solid rgba(0,219,231,0.2)' }}>
                <div style={{ fontSize:26, fontWeight:800, color:'var(--cyan,#00b4cc)' }}>{myStats.points}</div>
                <div style={{ fontSize:11, color:'var(--t3)' }}>points</div>
              </div>
              <div style={{ flex:1, textAlign:'center', padding:'16px 8px', borderRadius:14, background:'var(--s1,#1a1e1f)', border:'1px solid var(--b1,rgba(255,255,255,0.06))' }}>
                <div style={{ fontSize:26, fontWeight:800, color:'var(--t1)' }}>{myStats.rank?('#'+myStats.rank):'—'}</div>
                <div style={{ fontSize:11, color:'var(--t3)' }}>rank</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginBottom:16 }}>
              <div style={{ flex:1, textAlign:'center', padding:'12px 8px', borderRadius:14, background:'var(--s1,#1a1e1f)', border:'1px solid var(--b1,rgba(255,255,255,0.06))' }}>
                <div style={{ fontSize:20, fontWeight:800 }}>{myStats.checkins}</div>
                <div style={{ fontSize:11, color:'var(--t3)' }}>check-ins</div>
              </div>
              <div style={{ flex:1, textAlign:'center', padding:'12px 8px', borderRadius:14, background:'var(--s1,#1a1e1f)', border:'1px solid var(--b1,rgba(255,255,255,0.06))' }}>
                <div style={{ fontSize:20, fontWeight:800 }}>{myStats.adds}</div>
                <div style={{ fontSize:11, color:'var(--t3)' }}>added</div>
              </div>
            </div>
            <button onClick={()=>router.push('/leaderboard')} style={{ width:'100%', padding:'11px', borderRadius:10, background:'var(--grad,linear-gradient(90deg,#00e5ff,#9c27ff))', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>🏆 View full leaderboard</button>
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'32px 0', color:'var(--t3)', fontSize:13 }}><div style={{ fontSize:32, marginBottom:8 }}>📍</div>Check in somewhere to start earning points!</div>
        ))}
      </main>
      <BottomNav/>
    </div>
  )
}
