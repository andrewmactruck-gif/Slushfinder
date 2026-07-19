import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { location_id, user_id, machine_condition, flavours_available, note } = body
  if (!location_id) {
    return NextResponse.json({ error: 'Missing location' }, { status: 400 })
  }

  const db = supabaseAdmin()

  const { data: loc } = await db.from('locations').select('id, checkin_count').eq('id', location_id).single()
  if (!loc) return NextResponse.json({ error: 'Location not found' }, { status: 404 })

  const cleanFlavours = typeof flavours_available === 'string' && flavours_available.trim()
    ? flavours_available.trim().slice(0, 300) : null

  // 1. Save the check-in
  const { error: ciErr } = await db.from('checkins').insert({
    location_id,
    user_id: user_id || null,
    machine_condition: machine_condition || null,
    flavours_available: cleanFlavours,
    note: typeof note === 'string' && note.trim() ? note.trim().slice(0, 500) : null,
  })
  if (ciErr) {
    console.error('CHECKIN INSERT FAILED:', JSON.stringify(ciErr))
    return NextResponse.json({ error: 'Could not save check-in' }, { status: 500 })
  }

  // 2. Update the location: latest flavours win, bump count + timestamp, reflect machine status
  const updates: Record<string, unknown> = {
    checkin_count: (loc.checkin_count || 0) + 1,
    last_checkin_at: new Date().toISOString(),
  }
  if (cleanFlavours) updates.flavours = cleanFlavours
  if (machine_condition === 'working') updates.machine_status = 'operational'
  else if (machine_condition === 'not_working') updates.machine_status = 'issue_reported'

  await db.from('locations').update(updates).eq('id', location_id)

  return NextResponse.json({ success: true })
}
