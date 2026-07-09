export interface GeocodedLocation {
  lat: number
  lng: number
  displayName?: string
  city?: string
  country?: string
  countryCode?: string
  timezone?: string
}

/**
 * Geocode any postal code, ZIP code, or city name worldwide using Nominatim.
 * Free, no API key required. Rate-limit: max 1 req/sec.
 */
export async function geocodeQuery(query: string): Promise<GeocodedLocation | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`
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

/** Reverse geocode lat/lng to country code */
export async function reverseGeocode(lat: number, lng: number): Promise<{ countryCode?: string; city?: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SlushySearch/1.0 (contact@slushysearch.com)' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const addr = data.address ?? {}
    return {
      countryCode: addr.country_code?.toUpperCase(),
      city: addr.city ?? addr.town ?? addr.village ?? '',
    }
  } catch {
    return null
  }
}

/** Haversine distance in km */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Best-guess IANA timezone from country code */
function countryTimezone(cc?: string): string {
  const map: Record<string, string> = {
    CA: 'America/Toronto', US: 'America/New_York', GB: 'Europe/London',
    AU: 'Australia/Sydney', NZ: 'Pacific/Auckland', JP: 'Asia/Tokyo',
    KR: 'Asia/Seoul', CN: 'Asia/Shanghai', IN: 'Asia/Kolkata',
    SG: 'Asia/Singapore', HK: 'Asia/Hong_Kong', TW: 'Asia/Taipei',
    DE: 'Europe/Berlin', FR: 'Europe/Paris', IT: 'Europe/Rome',
    ES: 'Europe/Madrid', NL: 'Europe/Amsterdam', BE: 'Europe/Brussels',
    SE: 'Europe/Stockholm', NO: 'Europe/Oslo', DK: 'Europe/Copenhagen',
    FI: 'Europe/Helsinki', PL: 'Europe/Warsaw', CZ: 'Europe/Prague',
    AT: 'Europe/Vienna', CH: 'Europe/Zurich', PT: 'Europe/Lisbon',
    IE: 'Europe/Dublin', MX: 'America/Mexico_City', BR: 'America/Sao_Paulo',
    AR: 'America/Argentina/Buenos_Aires', CL: 'America/Santiago',
    CO: 'America/Bogota', PE: 'America/Lima', ZA: 'Africa/Johannesburg',
    EG: 'Africa/Cairo', NG: 'Africa/Lagos', KE: 'Africa/Nairobi',
    AE: 'Asia/Dubai', SA: 'Asia/Riyadh', IL: 'Asia/Jerusalem',
    TR: 'Europe/Istanbul', RU: 'Europe/Moscow', UA: 'Europe/Kiev',
    PH: 'Asia/Manila', TH: 'Asia/Bangkok', VN: 'Asia/Ho_Chi_Minh',
    ID: 'Asia/Jakarta', MY: 'Asia/Kuala_Lumpur',
  }
  return map[cc ?? ''] ?? 'UTC'
}
