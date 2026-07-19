'use client'

import { AlertTriangle } from 'lucide-react'

export default function ReportIssueButton() {
  return (
    <button className="w-full flex items-center gap-2 px-4 py-3 text-[13px] border-t" style={{ background: 'none', border: 'none', borderTop: `1px solid var(--b1)`, color: 'var(--red)', cursor: 'pointer', fontFamily: 'inherit' }}
      onClick={() => alert('Thank you — your report will be reviewed.')}>
      <AlertTriangle size={14} /> Report an issue
    </button>
  )
}
