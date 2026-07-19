import { NextRequest, NextResponse } from 'next/server'
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '8.8.8.8'
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, { headers: { 'User-Agent': 'SlushFinder/1.0' }, signal: AbortSignal.timeout(4000) })
    if (!res.ok) throw new Error('failed')
    const d = await res.json()
    return NextResponse.json({ country_code: d.country_code ?? 'CA', country_name: d.country_name ?? 'Canada', city: d.city ?? '', latitude: d.latitude ?? 43.6, longitude: d.longitude ?? -79.4 })
  } catch {
    return NextResponse.json({ country_code: 'CA', country_name: 'Canada', city: 'Toronto', latitude: 43.6, longitude: -79.4 })
  }
}
