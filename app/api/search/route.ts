import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isLocationOpen, getTodaysHoursDisplay } from '@/lib/hours'
import { LocationWithDistance, Brand } from '@/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const lat       = parseFloat(searchParams.get('lat') ?? '')
  const lng       = parseFloat(searchParams.get('lng') ?? '')
  const radius_km = parseFloat(searchParams.get('radius') ?? '10')
  const brand     = searchParams.get('brand') as Brand | null
  const open_now  = searchParams.get('open_now') === 'true'
  const country   = searchParams.get('country') ?? null  // optional ISO code filter

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 })
  }

  const db = supabaseAdmin()

  let query = db.rpc('search_locations', {
    search_lat: lat,
    search_lng: lng,
    radius_meters: radius_km * 1000,
  })

  if (brand)   query = query.eq('brand', brand)
  if (country) query = query.eq('country_code', country.toUpperCase())

  const { data, error } = await query

  if (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }

  let locations: LocationWithDistance[] = (data ?? []).map((loc: any) => ({
    ...loc,
    distance_km: Math.round(loc.distance_meters / 100) / 10,
    is_open: isLocationOpen(loc.hours, loc.timezone),
    todays_hours: getTodaysHoursDisplay(loc.hours, loc.timezone),
  }))

  if (open_now) locations = locations.filter(l => l.is_open)

  return NextResponse.json({
    locations,
    total: locations.length,
    search_center: { lat, lng },
    radius_km,
  })
}
