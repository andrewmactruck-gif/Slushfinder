'use client'

import { useState, useCallback } from 'react'
import { Search, LocateFixed, Loader2 } from 'lucide-react'
import { geocodeQuery } from '@/lib/geocode'
import { Strings } from '@/types'

interface Props {
  onSearch: (lat: number, lng: number, label: string, countryCode?: string) => void
  strings: Strings
  compact?: boolean
  initialValue?: string
}

export default function SearchBar({ onSearch, strings, compact = false, initialValue = '' }: Props) {
  const [query, setQuery]       = useState(initialValue)
  const [gpsLoading, setGps]    = useState(false)
  const [error, setError]        = useState('')
  const [searching, setSearching] = useState(false)

  const handleSearch = useCallback(async () => {
    const q = query.trim()
    if (!q) { setError('Enter a Postal code, ZIP, or city name'); return }
    setError('')
    setSearching(true)
    const geo = await geocodeQuery(q)
    setSearching(false)
    if (!geo) { setError('Location not found — try a different search'); return }
    onSearch(geo.lat, geo.lng, geo.city ? `${geo.city}, ${geo.country}` : q, geo.countryCode)
  }, [query, onSearch])

  const handleGps = useCallback(() => {
    if (!navigator.geolocation) { setError('GPS not available'); return }
    setGps(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGps(false)
        onSearch(pos.coords.latitude, pos.coords.longitude, 'Current location')
      },
      () => { setGps(false); setError('Could not get location — try a postcode instead') },
      { timeout: 8000 }
    )
  }, [onSearch])

  if (compact) {
    return (
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            className="w-full h-10 pl-3 pr-3 text-[13px] bg-[#1e2229] border border-[#1e2840] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={strings.searchPlaceholder}
          />
        </div>
        <button onClick={handleSearch} disabled={searching}
          className="h-9 px-4 bg-cyan-500 text-black text-[12px] font-bold rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-60 font-space">
          {searching ? '…' : 'GO'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            className="w-full h-12 pl-12 pr-3 text-[15px] bg-[#1e2229] border border-[#1e2840] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={strings.searchPlaceholder}
          />
        </div>
        <button onClick={handleSearch} disabled={searching}
          className="h-11 px-5 bg-cyan-500 text-black text-[13px] font-bold rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-60 whitespace-nowrap font-space">
          {searching ? <Loader2 size={16} className="animate-spin" /> : 'EXPLORE'}
        </button>
      </div>
      <button onClick={handleGps} disabled={gpsLoading}
        className="w-full h-11 flex items-center justify-center gap-2 bg-[#1e2229] border border-[#1e2840] rounded-xl text-[13px] text-slate-300 hover:border-cyan-500/40 hover:text-cyan-400 transition-colors disabled:opacity-60">
        {gpsLoading
          ? <><Loader2 size={15} className="animate-spin text-cyan-400" /> Getting location…</>
          : <><LocateFixed size={15} className="text-cyan-400" /> {strings.useLocation}</>}
      </button>
      {error && <p className="text-[11px] text-red-400 pl-1">{error}</p>}
    </div>
  )
}
