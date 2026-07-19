export interface GeocodedLocation {
  lat: number
  lng: number
  displayName?: string
  city?: string
  country?: string
  countryCode?: string
  timezone?: string
}

export async function geocodeQuery(query: string, bias?: string): Promise<GeocodedLocation | null> {
  try {
    const countryParam = bias ? `&countrycodes=${bias.toLowerCase()}` : ''
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1${countryParam}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SlushySearch/1.0 (contact@slushysearch.com)' },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.length) return null
    const r = data[0]
    const addr = r.address ?? {}
    const countryCode = addr.country_code?.toUpperCase()
    return {
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      displayName: r.display_name,
      city: addr.city ?? addr.town ?? addr.village ?? addr.county ?? '',
      country: addr.country ?? '',
      countryCode,
      timezone: countryTimezone(countryCode),
    }
  } catch {
    return null
  }
}

function countryTimezone(cc?: string): string {
  const map: Record<string, string> = {
    CA: 'America/Toronto', US: 'America/New_York', GB: 'Europe/London',
    AU: 'Australia/Sydney', JP: 'Asia/Tokyo', KR: 'Asia/Seoul',
    DE: 'Europe/Berlin', FR: 'Europe/Paris', IT: 'Europe/Rome',
    ES: 'Europe/Madrid', NL: 'Europe/Amsterdam', BR: 'America/Sao_Paulo',
    MX: 'America/Mexico_City', NZ: 'Pacific/Auckland', SG: 'Asia/Singapore',
    HK: 'Asia/Hong_Kong', IN: 'Asia/Kolkata', AE: 'Asia/Dubai',
    ZA: 'Africa/Johannesburg', PH: 'Asia/Manila', TH: 'Asia/Bangkok',
    MY: 'Asia/Kuala_Lumpur', ID: 'Asia/Jakarta',
  }
  return cc ? (map[cc] ?? 'UTC') : 'UTC'
}
