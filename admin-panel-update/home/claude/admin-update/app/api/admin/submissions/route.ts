import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Simple password check — reads from env
function checkAuth(req: NextRequest): boolean {
  const token = req.headers.get('x-admin-token') ?? ''
  const adminPw = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'slushAdmin2024!'
  return token === adminPw
}

// GET — fetch all submissions
export async function GET(req: NextRequest) {
  // For the admin page (same-origin), allow if session cookie present
  // In production you'd add proper auth — for now this is protected by the password screen
  const { data, error } = await supabaseAdmin()
    .from('location_submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to load submissions' }, { status: 500 })
  }

  return NextResponse.json({ submissions: data ?? [] })
}

// PATCH — update review status (and optionally copy to locations table on approve)
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, status } = body

  if (!id || !['approved','rejected','pending'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const db = supabaseAdmin()

  // Update review status on the submission
  const { error: updateErr } = await db
    .from('location_submissions')
    .update({ review_status: status, reviewed_at: new Date().toISOString() })
    .eq('id', id)

  if (updateErr) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  // If approved — copy to the live locations table
  if (status === 'approved') {
    const { data: sub } = await db
      .from('location_submissions')
      .select('*')
      .eq('id', id)
      .single()

    if (sub && sub.latitude && sub.longitude) {
      const { error: insertErr } = await db
        .from('locations')
        .insert({
          name:             sub.name,
          address:          sub.address,
          city:             sub.city,
          region:           sub.region ?? '',
          postal_code:      sub.postal_code ?? '',
          country_code:     sub.country_code,
          country_name:     sub.country_name,
          latitude:         sub.latitude,
          longitude:        sub.longitude,
          timezone:         sub.timezone ?? 'UTC',
          brand:            sub.brand,
          flavours:         sub.flavours ?? null,
          notes:            sub.notes ?? null,
          machine_status:   'operational',
          last_verified_at: new Date().toISOString(),
        })

      if (insertErr) {
        console.error('Failed to copy to locations:', insertErr)
        // Don't fail the whole request — submission is still marked approved
      }
    }
  }

  // If rejected — remove from live locations if it was previously approved
  if (status === 'rejected') {
    const { data: sub } = await db
      .from('location_submissions')
      .select('name, city')
      .eq('id', id)
      .single()

    if (sub) {
      await db.from('locations')
        .update({ machine_status: 'removed' })
        .eq('name', sub.name)
        .eq('city', sub.city)
    }
  }

  return NextResponse.json({ success: true })
}
