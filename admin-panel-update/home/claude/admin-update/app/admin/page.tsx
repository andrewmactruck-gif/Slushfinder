'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, RotateCcw, ChevronDown, ChevronUp, LogOut, MapPin, RefreshCw } from 'lucide-react'

interface Submission {
  id: string
  name: string
  address: string
  city: string
  region: string
  postal_code: string
  country_code: string
  country_name: string
  brand: string
  flavours: string | null
  machine_condition: string | null
  notes: string | null
  latitude: number | null
  longitude: number | null
  geocoded: boolean
  review_status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'slushAdmin2024!'

export default function AdminPage() {
  const router = useRouter()
  const [authed, setAuthed]       = useState(false)
  const [pw, setPw]               = useState('')
  const [pwErr, setPwErr]         = useState('')
  const [subs, setSubs]           = useState<Submission[]>([])
  const [loading, setLoading]     = useState(false)
  const [filter, setFilter]       = useState<'all'|'pending'|'approved'|'rejected'|'no_coords'>('pending')
  const [expanded, setExpanded]   = useState<string[]>([])
  const [actionMsg, setActionMsg] = useState('')
  const [msgType, setMsgType]     = useState<'ok'|'err'>('ok')

  // Check session on mount
  useEffect(() => {
    if (sessionStorage.getItem('sf-admin') === '1') {
      setAuthed(true)
    }
  }, [])

  const toast = (msg: string, type: 'ok'|'err' = 'ok') => {
    setActionMsg(msg); setMsgType(type)
    setTimeout(() => setActionMsg(''), 3000)
  }

  const login = () => {
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem('sf-admin', '1')
      setAuthed(true)
      setPwErr('')
    } else {
      setPwErr('Incorrect password')
    }
  }

  const logout = () => {
    sessionStorage.removeItem('sf-admin')
    setAuthed(false)
    setPw('')
  }

