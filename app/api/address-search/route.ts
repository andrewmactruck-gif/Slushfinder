import { NextRequest, NextResponse } from 'next/server'

// Address autocomplete via OpenStreetMap Nominatim.
// Returns a few candidate addresses with parsed parts + coordinates.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  const cc = req.nextUrl.searchParams.get('cc')?.toLowerCase() || ''
  if (!q || q.length < 4) return NextResponse.json({ results: [] })

  const ccParam = cc ? `&countrycodes=${cc}` : ''
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1${ccParam}`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SlushFinder/1.0 (contact@slushfinder.com)' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return NextResponse.json({ results: [] })
    const data = await res.json()
    const results = (data || []).map((r: any) => {
      const a = r.address || {}
      const houseAndStreet = [a.house_number, a.road].filter(Boolean).join(' ')
      return {
        label: r.display_name,
        address: houseAndStreet || a.road || '',
        city: a.city || a.town || a.village || a.hamlet || a.county || '',
        region: a.state || a.region || '',
        postal_code: a.postcode || '',
        country_code: (a.country_code || '').toUpperCase(),
        country_name: a.country || '',
        latitude: parseFloat(r.lat),
        longitude: parseFloat(r.lon),
      }
    })
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
