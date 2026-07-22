import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const CHECKIN_PTS = 1
const ADD_PTS = 5

export async function GET() {
  const db = supabaseAdmin()

  const [{ data: checkins }, { data: locations }, { data: profiles }] = await Promise.all([
    db.from('checkins').select('user_id').not('user_id', 'is', null),
    db.from('locations').select('added_by').not('added_by', 'is', null),
    db.from('profiles').select('id, username, avatar_url, emoji'),
  ])

  const tally: Record<string, { checkins: number; adds: number }> = {}
  for (const c of checkins || []) {
    const u = (c as any).user_id
    if (!u) continue
    tally[u] = tally[u] || { checkins: 0, adds: 0 }
    tally[u].checkins++
  }
  for (const l of locations || []) {
    const u = (l as any).added_by
    if (!u) continue
    tally[u] = tally[u] || { checkins: 0, adds: 0 }
    tally[u].adds++
  }

  const profMap: Record<string, any> = {}
  for (const p of profiles || []) profMap[(p as any).id] = p

  const rows = Object.entries(tally).map(([userId, t]) => {
    const points = t.checkins * CHECKIN_PTS + t.adds * ADD_PTS
    const prof = profMap[userId] || {}
    return {
      user_id: userId,
      username: prof.username || 'Anonymous',
      avatar_url: prof.avatar_url || null,
      emoji: prof.emoji || '🧊',
      checkins: t.checkins,
      adds: t.adds,
      points,
    }
  }).sort((a, b) => b.points - a.points)

  rows.forEach((r, i) => { (r as any).rank = i + 1 })

  return NextResponse.json({ leaderboard: rows })
}
