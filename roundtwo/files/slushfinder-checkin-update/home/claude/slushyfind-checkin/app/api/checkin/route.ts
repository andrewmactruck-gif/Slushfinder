import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// ─── Super Slush Rating Tiers ─────────────────────────────────────────────────
export function getSlushRating(checkins: number): {
  tier: string
  label: string
  emoji: string
  color: string
  percent: number
} {
  const pct = Math.min(Math.round((checkins / 100) * 100), 100)
  if (checkins >= 100) return { tier: 'super',    label: 'Super Slush',     emoji: '⚡', color: '#00e5ff', percent: 100 }
  if (checkins >= 75)  return { tier: 'elite',    label: 'Elite Freeze',    emoji: '🧊', color: '#9c27ff', percent: pct }
  if (checkins >= 50)  return { tier: 'verified', label: 'Verified Chill',  emoji: '✅', color: '#00ee98', percent: pct }
  if (checkins >= 25)  return { tier: 'rising',   label: 'Rising Cold',     emoji: '📈', color: '#ffb400', percent: pct }
  if (checkins >= 10)  return { tier: 'fresh',    label: 'Fresh Spot',      emoji: '🌊', color: '#849396', percent: pct }
  return                        { tier: 'new',     label: 'New Location',    emoji: '🆕', color: '#3b494c', percent: pct }
}

// ─── POST /api/checkin ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { location_id, user_id, machine_condition, flavours_available } = body

  if (!location_id) return NextResponse.json({ error: 'location_id required' }, { status: 400 })

  const db = supabaseAdmin()

  // Prevent duplicate check-ins within 4 hours from same user/IP
  if (user_id) {
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    const { data: existing } = await db
      .from('checkins')
      .select('id')
      .eq('location_id', location_id)
      .eq('user_id', user_id)
      .gte('created_at', fourHoursAgo)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already checked in recently — come back in 4 hours!' }, { status: 429 })
    }
  }

  // Insert the check-in record
  await db.from('checkins').insert({
    location_id,
    user_id: user_id ?? null,
    machine_condition: machine_condition ?? null,
    flavours_available: flavours_available ?? null,
  })

  // Increment counter on the location (capped at 100)
  const { data: loc } = await db
    .from('locations')
    .select('checkin_count')
    .eq('id', location_id)
    .single()

  const currentCount = loc?.checkin_count ?? 0
  const newCount = Math.min(currentCount + 1, 100)
  const rating = getSlushRating(newCount)

  await db.from('locations').update({
    checkin_count: newCount,
    slush_rating: rating.percent,
    slush_tier: rating.tier,
    last_checkin_at: new Date().toISOString(),
    // Also update machine condition if provided
    ...(machine_condition ? { machine_status: machine_condition } : {}),
  }).eq('id', location_id)

  return NextResponse.json({
    success: true,
    checkin_count: newCount,
    rating,
    message: newCount >= 100
      ? '⚡ This location just hit Super Slush status!'
      : `Check-in recorded! ${100 - newCount} more check-ins to reach Super Slush status.`,
  })
}

// ─── GET /api/checkin?location_id=xxx ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('location_id')
  if (!id) return NextResponse.json({ error: 'location_id required' }, { status: 400 })

  const db = supabaseAdmin()
  const { data: loc } = await db
    .from('locations')
    .select('checkin_count, slush_tier, last_checkin_at')
    .eq('id', id)
    .single()

  if (!loc) return NextResponse.json({ error: 'Location not found' }, { status: 404 })

  const rating = getSlushRating(loc.checkin_count ?? 0)

  return NextResponse.json({
    checkin_count: loc.checkin_count ?? 0,
    rating,
    last_checkin_at: loc.last_checkin_at,
  })
}
