'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
async function getToken(){const{data:{session}}=await sb.auth.getSession();return session?.access_token??''}
function ah(t:string){return{Authorization:'Bearer '+t,'Content-Type':'application/json'}}
export default function UsersAdmin(){
  const router=useRouter()
  const [users,setUsers]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState('')
  const [toast,setToast]=useState('')
  const showToast=(msg:string)=>{setToast(msg);setTimeout(()=>setToast(''),3000)}
  const load=useCallback(async()=>{
    setLoading(true)
    const token=await getToken()
    if(!token){router.push('/admin');return}
    const res=await fetch('/api/admin/users',{headers:ah(token)})
    if(res.status===401){router.push('/admin');return}
    const data=await res.json()
    setUsers(data.users??[])
    setLoading(false)
  },[router])
  useEffect(()=>{load()},[load])
  const del=async(id:string,email:string)=>{
    if(!confirm('Permanently DELETE '+email+'?'))return
    const t=await getToken()
    const r=await fetch('/api/admin/users?id='+id+'&action=delete',{method:'DELETE',headers:ah(t)})
    const d=await r.json()
    if(d.success){showToast('🗑️ Deleted');load()}else showToast('Error: '+d.error)
  }
  const ban=async(id:string,email:string)=>{
    if(!confirm('Ban '+email+'?'))return
    const t=await getToken()
    const r=await fetch('/api/admin/users?id='+id+'&action=ban',{method:'DELETE',headers:ah(t)})
    const d=await r.json()
    if(d.success){showToast('🚫 Banned');load()}else showToast('Error: '+d.error)
  }
  const setRole=async(id:string,role:string)=>{
    const t=await getToken()
    const r=await fetch('/api/admin/users',{method:'PATCH',headers:ah(t),body:JSON.stringify({userId:id,role})})
    const d=await r.json()
    if(d.success){showToast('✅ Role: '+role);load()}else showToast('Error: '+d.error)
  }
  const filtered=users.filter(u=>!search||u.email?.toLowerCase().includes(search.toLowerCase()))
  const inp={background:'#1c2021',border:'1px solid #3b494c',borderRadius:9,padding:'7px 11px',color:'#fff',fontSize:12,outline:'none',fontFamily:'inherit'}
  const btn=(c='#00e5ff')=>({background:'none',border:'1px solid '+c,borderRadius:7,color:c,padding:'4px 9px',fontSize:11,fontWeight:700,cursor:'pointer'})
  const td={padding:'10px 12px',fontSize:12,borderBottom:'1px solid rgba(59,73,76,.4)',verticalAlign:'middle' as const}
  return(
    <div style={{background:'#101415',minHeight:'100vh',fontFamily:'Inter,sans-serif',color:'#e0e3e4'}}>
      <div style={{background:'#111318',borderBottom:'1px solid #3b494c',padding:'11px 20px',display:'flex',alignItems:'center',gap:10,position:'sticky',top:0,zIndex:20,flexWrap:'wrap'}}>
        <span style={{fontSize:20}}>🧊</span>
        <span style={{color:'#00e5ff',fontWeight:800,fontSize:14}}>Slush Finder Admin</span>
        <button style={btn('#849396')} onClick={()=>router.push('/admin/locations')}>← Locations</button>
        <button style={btn('#849396')} onClick={()=>router.push('/admin/reports')}>🚩 Reports</button>
        <span style={{color:'#bac9cc',fontWeight:700}}>👥 Users</span>
        <button style={{...btn('#ff4444'),marginLeft:'auto'}} onClick={async()=>{await sb.auth.signOut();router.push('/admin')}}>Log out</button>
      </div>
      <div style={{padding:20,maxWidth:1100,margin:'0 auto'}}>
        <div style={{background:'#111318',border:'1px solid #3b494c',borderRadius:12,padding:14,marginBottom:16,fontSize:12,color:'#bac9cc',lineHeight:1.6}}>
          <b style={{color:'#00e5ff'}}>Grant admin:</b> Change role dropdown below, or run in Supabase SQL Editor:<br/>
          <code style={{color:'#00e5ff',fontSize:11}}>UPDATE profiles SET role = 'admin' WHERE id = 'user-uuid-here';</code>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:14,alignItems:'center',flexWrap:'wrap'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by email…" style={{...inp,width:240}}/>
          <button style={btn()} onClick={load}>🔄 Refresh</button>
          <span style={{fontSize:11,color:'#849396',marginLeft:'auto'}}>{filtered.length} users</span>
        </div>
        {loading?<div style={{textAlign:'center',padding:40,color:'#849396'}}>Loading users…</div>:(
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',background:'#111318',borderRadius:13,overflow:'hidden'}}>
              <thead><tr>{['Email','Role','Created','Last Sign In','Status','Actions'].map(h=><th key={h} style={{padding:'8px 12px',textAlign:'left' as const,fontSize:10,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'.07em',color:'#849396',borderBottom:'1px solid #3b494c'}}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(u=>(
                  <tr key={u.id}>
                    <td style={td}><div style={{color:'#fff',fontWeight:600,fontSize:12}}>{u.email}</div><div style={{fontSize:10,color:'#849396'}}>{u.id.slice(0,8)}…</div></td>
                    <td style={td}><select value={u.role} onChange={e=>setRole(u.id,e.target.value)} style={{...inp,padding:'3px 8px',fontSize:11,cursor:'pointer',color:u.role==='admin'?'#00e5ff':'#bac9cc',borderColor:u.role==='admin'?'rgba(0,229,255,.4)':'#3b494c'}}><option value="user">User</option><option value="admin">Admin</option></select></td>
                    <td style={{...td,whiteSpace:'nowrap' as const,color:'#849396'}}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td style={{...td,whiteSpace:'nowrap' as const,color:'#849396'}}>{u.last_sign_in?new Date(u.last_sign_in).toLocaleDateString():'—'}</td>
                    <td style={td}><span style={{padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:700,background:u.confirmed?'rgba(0,238,152,.1)':'rgba(255,180,0,.1)',color:u.confirmed?'#00ee98':'#ffb400',border:'1px solid '+(u.confirmed?'rgba(0,238,152,.3)':'rgba(255,180,0,.3)')}}>{u.confirmed?'Active':'Unconfirmed'}</span></td>
                    <td style={td}><div style={{display:'flex',gap:4}}><button style={btn('#ffb400')} onClick={()=>ban(u.id,u.email)}>🚫 Ban</button><button style={btn('#ff4444')} onClick={()=>del(u.id,u.email)}>🗑️ Del</button></div></td>
                  </tr>
                ))}
                {!filtered.length&&<tr><td colSpan={6} style={{...td,textAlign:'center' as const,padding:32,color:'#849396'}}>No users found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {toast&&<div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',background:'#111318',border:'1px solid rgba(0,238,152,.4)',color:'#00ee98',padding:'10px 18px',borderRadius:12,fontSize:12,fontWeight:700,zIndex:50,whiteSpace:'nowrap'}}>{toast}</div>}
    </div>
  )
}
