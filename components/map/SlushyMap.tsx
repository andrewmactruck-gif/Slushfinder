'use client'

import { useEffect, useRef } from 'react'
import { LocationWithDistance } from '@/types'

interface Props {
  locations: LocationWithDistance[]
  center: { lat: number; lng: number }
  onSelectLocation?: (id: string) => void
}

// Loaded dynamically — no SSR
export default function SlushyMap({ locations, center, onSelectLocation }: Props) {
  const mapRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Dynamic import of Leaflet to avoid SSR issues
    import('leaflet').then(L => {
      // Fix default marker icons (webpack issue with Leaflet)
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current!).setView([center.lat, center.lng], 13)
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      // User location marker (blue dot)
      const userIcon = L.divIcon({
        html: `<div style="width:14px;height:14px;background:#185FA5;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(24,95,165,0.25)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        className: '',
      })
      L.marker([center.lat, center.lng], { icon: userIcon }).addTo(map)

      // Machine markers
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

        const marker = L.marker([loc.latitude, loc.longitude], { icon }).addTo(map)
        marker.bindPopup(`
          <div style="min-width:160px;font-family:system-ui,sans-serif">
            <strong style="font-size:13px">${loc.name}</strong><br>
            <span style="font-size:11px;color:#555">${loc.address}</span><br>
            <span style="font-size:11px;color:${loc.is_open ? '#1D9E75' : '#EF4444'};font-weight:600">
              ${loc.is_open ? '● Open now' : '● Closed'}
            </span>
            &nbsp;·&nbsp;
            <span style="font-size:11px;color:#1D9E75">${loc.distance_km.toFixed(1)} km</span><br>
            <a href="/location/${loc.id}" style="font-size:11px;color:#1D9E75;text-decoration:none;font-weight:600">
              View details →
            </a>
          </div>
        `)
        if (onSelectLocation) {
          marker.on('click', () => onSelectLocation(loc.id))
        }
      })
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-2xl overflow-hidden"
      style={{ minHeight: '280px' }}
    />
  )
}
