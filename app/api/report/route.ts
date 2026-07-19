import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const REPORT_TYPES = ['broken', 'gone', 'wrong_info', 'wrong_hours', 'other'] as const

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { location_id, report_type, notes } = body

  if (!location_id || !report_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!REPORT_TYPES.includes(report_type)) {
    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
  }

  const db = supabaseAdmin()

  // Location must exist — the FK would reject it anyway, but this gives a clearer error
  const { data: loc } = await db.from('locations').select('id').eq('id', location_id).single()
  if (!loc) return NextResponse.json({ error: 'Location not found' }, { status: 404 })

  const { error } = await db.from('machine_reports').insert({
    location_id,
    report_type,
    notes: typeof notes === 'string' && notes.trim() ? notes.trim().slice(0, 500) : null,
  })

  if (error) {
    console.error('REPORT INSERT FAILED:', JSON.stringify(error))
    return NextResponse.json({ error: 'Could not save report' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
