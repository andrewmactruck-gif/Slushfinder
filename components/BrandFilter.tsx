'use client'
import { Brand } from '@/types'

const FILTERS: Array<{ brand: Brand | 'all'; label: string }> = [
  { brand: 'all',          label: 'All brands' },
  { brand: '7-Eleven',     label: '🥤 Slurpee' },
  { brand: 'Circle K',     label: '🧊 Froster' },
  { brand: 'Couche-Tard',  label: '❄️ Sloche' },
  { brand: 'ICEE',         label: '🌀 ICEE' },
  { brand: 'Slush Puppie', label: '🐶 Slush Puppie' },
  { brand: 'Slurpee Japan',label: '🗾 スラーピー' },
  { brand: 'Frosty',       label: '🥶 Frosty' },
  { brand: 'Other',        label: '🧃 Other' },
]

interface Props {
  active: Brand | 'all'
  onChange: (brand: Brand | 'all') => void
}

export default function BrandFilter({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar px-4">
      {FILTERS.map(f => (
        <button key={f.brand} onClick={() => onChange(f.brand)}
          className={`shrink-0 h-7 px-3 rounded-full text-[11px] font-semibold border transition-colors ${
            active === f.brand
              ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white border-transparent'
              : 'bg-[#1e2229] text-slate-400 border-[#1e2840] hover:border-cyan-500/30 hover:text-cyan-400'
          }`}>
          {f.label}
        </button>
      ))}
    </div>
  )
}