  const fetchSubs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/submissions')
      const data = await res.json()
      setSubs(data.submissions ?? [])
    } catch {
      toast('Failed to load submissions', 'err')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authed) fetchSubs()
  }, [authed, fetchSubs])

  const updateStatus = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      const data = await res.json()
      if (data.success) {
        setSubs(prev => prev.map(s => s.id === id ? { ...s, review_status: status } : s))
        toast(
          status === 'approved' ? '✅ Location approved and published!' :
          status === 'rejected' ? '❌ Submission rejected' :
          '↩ Moved back to pending'
        )
      } else {
        toast(data.error ?? 'Action failed', 'err')
      }
    } catch {
      toast('Network error', 'err')
    }
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const filtered = subs.filter(s => {
    if (filter === 'all')       return true
    if (filter === 'no_coords') return !s.geocoded || (!s.latitude && !s.longitude)
    return s.review_status === filter
  })

  const counts = {
    pending:  subs.filter(s => s.review_status === 'pending').length,
    approved: subs.filter(s => s.review_status === 'approved').length,
    rejected: subs.filter(s => s.review_status === 'rejected').length,
    no_coords:subs.filter(s => !s.latitude || !s.longitude).length,
  }

  const timeSince = (iso: string) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (mins < 60)   return `${mins}m ago`
    if (mins < 1440) return `${Math.floor(mins/60)}h ago`
    return `${Math.floor(mins/1440)}d ago`
  }

  // ── LOGIN SCREEN ──────────────────────────────────────
  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: '#0a0c0f' }}>
      <div className="w-full max-w-sm rounded-2xl p-7 border"
           style={{ background: '#111318', borderColor: '#1e2840' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
             style={{ background: 'linear-gradient(135deg,#00e5ff,#9c27ff)' }}>🧊</div>
        <h1 className="text-[20px] font-black text-center mb-1" style={{ color: '#fff' }}>Admin Panel</h1>
        <p className="text-[12px] text-center mb-6" style={{ color: '#5a6272' }}>Slush Finder — Location Review</p>

        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#5a6272' }}>Password</label>
        <input
          type="password" value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          placeholder="Admin password"
          className="w-full h-11 px-3 text-[13px] rounded-xl border mb-3 focus:outline-none"
          style={{ background: '#1e2229', borderColor: pwErr ? '#ff4444' : '#1e2840', color: '#fff' }}
        />
        {pwErr && <p className="text-[11px] mb-3 text-center" style={{ color: '#ff4444' }}>{pwErr}</p>}
        <button onClick={login}
          className="w-full h-11 rounded-xl font-black text-[14px] border-none cursor-pointer"
          style={{ background: 'linear-gradient(135deg,#00e5ff,#9c27ff)', color: '#000' }}>
          LOG IN
        </button>
        <p className="text-[10px] text-center mt-4" style={{ color: '#5a6272' }}>
          Set your password in <code style={{ color: '#00e5ff' }}>.env.local</code> as <code style={{ color: '#00e5ff' }}>NEXT_PUBLIC_ADMIN_PASSWORD</code>
        </p>
      </div>
    </div>
  )

  // ── ADMIN PANEL ───────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#0a0c0f' }}>
      {/* Toast */}
      {actionMsg && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl text-[12px] font-bold z-50 whitespace-nowrap"
             style={{ background: '#111318', border: `1px solid ${msgType==='ok'?'rgba(0,229,150,.4)':'rgba(255,68,68,.4)'}`, color: msgType==='ok'?'#00e596':'#ff4444', boxShadow:'0 4px 20px rgba(0,0,0,.4)' }}>
          {actionMsg}
        </div>
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-20 px-5 py-3 flex items-center gap-3 border-b"
              style={{ background: '#111318', borderColor: '#1e2840' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0"
             style={{ background: 'linear-gradient(135deg,#00e5ff,#9c27ff)', color: '#000' }}>🧊</div>
        <span className="font-black text-[14px]" style={{ color: '#fff' }}>
          Slush <span style={{ color: '#00e5ff' }}>Finder</span>
        </span>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider"
              style={{ background: 'rgba(255,180,0,.1)', color: '#ffb400', border: '1px solid rgba(255,180,0,.3)' }}>
          ADMIN
        </span>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={fetchSubs}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border cursor-pointer"
            style={{ background: 'none', borderColor: '#1e2840', color: '#a8b0c0' }}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={logout}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border cursor-pointer"
            style={{ background: 'none', borderColor: '#1e2840', color: '#a8b0c0' }}>
            <LogOut size={12} /> Log out
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 p-5 pb-0">
        {[
          { label:'Pending',     val: counts.pending,   color:'#ffb400' },
          { label:'Approved',    val: counts.approved,  color:'#00e596' },
          { label:'Rejected',    val: counts.rejected,  color:'#ff4444' },
          { label:'No Coords',   val: counts.no_coords, color:'#00e5ff' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center border"
               style={{ background: '#111318', borderColor: '#1e2840' }}>
            <p className="text-[24px] font-black leading-none" style={{ color: s.color }}>{s.val}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider mt-1.5" style={{ color: '#5a6272' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto p-5 pb-3 no-scrollbar">
        {([
          ['pending',   `⏳ Pending (${counts.pending})`],
          ['all',       'All submissions'],
          ['approved',  `✅ Approved (${counts.approved})`],
          ['rejected',  `❌ Rejected (${counts.rejected})`],
          ['no_coords', `📍 No coords (${counts.no_coords})`],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className="flex-shrink-0 h-7 px-3 rounded-full text-[11px] font-bold border transition-all cursor-pointer"
            style={{
              background: filter===key ? 'linear-gradient(135deg,rgba(0,229,255,.15),rgba(156,39,255,.15))' : '#1e2229',
              borderColor: filter===key ? '#00e5ff' : '#1e2840',
              color: filter===key ? '#00e5ff' : '#a8b0c0',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-5 pb-10">
        {loading ? (
          <div className="text-center py-16" style={{ color: '#5a6272' }}>
            <div className="w-8 h-8 rounded-full border-2 border-t-cyan-400 animate-spin mx-auto mb-3"
                 style={{ borderColor: '#1e2840', borderTopColor: '#00e5ff' }}></div>
            Loading submissions…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">🧊</p>
            <p className="text-[14px] font-bold mb-1" style={{ color: '#a8b0c0' }}>Nothing here</p>
            <p className="text-[12px]" style={{ color: '#5a6272' }}>No submissions in this category.</p>
          </div>
        ) : (
          filtered.map(sub => {
            const isOpen = expanded.includes(sub.id)
            const hasCoords = sub.latitude && sub.longitude
            const statusColor = sub.review_status==='approved'?'#00e596':sub.review_status==='rejected'?'#ff4444':'#ffb400'
            const statusBg = sub.review_status==='approved'?'rgba(0,229,150,.1)':sub.review_status==='rejected'?'rgba(255,68,68,.08)':'rgba(255,180,0,.1)'
            const statusBorder = sub.review_status==='approved'?'rgba(0,229,150,.25)':sub.review_status==='rejected'?'rgba(255,68,68,.2)':'rgba(255,180,0,.25)'
            const statusLabel = sub.review_status==='approved'?'✅ Approved':sub.review_status==='rejected'?'❌ Rejected':'⏳ Pending'

            return (
              <div key={sub.id} className="rounded-2xl p-4 mb-3 border"
                   style={{ background: '#111318', borderColor: '#1e2840' }}>
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-[14px] font-black flex-1 pr-3 leading-snug" style={{ color: '#fff' }}>{sub.name}</h3>
                  <span className="text-[9px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                        style={{ background: statusBg, color: statusColor, border: `1px solid ${statusBorder}` }}>
                    {statusLabel}
                  </span>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                  <span className="text-[11px] flex items-center gap-1" style={{ color: '#a8b0c0' }}>
                    <MapPin size={11} style={{ color: '#00e5ff' }} />
                    {sub.city}, {sub.region} {sub.postal_code}
                  </span>
                  <span className="text-[11px] font-bold" style={{ color: 'rgba(0,229,255,.85)' }}>{sub.brand}</span>
                  <span className="text-[10px]" style={{ color: '#5a6272' }}>{timeSince(sub.created_at)}</span>
                  {!hasCoords && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,180,0,.1)', color: '#ffb400', border: '1px solid rgba(255,180,0,.2)' }}>
                      ⚠️ No coordinates
                    </span>
                  )}
                </div>

                {/* Expanded details */}
                {isOpen && (
                  <div className="rounded-xl p-3 mb-3 border"
                       style={{ background: '#0d1117', borderColor: '#30363d' }}>
                    {/* Map link */}
                    {hasCoords && (
                      <div className="mb-3">
                        <a href={`https://www.google.com/maps?q=${sub.latitude},${sub.longitude}`}
                           target="_blank" rel="noreferrer"
                           className="text-[11px] font-semibold no-underline"
                           style={{ color: '#00e5ff' }}>
                          📍 View on Google Maps → ({sub.latitude?.toFixed(5)}, {sub.longitude?.toFixed(5)})
                        </a>
                      </div>
                    )}
                    {[
                      ['Full address', `${sub.address}, ${sub.city}, ${sub.region}, ${sub.postal_code}, ${sub.country_name}`],
                      ['Brand',        sub.brand],
                      ['Flavours',     sub.flavours ?? '—'],
                      ['Condition',    sub.machine_condition ?? '—'],
                      ['Notes',        sub.notes ?? '—'],
                      ['Coordinates',  hasCoords ? `${sub.latitude}, ${sub.longitude} ✓` : '⚠️ Not geocoded — add manually in Supabase'],
                      ['Country',      `${sub.country_name} (${sub.country_code})`],
                    ].map(([k,v]) => (
                      <div key={k} className="flex gap-3 py-2 border-b text-[11px]"
                           style={{ borderColor: '#1e2840' }}>
                        <span className="font-bold w-24 flex-shrink-0" style={{ color: '#5a6272' }}>{k}</span>
                        <span style={{ color: k==='Coordinates'&&!hasCoords?'#ffb400':'#e0e0e0', flex:1 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {sub.review_status === 'pending' && <>
                    <button onClick={() => updateStatus(sub.id,'approved')}
                      className="flex-1 h-9 rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 border-none cursor-pointer"
                      style={{ background: 'linear-gradient(135deg,#00e596,#007abc)', color: '#fff' }}>
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button onClick={() => updateStatus(sub.id,'rejected')}
                      className="flex-1 h-9 rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 cursor-pointer"
                      style={{ background: 'rgba(255,68,68,.06)', border: '1px solid rgba(255,68,68,.3)', color: '#ff6b6b' }}>
                      <XCircle size={14} /> Reject
                    </button>
                  </>}
                  {sub.review_status !== 'pending' && (
                    <button onClick={() => updateStatus(sub.id,'pending')}
                      className="h-9 px-3 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer"
                      style={{ background: 'none', border: '1px solid #1e2840', color: '#5a6272' }}>
                      <RotateCcw size={12} /> Undo
                    </button>
                  )}
                  <button onClick={() => toggleExpand(sub.id)}
                    className="h-9 px-3 rounded-xl text-[12px] font-semibold flex items-center gap-1 cursor-pointer"
                    style={{ background: 'none', border: '1px solid #1e2840', color: '#a8b0c0' }}>
                    {isOpen ? <><ChevronUp size={14}/> Hide</> : <><ChevronDown size={14}/> Details</>}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
