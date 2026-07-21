import { NextRequest, NextResponse } from 'next/server'
import { geocodeQuery } from '@/lib/geocode'
import { adminDb, isAdminRequest } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tab = req.nextUrl.searchParams.get('tab') ?? 'submissions'
  const search = req.nextUrl.searchParams.get('q') ?? ''
  const status = req.nextUrl.searchParams.get('status') ?? 'all'
  const db = adminDb()
  if (tab === 'live') {
    let q = db.from('locations').select('*').order('created_at', { ascending: false })
    if (search) q = q.ilike('name', `%${search}%`)
    const { data, error } = await q.limit(100)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ locations: data ?? [] })
  }
  let q = db.from('location_submissions').select('*').order('created_at', { ascending: false })
  if (search) q = q.ilike('name', `%${search}%`)
  if (status !== 'all') q = q.eq('review_status', status)
  const { data, error } = await q.limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ submissions: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, status } = await req.json()
  if (!id || !['approved','rejected','pending'].includes(status)) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  const db = adminDb()
  await db.from('location_submissions').update({ review_status: status, reviewed_at: new Date().toISOString() }).eq('id', id)
  if (status === 'approved') {
    const { data: sub } = await db.from('location_submissions').select('*').eq('id', id).single()
    if (sub?.latitude && sub?.longitude) {
      const { data: existing } = await db.from('locations').select('id').eq('name', sub.name).eq('city', sub.city).single()
      if (!existing) {
        await db.from('locations').insert({ name: sub.name, address: sub.address ?? '', city: sub.city, region: sub.region ?? '', postal_code: sub.postal_code ?? '', country_code: sub.country_code, country_name: sub.country_name ?? sub.country_code, latitude: sub.latitude, longitude: sub.longitude, timezone: sub.timezone ?? 'UTC', brand: sub.brand, flavours: sub.flavours ?? null, notes: sub.notes ?? null, machine_status: 'operational', checkin_count: 0, slush_tier: 'new', last_verified_at: new Date().toISOString(), hours: '{}' })
      }
    }
  }
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  const table = req.nextUrl.searchParams.get('table') ?? 'location_submissions'
  const soft = req.nextUrl.searchParams.get('soft') === 'true'
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  const db = adminDb()
  if (soft) {
    await db.from('locations').update({ machine_status: 'removed' }).eq('id', id)
    return NextResponse.json({ success: true, action: 'hidden' })
  }
  await db.from(table as any).delete().eq('id', id)
  return NextResponse.json({ success: true, action: 'deleted' })
}


// Edit a live location's fields; re-geocode if the address/city/region changed
export async function PUT(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { id, name, brand, address, city, region, country_code, country_name,
          flavours, hours_note, machine_status, latitude, longitude, regeocode } = body
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  const db = adminDb()

  const updates: Record<string, unknown> = {}
  if (typeof name === 'string') updates.name = name.trim().slice(0, 120)
  if (typeof brand === 'string') updates.brand = brand.trim().slice(0, 60)
  if (typeof address === 'string') updates.address = address.trim().slice(0, 200)
  if (typeof city === 'string') updates.city = city.trim().slice(0, 80)
  if (typeof region === 'string') updates.region = region.trim().slice(0, 80)
  if (typeof flavours === 'string') updates.flavours = flavours.trim().slice(0, 300)
  if (typeof hours_note === 'string') updates.hours_note = hours_note.trim().slice(0, 200) || null
  if (typeof machine_status === 'string') updates.machine_status = machine_status

  // Coordinates: manual override wins; otherwise re-geocode if asked
  if (latitude !== undefined && latitude !== null && latitude !== '') {
    updates.latitude = parseFloat(latitude)
    updates.longitude = parseFloat(longitude)
  } else if (regeocode && address) {
    const cc = country_name ?? country_code ?? ''
    const reg = region ? `${region} ` : ''
    const geo = await geocodeQuery(`${address}, ${city}, ${reg}${cc}`, country_code?.toLowerCase())
    if (geo) { updates.latitude = geo.lat; updates.longitude = geo.lng }
  }

  const { error } = await db.from('locations').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, updates })
}
