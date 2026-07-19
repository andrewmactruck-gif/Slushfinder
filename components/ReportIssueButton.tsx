'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, X } from 'lucide-react'

const REASONS = [
  { value: 'broken',      label: 'Machine is broken' },
  { value: 'gone',        label: 'Machine is gone' },
  { value: 'wrong_info',  label: 'Details are wrong' },
  { value: 'wrong_hours', label: 'Hours are wrong' },
  { value: 'other',       label: 'Something else' },
] as const

export default function ReportIssueButton({ locationId }: { locationId: string }) {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [failed, setFailed] = useState(false)

  async function submit(reportType: string) {
    setSending(reportType)
    setFailed(false)
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location_id: locationId, report_type: reportType }),
      })
      if (!res.ok) throw new Error('failed')
      setDone(true)
      setOpen(false)
    } catch {
      setFailed(true)
    } finally {
      setSending(null)
    }
  }

  if (done) {
    return (
      <div className="w-full flex items-center gap-2 px-4 py-3 text-[13px]"
        style={{ color: 'var(--green)' }}>
        <CheckCircle size={14} /> Thanks — your report will be reviewed.
      </div>
    )
  }

  return (
    <div>
      <button className="w-full flex items-center gap-2 px-4 py-3 text-[13px]"
        style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontFamily: 'inherit' }}
        onClick={() => setOpen(o => !o)}>
        {open ? <X size={14} /> : <AlertTriangle size={14} />}
        {open ? 'Cancel' : 'Report an issue'}
      </button>

      {open && (
        <div className="pb-2">
          {REASONS.map(r => (
            <button key={r.value} disabled={sending !== null}
              className="w-full text-left px-4 py-2.5 text-[13px]"
              style={{ background: 'none', border: 'none', color: 'var(--t2)', cursor: sending ? 'default' : 'pointer', fontFamily: 'inherit', opacity: sending && sending !== r.value ? 0.4 : 1 }}
              onClick={() => submit(r.value)}>
              {sending === r.value ? 'Sending…' : r.label}
            </button>
          ))}
          {failed && (
            <p className="px-4 py-2 text-[12px]" style={{ color: 'var(--red)' }}>
              Could not send — please try again.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
