/**
 * SlushyFind — Google Places Seeder
 * 
 * Seeds your Supabase database with real slushy machine locations from Google Places.
 * 
 * Usage:
 *   GOOGLE_PLACES_API_KEY=xxx SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx npx ts-node scripts/seed-from-places.ts
 * 
 * Cost estimate: ~30 cities × 5 keywords = 150 Text Search calls ≈ $0.85 USD (well within free tier)
 */

import { createClient } from '@supabase/supabase-js'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!
const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Search keywords → maps to a brand in our system
const SEARCH_KEYWORDS: Array<{ keyword: string; brand: string }> = [
  { keyword: 'Slurpee 7-Eleven',  brand: '7-Eleven' },
  { keyword: 'Froster Circle K',  brand: 'Circle K' },
  { keyword: 'Sloche Couche-Tard', brand: 'Couche-Tard' },
  { keyword: 'ICEE machine',       brand: 'ICEE' },
  { keyword: 'Slush Puppie',       brand: 'Slush Puppie' },
]

// Major Canadian city centres covering all provinces
const CITY_CENTRES: Array<{ name: string; province: string; lat: number; lng: number; timezone: string }> = [
  // Ontario
  { name: 'Toronto',     province: 'ON', lat: 43.6532, lng: -79.3832, timezone: 'America/Toronto' },
  { name: 'Ottawa',      province: 'ON', lat: 45.4215, lng: -75.6972, timezone: 'America/Toronto' },
  { name: 'Mississauga', province: 'ON', lat: 43.5890, lng: -79.6441, timezone: 'America/Toronto' },
  { name: 'Hamilton',    province: 'ON', lat: 43.2557, lng: -79.8711, timezone: 'America/Toronto' },
  // Quebec
  { name: 'Montreal',    province: 'QC', lat: 45.5017, lng: -73.5673, timezone: 'America/Toronto' },
  { name: 'Quebec City', province: 'QC', lat: 46.8139, lng: -71.2080, timezone: 'America/Toronto' },
  { name: 'Laval',       province: 'QC', lat: 45.5669, lng: -73.6924, timezone: 'America/Toronto' },
  // BC
  { name: 'Vancouver',   province: 'BC', lat: 49.2827, lng: -123.1207, timezone: 'America/Vancouver' },
  { name: 'Surrey',      province: 'BC', lat: 49.1913, lng: -122.8490, timezone: 'America/Vancouver' },
  { name: 'Burnaby',     province: 'BC', lat: 49.2488, lng: -122.9805, timezone: 'America/Vancouver' },
  // Alberta
  { name: 'Calgary',     province: 'AB', lat: 51.0447, lng: -114.0719, timezone: 'America/Edmonton' },
  { name: 'Edmonton',    province: 'AB', lat: 53.5461, lng: -113.4938, timezone: 'America/Edmonton' },
  // Manitoba
  { name: 'Winnipeg',    province: 'MB', lat: 49.8951, lng: -97.1384, timezone: 'America/Winnipeg' },
  // Saskatchewan
  { name: 'Saskatoon',   province: 'SK', lat: 52.1579, lng: -106.6702, timezone: 'America/Regina' },
  { name: 'Regina',      province: 'SK', lat: 50.4452, lng: -104.6189, timezone: 'America/Regina' },
  // Nova Scotia
  { name: 'Halifax',     province: 'NS', lat: 44.6488, lng: -63.5752, timezone: 'America/Halifax' },
  // New Brunswick
  { name: 'Moncton',     province: 'NB', lat: 46.0878, lng: -64.7782, timezone: 'America/Moncton' },
  // Newfoundland
  { name: "St. John's",  province: 'NL', lat: 47.5615, lng: -52.7126, timezone: 'America/St_Johns' },
]

const PROVINCE_TIMEZONES: Record<string, string> = {
  BC:'America/Vancouver', AB:'America/Edmonton', SK:'America/Regina',
  MB:'America/Winnipeg', ON:'America/Toronto', QC:'America/Toronto',
  NB:'America/Moncton', NS:'America/Halifax', PE:'America/Halifax',
  NL:'America/St_Johns', NT:'America/Yellowknife', NU:'America/Rankin_Inlet', YT:'America/Whitehorse',
}

interface PlaceResult {
  id: string
  displayName: { text: string }
  formattedAddress: string
  location: { latitude: number; longitude: number }
  currentOpeningHours?: { weekdayDescriptions?: string[] }
  internationalPhoneNumber?: string
}

async function searchPlaces(keyword: string, lat: number, lng: number): Promise<PlaceResult[]> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.internationalPhoneNumber',
    },
    body: JSON.stringify({
      textQuery: keyword,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 25000, // 25km per city
        },
      },
      maxResultCount: 20,
    }),
  })
  const data = await res.json()
  return data.places ?? []
}

function parseProvince(address: string): string {
  const match = address.match(/,\s*([A-Z]{2})\s+[A-Z]\d[A-Z]/)
  return match?.[1] ?? 'ON'
}

function parsePostal(address: string): string {
  const match = address.match(/[A-Z]\d[A-Z]\s*\d[A-Z]\d/)
  return match?.[0].replace(/\s/g, '') ?? ''
}

function parseCity(address: string): string {
  const parts = address.split(',')
  return parts.length >= 2 ? parts[parts.length - 3]?.trim() ?? '' : ''
}

function parseStreet(address: string): string {
  return address.split(',')[0]?.trim() ?? ''
}

async function seed() {
  console.log('🧊 SlushyFind Seeder starting...\n')
  let inserted = 0
  let skipped = 0

  for (const city of CITY_CENTRES) {
    for (const { keyword, brand } of SEARCH_KEYWORDS) {
      console.log(`  Searching "${keyword}" near ${city.name}, ${city.province}...`)

      try {
        const places = await searchPlaces(keyword, city.lat, city.lng)
        console.log(`    Found ${places.length} results`)

        for (const place of places) {
          const province = parseProvince(place.formattedAddress) || city.province
          const postal = parsePostal(place.formattedAddress)
          const street = parseStreet(place.formattedAddress)
          const cityName = parseCity(place.formattedAddress) || city.name
          const timezone = PROVINCE_TIMEZONES[province] ?? city.timezone

          const { error } = await supabase.from('locations').upsert({
            name: place.displayName.text,
            address: street,
            city: cityName,
            province,
            postal_code: postal,
            country: 'CA',
            latitude: place.location.latitude,
            longitude: place.location.longitude,
            timezone,
            brand,
            machine_status: 'operational',
            phone: place.internationalPhoneNumber ?? null,
            last_verified_at: new Date().toISOString(),
          }, {
            onConflict: 'latitude,longitude,brand', // skip true duplicates
            ignoreDuplicates: true,
          })

          if (error) {
            console.warn(`    ⚠ Skipped (${error.message})`)
            skipped++
          } else {
            inserted++
          }
        }

        // Be polite to the API
        await new Promise(r => setTimeout(r, 200))
      } catch (err) {
        console.error(`    ✗ Error: ${err}`)
      }
    }
  }

  console.log(`\n✅ Done! Inserted: ${inserted}, Skipped: ${skipped}`)
}

seed().catch(console.error)
