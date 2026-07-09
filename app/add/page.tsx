'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { ALL_BRANDS, BRAND_DISPLAY, detectLanguage, getStrings, SubmitLocationPayload, Strings } from '@/types'

// Full country list (ISO 3166-1 alpha-2)
const COUNTRIES = [
  { code:'CA', name:'Canada' }, { code:'US', name:'United States' },
  { code:'GB', name:'United Kingdom' }, { code:'AU', name:'Australia' },
  { code:'NZ', name:'New Zealand' }, { code:'JP', name:'Japan' },
  { code:'KR', name:'South Korea' }, { code:'CN', name:'China' },
  { code:'SG', name:'Singapore' }, { code:'HK', name:'Hong Kong' },
  { code:'DE', name:'Germany' }, { code:'FR', name:'France' },
  { code:'IT', name:'Italy' }, { code:'ES', name:'Spain' },
  { code:'NL', name:'Netherlands' }, { code:'BE', name:'Belgium' },
  { code:'SE', name:'Sweden' }, { code:'NO', name:'Norway' },
  { code:'DK', name:'Denmark' }, { code:'FI', name:'Finland' },
  { code:'PL', name:'Poland' }, { code:'CH', name:'Switzerland' },
  { code:'AT', name:'Austria' }, { code:'PT', name:'Portugal' },
  { code:'IE', name:'Ireland' }, { code:'MX', name:'Mexico' },
  { code:'BR', name:'Brazil' }, { code:'AR', name:'Argentina' },
  { code:'ZA', name:'South Africa' }, { code:'IN', name:'India' },
  { code:'PH', name:'Philippines' }, { code:'TH', name:'Thailand' },
  { code:'MY', name:'Malaysia' }, { code:'ID', name:'Indonesia' },
  { code:'AE', name:'UAE' }, { code:'IL', name:'Israel' },
  { code:'TR', name:'Türkiye' }, { code:'EG', name:'Egypt' },
  { code:'NG', name:'Nigeria' }, { code:'ZW', name:'Zimbabwe' },
]

const FLAVOUR_PRESETS = [
  '🍒 Cherry','🫐 Blue Raspberry','🍋 Lemon','🍓 Strawberry','🍉 Watermelon',
  '🥤 Cola','🍇 Grape','🍊 Orange','🍵 Green Apple','❄️ Arctic Mint',
  '🌶️ Mango Chili','🍑 Peach','🥝 Kiwi','🍍 Pineapple',
]

const CONDITIONS = [
  { label:'✅ All good', type:'good', sub:'Machine working great' },
  { label:'⚠️ Too liquidy', type:'warn', sub:'Watery or warm slushy' },
  { label:'🥶 Too frozen', type:'warn', sub:'Very icy / hard to pour' },
  { label:'📦 Low supply', type:'warn', sub:'Few cups or straws left' },
  { label:'❌ Out of order', type:'bad', sub:'Machine not working' },
  { label:'🚫 Machine gone', type:'bad', sub:'No longer at this location' },
]

