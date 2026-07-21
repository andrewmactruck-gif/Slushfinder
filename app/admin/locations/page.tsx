'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
async function getToken() { const {data:{session}} = await sb.auth.getSession(); return session?.access_token??'' }
function ah(t:string){return{Authorization:'Bearer '+t,'Content-Type':'application/json'}}
export default function LocationsAdmin() {
  const router = useRouter()
  const [tab,setTab] = useState<'submissions'|'live'>('submissions')
  const [filter,setFilter] = useState('all')
  const [search,setSearch] = useState('')
  const [items,setItems] = useState<any[]>([])
  const [live,setLive] = useState<any[]>([])
  const [loading,setLoading] = useState(true)
  const [toast,setToast] = useState('')
  const [expanded,setExpanded] = useState<string|null>(null)
  const [editForm,setEditForm] = useState<any>({})
  const [savingEdit,setSavingEdit] = useState(false)
  const [verifying,setVerifying] = useState<string|null>(null)
  const showToast=(msg:string)=>{setToast(msg);setTimeout(()=>setToast(''),3000)}
  const load=useCallback(async()=>{
    setLoading(true)
    const token=await getToken()
    if(!token){router.push('/admin');return}
    const res=await fetch('/api/admin/locations?tab='+tab+'&status='+filter+'&q='+encodeURIComponent(search),{headers:ah(token)})
    if(res.status===401){router.push('/admin');return}
    const data=await res.json()
    if(tab==='live')setLive(data.locations??[])
    else setItems(data.submissions??[])
    setLoading(false)
  },[tab,filter,search,router])
  useEffect(()=>{load()},[load])
  const action=async(id:string,status:string)=>{
    const token=await getToken()
    const res=await fetch('/api/admin/locations',{method:'PATCH',headers:ah(token),body:JSON.stringify({id,status})})
    const d=await res.json()
    if(d.success){showToast(status==='approved'?'✅ Approved!':status==='rejected'?'❌ Rejected':'↩ Reset');load()}
    else showToast('Error: '+d.error)
  }
  const verify=async(id:string)=>{
    setVerifying(id)
    const token=await getToken()
    const res=await fetch('/api/admin/verify',{method:'POST',headers:ah(token),body:JSON.stringify({submission_id:id})})
    const d=await res.json()
    showToast(d.verified?'✅ OSM verified ('+d.confidence+'/100)!':'⚠️ '+d.reason)
    setVerifying(null);load()
  }
  const del=async(id:string,table:string,soft=false)=>{
    if(!confirm(soft?'Hide from map?':'Permanently delete?'))return
    const token=await getToken()
    await fetch('/api/admin/locations?id='+id+'&table='+table+'&soft='+soft,{method:'DELETE',headers:ah(token)})
    showToast(soft?'🙈 Hidden':'🗑️ Deleted');load()
  }

  const openEdit=(loc:any)=>{
    setExpanded(expanded===loc.id?null:loc.id)
    setEditForm({ id:loc.id, name:loc.name, brand:loc.brand, address:loc.address, city:loc.city, region:loc.region, country_code:loc.country_code, country_name:loc.country_name, flavours:loc.flavours??'', hours_note:loc.hours_note??'', machine_status:loc.machine_status, latitude:loc.latitude, longitude:loc.longitude, _origAddress:loc.address })
  }
  const setEf=(k:string,v:any)=>setEditForm((f:any)=>({...f,[k]:v}))
  const saveEdit=async()=>{
    setSavingEdit(true)
    const token=await getToken()
    const regeocode = editForm.address !== editForm._origAddress
    const res=await fetch('/api/admin/locations',{method:'PUT',headers:ah(token),body:JSON.stringify({...editForm, regeocode})})
    const d=await res.json()
    setSavingEdit(false)
    if(d.success){showToast('✅ Saved');setExpanded(null);load()}
    else showToast('Error: '+(d.error||'save failed'))
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
          <button style={{...btn(tab==='submissions'?'#00e5ff':'#849396'),background:tab==='submissions'?'rgba(0,229,255,.1)':'none'}} onClick={()=>setTab('submissions')}>📋 Submissions</button>
          <button style={{...btn(tab==='live'?'#00e5ff':'#849396'),background:tab==='live'?'rgba(0,229,255,.1)':'none'}} onClick={()=>setTab('live')}>🗺️ Live Locations</button>
          <button style={btn('#849396')} onClick={()=>router.push('/admin/reports')}>🚩 Reports</button>
          <button style={btn('#849396')} onClick={()=>router.push('/admin/users')}>👥 Users</button>
        </div>
        <button style={{...btn('#ff4444'),marginLeft:'auto'}} onClick={async()=>{await sb.auth.signOut();router.push('/admin')}}>Log out</button>
      </div>
      <div style={{padding:20,maxWidth:1200,margin:'0 auto'}}>
        <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name…" style={{...inp,width:200}}/>
          {tab==='submissions'&&<select value={filter} onChange={e=>setFilter(e.target.value)} style={{...inp,cursor:'pointer'}}><option value="all">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select>}
          <button style={btn()} onClick={load}>🔄 Refresh</button>
          <span style={{fontSize:11,color:'#849396',marginLeft:'auto'}}>{tab==='submissions'?items.length:live.length} records</span>
        </div>
        {tab==='submissions'&&(
          <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
            {[{label:'Pending',count:items.filter(i=>i.review_status==='pending').length,color:'#ffb400'},{label:'Approved',count:items.filter(i=>i.review_status==='approved').length,color:'#00ee98'},{label:'Rejected',count:items.filter(i=>i.review_status==='rejected').length,color:'#ff4444'},{label:'OSM ✓',count:items.filter(i=>i.verified_by_osm).length,color:'#00e5ff'}].map(s=>(
              <div key={s.label} style={{background:'#111318',border:'1px solid '+s.color+'33',borderRadius:10,padding:'8px 14px',textAlign:'center'}}>
                <div style={{fontSize:20,fontWeight:900,color:s.color,lineHeight:1}}>{s.count}</div>
                <div style={{fontSize:9,fontWeight:700,color:'#849396',textTransform:'uppercase',marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
        {loading?<div style={{textAlign:'center',padding:40,color:'#849396'}}>Loading…</div>:(
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',background:'#111318',borderRadius:13,overflow:'hidden'}}>
              <thead><tr>{(tab==='submissions'?['Name','City','Brand','Status','OSM','Date','Actions']:['Name','City','Brand','Check-ins','Tier','Status','Actions']).map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {tab==='submissions'?items.map(sub=>(
                  <>
                  <tr key={sub.id} style={{cursor:'pointer'}} onClick={()=>setExpanded(expanded===sub.id?null:sub.id)}>
                    <td style={{...td,color:'#fff',fontWeight:600}}>{sub.name}</td>
                    <td style={td}>{sub.city}, {sub.country_code}</td>
                    <td style={td}>{sub.brand}</td>
                    <td style={td}><span style={{padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:700,background:sub.review_status==='approved'?'rgba(0,238,152,.1)':sub.review_status==='rejected'?'rgba(255,68,68,.1)':'rgba(255,180,0,.1)',color:sub.review_status==='approved'?'#00ee98':sub.review_status==='rejected'?'#ff4444':'#ffb400',border:'1px solid '+(sub.review_status==='approved'?'rgba(0,238,152,.3)':sub.review_status==='rejected'?'rgba(255,68,68,.3)':'rgba(255,180,0,.3)')}}>{sub.review_status}</span></td>
                    <td style={td}><div style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:40,height:5,background:'#1c2021',borderRadius:10,overflow:'hidden'}}><div style={{width:(sub.osm_confidence??0)+'%',height:'100%',background:(sub.osm_confidence??0)>=60?'#00ee98':'#ffb400',borderRadius:10}}/></div><span style={{fontSize:10,color:'#849396'}}>{sub.osm_confidence??0}</span></div></td>
                    <td style={{...td,whiteSpace:'nowrap'}}>{new Date(sub.created_at).toLocaleDateString()}</td>
                    <td style={td}><div style={{display:'flex',gap:4,flexWrap:'wrap'}}><button style={btn('#00ee98')} onClick={e=>{e.stopPropagation();action(sub.id,'approved')}}>✅</button><button style={btn('#ff4444')} onClick={e=>{e.stopPropagation();action(sub.id,'rejected')}}>❌</button><button style={btn('#00e5ff')} disabled={verifying===sub.id} onClick={e=>{e.stopPropagation();verify(sub.id)}}>{verifying===sub.id?'…':'🗺️'}</button><button style={btn('#ff4444')} onClick={e=>{e.stopPropagation();del(sub.id,'location_submissions')}}>🗑️</button></div></td>
                  </tr>
                  {expanded===sub.id&&<tr key={sub.id+'e'}><td colSpan={7} style={{padding:12,background:'#0d1117',borderBottom:'1px solid rgba(59,73,76,.4)'}}><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:10}}>{[['Address',sub.address],['Flavours',sub.flavours??'—'],['Notes',sub.notes??'—'],['Coords',sub.latitude?sub.latitude.toFixed(4)+', '+sub.longitude?.toFixed(4):'None'],['OSM Match',sub.osm_matched_name??'—'],['Reason',sub.verification_reason??'Not checked']].map(([k,v])=><div key={k}><div style={{fontSize:9,fontWeight:700,color:'#849396',textTransform:'uppercase',marginBottom:2}}>{k}</div><div style={{fontSize:11,color:'#bac9cc'}}>{v}</div></div>)}</div>{sub.latitude&&<a href={'https://www.google.com/maps/search/?api=1&query='+sub.latitude+','+sub.longitude} target="_blank" rel="noreferrer" style={{color:'#00e5ff',fontSize:11,display:'inline-block',marginTop:8}}>📍 Google Maps →</a>}</td></tr>}
                  </>
                )):live.map(loc=>(
                  <>
                  <tr key={loc.id} style={{cursor:'pointer'}} onClick={()=>openEdit(loc)}>
                    <td style={{...td,color:'#fff',fontWeight:600}}>{loc.name}</td>
                    <td style={td}>{loc.city}, {loc.country_code}</td>
                    <td style={td}>{loc.brand}</td>
                    <td style={td}><div style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:50,height:5,background:'#1c2021',borderRadius:10,overflow:'hidden'}}><div style={{width:Math.min(loc.checkin_count??0,100)+'%',height:'100%',background:'linear-gradient(90deg,#00e5ff,#9c27ff)',borderRadius:10}}/></div><span style={{fontSize:12,fontWeight:700,color:'#00e5ff'}}>{loc.checkin_count??0}</span></div></td>
                    <td style={td}>{loc.slush_tier??'new'}</td>
                    <td style={td}><span style={{padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:700,background:loc.machine_status==='operational'?'rgba(0,238,152,.1)':'rgba(255,68,68,.1)',color:loc.machine_status==='operational'?'#00ee98':'#ff4444',border:'1px solid '+(loc.machine_status==='operational'?'rgba(0,238,152,.3)':'rgba(255,68,68,.3)')}}>{loc.machine_status}</span></td>
                    <td style={td}><div style={{display:'flex',gap:4}}><button style={btn('#00e5ff')} onClick={e=>{e.stopPropagation();openEdit(loc)}}>✏️ Edit</button><button style={btn('#ffb400')} onClick={e=>{e.stopPropagation();del(loc.id,'locations',true)}}>🙈 Hide</button><button style={btn('#ff4444')} onClick={e=>{e.stopPropagation();del(loc.id,'locations')}}>🗑️ Del</button></div></td>
                  </tr>
                  {expanded===loc.id&&<tr><td colSpan={7} style={{padding:14,background:'#0d1117'}}><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
{[['name','Name'],['brand','Brand'],['address','Address'],['city','City'],['region','Region'],['flavours','Flavours'],['hours_note','Hours (text)'],['latitude','Latitude'],['longitude','Longitude']].map(([k,label])=>(
  <div key={k}><div style={{fontSize:9,fontWeight:700,color:'#849396',textTransform:'uppercase',marginBottom:3}}>{label}</div>
  <input value={editForm[k]??''} onChange={e=>setEf(k,e.target.value)} style={{...inp,width:'100%'}} onClick={e=>e.stopPropagation()}/></div>
))}
<div><div style={{fontSize:9,fontWeight:700,color:'#849396',textTransform:'uppercase',marginBottom:3}}>Status</div>
<select value={editForm.machine_status??'operational'} onChange={e=>setEf('machine_status',e.target.value)} onClick={e=>e.stopPropagation()} style={{...inp,width:'100%',cursor:'pointer'}}>
<option value="operational">operational</option><option value="issue_reported">issue_reported</option><option value="removed">removed</option></select></div>
</div>
<div style={{display:'flex',gap:8,marginTop:12,alignItems:'center'}}>
<button disabled={savingEdit} style={btn('#00ee98')} onClick={e=>{e.stopPropagation();saveEdit()}}>{savingEdit?'Saving…':'💾 Save changes'}</button>
<button style={btn('#849396')} onClick={e=>{e.stopPropagation();setExpanded(null)}}>Cancel</button>
<span style={{fontSize:10,color:'#849396'}}>Changing the address will re-locate the map pin automatically. Leave lat/lng to auto, or type them to override.</span>
</div></td></tr>}
                  </>
                ))}
                {!items.length&&tab==='submissions'&&<tr><td colSpan={7} style={{...td,textAlign:'center',padding:32,color:'#849396'}}>No submissions yet</td></tr>}
                {!live.length&&tab==='live'&&<tr><td colSpan={7} style={{...td,textAlign:'center',padding:32,color:'#849396'}}>No live locations</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <div style={{marginTop:10,fontSize:11,color:'#849396',textAlign:'center'}}>✅ Approve (goes live instantly) · ❌ Reject · 🗺️ OSM verify · 🗑️ Delete · Click row to expand</div>
      </div>
      {toast&&<div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',background:'#111318',border:'1px solid rgba(0,238,152,.4)',color:'#00ee98',padding:'10px 18px',borderRadius:12,fontSize:12,fontWeight:700,zIndex:50,whiteSpace:'nowrap'}}>{toast}</div>}
    </div>
  )
}
