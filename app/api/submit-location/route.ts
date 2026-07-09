import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { geocodeQuery } from '@/lib/geocode'
import { SubmitLocationPayload } from '@/types'

export async function POST(req: NextRequest) {
  const body: SubmitLocationPayload = await req.json()
  const { name, address, city, region, postal_code, country_code, country_name, brand, notes, flavours } = body

  if (!name || !address || !city || !country_code || !brand) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Geocode the full address for coordinates
  const searchQuery = `${address}, ${city}, ${country_name ?? country_code}`
  const geo = await geocodeQuery(postal_code || searchQuery)
  if (!geo) {
    return NextResponse.json({ error: 'Could not geocode address' }, { status: 422 })
  }

  const { error } = await supabaseAdmin()
    .from('location_submissions')
    .insert({
      name, address, city,
      region: region ?? '',
      postal_code: postal_code ?? '',
      country_code: country_code.toUpperCase(),
      country_name: country_name ?? country_code,
      latitude: geo.lat,
      longitude: geo.lng,
      timezone: geo.timezone ?? 'UTC',
      brand, notes, flavours,
      machine_status: 'operational',
      review_status: 'pending',
    })

  if (error) {
    console.error('Submission error:', error)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
