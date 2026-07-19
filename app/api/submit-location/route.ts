import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { geocodeQuery } from '@/lib/geocode'
import { SubmitLocationPayload } from '@/types'

export async function POST(req: NextRequest) {
  const body: SubmitLocationPayload = await req.json()
  const { name, address, city, region, postal_code, country_code, country_name, brand, notes, flavours } = body

  if (!name || !city || !country_code || !brand) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const db = supabaseAdmin()
  const bias = country_code?.toLowerCase()

  // Try multiple geocoding strategies
  let geo = null
  if (postal_code) geo = await geocodeQuery(`${postal_code} ${country_name ?? country_code}`, bias)
  if (!geo && address) geo = await geocodeQuery(`${address} ${city} ${country_name ?? country_code}`, bias)
  if (!geo) geo = await geocodeQuery(`${city} ${country_name ?? country_code}`, bias)

  const lat = geo?.lat ?? null
  const lng = geo?.lng ?? null

  // Always save to submissions
  await db.from('location_submissions').insert({
    name, address: address ?? '', city,
    region: region ?? '', postal_code: postal_code ?? '',
    country_code: country_code.toUpperCase(),
    country_name: country_name ?? country_code,
    latitude: lat, longitude: lng,
    timezone: geo?.timezone ?? 'UTC',
    brand, notes, flavours,
    machine_status: 'operational',
    review_status: 'approved',
    reviewed_at: new Date().toISOString(),
  })

  // Always insert to live locations table
  // If no coordinates, we still insert — admin can fix coords later
  const { error: locErr } = await db.from('locations').insert({
    name,
    address: address ?? '',
    city,
    region: region ?? '',
    postal_code: postal_code ?? '',
    country_code: country_code.toUpperCase(),
    country_name: country_name ?? country_code,
    latitude: lat,
    longitude: lng,
    timezone: geo?.timezone ?? 'UTC',
    brand,
    notes: notes ?? null,
    flavours: flavours ?? null,
    machine_status: 'operational',
    hours: '{}',
    checkin_count: 0,
    slush_tier: 'new',
    slush_rating: 0,
    is_verified: false,
    last_verified_at: new Date().toISOString(),
  })

  if (locErr) {
    console.error('LIVE INSERT FAILED:', JSON.stringify(locErr))
    return NextResponse.json({ success: true, warning: locErr.message })
  }

  return NextResponse.json({ success: true, message: 'Location is now live on the map!' })
}
