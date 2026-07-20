import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Navigation, Share2, AlertTriangle, CheckCircle, Phone } from 'lucide-react'
import ReportIssueButton from '@/components/ReportIssueButton'
import CheckInButton from '@/components/CheckInButton'
import { isLocationOpen, getTodaysHoursDisplay, WEEK_DAYS, formatDayHours, getTodayKey, hasHours } from '@/lib/hours'
import { BRAND_COLORS } from '@/types'

async function getLocation(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/locations/${id}`, { next: { revalidate: 60 } })
  if (!res.ok) return null
  return res.json()
}

export default async function LocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const loc = await getLocation(id)
  if (!loc) notFound()

  if (typeof loc.hours === 'string') {
    try { loc.hours = JSON.parse(loc.hours) } catch { loc.hours = {} }
  }
  if (!loc.hours || typeof loc.hours !== 'object') loc.hours = {}

  const isOpen = isLocationOpen(loc.hours, loc.timezone)
  const knowHours = hasHours(loc.hours)
  const todayKey = getTodayKey(loc.timezone)
  const brandColor = BRAND_COLORS[loc.brand as keyof typeof BRAND_COLORS] ?? BRAND_COLORS['Other']
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${loc.address}, ${loc.city}`)}`
  const lastVerified = loc.last_verified_at
    ? new Date(loc.last_verified_at).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="flex flex-col min-h-screen app-bg">
      <header className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3 border-b" style={{ background: 'var(--s1)', borderColor: 'var(--b1)' }}>
        <Link href="/search" className="flex items-center gap-1.5 text-[13px] hover:opacity-70" style={{ color: 'var(--t2)', textDecoration: 'none' }}>
          <ArrowLeft size={18} /> Results
        </Link>
        <div className="ml-auto"><Share2 size={18} style={{ color: 'var(--cyan)', cursor: 'pointer' }} /></div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
        <div className="px-4 pt-5 pb-4 border-b" style={{ background: 'linear-gradient(160deg, rgba(0,122,188,0.06), transparent)', borderColor: 'var(--b1)' }}>
          <h1 className="text-[18px] font-black mb-1 leading-tight" style={{ color: 'var(--t1)' }}>{loc.name}</h1>
          <p className="text-[13px] mb-3" style={{ color: 'var(--t2)' }}>{loc.address}, {loc.city} {loc.postal_code}</p>
          <div className="flex flex-wrap gap-2">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: !knowHours ? 'rgba(120,120,120,0.12)' : isOpen ? 'rgba(10,124,78,0.1)' : 'rgba(192,57,43,0.08)', color: !knowHours ? 'var(--t3)' : isOpen ? 'var(--green)' : 'var(--red)', border: `1px solid ${!knowHours ? 'rgba(120,120,120,0.25)' : isOpen ? 'rgba(10,124,78,0.25)' : 'rgba(192,57,43,0.2)'}` }}>
              {!knowHours ? '● Hours unknown' : isOpen ? '● Open now' : '● Closed'}
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${brandColor.bg} ${brandColor.text}`}>{loc.brand}</span>
            {loc.machine_status === 'issue_reported' && (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(176,109,0,0.1)', color: 'var(--amber)', border: '1px solid rgba(176,109,0,0.2)' }}>
                <AlertTriangle size={10} /> Issue reported
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-3 px-4 py-3">
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-[14px] font-black no-underline btn-grad" style={{ color: '#fff' }}>
            <Navigation size={16} /> Get directions
          </a>
          {loc.phone && (
            <a href={`tel:${loc.phone}`} className="w-11 h-11 flex items-center justify-center rounded-xl border no-underline" style={{ borderColor: 'rgba(108,30,176,0.3)', background: 'rgba(108,30,176,0.08)', color: 'var(--purple)' }}>
              <Phone size={16} />
            </a>
          )}
        </div>

        {/* Hours */}
        <div className="mx-4 mb-3 rounded-2xl overflow-hidden border" style={{ background: 'var(--s1)', borderColor: 'var(--b1)' }}>
          <p className="text-[10px] font-black uppercase tracking-widest px-4 pt-3 pb-2 border-b" style={{ color: 'var(--t3)', borderColor: 'var(--b1)' }}>Store hours</p>
          {!knowHours && loc.hours_note && (
            <div className="px-4 py-3 text-[13px]" style={{ color: 'var(--t1)' }}>
              {loc.hours_note}
            </div>
          )}
          {!knowHours && !loc.hours_note && (
            <div className="px-4 py-3 text-[13px]" style={{ color: 'var(--t3)' }}>
              Hours not yet available for this location.
            </div>
          )}
          {knowHours && WEEK_DAYS.map(({ key, label }) => {
            const isToday = key === todayKey
            return (
              <div key={key} className="flex justify-between items-center px-4 py-2.5 text-[13px] border-b last:border-0" style={{ background: isToday ? 'rgba(0,122,188,0.05)' : 'transparent', borderColor: 'var(--b1)' }}>
                <span style={{ color: isToday ? 'var(--cyan)' : 'var(--t2)', fontWeight: isToday ? '600' : '400' }}>
                  {label}{isToday && ' (today)'}
                </span>
                <span style={{ color: isToday ? 'var(--cyan)' : 'var(--t1)', fontWeight: isToday ? '600' : '400' }}>
                  {formatDayHours(loc.hours[key])}
                </span>
              </div>
            )
          })}
          {lastVerified && (
            <div className="flex items-center gap-2 px-4 py-2.5 text-[11px] border-t" style={{ color: 'var(--t3)', borderColor: 'var(--b1)' }}>
              <CheckCircle size={13} style={{ color: 'var(--cyan)' }} /> Last verified {lastVerified}
            </div>
          )}
        </div>

        {/* Notes */}
        {loc.notes && (
          <div className="mx-4 mb-3 rounded-2xl overflow-hidden border" style={{ background: 'var(--s1)', borderColor: 'var(--b1)' }}>
            <p className="text-[10px] font-black uppercase tracking-widest px-4 pt-3 pb-2 border-b" style={{ color: 'var(--t3)', borderColor: 'var(--b1)' }}>Notes</p>
            <p className="px-4 py-3 text-[13px] leading-relaxed" style={{ color: 'var(--t2)' }}>{loc.notes}</p>
          </div>
        )}

        {/* Check in */}
        <div className="mx-4 mb-3 rounded-2xl overflow-hidden border" style={{ background: 'var(--s1)', borderColor: 'var(--b1)', padding: '12px' }}>
          <CheckInButton locationId={loc.id} />
        </div>

        {/* Report — always available, regardless of whether notes exist */}
        <div className="mx-4 mb-3 rounded-2xl overflow-hidden border" style={{ background: 'var(--s1)', borderColor: 'var(--b1)' }}>
          <ReportIssueButton locationId={loc.id} />
        </div>
      </div>
    </div>
  )
}
