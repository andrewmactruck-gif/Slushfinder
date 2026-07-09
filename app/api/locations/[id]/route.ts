import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isLocationOpen, getTodaysHoursDisplay } from '@/lib/hours'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { data, error } = await supabaseAdmin()
    .from('locations')
    .select('*')
    .eq('id', id)
    .neq('machine_status', 'removed')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Location not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...data,
    is_open: isLocationOpen(data.hours, data.timezone),
    todays_hours: getTodaysHoursDisplay(data.hours, data.timezone),
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { report_type, notes } = body

  const { error } = await supabaseAdmin()
    .from('machine_reports')
    .insert({ location_id: id, report_type, notes })

  if (error) {
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }

  const { count } = await supabaseAdmin()
    .from('machine_reports')
    .select('*', { count: 'exact', head: true })
    .eq('location_id', id)
    .eq('resolved', false)

  if ((count ?? 0) >= 3) {
    await supabaseAdmin()
      .from('locations')
      .update({ machine_status: 'issue_reported', updated_at: new Date().toISOString() })
      .eq('id', id)
  }

  return NextResponse.json({ success: true })
}
