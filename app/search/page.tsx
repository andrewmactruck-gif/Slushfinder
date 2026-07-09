'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { List, Map as MapIcon } from 'lucide-react'
import SearchBar from '@/components/SearchBar'
import BrandFilter from '@/components/BrandFilter'
import LocationCard from '@/components/LocationCard'
import { LocationWithDistance, Brand, detectLanguage, getStrings, DistanceUnit, Strings } from '@/types'

const SlushyMap = dynamic(() => import('@/components/map/SlushyMap'), { ssr: false })

function SearchPageInner() {
  const router = useRouter()
  const params = useSearchParams()

  const lat     = parseFloat(params.get('lat') ?? '0')
  const lng     = parseFloat(params.get('lng') ?? '0')
  const label   = params.get('label') ?? ''
  const country = params.get('country') ?? ''
  const initUnit = (params.get('unit') ?? 'km') as DistanceUnit

  const [locations, setLocations] = useState<LocationWithDistance[]>([])
  const [loading, setLoading]     = useState(true)
  const [view, setView]           = useState<'list' | 'map'>('list')
  const [brand, setBrand]         = useState<Brand | 'all'>('all')
  const [radius, setRadius]       = useState(10)
  const [openNow, setOpenNow]     = useState(false)
  const [unit, setUnit]           = useState<DistanceUnit>(initUnit)
  const [strings, setStrings]     = useState<Strings>(getStrings('en'))

  useEffect(() => {
    setStrings(getStrings(detectLanguage()))
  }, [])

  const fetchLocations = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({
        lat: lat.toString(), lng: lng.toString(), radius: radius.toString(),
        ...(brand !== 'all' ? { brand } : {}),
        ...(openNow ? { open_now: 'true' } : {}),
        ...(country ? { country } : {}),
      })
      const res = await fetch(`/api/search?${qs}`)
      const data = await res.json()
      setLocations(data.locations ?? [])
    } catch { setLocations([]) }
    finally { setLoading(false) }
  }, [lat, lng, radius, brand, openNow, country])

  useEffect(() => { fetchLocations() }, [fetchLocations])

  const handleNewSearch = useCallback((nlat: number, nlng: number, nlabel: string, ncc?: string) => {
    const p = new URLSearchParams({
      lat: nlat.toString(), lng: nlng.toString(), label: nlabel, unit,
      ...(ncc ? { country: ncc } : {}),
    })
    router.push(`/search?${p}`)
  }, [router, unit])

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0c0f]">
      {/* Top bar */}
      <header className="bg-[#0a0c0f]/90 backdrop-blur-xl border-b border-[#1e2840] px-4 py-3 sticky top-0 z-10 space-y-2">
        <div className="flex items-center gap-3">
          <a href="/" className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shrink-0">
            <span className="text-black font-black text-[12px] font-space">S</span>
          </a>
          <div className="flex-1">
            <SearchBar onSearch={handleNewSearch} strings={strings} compact initialValue={label} />
          </div>
          <button onClick={() => setUnit(u => u === 'km' ? 'mi' : 'km')}
            className="text-[10px] font-bold px-2 py-1 rounded-full border border-[#1e2840] text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400 transition-colors shrink-0">
            {unit}
          </button>
        </div>
      </header>

      {/* Brand filter */}
      <div className="bg-[#0a0c0f] border-b border-[#1e2840] py-2">
        <BrandFilter active={brand} onChange={b => setBrand(b)} />
      </div>

      {/* Results bar */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <p className="text-[11px] text-slate-400">
          {loading ? 'Searching…' : (
            <><span className="font-bold text-white">{locations.length}</span> {strings.foundNearby} · <span className="text-cyan-400">{label}</span></>
          )}
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => setOpenNow(v => !v)}
            className={`h-6 px-2.5 text-[10px] font-bold rounded-full border transition-colors ${
              openNow ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-transparent text-slate-400 border-[#1e2840]'
            }`}>
            {strings.openNow}
          </button>
          <select value={radius} onChange={e => setRadius(Number(e.target.value))}
            className="h-6 text-[10px] border border-[#1e2840] rounded-full px-2 bg-[#111318] text-slate-400">
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
            <option value={100}>100 km</option>
          </select>
          <div className="flex border border-[#1e2840] rounded-lg overflow-hidden">
            <button onClick={() => setView('list')}
              className={`w-7 h-6 flex items-center justify-center ${view==='list' ? 'bg-cyan-500 text-black' : 'text-slate-500 hover:text-slate-300'}`}>
              <List size={12} />
            </button>
            <button onClick={() => setView('map')}
              className={`w-7 h-6 flex items-center justify-center ${view==='map' ? 'bg-cyan-500 text-black' : 'text-slate-500 hover:text-slate-300'}`}>
              <MapIcon size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Map view */}
      {view === 'map' && !loading && (
        <div className="mx-4 mb-3 rounded-2xl overflow-hidden border border-[#1e2840]" style={{ height: 240 }}>
          <SlushyMap locations={locations} center={{ lat, lng }} />
        </div>
      )}

      {/* List */}
      <div className="flex-1 px-4 pb-24 space-y-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[#111318] rounded-2xl p-4 animate-pulse space-y-3 border border-[#1e2840]">
                <div className="flex justify-between"><div className="h-4 bg-[#1e2229] rounded w-2/3" /><div className="h-5 bg-[#1e2229] rounded-full w-16" /></div>
                <div className="h-3 bg-[#1e2229] rounded w-full" />
                <div className="flex gap-2"><div className="h-3 bg-[#1e2229] rounded w-20" /><div className="h-3 bg-[#1e2229] rounded w-16" /></div>
                <div className="flex gap-2 pt-2 border-t border-[#1e2840]"><div className="h-9 bg-[#1e2229] rounded-xl flex-1" /><div className="h-9 bg-[#1e2229] rounded-xl w-20" /></div>
              </div>
            ))
          : locations.length === 0
          ? (
            <div className="flex flex-col items-center py-16 text-center px-4">
              <div className="text-4xl mb-4">🧊</div>
              <p className="text-[14px] font-bold text-white mb-1 font-space">{strings.noMachines}</p>
              <p className="text-[12px] text-slate-400 leading-relaxed">
                Try expanding your radius, changing the brand filter, or{' '}
                <a href="/add" className="text-cyan-400 underline">add a location</a>.
              </p>
            </div>
          )
          : locations.map(loc => (
              <LocationCard key={loc.id} location={loc} unit={unit} strings={strings} />
            ))
        }
      </div>

      <nav className="bg-[#0a0c0f]/95 backdrop-blur-xl border-t border-[#1e2840] flex sticky bottom-0">
        <a href="/" className="flex-1 flex flex-col items-center gap-1 py-2.5 text-slate-500 hover:text-slate-300">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
          <span className="text-[9px] font-bold tracking-wider">DISCOVER</span>
        </a>
        <a href="/add" className="flex-1 flex flex-col items-center gap-1 py-2.5 text-slate-500 hover:text-slate-300">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>
          <span className="text-[9px] font-bold tracking-wider">ADD</span>
        </a>
        <button className="flex-1 flex flex-col items-center gap-1 py-2.5 text-cyan-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span className="text-[9px] font-bold tracking-wider">STATIONS</span>
        </button>
      </nav>
    </div>
  )
}

export default function SearchPage() {
  return <Suspense><SearchPageInner /></Suspense>
}
