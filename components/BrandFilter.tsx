'use client'
import { Brand } from '@/types'

const COUNTRY_BRANDS: Record<string, Array<Brand | 'all'>> = {
  CA: ['all', '7-Eleven', 'Circle K', 'Couche-Tard', 'ICEE', 'Slush Puppie', 'Frazil', 'Other'],
  US: ['all', '7-Eleven', 'ICEE', 'Slush Puppie', 'Frazil', 'Frosty', 'Other'],
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
  'Frazil':       '🌊 Frazil',
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
    <div className="px-4">
      <select
        value={active}
        onChange={e => onChange(e.target.value as Brand | 'all')}
        style={{
          width: '100%',
          maxWidth: 260,
          height: 34,
          padding: '0 12px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'inherit',
          cursor: 'pointer',
          color: active === 'all' ? '#b9cacb' : '#fff',
          background: active === 'all' ? 'rgba(28,32,33,0.6)' : 'linear-gradient(90deg,#00b4cc,#9c27ff)',
          border: '1px solid ' + (active === 'all' ? 'rgba(255,255,255,0.12)' : 'transparent'),
          outline: 'none',
        }}
      >
        {allowed.map(brand => (
          <option key={brand} value={brand} style={{ color: '#111', background: '#fff' }}>
            {LABELS[brand] ?? brand}
          </option>
        ))}
      </select>
    </div>
  )
}
