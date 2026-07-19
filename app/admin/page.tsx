'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/admin/locations')
    })
  }, [router])

  const login = async () => {
    setErr(''); setLoading(true)
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pw })
    if (error) { setErr(error.message); setLoading(false); return }
    const token = data.session?.access_token
    const res = await fetch('/api/admin/locations?tab=submissions&status=all&q=', { headers: { Authorization: `Bearer ${token}` } })
    if (res.status === 401) { await sb.auth.signOut(); setErr('Your account does not have admin access. Ask an admin to grant you the admin role.'); setLoading(false); return }
    router.push('/admin/locations')
  }

  return (
    <div style={{background:'#101415',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Inter,system-ui,sans-serif',padding:16}}>
      <div style={{background:'#111318',border:'1px solid #3b494c',borderRadius:16,padding:32,width:'100%',maxWidth:360}}>
        <div style={{textAlign:'center',marginBottom:20}}>
          <div style={{fontSize:40,marginBottom:8}}>🧊</div>
          <h1 style={{color:'#00e5ff',fontSize:20,fontWeight:800,margin:0}}>Slush Finder Admin</h1>
          <p style={{color:'#849396',fontSize:12,marginTop:4}}>Sign in with your admin account</p>
        </div>
        <label style={{display:'block',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'#849396',marginBottom:4}}>Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com"
          style={{width:'100%',height:42,background:'#1c2021',border:'1px solid #3b494c',borderRadius:10,padding:'0 12px',color:'#fff',fontSize:13,marginBottom:12,boxSizing:'border-box' as const,outline:'none'}}/>
        <label style={{display:'block',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'#849396',marginBottom:4}}>Password</label>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} placeholder="••••••••"
          style={{width:'100%',height:42,background:'#1c2021',border:'1px solid #3b494c',borderRadius:10,padding:'0 12px',color:'#fff',fontSize:13,marginBottom:12,boxSizing:'border-box' as const,outline:'none'}}/>
        {err && <p style={{color:'#ff4444',fontSize:11,marginBottom:10,lineHeight:1.4}}>{err}</p>}
        <button onClick={login} disabled={loading}
          style={{width:'100%',height:44,background:'linear-gradient(135deg,#00e5ff,#9c27ff)',color:'#000',border:'none',borderRadius:11,fontSize:14,fontWeight:800,cursor:'pointer',opacity:loading?.6:1,fontFamily:'inherit'}}>
          {loading?'Signing in…':'SIGN IN'}
        </button>
        <div style={{marginTop:16,padding:12,background:'#1c2021',borderRadius:8,fontSize:11,color:'#849396',lineHeight:1.6}}>
          <b style={{color:'#bac9cc'}}>First time?</b> Sign up on the site, then in Supabase SQL Editor run:<br/>
          <code style={{color:'#00e5ff',fontSize:10,wordBreak:'break-all' as const}}>UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';</code>
        </div>
      </div>
    </div>
  )
}
