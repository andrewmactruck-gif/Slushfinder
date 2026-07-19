'use client'
import { Brand } from '@/types'

const COUNTRY_BRANDS: Record<string, Array<Brand | 'all'>> = {
  CA: ['all', '7-Eleven', 'Circle K', 'Couche-Tard', 'ICEE', 'Slush Puppie', 'Other'],
  US: ['all', '7-Eleven', 'ICEE', 'Slush Puppie', 'Frosty', 'Other'],
  GB: ['all', 'Slush Puppie', 'ICEE', 'Other'],
  AU: ['all', '7-Eleven', 'Slush Puppie', 'Other'],
  NZ: ['all', 'Slush Puppie', 'Other'],
  JP: ['all', 'Slurpee Japan', 'Other'],
  KR: ['all', '7-Eleven', 'Other'],
  DE: ['all', 'Circle K', 'Slush Puppie', 'Other'],
  FR: ['all', '7-Eleven', 'Slush Puppie', 'Other'],
  SE: ['all', '7-Eleven', 'Circle K', 'Other'],
  NO: ['all', '7-Eleven', 'Circle K', 'Other'],
  DK: ['all', '7-Eleven', 'Circle K', 'Other'],
  DEFAULT: ['all', '7-Eleven', 'Circle K', 'ICEE', 'Slush Puppie', 'Frosty', 'Other'],
}

const LABELS: Record<string, string> = {
  'all':          'All brands',
  '7-Eleven':     '🥤 Slurpee',
  'Circle K':     '🧊 Froster',
  'Couche-Tard':  '❄️ Sloche',
  'ICEE':         '🌀 ICEE',
  'Slush Puppie': '🐶 Slush Puppie',
  'Slurpee Japan':'🗾 スラーピー',
  'Frosty':       '🥶 Frosty',
  'Other':        '🧃 Other',
}

interface Props {
  active: Brand | 'all'
  onChange: (brand: Brand | 'all') => void
  country?: string
}

export default function BrandFilter({ active, onChange, country }: Props) {
  const cc = country?.toUpperCase() ?? ''
  const allowed = COUNTRY_BRANDS[cc] ?? COUNTRY_BRANDS.DEFAULT

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar px-4">
      {allowed.map(brand => (
        <button key={brand} onClick={() => onChange(brand)}
          className={`shrink-0 h-7 px-3 rounded-full text-[11px] font-semibold border transition-colors ${
            active === brand
              ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white border-transparent'
              : 'bg-[#1e2229] text-slate-400 border-[#1e2840] hover:border-cyan-500/30 hover:text-cyan-400'
          }`}>
          {LABELS[brand] ?? brand}
        </button>
      ))}
    </div>
  )
}
