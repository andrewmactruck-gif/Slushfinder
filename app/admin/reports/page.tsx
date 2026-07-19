'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
async function getToken() { const {data:{session}} = await sb.auth.getSession(); return session?.access_token??'' }
function ah(t:string){return{Authorization:'Bearer '+t,'Content-Type':'application/json'}}

const TYPE_LABELS:Record<string,{label:string,color:string}> = {
  broken:      {label:'Machine broken', color:'#ff4444'},
  gone:        {label:'Machine gone',   color:'#ff4444'},
  wrong_info:  {label:'Wrong details',  color:'#ffb400'},
  wrong_hours: {label:'Wrong hours',    color:'#ffb400'},
  other:       {label:'Other',          color:'#849396'},
}

export default function ReportsAdmin() {
  const router = useRouter()
  const [status,setStatus] = useState<'open'|'resolved'|'all'>('open')
  const [reports,setReports] = useState<any[]>([])
  const [loading,setLoading] = useState(true)
  const [toast,setToast] = useState('')
  const [busy,setBusy] = useState<string|null>(null)
  const showToast=(msg:string)=>{setToast(msg);setTimeout(()=>setToast(''),3000)}

  const load=useCallback(async()=>{
    setLoading(true)
    const token=await getToken()
    if(!token){router.push('/admin');return}
    const res=await fetch('/api/admin/reports?status='+status,{headers:ah(token)})
    if(res.status===401){router.push('/admin');return}
    const data=await res.json()
    setReports(data.reports??[])
    setLoading(false)
  },[status,router])
  useEffect(()=>{load()},[load])

  const resolve=async(id:string,resolved:boolean)=>{
    setBusy(id)
    const token=await getToken()
    const res=await fetch('/api/admin/reports',{method:'PATCH',headers:ah(token),body:JSON.stringify({id,resolved})})
    const d=await res.json()
    showToast(d.success?(resolved?'✅ Resolved':'↩ Reopened'):'Error: '+d.error)
    setBusy(null);load()
  }

  const setStatusFor=async(locationId:string,machine_status:string)=>{
    setBusy(locationId)
    const token=await getToken()
    const res=await fetch('/api/admin/reports',{method:'PATCH',headers:ah(token),body:JSON.stringify({location_id:locationId,machine_status})})
    const d=await res.json()
    showToast(d.success?'🗺️ Location marked '+machine_status.replace('_',' '):'Error: '+d.error)
    setBusy(null);load()
  }

  const btn=(c='#00e5ff')=>({background:'none',border:'1px solid '+c,borderRadius:7,color:c,padding:'5px 11px',fontSize:11,fontWeight:700,cursor:'pointer'})
  const inp={background:'#1c2021',border:'1px solid #3b494c',borderRadius:9,padding:'7px 11px',color:'#fff',fontSize:12,outline:'none',fontFamily:'inherit'}
  const td={padding:'10px 12px',fontSize:12,color:'#bac9cc',borderBottom:'1px solid rgba(59,73,76,.4)',verticalAlign:'top' as const}
  const th={padding:'8px 12px',textAlign:'left' as const,fontSize:10,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'.07em',color:'#849396',borderBottom:'1px solid #3b494c',whiteSpace:'nowrap' as const}

  return(
    <div style={{background:'#101415',minHeight:'100vh',fontFamily:'Inter,sans-serif',color:'#e0e3e4'}}>
      <div style={{background:'#111318',borderBottom:'1px solid #3b494c',padding:'11px 20px',display:'flex',alignItems:'center',gap:10,position:'sticky',top:0,zIndex:20,flexWrap:'wrap'}}>
        <span style={{fontSize:20}}>🧊</span>
        <span style={{color:'#00e5ff',fontWeight:800,fontSize:14}}>Slush Finder Admin</span>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <button style={btn('#849396')} onClick={()=>router.push('/admin/locations')}>📋 Locations</button>
          <button style={{...btn('#00e5ff'),background:'rgba(0,229,255,.1)'}}>🚩 Reports</button>
          <button style={btn('#849396')} onClick={()=>router.push('/admin/users')}>👥 Users</button>
        </div>
        <button style={{...btn('#ff4444'),marginLeft:'auto'}} onClick={async()=>{await sb.auth.signOut();router.push('/admin')}}>Log out</button>
      </div>

      <div style={{padding:20,maxWidth:1200,margin:'0 auto'}}>
        <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
          <select value={status} onChange={e=>setStatus(e.target.value as any)} style={{...inp,cursor:'pointer'}}>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="all">All</option>
          </select>
          <button style={btn()} onClick={load}>🔄 Refresh</button>
          <span style={{fontSize:11,color:'#849396',marginLeft:'auto'}}>{reports.length} reports</span>
        </div>

        {loading ? (
          <p style={{color:'#849396',fontSize:13,padding:'30px 0',textAlign:'center'}}>Loading…</p>
        ) : reports.length===0 ? (
          <p style={{color:'#849396',fontSize:13,padding:'40px 0',textAlign:'center'}}>
            {status==='open'?'No open reports — nothing to triage. 🎉':'No reports here.'}
          </p>
        ) : (
          <div style={{background:'#111318',border:'1px solid #3b494c',borderRadius:12,overflow:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse' as const}}>
              <thead><tr>
                <th style={th}>Location</th><th style={th}>Issue</th><th style={th}>Notes</th>
                <th style={th}>Reported</th><th style={th}>Map status</th><th style={th}>Actions</th>
              </tr></thead>
              <tbody>
                {reports.map(r=>{
                  const t = TYPE_LABELS[r.report_type] ?? TYPE_LABELS.other
                  const loc = r.locations
                  return (
                    <tr key={r.id} style={{opacity:r.resolved?.55:1}}>
                      <td style={td}>
                        <a href={'/location/'+r.location_id} target="_blank" rel="noopener noreferrer" style={{color:'#00e5ff',textDecoration:'none',fontWeight:600}}>
                          {loc?.name ?? '(deleted)'}
                        </a>
                        {loc && <div style={{color:'#849396',fontSize:11,marginTop:2}}>{loc.city}{loc.region?', '+loc.region:''} · {loc.brand}</div>}
                      </td>
                      <td style={td}><span style={{color:t.color,fontWeight:700}}>{t.label}</span></td>
                      <td style={{...td,maxWidth:260}}>{r.notes || <span style={{color:'#4d5a5c'}}>—</span>}</td>
                      <td style={{...td,whiteSpace:'nowrap' as const}}>{new Date(r.created_at).toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'})}</td>
                      <td style={td}>
                        <span style={{fontSize:11,color:loc?.machine_status==='operational'?'#00ee98':'#ffb400'}}>
                          {loc?.machine_status?.replace('_',' ') ?? '—'}
                        </span>
                      </td>
                      <td style={{...td,whiteSpace:'nowrap' as const}}>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          {!r.resolved
                            ? <button disabled={busy===r.id} style={btn('#00ee98')} onClick={()=>resolve(r.id,true)}>✓ Resolve</button>
                            : <button disabled={busy===r.id} style={btn('#849396')} onClick={()=>resolve(r.id,false)}>↩ Reopen</button>}
                          {loc && loc.machine_status!=='issue_reported' &&
                            <button disabled={busy===r.location_id} style={btn('#ffb400')} onClick={()=>setStatusFor(r.location_id,'issue_reported')}>⚠ Flag on map</button>}
                          {loc && loc.machine_status!=='operational' &&
                            <button disabled={busy===r.location_id} style={btn('#00e5ff')} onClick={()=>setStatusFor(r.location_id,'operational')}>✓ Mark OK</button>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && <div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',background:'#111318',border:'1px solid #3b494c',borderRadius:10,padding:'10px 18px',fontSize:13,zIndex:50}}>{toast}</div>}
    </div>
  )
}