export default function AddPage() {
  const router = useRouter()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [strings, setStrings]     = useState<Strings>(getStrings('en'))
  const [flavours, setFlavours]   = useState<string[]>([])
  const [customFlavour, setCustomFlavour] = useState('')
  const [condition, setCondition] = useState<string | null>(null)
  const [form, setForm]           = useState<Partial<SubmitLocationPayload>>({ brand: '7-Eleven' })

  useEffect(() => { setStrings(getStrings(detectLanguage())) }, [])

  const set = (key: keyof SubmitLocationPayload, value: string) =>
    setForm(f => ({ ...f, [key]: value }))

  const addFlavour = (f: string) => {
    if (!flavours.includes(f)) setFlavours(prev => [...prev, f])
  }
  const removeFlavour = (f: string) => setFlavours(prev => prev.filter(x => x !== f))

  const handleSubmit = async () => {
    if (!form.name || !form.address || !form.city || !form.country_code || !form.brand) {
      setError('Please fill in all required fields'); return
    }
    setLoading(true); setError('')
    try {
      const payload = {
        ...form,
        flavours: flavours.join(', '),
        machine_condition: condition ?? '',
      }
      const res = await fetch('/api/submit-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) setSubmitted(true)
      else { const d = await res.json(); setError(d.error ?? 'Submission failed') }
    } catch { setError('Network error — please try again') }
    finally { setLoading(false) }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center bg-[#0a0c0f]">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mb-5">
          <CheckCircle size={30} className="text-white" />
        </div>
        <h2 className="text-[18px] font-black text-white mb-2 font-space">Station added!</h2>
        <p className="text-[12px] text-slate-400 leading-relaxed mb-8 max-w-xs">
          Your submission goes live after a quick review — usually within 24 hours.
        </p>
        <button onClick={() => router.push('/')}
          className="h-11 px-8 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-[13px] font-bold rounded-xl font-space">
          Find more slushies
        </button>
      </div>
    )
  }

  const inp = "w-full h-11 px-3 text-[13px] border border-[#1e2840] rounded-xl bg-[#111318] text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 mb-4"
  const sel = "w-full h-11 px-3 text-[13px] border border-[#1e2840] rounded-xl bg-[#111318] text-slate-200 focus:outline-none focus:border-cyan-500/50 mb-4"
  const lbl = "block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5"

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0c0f]">
      <header className="bg-[#0a0c0f]/90 backdrop-blur-xl border-b border-[#1e2840] px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 flex items-center gap-1.5 text-[13px] hover:text-white">
          <ArrowLeft size={18} />
        </button>
        <span className="text-[14px] font-bold text-white font-space">Add a Station</span>
      </header>

      <div className="flex-1 px-4 py-5 pb-24 overflow-y-auto">
        <p className="text-[12px] text-slate-400 mb-5 leading-relaxed">
          Know a slushy machine not on the map? Add it here — works anywhere in the world.
        </p>

        <label className={lbl}>Store name *</label>
        <input className={inp} type="text" placeholder="e.g. 7-Eleven — Shibuya" onChange={e => set('name', e.target.value)} />

        <label className={lbl}>Street address *</label>
        <input className={inp} type="text" placeholder="123 Main St" onChange={e => set('address', e.target.value)} />

        <label className={lbl}>City *</label>
        <input className={inp} type="text" placeholder="e.g. Tokyo" onChange={e => set('city', e.target.value)} />

        <label className={lbl}>State / Province / Region</label>
        <input className={inp} type="text" placeholder="e.g. Ontario, California, Île-de-France" onChange={e => set('region', e.target.value)} />

        <label className={lbl}>Postcode / ZIP</label>
        <input className={inp} type="text" placeholder="e.g. EC1A 1BB or 90210" onChange={e => set('postal_code', e.target.value)} />

        <label className={lbl}>Country *</label>
        <select className={sel} onChange={e => {
          const [code, ...rest] = e.target.value.split('|')
          set('country_code', code)
          set('country_name', rest.join('|'))
        }}>
          <option value="">Select country</option>
          {COUNTRIES.map(c => (
            <option key={c.code} value={`${c.code}|${c.name}`}>{c.name}</option>
          ))}
          <option value="OTHER|Other">Other country</option>
        </select>

        <label className={lbl}>Machine brand *</label>
        <select className={sel} value={form.brand} onChange={e => set('brand', e.target.value)}>
          {ALL_BRANDS.map(b => (
            <option key={b} value={b}>{BRAND_DISPLAY[b]}</option>
          ))}
        </select>

        {/* Flavours */}
        <label className={lbl}>Available flavours</label>
        <div className="mb-2">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {FLAVOUR_PRESETS.map(f => (
              <button key={f} type="button" onClick={() => addFlavour(f)}
                className="text-[10px] px-2.5 py-1 rounded-full bg-[#111318] border border-[#1e2840] text-slate-400 hover:border-cyan-500/30 hover:text-cyan-400 transition-colors">
                + {f}
              </button>
            ))}
          </div>
          {flavours.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {flavours.map(f => (
                <button key={f} type="button" onClick={() => removeFlavour(f)}
                  className="text-[10px] px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                  {f} ×
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 mb-4">
            <input className="flex-1 h-10 px-3 text-[12px] border border-[#1e2840] rounded-xl bg-[#111318] text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
              value={customFlavour} onChange={e => setCustomFlavour(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { addFlavour(customFlavour); setCustomFlavour('') }}}
              placeholder="Other flavour…" />
            <button type="button" onClick={() => { addFlavour(customFlavour); setCustomFlavour('') }}
              className="h-10 px-3 rounded-xl border border-[#1e2840] text-cyan-400 text-[12px] font-bold hover:border-cyan-500/40 transition-colors">
              Add
            </button>
          </div>
        </div>

        {/* Condition */}
        <label className={lbl}>Machine condition</label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {CONDITIONS.map(c => (
            <button key={c.label} type="button" onClick={() => setCondition(c.label)}
              className={`p-3 rounded-xl border text-left transition-all ${
                condition === c.label
                  ? c.type === 'good' ? 'border-emerald-500/60 bg-emerald-500/8'
                  : c.type === 'warn' ? 'border-amber-500/60 bg-amber-500/8'
                  : 'border-red-500/60 bg-red-500/8'
                  : 'border-[#1e2840] bg-[#111318] hover:border-slate-600'
              }`}>
              <span className="block text-[11px] font-bold text-white mb-0.5">{c.label}</span>
              <span className="text-[10px] text-slate-400">{c.sub}</span>
            </button>
          ))}
        </div>

        <label className={lbl}>Notes (optional)</label>
        <input className={inp} type="text" placeholder="Machine location in store, access tips, etc." onChange={e => set('notes', e.target.value)} />

        {error && <p className="text-[12px] text-red-400 mb-3">{error}</p>}

        <button onClick={handleSubmit} disabled={loading}
          className="w-full h-12 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-[14px] font-black rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 font-space mt-1">
          {loading ? 'Submitting…' : strings.submitStation.toUpperCase()}
        </button>
        <p className="text-[10px] text-slate-500 text-center mt-3 leading-relaxed">
          Submissions are reviewed before going live. Thank you for helping build the global map.
        </p>
      </div>

      <nav className="bg-[#0a0c0f]/95 backdrop-blur-xl border-t border-[#1e2840] flex sticky bottom-0">
        <a href="/" className="flex-1 flex flex-col items-center gap-1 py-2.5 text-slate-500">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
          <span className="text-[9px] font-bold tracking-wider">DISCOVER</span>
        </a>
        <button className="flex-1 flex flex-col items-center gap-1 py-2.5 text-cyan-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>
          <span className="text-[9px] font-bold tracking-wider">ADD</span>
        </button>
        <a href="/search" className="flex-1 flex flex-col items-center gap-1 py-2.5 text-slate-500">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span className="text-[9px] font-bold tracking-wider">STATIONS</span>
        </a>
      </nav>
    </div>
  )
}
