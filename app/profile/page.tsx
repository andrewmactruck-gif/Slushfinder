'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Settings, Heart, MapPin, LogOut, Edit3 } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

const ALL_FLAVOURS = ['🍒 Cherry','🫐 Blue Raspberry','🍋 Lemon','🍓 Strawberry','🍉 Watermelon','🥤 Cola','🍇 Grape','🍊 Orange','❄️ Arctic Mint','🍑 Peach','🍵 Matcha','🌶️ Mango Chili']
const EMOJIS = ['🧊','🥤','❄️','🐧','🍒','🫐','🍓','🌊','⚡','🔮','🦋','🌸']
interface User { username:string; displayName:string; email:string; city:string; emoji:string; bio:string }
const DEFAULT:User = {username:'slush_fan',displayName:'Slush Fan',email:'user@slushfinder.com',city:'Toronto, ON',emoji:'🧊',bio:'Frozen drink enthusiast'}

export default function ProfilePage() {
  const router = useRouter()
  const [tab,setTab] = useState<'saved'|'flavours'|'location'>('saved')
  const [user,setUser] = useState<User>(DEFAULT)
  const [favs,setFavs] = useState<string[]>(['🍒 Cherry','🫐 Blue Raspberry','❄️ Arctic Mint'])
  const [editing,setEditing] = useState(false)
  const [form,setForm] = useState<User>(DEFAULT)
  const [msg,setMsg] = useState('')
  const [uStatus,setUStatus] = useState<'ok'|'taken'|'bad'|''>('')

  useEffect(()=>{
    try{const u=localStorage.getItem('sf-user');if(u){const p=JSON.parse(u);setUser(p);setForm(p)}
    const f=localStorage.getItem('sf-flavours');if(f)setFavs(JSON.parse(f))}catch{}
  },[])

  const toast=(s:string)=>{setMsg(s);setTimeout(()=>setMsg(''),2200)}

  const saveUser=()=>{
    if(!form.username||!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)){toast('Invalid username');return}
    setUser(form);localStorage.setItem('sf-user',JSON.stringify(form));setEditing(false);toast('✅ Profile saved!')
  }
  const checkU=(v:string)=>{
    setForm(f=>({...f,username:v}))
    if(!v){setUStatus('');return}
    if(!/^[a-zA-Z0-9_]{3,20}$/.test(v)){setUStatus('bad');return}
    setUStatus(['slush_king','frosty_dan','icee_queen'].includes(v.toLowerCase())?'taken':'ok')
  }
  const toggleFav=(f:string)=>{
    const next=favs.includes(f)?favs.filter(x=>x!==f):[...favs,f]
    setFavs(next);localStorage.setItem('sf-flavours',JSON.stringify(next))
    toast(favs.includes(f)?`Removed ${f}`:`❤️ Added ${f}`)
  }

  const fs={background:'var(--s2)',borderColor:'var(--b1)',color:'var(--t1)'}
  const SAVED=[
    {name:'Queen West Slush — 7-Eleven',addr:'742 Queen St W, Toronto',dist:0.4,open:true,brand:'Slurpee'},
    {name:'Harbourfront Aurora — Circle K',addr:'235 Queens Quay W, Toronto',dist:1.2,open:true,brand:'Froster'},
    {name:'Liberty Village ICEE',addr:'171 East Liberty St, Toronto',dist:2.8,open:false,brand:'ICEE'},
  ]

  if(editing) return(
    <div className="flex flex-col min-h-screen app-bg">
      <header className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3 border-b" style={{background:'var(--s1)',borderColor:'var(--b1)'}}>
        <button onClick={()=>setEditing(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--t2)'}}><ArrowLeft size={20}/></button>
        <span className="font-black text-[14px]" style={{color:'var(--t1)'}}>Edit Profile</span>
        <button onClick={saveUser} className="ml-auto text-[12px] font-black" style={{background:'none',border:'none',cursor:'pointer',color:'var(--cyan)'}}>SAVE</button>
      </header>
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-5 space-y-4">
        <div className="flex flex-col items-center mb-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3" style={{background:'var(--grad)'}}>{form.emoji}</div>
          <p className="text-[10px] mb-3" style={{color:'var(--t3)'}}>Choose your avatar</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {EMOJIS.map(e=>(
              <button key={e} onClick={()=>setForm(f=>({...f,emoji:e}))} className="text-xl p-2 rounded-lg border-2 transition-all"
                style={{borderColor:form.emoji===e?'var(--cyan)':'transparent',background:form.emoji===e?'rgba(0,122,188,0.1)':'var(--s2)',cursor:'pointer'}}>{e}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{color:'var(--t3)'}}>Username *</label>
          <input value={form.username} onChange={e=>checkU(e.target.value)} placeholder="e.g. frosty_dan" className="w-full h-11 px-3 text-[13px] rounded-xl border focus:outline-none" style={fs}/>
          {uStatus==='ok'&&<p className="text-[10px] mt-1" style={{color:'var(--green)'}}>✓ Available!</p>}
          {uStatus==='taken'&&<p className="text-[10px] mt-1" style={{color:'var(--red)'}}>✗ Username taken</p>}
          {uStatus==='bad'&&<p className="text-[10px] mt-1" style={{color:'var(--red)'}}>✗ Letters, numbers, underscores (3–20)</p>}
        </div>
        {[['displayName','Display name','e.g. Dan the Slush King'],['bio','Bio','e.g. Cherry slush enthusiast'],['city','City / Region','e.g. Toronto, ON'],['email','Email','your@email.com']].map(([k,l,p])=>(
          <div key={k}>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{color:'var(--t3)'}}>{l}</label>
            <input value={(form as any)[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={p} className="w-full h-11 px-3 text-[13px] rounded-xl border focus:outline-none" style={fs}/>
          </div>
        ))}
        <button onClick={()=>{localStorage.clear();router.push('/')}} className="w-full h-10 rounded-xl text-[13px] font-semibold border mt-4" style={{background:'none',borderColor:'rgba(192,57,43,0.4)',color:'var(--red)',cursor:'pointer'}}>
          <span className="flex items-center justify-center gap-2"><LogOut size={14}/>Log out</span>
        </button>
      </div>
      {msg&&<div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl text-[12px] font-semibold z-50" style={{background:'var(--s1)',border:'1px solid var(--b2)',color:'var(--green)',boxShadow:'0 4px 20px rgba(0,0,0,0.3)'}}>{msg}</div>}
    </div>
  )

  return(
    <div className="flex flex-col min-h-screen app-bg">
      <header className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3 border-b" style={{background:'var(--s1)',borderColor:'var(--b1)'}}>
        <button onClick={()=>router.push('/')} style={{background:'none',border:'none',cursor:'pointer',color:'var(--t2)'}}><ArrowLeft size={20}/></button>
        <Image src="/logo.png" alt="" width={20} height={20} className="rounded"/>
        <span className="font-black text-[13px]" style={{color:'var(--t1)'}}>My Profile</span>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle/>
          <button onClick={()=>setEditing(true)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--t2)'}}><Settings size={18}/></button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-5 pb-4 border-b" style={{background:'linear-gradient(160deg,rgba(0,122,188,0.07),rgba(108,30,176,0.05))',borderColor:'var(--b1)'}}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black flex-shrink-0" style={{background:'var(--grad)'}}>{user.emoji}</div>
            <div className="flex-1">
              <p className="text-[16px] font-black" style={{color:'var(--t1)'}}>@{user.username}</p>
              {user.bio&&<p className="text-[11px] mt-0.5" style={{color:'var(--t2)'}}>{user.bio}</p>}
              <p className="text-[10px] mt-1" style={{color:'var(--t3)'}}>📍 {user.city}</p>
            </div>
            <button onClick={()=>setEditing(true)} className="flex items-center gap-1.5 h-8 px-3 rounded-xl border text-[11px] font-bold" style={{background:'none',borderColor:'rgba(0,122,188,0.35)',color:'var(--cyan)',cursor:'pointer'}}>
              <Edit3 size={12}/>Edit
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[{n:SAVED.length.toString(),l:'Saved Spots'},{n:favs.length.toString(),l:'Fav Flavours'},{n:'2',l:'Spots Added'}].map(s=>(
              <div key={s.l} className="rounded-xl p-3 text-center border" style={{background:'var(--s2)',borderColor:'var(--b1)'}}>
                <p className="text-[22px] font-black leading-none" style={{color:'var(--cyan)'}}>{s.n}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{color:'var(--t3)'}}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex border-b" style={{borderColor:'var(--b1)'}}>
          {[['saved','Saved Spots'],['flavours','Flavours'],['location','My Location']].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k as any)} className="flex-1 h-10 text-[11px] font-bold transition-colors"
              style={{background:'none',border:'none',borderBottom:`2px solid ${tab===k?'var(--cyan)':'transparent'}`,color:tab===k?'var(--cyan)':'var(--t3)',cursor:'pointer'}}>{l}</button>
          ))}
        </div>
        <div className="px-4 py-4">
          {tab==='saved'&&<div>{SAVED.map((loc,i)=>(
            <div key={i} className="rounded-2xl p-4 mb-3 border" style={{background:'var(--s1)',borderColor:'var(--b1)'}}>
              <div className="flex justify-between items-start mb-1.5">
                <p className="text-[13px] font-black flex-1 pr-2 leading-snug" style={{color:'var(--t1)'}}>{loc.name}</p>
                <button style={{background:'none',border:'none',cursor:'pointer',color:'#ff4d6d'}}><Heart size={16} fill="#ff4d6d"/></button>
              </div>
              <p className="text-[11px] mb-2" style={{color:'var(--t3)'}}>{loc.addr}</p>
              <div className="flex gap-2 items-center mb-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{background:loc.open?'rgba(10,124,78,0.1)':'rgba(192,57,43,0.08)',color:loc.open?'var(--green)':'var(--red)',border:`1px solid ${loc.open?'rgba(10,124,78,0.25)':'rgba(192,57,43,0.2)'}`}}>{loc.open?'Open now':'Closed'}</span>
                <span className="text-[10px] font-semibold" style={{color:'var(--cyan)'}}>📍 {loc.dist.toFixed(1)} km</span>
              </div>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(loc.addr)}`} target="_blank" rel="noreferrer"
                className="flex w-full h-9 items-center justify-center gap-2 rounded-xl text-[12px] font-black no-underline btn-grad" style={{color:'#fff'}}>
                <MapPin size={13}/>Get directions
              </a>
            </div>
          ))}</div>}
          {tab==='flavours'&&<div>
            <p className="text-[11px] mb-3" style={{color:'var(--t2)'}}>Tap to add or remove your favourite flavours.</p>
            <p className="text-[12px] font-black mb-3" style={{color:'var(--t1)'}}>Your favourites ({favs.length})</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {favs.length===0?<p className="text-[11px]" style={{color:'var(--t3)'}}>None yet.</p>:favs.map(f=>(
                <button key={f} onClick={()=>toggleFav(f)} className="text-[11px] px-3 py-1.5 rounded-full font-semibold border" style={{background:'rgba(108,30,176,0.1)',color:'var(--purple)',borderColor:'rgba(108,30,176,0.25)',cursor:'pointer'}}>{f} ×</button>
              ))}
            </div>
            <p className="text-[12px] font-black mb-3" style={{color:'var(--t1)'}}>All flavours</p>
            <div className="flex flex-wrap gap-2">
              {ALL_FLAVOURS.map(f=>{const isFav=favs.includes(f);return(
                <button key={f} onClick={()=>toggleFav(f)} className="text-[11px] px-3 py-1.5 rounded-full font-semibold border transition-all" style={{background:isFav?'rgba(108,30,176,0.1)':'var(--s2)',color:isFav?'var(--purple)':'var(--t2)',borderColor:isFav?'rgba(108,30,176,0.25)':'var(--b1)',cursor:'pointer'}}>{isFav?'✓ ':'+  '}{f}</button>
              )})}
            </div>
          </div>}
          {tab==='location'&&<div className="space-y-4">
            <p className="text-[11px]" style={{color:'var(--t2)'}}>Save your home location so Slush Finder shows nearby spots automatically.</p>
            {[['Home city / area','e.g. Toronto, ON',user.city],['Postcode / ZIP','e.g. M5V 3A8','']].map(([l,p,d])=>(
              <div key={l}><label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{color:'var(--t3)'}}>{l}</label>
              <input type="text" defaultValue={d} placeholder={p} className="w-full h-11 px-3 text-[13px] rounded-xl border focus:outline-none" style={fs}/></div>
            ))}
            <div><label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{color:'var(--t3)'}}>Default radius</label>
            <select className="w-full h-11 px-3 text-[13px] rounded-xl border" style={fs}><option>5 km</option><option>10 km</option><option>25 km</option><option>50 km</option></select></div>
            <button onClick={()=>toast('✅ Location saved!')} className="btn-grad w-full h-11 rounded-xl text-[14px] font-black">SAVE PREFERENCES</button>
          </div>}
        </div>
      </div>
      {msg&&<div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl text-[12px] font-semibold z-50" style={{background:'var(--s1)',border:'1px solid var(--b2)',color:'var(--green)',boxShadow:'0 4px 20px rgba(0,0,0,0.3)'}}>{msg}</div>}
    </div>
  )
}
