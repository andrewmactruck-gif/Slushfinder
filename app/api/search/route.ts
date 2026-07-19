import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isLocationOpen, getTodaysHoursDisplay } from '@/lib/hours'
import { LocationWithDistance, Brand } from '@/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat       = parseFloat(searchParams.get('lat') ?? '')
  const lng       = parseFloat(searchParams.get('lng') ?? '')
  const radius_km = parseFloat(searchParams.get('radius') ?? '50')
  const brand     = searchParams.get('brand') as Brand | null
  const open_now  = searchParams.get('open_now') === 'true'
  const country   = searchParams.get('country') ?? null

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 })
  }

  const db = supabaseAdmin()

  // Pass radius as float to match function signature
  const radius_meters: number = radius_km * 1000.0

  const { data: rpcData, error: rpcError } = await db.rpc('search_locations', {
    search_lat: lat,
    search_lng: lng,
    radius_meters: radius_meters,
  })

  let locations: LocationWithDistance[] = []

  if (!rpcError && rpcData) {
    locations = rpcData.map((loc: any) => ({
      ...loc,
      distance_km: Math.round((loc.distance_meters ?? 0) / 100) / 10,
      is_open: isLocationOpen(loc.hours, loc.timezone),
      todays_hours: getTodaysHoursDisplay(loc.hours, loc.timezone),
    }))
  } else {
    // Haversine fallback
    console.log('RPC fallback:', rpcError?.message)
    const { data: rawData, error: rawError } = await db
      .from('locations')
      .select('*')
      .neq('machine_status', 'removed')
      .limit(500)

    if (rawError) {
      return NextResponse.json({ error: 'Search failed: ' + rawError.message }, { status: 500 })
    }

    const R = 6371
    locations = (rawData ?? []).map((loc: any) => {
      const dLat = (loc.latitude - lat) * Math.PI / 180
      const dLng = (loc.longitude - lng) * Math.PI / 180
      const a = Math.sin(dLat/2)**2 + Math.cos(lat*Math.PI/180) * Math.cos(loc.latitude*Math.PI/180) * Math.sin(dLng/2)**2
      const distance_km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      return {
        ...loc,
        distance_km: Math.round(distance_km * 10) / 10,
        distance_meters: distance_km * 1000,
        is_open: isLocationOpen(loc.hours, loc.timezone),
        todays_hours: getTodaysHoursDisplay(loc.hours, loc.timezone),
      }
    })
    .filter((loc: any) => loc.distance_km <= radius_km)
    .sort((a: any, b: any) => a.distance_km - b.distance_km)
  }

  if (brand) locations = locations.filter((l: any) => l.brand === brand)
  if (country) locations = locations.filter((l: any) => l.country_code === country.toUpperCase())
  if (open_now) locations = locations.filter((l: any) => l.is_open)

  return NextResponse.json({ locations, total: locations.length, search_center: { lat, lng }, radius_km })
}
