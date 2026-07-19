'use client'

import Link from 'next/link'
import { Navigation, ChevronRight, AlertTriangle, CheckCircle, Phone } from 'lucide-react'
import { LocationWithDistance, BRAND_COLORS, DistanceUnit, formatDistance, Strings } from '@/types'

interface Props {
  location: LocationWithDistance
  unit: DistanceUnit
  strings: Strings
}

export default function LocationCard({ location: loc, unit, strings }: Props) {
  const bc = BRAND_COLORS[loc.brand] ?? BRAND_COLORS['Other']
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${loc.address}, ${loc.city}`)}`

  const flavours = loc.flavours ? loc.flavours.split(',').map(f => f.trim()).filter(Boolean) : []
  const conditions: string[] = (loc as any).conditions ? JSON.parse((loc as any).conditions) : []

  return (
    <div className="bg-[#111318] border border-[#1e2840] rounded-2xl p-4 hover:border-cyan-500/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="text-[14px] font-bold text-white leading-snug flex-1 font-space">{loc.name}</h3>
        <span className={`shrink-0 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
          loc.is_open
            ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25'
            : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {loc.is_open ? strings.openNowLabel : strings.closedLabel}
        </span>
      </div>

      {/* Address */}
      <p className="text-[11px] text-slate-400 mb-2.5 leading-snug">
        {loc.address}, {loc.city}
        {loc.country_code && loc.country_code !== 'CA' && loc.country_code !== 'US'
          ? `, ${loc.country_name ?? loc.country_code}` : ''}
      </p>

      {/* Verified badge — shows until 10 check-ins */}
      {!(loc as any).is_verified && (
        <div className="flex items-center gap-1.5 mb-2 px-2.5 py-1 rounded-lg bg-amber-500/8 border border-amber-500/20 w-fit">
          <AlertTriangle size={10} className="text-amber-400 shrink-0" />
          <span className="text-[10px] font-semibold text-amber-400">Not a verified location</span>
          {(loc as any).checkin_count > 0 && (
            <span className="text-[10px] text-amber-400/60">· {(loc as any).checkin_count}/10 check-ins</span>
          )}
        </div>
      )}
      {(loc as any).is_verified && (loc as any).checkin_count >= 10 && (
        <div className="flex items-center gap-1.5 mb-2 px-2.5 py-1 rounded-lg bg-emerald-500/8 border border-emerald-500/20 w-fit">
          <CheckCircle size={10} className="text-emerald-400 shrink-0" />
          <span className="text-[10px] font-semibold text-emerald-400">Community verified · {(loc as any).checkin_count} check-ins</span>
        </div>
      )}

      {/* Flavours */}
      {flavours.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-2">
          {flavours.slice(0, 3).map(f => (
            <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/8 text-cyan-400 border border-cyan-500/15">{f}</span>
          ))}
          {flavours.length > 3 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">+{flavours.length - 3} more</span>
          )}
        </div>
      )}

      {/* Conditions */}
      {conditions.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-2">
          {conditions.map((c, i) => (
            <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">{c}</span>
          ))}
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className="flex items-center gap-1 text-[12px] font-semibold text-cyan-400">
          <Navigation size={11} />
          {formatDistance(loc.distance_km, unit)} away
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bc.bg} ${bc.text}`}>
          {loc.brand}
        </span>
        {loc.machine_status === 'operational'
          ? <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400"><CheckCircle size={10} />{strings.operational}</span>
          : <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400"><AlertTriangle size={10} />{strings.issueReported}</span>
        }
        <span className="text-[10px] text-slate-500">{loc.todays_hours}</span>
        {(loc as any).checkin_count > 0 && (
          <span className="text-[10px] text-cyan-400/70">📍 {(loc as any).checkin_count} check-ins</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-[#1e2840]">
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-[12px] font-bold rounded-xl hover:opacity-90 transition-opacity font-space">
          <Navigation size={13} /> {strings.getDirections}
        </a>
        <Link href={`/location/${loc.id}`}
          className="flex items-center gap-1 px-3 h-9 border border-[#1e2840] rounded-xl text-[12px] text-slate-400 hover:border-cyan-500/30 hover:text-cyan-400 transition-colors">
          Info <ChevronRight size={13} />
        </Link>
        {loc.phone && (
          <a href={`tel:${loc.phone}`}
            className="w-9 h-9 flex items-center justify-center border border-purple-500/30 rounded-xl text-purple-400 hover:border-purple-500/60 transition-colors">
            <Phone size={14} />
          </a>
        )}
      </div>
    </div>
  )
}
