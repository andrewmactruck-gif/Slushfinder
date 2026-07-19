'use client'

import { useEffect, useRef, useState } from 'react'
import type * as LeafletNS from 'leaflet'
import { LocationWithDistance } from '@/types'

interface Props {
  locations: LocationWithDistance[]
  center: { lat: number; lng: number }
  onSelectLocation?: (id: string) => void
}

// Popup content is built as an HTML string, so anything from the DB gets escaped
const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const esc = (s: string) => String(s ?? '').replace(/[&<>"']/g, c => ESCAPES[c])

// Loaded dynamically — no SSR
export default function SlushyMap({ locations, center, onSelectLocation }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<typeof LeafletNS | null>(null)
  const mapRef = useRef<LeafletNS.Map | null>(null)
  const markersRef = useRef<LeafletNS.LayerGroup | null>(null)
  const userMarkerRef = useRef<LeafletNS.Marker | null>(null)
  const onSelectRef = useRef(onSelectLocation)
  const [ready, setReady] = useState(false)

  // Kept in a ref so marker rebuilds don't depend on the callback's identity
  useEffect(() => { onSelectRef.current = onSelectLocation }, [onSelectLocation])

  // Create the map once. `center` seeds the initial view; recentring happens below.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false

    // Dynamic import of Leaflet to avoid SSR issues
    import('leaflet').then(L => {
      if (cancelled || !containerRef.current || mapRef.current) return

      // Fix default marker icons (webpack issue with Leaflet)
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current).setView([center.lat, center.lng], 13)

      // Dark basemap to match the app's palette
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        detectRetina: true,
        maxZoom: 20,
      }).addTo(map)

      leafletRef.current = L
      mapRef.current = map
      markersRef.current = L.layerGroup().addTo(map)
      setReady(true)
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markersRef.current = null
      userMarkerRef.current = null
      setReady(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Recentre and move the user marker whenever the search origin changes
  useEffect(() => {
    const L = leafletRef.current
    const map = mapRef.current
    if (!ready || !L || !map) return

    map.setView([center.lat, center.lng], map.getZoom())

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([center.lat, center.lng])
      return
    }

    // User location marker (blue dot)
    const userIcon = L.divIcon({
      html: `<div style="width:14px;height:14px;background:#185FA5;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(24,95,165,0.25)"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      className: '',
    })
    userMarkerRef.current = L.marker([center.lat, center.lng], { icon: userIcon }).addTo(map)
  }, [ready, center.lat, center.lng])

  // Rebuild machine markers whenever the result set changes (search, filters, radius)
  useEffect(() => {
    const L = leafletRef.current
    const group = markersRef.current
    if (!ready || !L || !group) return

    group.clearLayers()

    locations.forEach(loc => {
      const color = loc.machine_status === 'operational'
        ? (loc.is_open ? '#1D9E75' : '#6B7280')
        : '#D97706'

      const icon = L.divIcon({
        html: `<div style="
          width:28px;height:28px;
          background:${color};
          border:2.5px solid white;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
        ">
          <span style="transform:rotate(45deg);color:white;font-size:13px">❄</span>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        className: '',
      })

      const marker = L.marker([loc.latitude, loc.longitude], { icon })
      marker.bindPopup(`
        <div style="min-width:160px;font-family:system-ui,sans-serif">
          <strong style="font-size:13px">${esc(loc.name)}</strong><br>
          <span style="font-size:11px;color:#555">${esc(loc.address)}</span><br>
          <span style="font-size:11px;color:${loc.is_open ? '#1D9E75' : '#EF4444'};font-weight:600">
            ${loc.is_open ? '● Open now' : '● Closed'}
          </span>
          &nbsp;·&nbsp;
          <span style="font-size:11px;color:#1D9E75">${loc.distance_km.toFixed(1)} km</span><br>
          <a href="/location/${encodeURIComponent(loc.id)}" style="font-size:11px;color:#1D9E75;text-decoration:none;font-weight:600">
            View details →
          </a>
        </div>
      `)
      marker.on('click', () => onSelectRef.current?.(loc.id))
      group.addLayer(marker)
    })
  }, [ready, locations])

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-2xl overflow-hidden"
      style={{ minHeight: '280px' }}
    />
  )
}
