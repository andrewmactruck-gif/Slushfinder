'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { MapPin, CheckCircle, X } from 'lucide-react'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const PRESET_FLAVOURS = ['Cherry','Blue Raspberry','Watermelon','Grape','Cola','Lemon-Lime','Orange','Strawberry','Mango']
const BRANDS = ['Slurpee','ICEE','Slush Puppie','Froster','Sloche','Other']

export default function CheckInButton({ locationId }: { locationId: string }) {
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [working, setWorking] = useState<'working' | 'not_working' | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [other, setOther] = useState('')
  const [brand, setBrand] = useState('')
  const [hours, setHours] = useState('')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [failed, setFailed] = useState('')

  useEffect(() => { sb.auth.getUser().then(({ data }) => setUserId(data.user?.id || null)) }, [])

  const toggleFlavour = (f: string) =>
    setSelected(s => s.includes(f) ? s.filter(x => x !== f) : [...s, f])

  async function submit() {
    setFailed('')
    if (!working) { setFailed('Please say if the machine is working.'); return }
    setSending(true)
    try {
      const allFlavours = [...selected, ...other.split(',').map(x => x.trim()).filter(Boolean)]
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: locationId,
          user_id: userId,
          machine_condition: working,
          brand: brand || undefined,
          hours_text: hours || undefined,
          flavours_available: allFlavours.join(', '),
          note,
        }),
      })
      if (!res.ok) throw new Error('failed')
      setDone(true); setOpen(false)
    } catch {
      setFailed('Could not save — please try again.')
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div className="w-full flex items-center gap-2 px-4 py-3 text-[13px]" style={{ color: 'var(--green)' }}>
        <CheckCircle size={14} /> Thanks for checking in!
      </div>
    )
  }

  return (
    <div>
      <button className="w-full flex items-center justify-center gap-2 px-4 py-3 text-[14px] font-bold"
        style={{ background: open ? 'none' : 'var(--grad)', border: 'none', color: open ? 'var(--t2)' : '#fff', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 12 }}
        onClick={() => setOpen(o => !o)}>
        {open ? <X size={16} /> : <MapPin size={16} />}
        {open ? 'Cancel' : 'Check in here'}
      </button>

      {open && (
        <div style={{ padding: '12px 4px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!userId && (
            <p className="text-[12px]" style={{ color: 'var(--amber)' }}>
              You can check in as a guest, or sign in on the Profile page to track your check-ins.
            </p>
          )}

          <div>
            <p className="text-[11px] font-bold uppercase" style={{ color: 'var(--t3)', marginBottom: 6 }}>Is the machine working?</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['working','✅ Working'],['not_working','❌ Not working']].map(([val,label]) => (
                <button key={val} onClick={() => setWorking(val as any)}
                  style={{ flex: 1, padding: '8px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    border: '1px solid ' + (working === val ? 'var(--cyan)' : 'var(--out-v)'),
                    background: working === val ? 'rgba(0,180,204,0.12)' : 'var(--s-base)', color: 'var(--t1)' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase" style={{ color: 'var(--t3)', marginBottom: 6 }}>Flavours available</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRESET_FLAVOURS.map(f => (
                <button key={f} onClick={() => toggleFlavour(f)}
                  style={{ padding: '5px 10px', borderRadius: 999, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                    border: '1px solid ' + (selected.includes(f) ? 'var(--cyan)' : 'var(--out-v)'),
                    background: selected.includes(f) ? 'rgba(0,180,204,0.12)' : 'var(--s-base)', color: 'var(--t1)' }}>
                  {f}
                </button>
              ))}
            </div>
            <input value={other} onChange={e => setOther(e.target.value)} placeholder="Other flavours (comma separated)"
              style={{ width: '100%', marginTop: 8, padding: '8px 10px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
                border: '1px solid var(--out-v)', background: 'var(--s-base)', color: 'var(--t1)' }} />
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase" style={{ color: 'var(--t3)', marginBottom: 6 }}>Note (optional)</p>
            <div style={{ marginBottom: 14 }}>
              <p className="text-[11px] font-bold uppercase" style={{ color: 'var(--t3)', marginBottom: 6 }}>Brand (if different)</p>
              <select value={brand} onChange={e => setBrand(e.target.value)}
                style={{ width: '100%', padding: '9px 10px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', border: '1px solid var(--out-v)', background: 'var(--s-base)', color: 'var(--t1)', cursor: 'pointer' }}>
                <option value="">Keep current brand</option>
                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <p className="text-[11px] font-bold uppercase" style={{ color: 'var(--t3)', marginBottom: 6 }}>Store hours (optional)</p>
              <input value={hours} onChange={e => setHours(e.target.value)} placeholder="e.g. Mon-Fri 9-9, Sat-Sun 10-6"
                style={{ width: '100%', padding: '9px 10px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', border: '1px solid var(--out-v)', background: 'var(--s-base)', color: 'var(--t1)' }} />
            </div>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Anything worth mentioning?" rows={2}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'vertical',
                border: '1px solid var(--out-v)', background: 'var(--s-base)', color: 'var(--t1)' }} />
          </div>

          {failed && <p className="text-[12px]" style={{ color: 'var(--red)' }}>{failed}</p>}

          <button onClick={submit} disabled={sending}
            style={{ width: '100%', padding: '11px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: sending ? 'default' : 'pointer', fontFamily: 'inherit',
              background: 'var(--grad)', color: '#fff', border: 'none', opacity: sending ? 0.6 : 1 }}>
            {sending ? 'Saving…' : 'Submit check-in'}
          </button>
        </div>
      )}
    </div>
  )
}
