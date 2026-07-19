import { NextRequest, NextResponse } from 'next/server'
import { adminDb, isAdminRequest } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { submission_id } = await req.json()
  if (!submission_id) return NextResponse.json({ error: 'submission_id required' }, { status: 400 })
  const db = adminDb()
  const { data: sub } = await db.from('location_submissions').select('*').eq('id', submission_id).single()
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  let confidence = 0; let matched_name = null; let reason = 'Address not found on OpenStreetMap'
  try {
    const q = encodeURIComponent(`${sub.address}, ${sub.city}, ${sub.country_name ?? sub.country_code}`)
    const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, { headers: { 'User-Agent': 'SlushFinder/1.0' }, signal: AbortSignal.timeout(8000) })
    const geoData = await geo.json()
    if (geoData?.length) {
      const lat = parseFloat(geoData[0].lat), lng = parseFloat(geoData[0].lon)
      const ovRes = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: `data=${encodeURIComponent(`[out:json];(node["name"](around:100,${lat},${lng}););out tags;`)}`, headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'SlushFinder/1.0' }, signal: AbortSignal.timeout(10000) })
      const ovData = await ovRes.json()
      confidence = 10
      for (const el of ovData.elements ?? []) {
        if (!el.tags?.name) continue
        let s = 10
        if (el.tags.name.toLowerCase().includes(sub.brand.toLowerCase())) s += 50
        if (['convenience','fuel'].includes(el.tags.amenity ?? '')) s += 20
        if (s > confidence) { confidence = s; matched_name = el.tags.name }
      }
      reason = confidence >= 60 ? `Matched "${matched_name}" via OpenStreetMap` : 'Location found but brand not confirmed'
      await db.from('location_submissions').update({ verified_by_osm: confidence >= 60, osm_confidence: Math.min(confidence,100), osm_matched_name: matched_name, verification_reason: reason, latitude: lat, longitude: lng, review_status: confidence >= 60 ? 'approved' : 'pending', reviewed_at: new Date().toISOString() }).eq('id', submission_id)
      if (confidence >= 60) {
        const { data: ex } = await db.from('locations').select('id').eq('name', sub.name).eq('city', sub.city).single()
        if (!ex) await db.from('locations').insert({ name: sub.name, address: sub.address ?? '', city: sub.city, region: sub.region ?? '', postal_code: sub.postal_code ?? '', country_code: sub.country_code, country_name: sub.country_name ?? sub.country_code, latitude: lat, longitude: lng, timezone: sub.timezone ?? 'UTC', brand: sub.brand, flavours: sub.flavours, notes: sub.notes, machine_status: 'operational', checkin_count: 0, slush_tier: 'new', last_verified_at: new Date().toISOString(), hours: '{}' })
      }
    }
  } catch (e) { reason = 'OSM service unavailable' }
  return NextResponse.json({ verified: confidence >= 60, confidence: Math.min(confidence,100), matched_name, reason })
}
