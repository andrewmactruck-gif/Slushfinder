import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────
interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  type: string
  category: string
  address: {
    amenity?: string
    shop?: string
    building?: string
    house_number?: string
    road?: string
    city?: string
    town?: string
    suburb?: string
    country_code?: string
    postcode?: string
  }
  namedetails?: { name?: string }
}

interface OverpassElement {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: {
    name?: string
    amenity?: string
    shop?: string
    brand?: string
    'brand:wikidata'?: string
    opening_hours?: string
    phone?: string
    website?: string
  }
}

// Known brand name variants for fuzzy matching
const BRAND_ALIASES: Record<string, string[]> = {
  '7-Eleven':    ['7-eleven','7 eleven','seven eleven','7-11'],
  'Circle K':    ['circle k','circlek','couche-tard'],
  'Couche-Tard': ['couche-tard','couche tard','circle k'],
  'ICEE':        ['icee'],
  'Slush Puppie':['slush puppie','slushie puppie','slush puppy'],
  'Frosty':      ['frosty','wendy\'s'],
}

function brandMatch(submittedBrand: string, osmName: string): boolean {
  const aliases = BRAND_ALIASES[submittedBrand] ?? [submittedBrand.toLowerCase()]
  const name = osmName.toLowerCase()
  return aliases.some(a => name.includes(a)) || name.includes(submittedBrand.toLowerCase())
}

// ─── Geocode the submitted address via Nominatim ─────────────────────────────
async function geocodeAddress(address: string, city: string, country: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const q = encodeURIComponent(`${address}, ${city}, ${country}`)
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=3&addressdetails=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SlushFinder/1.0 (contact@slushfinder.com)', 'Accept-Language': 'en' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null
  const data: NominatimResult[] = await res.json()
  if (!data.length) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), displayName: data[0].display_name }
}

// ─── Query Overpass for businesses near coordinates ───────────────────────────
async function findNearbyBusinesses(lat: number, lng: number, radiusMeters = 80): Promise<OverpassElement[]> {
  const query = `
    [out:json][timeout:10];
    (
      node["name"](around:${radiusMeters},${lat},${lng});
      node["amenity"](around:${radiusMeters},${lat},${lng});
      node["shop"](around:${radiusMeters},${lat},${lng});
      way["name"](around:${radiusMeters},${lat},${lng});
    );
    out center tags;
  `
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'SlushFinder/1.0' },
    body: 'data=' + encodeURIComponent(query),
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.elements ?? []
}

// ─── Score the verification result ───────────────────────────────────────────
function scoreVerification(elements: OverpassElement[], submittedName: string, submittedBrand: string): {
  score: number
  matchedName: string | null
  matchedType: string | null
  reason: string
} {
  if (!elements.length) return { score: 0, matchedName: null, matchedType: null, reason: 'No businesses found at this address via OpenStreetMap' }

  let bestScore = 0
  let matchedName: string | null = null
  let matchedType: string | null = null
  let reason = 'Address exists but no matching business found nearby'

  for (const el of elements) {
    if (!el.tags?.name) continue
    const name = el.tags.name
    let score = 10 // base: something exists here

    // Brand name match
    if (brandMatch(submittedBrand, name)) score += 50
    else if (name.toLowerCase().includes(submittedName.toLowerCase().split(' ')[0])) score += 25

    // Type match (convenience store / fuel station common for Slurpee brands)
    const type = el.tags.amenity ?? el.tags.shop ?? ''
    if (['convenience','fuel','supermarket','department_store','general'].includes(type)) score += 20
    if (el.tags.amenity === 'fast_food' || el.tags.amenity === 'cafe') score += 10

    // Has extra data = more trustworthy
    if (el.tags.opening_hours) score += 5
    if (el.tags.phone || el.tags.website) score += 5

    if (score > bestScore) {
      bestScore = score
      matchedName = name
      matchedType = type
      reason = score >= 60
        ? `Matched "${name}" (${type || 'business'}) via OpenStreetMap`
        : `Found nearby business "${name}" — partial match`
    }
  }

  return { score: bestScore, matchedName, matchedType, reason }
}

// ─── Main POST handler ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { submission_id } = body

  if (!submission_id) return NextResponse.json({ error: 'submission_id required' }, { status: 400 })

  const db = supabaseAdmin()

  // Fetch the submission
  const { data: sub, error: fetchErr } = await db
    .from('location_submissions')
    .select('*')
    .eq('id', submission_id)
    .single()

  if (fetchErr || !sub) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })

  let verificationResult = {
    verified: false,
    confidence: 0,
    matched_name: null as string | null,
    matched_type: null as string | null,
    osm_lat: null as number | null,
    osm_lng: null as number | null,
    reason: '',
  }

  try {
    // Step 1: Geocode the address
    const geo = await geocodeAddress(sub.address, sub.city, sub.country_name ?? sub.country_code)

    if (!geo) {
      verificationResult.reason = 'Address could not be found on OpenStreetMap maps'
    } else {
      verificationResult.osm_lat = geo.lat
      verificationResult.osm_lng = geo.lng

      // Step 2: Query Overpass for businesses at those coordinates
      const businesses = await findNearbyBusinesses(geo.lat, geo.lng, 100)

      // Step 3: Score the match
      const { score, matchedName, matchedType, reason } = scoreVerification(businesses, sub.name, sub.brand)

      verificationResult.confidence = Math.min(score, 100)
      verificationResult.matched_name = matchedName
      verificationResult.matched_type = matchedType
      verificationResult.reason = reason

      // Auto-approve if confidence >= 60
      verificationResult.verified = score >= 60
    }
  } catch (err) {
    console.error('Verification error:', err)
    verificationResult.reason = 'Verification service temporarily unavailable'
  }

  // Update the submission with verification results
  const newStatus = verificationResult.verified ? 'approved' : 'pending'

  await db.from('location_submissions').update({
    review_status: newStatus,
    verified_by_osm: verificationResult.verified,
    osm_confidence: verificationResult.confidence,
    osm_matched_name: verificationResult.matched_name,
    osm_matched_type: verificationResult.matched_type,
    verification_reason: verificationResult.reason,
    latitude: verificationResult.osm_lat ?? sub.latitude,
    longitude: verificationResult.osm_lng ?? sub.longitude,
    reviewed_at: new Date().toISOString(),
  }).eq('id', submission_id)

  // If auto-approved, copy to live locations table
  if (verificationResult.verified) {
    const lat = verificationResult.osm_lat ?? sub.latitude
    const lng = verificationResult.osm_lng ?? sub.longitude
    if (lat && lng) {
      await db.from('locations').insert({
        name: sub.name,
        address: sub.address,
        city: sub.city,
        region: sub.region ?? '',
        postal_code: sub.postal_code ?? '',
        country_code: sub.country_code,
        country_name: sub.country_name ?? sub.country_code,
        latitude: lat,
        longitude: lng,
        timezone: sub.timezone ?? 'UTC',
        brand: sub.brand,
        flavours: sub.flavours ?? null,
        notes: sub.notes ?? null,
        machine_status: 'operational',
        checkin_count: 0,
        slush_rating: 0,
        last_verified_at: new Date().toISOString(),
      })
    }
  }

  return NextResponse.json({
    verified: verificationResult.verified,
    confidence: verificationResult.confidence,
    matched_name: verificationResult.matched_name,
    matched_type: verificationResult.matched_type,
    reason: verificationResult.reason,
    status: newStatus,
  })
}
