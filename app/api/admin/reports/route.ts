import { NextRequest, NextResponse } from 'next/server'
import { adminDb, isAdminRequest } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const status = req.nextUrl.searchParams.get('status') ?? 'open'
  const db = adminDb()

  let q = db
    .from('machine_reports')
    .select('id,location_id,report_type,notes,resolved,resolved_at,created_at,locations(name,city,region,brand,machine_status)')
    .order('created_at', { ascending: false })

  if (status === 'open') q = q.eq('resolved', false)
  else if (status === 'resolved') q = q.eq('resolved', true)

  const { data, error } = await q.limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reports: data ?? [] })
}

// Mark a report resolved / reopen it, and optionally set the location's public status
export async function PATCH(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, resolved, location_id, machine_status } = await req.json()
  const db = adminDb()

  if (id !== undefined) {
    if (typeof resolved !== 'boolean') return NextResponse.json({ error: 'Invalid' }, { status: 400 })
    const { error } = await db
      .from('machine_reports')
      .update({ resolved, resolved_at: resolved ? new Date().toISOString() : null })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (location_id && machine_status) {
    if (!['operational', 'issue_reported', 'removed'].includes(machine_status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    const { error } = await db.from('locations').update({ machine_status }).eq('id', location_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
