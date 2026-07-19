import { NextRequest, NextResponse } from 'next/server'
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
