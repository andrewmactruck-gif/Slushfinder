'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { LocateFixed, Search } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import { geocodeQuery } from '@/lib/geocode'
import { detectLanguage, getStrings, detectUnit, Strings, DistanceUnit } from '@/types'

export default function HomePage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [error, setError] = useState('')
  const [strings, setStrings] = useState<Strings>(getStrings('en'))

  useEffect(() => { setStrings(getStrings(detectLanguage())) }, [])

  const handleSearch = useCallback(async () => {
    const q = query.trim()
    if (!q) { setError('Enter a postcode, ZIP, or city'); return }
    setError(''); setSearching(true)
    const geo = await geocodeQuery(q)
    setSearching(false)
    if (!geo) { setError('Location not found — try a city name'); return }
    const u = detectUnit(geo.countryCode)
    const p = new URLSearchParams({ lat: geo.lat.toString(), lng: geo.lng.toString(), label: geo.city ? `${geo.city}, ${geo.country}` : q, unit: u, ...(geo.countryCode ? { country: geo.countryCode } : {}) })
    router.push(`/search?${p}`)
  }, [query, router])

  const handleGps = useCallback(() => {
    if (!navigator.geolocation) { setError('GPS not available'); return }
    setGpsLoading(true); setError('')
    navigator.geolocation.getCurrentPosition(
      pos => { setGpsLoading(false); const p = new URLSearchParams({ lat: pos.coords.latitude.toString(), lng: pos.coords.longitude.toString(), label: 'Current location', unit: 'km' }); router.push(`/search?${p}`) },
      () => { setGpsLoading(false); setError('Could not get location — try a postcode') },
      { timeout: 8000 }
    )
  }, [router])

  const quickSearch = (lat: number, lng: number, label: string, cc: string) => {
    const u = detectUnit(cc)
    const p = new URLSearchParams({ lat: lat.toString(), lng: lng.toString(), label, unit: u, country: cc })
    router.push(`/search?${p}`)
  }

  return (
    <div className="flex flex-col min-h-screen app-bg">
      {/* TOPBAR */}
      <header className="topbar-glass sticky top-0 z-20 border-b border-app px-4 py-3 flex items-center gap-3"
              style={{ background: 'var(--s1)', borderColor: 'var(--b1)' }}>
        <Image src="/logo.png" alt="Slush Finder" width={28} height={28} className="rounded-lg flex-shrink-0" />
        <span className="font-black text-[14px] tracking-wide" style={{ color: 'var(--t1)' }}>
          Slush <span style={{ color: 'var(--cyan)' }}>Finder</span>
        </span>
        <nav className="hidden sm:flex gap-5 ml-4">
          {['Flavors','Locations','Mixer'].map(n => (
            <a key={n} href="#" className="text-[13px] font-medium transition-colors hover:opacity-80" style={{ color: 'var(--t2)' }}>{n}</a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <a href="/profile" className="w-8 h-8 rounded-full flex items-center justify-center font-black text-[12px]"
             style={{ background: 'var(--grad)', color: '#fff' }}>S</a>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* HERO */}
        <section className="px-4 pt-8 pb-6 border-b" style={{ borderColor: 'var(--b1)' }}>
          {/* Announce pill */}
          <div className="flex justify-center mb-5">
            <span className="announce-pill inline-flex items-center gap-2 text-[10px] font-bold rounded-full px-3 py-1.5 tracking-widest border"
                  style={{ background: 'rgba(0,122,188,0.08)', borderColor: 'rgba(0,122,188,0.2)', color: 'var(--cyan)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--cyan)' }}></span>
              NEW: ARCTIC MINT PULSE DROPPING NOW
            </span>
          </div>
          <h1 className="text-[28px] sm:text-[34px] font-black leading-tight mb-3 text-center" style={{ color: 'var(--t1)' }}>
            Find your{' '}
            <span className="grad-text">slushie.</span>
          </h1>
          <p className="text-center text-[13px] mb-6 leading-relaxed" style={{ color: 'var(--t2)' }}>
            Discover slushy machines anywhere in the world —<br />Slurpee, ICEE, Froster, Slush Puppie and more.
          </p>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--t3)' }} />
            <input
              className="w-full h-11 pl-9 pr-24 text-[14px] rounded-xl border focus:outline-none focus:ring-2"
              style={{ background: 'var(--s2)', borderColor: 'var(--b1)', color: 'var(--t1)', '--tw-ring-color': 'var(--cyan)' } as any}
              placeholder={strings.searchPlaceholder}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-4 rounded-lg text-[11px] font-black btn-grad disabled:opacity-60 transition-opacity"
            >
              {searching ? '…' : 'FIND IT'}
            </button>
          </div>
          <button
            onClick={handleGps}
            disabled={gpsLoading}
            className="w-full h-10 rounded-xl flex items-center justify-center gap-2 text-[13px] font-medium border transition-colors hover:opacity-80 disabled:opacity-60"
            style={{ background: 'var(--s2)', borderColor: 'var(--b1)', color: 'var(--t2)' }}
          >
            <LocateFixed size={15} style={{ color: 'var(--cyan)' }} />
            {gpsLoading ? 'Getting location…' : strings.useLocation}
          </button>
          {error && <p className="text-[11px] mt-2 pl-1" style={{ color: 'var(--red)' }}>{error}</p>}
        </section>

        {/* FEATURED */}
        <section className="px-4 py-5">
          <div className="flex justify-between items-center mb-3">
            <p className="text-[14px] font-black" style={{ color: 'var(--t1)' }}>Featured Frequency</p>
            <button className="text-[10px] font-bold tracking-wider" style={{ color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer' }}>VIEW ALL →</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { tag:'BEST SELLER', tagColor:'var(--cyan)', name:'Neon Nebula Mix', desc:'Deep space blend of blueberry galaxy crystals.', link:'Find near me →' },
              { tag:'COLD PRESSED', tagColor:'#0a7c4e', name:'Glacial Lime Zest', desc:'Electric lime with arctic salt crush.', link:'Find near me →' },
            ].map(c => (
              <div key={c.name} onClick={() => quickSearch(43.6, -79.4, 'Toronto', 'CA')}
                className="rounded-xl p-3 cursor-pointer card-hover transition-all border"
                style={{ background: 'var(--s1)', borderColor: 'var(--b1)' }}>
                <p className="text-[9px] font-black tracking-widest mb-2" style={{ color: c.tagColor }}>{c.tag}</p>
                <p className="text-[12px] font-black mb-1 leading-tight" style={{ color: 'var(--t1)' }}>{c.name}</p>
                <p className="text-[10px] leading-snug mb-3" style={{ color: 'var(--t3)' }}>{c.desc}</p>
                <p className="text-[10px] font-bold" style={{ color: c.tagColor }}>{c.link}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ICE-COLD INFUSIONS */}
        <section className="px-4 pb-5">
          <p className="text-[14px] font-black mb-3" style={{ color: 'var(--t1)' }}>Ice-Cold Infusions</p>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {[
              { emoji:'🧊', name:'Arctic Mint Pulse', sub:'High-Voltage Refresh', badge:'#1 TRENDING' },
              { emoji:'🍊', name:'Solar Flare Sip', sub:'Caild-Cold Fusion', badge:null },
              { emoji:'🫐', name:'Cyber Berry Blast', sub:'Data-Driven Flavor', badge:null },
              { emoji:'🍇', name:'Cloud Nine Crush', sub:'Velvet Ice Texture', badge:null },
            ].map(item => (
              <div key={item.name} className="flex-shrink-0 w-[100px] cursor-pointer">
                <div className="w-[100px] h-[72px] rounded-xl flex items-center justify-center mb-2 relative border"
                     style={{ background: 'var(--s2)', borderColor: 'var(--b1)' }}>
                  <span className="text-3xl">{item.emoji}</span>
                  {item.badge && (
                    <span className="absolute bottom-1.5 left-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-md"
                          style={{ background: 'rgba(0,122,188,0.12)', color: 'var(--cyan)', border: '1px solid rgba(0,122,188,0.3)' }}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-bold leading-tight" style={{ color: 'var(--t1)' }}>{item.name}</p>
                <p className="text-[9px]" style={{ color: 'var(--t3)' }}>{item.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-4 mb-5 rounded-2xl p-5 text-center border" style={{ background: 'var(--s1)', borderColor: 'var(--b1)' }}>
          <p className="text-[16px] font-black mb-2" style={{ color: 'var(--t1)' }}>Ready to find your slushie?</p>
          <p className="text-[11px] mb-4 leading-relaxed" style={{ color: 'var(--t2)' }}>Available worldwide — Tokyo to Toronto, London to Los Angeles.</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => router.push('/add')}
              className="btn-grad h-9 px-5 rounded-full text-[11px] font-black tracking-wide">ADD A SPOT</button>
            <button onClick={() => quickSearch(43.6, -79.4, 'Toronto', 'CA')}
              className="h-9 px-5 rounded-full text-[11px] font-semibold border hover:opacity-80 transition-opacity"
              style={{ background: 'none', borderColor: 'var(--b2)', color: 'var(--t2)' }}>FIND A SPOT</button>
          </div>
        </section>

        {/* COUNTRY QUICK SEARCH */}
        <section className="px-4 pb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--t3)' }}>Search by country</p>
          <div className="flex flex-wrap gap-2">
            {[
              { f:'🇨🇦', n:'Canada',        lat:43.6,  lng:-79.4,   cc:'CA' },
              { f:'🇺🇸', n:'United States', lat:40.7,  lng:-74.0,   cc:'US' },
              { f:'🇬🇧', n:'United Kingdom',lat:51.5,  lng:-0.1,    cc:'GB' },
              { f:'🇯🇵', n:'Japan',         lat:35.6,  lng:139.7,   cc:'JP' },
              { f:'🇦🇺', n:'Australia',     lat:-33.8, lng:151.2,   cc:'AU' },
              { f:'🇩🇪', n:'Germany',       lat:52.5,  lng:13.4,    cc:'DE' },
              { f:'🇫🇷', n:'France',        lat:48.8,  lng:2.3,     cc:'FR' },
              { f:'🌍', n:'Everywhere',     lat:0,     lng:0,       cc:'' },
            ].map(c => (
              <button key={c.n} onClick={() => c.lat !== 0 && quickSearch(c.lat, c.lng, c.n, c.cc)}
                className="text-[11px] px-3 py-1.5 rounded-full border hover:opacity-80 transition-opacity"
                style={{ background: 'var(--s1)', borderColor: 'var(--b1)', color: 'var(--t2)' }}>
                {c.f} {c.n}
              </button>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t px-4 py-6" style={{ borderColor: 'var(--b1)' }}>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Image src="/logo.png" alt="" width={20} height={20} className="rounded" />
                <span className="text-[12px] font-black" style={{ color: 'var(--cyan)' }}>SLUSH FINDER</span>
              </div>
              <p className="text-[10px] leading-relaxed" style={{ color: 'var(--t3)' }}>
                Redefining the frozen experience through technology and taste. Built for the bold, the cold, and the curious.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--t3)' }}>Discovery</p>
                {['Trending Now','Flavor Profiles','Mixer Lab','Station Finder'].map(l => (
                  <p key={l} className="text-[10px] mb-1.5 cursor-pointer hover:opacity-80" style={{ color: 'var(--t2)' }}>{l}</p>
                ))}
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--t3)' }}>Company</p>
                {['Our Origin','Sustainability','Careers','Contact'].map(l => (
                  <p key={l} className="text-[10px] mb-1.5 cursor-pointer hover:opacity-80" style={{ color: 'var(--t2)' }}>{l}</p>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: 'var(--b1)' }}>
            <p className="text-[9px]" style={{ color: 'var(--t3)' }}>© 2024 Slush Finder Co. All rights reserved.</p>
            <div className="flex gap-4">
              {['Privacy','Terms','Accessibility'].map(l => (
                <a key={l} href="#" className="text-[9px] hover:opacity-80" style={{ color: 'var(--t3)' }}>{l}</a>
              ))}
            </div>
          </div>
        </footer>
      </div>

      {/* BOTTOM NAV */}
      <nav className="botnav-glass sticky bottom-0 z-20 border-t flex" style={{ background: 'var(--s1)', borderColor: 'var(--b1)' }}>
        {[
          { label:'Home', icon:'⌂', href:'/' },
          { label:'Flavors', icon:'🧊', href:'/search' },
          { label:'Locations', icon:'📍', href:'/search' },
          { label:'Profile', icon:'👤', href:'/profile' },
        ].map(n => (
          <a key={n.label} href={n.href}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 no-underline"
            style={{ color: n.label === 'Home' ? 'var(--cyan)' : 'var(--t3)', textDecoration: 'none' }}>
            <span className="text-[18px] leading-none">{n.icon}</span>
            <span className="text-[8px] font-bold tracking-widest uppercase">{n.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
