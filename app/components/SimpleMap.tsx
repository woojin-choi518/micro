'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Sample } from '@/app/lib/types'

// Leaflet 마커 아이콘 설정
const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export default function SimpleMap({ samples }: { samples: Sample[] }) {
  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden shadow border border-green-100 dark:border-green-900">
      <MapContainer
        center={[36.5, 127.5]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {samples.map((sample) => {
          if (!sample.latitude || !sample.longitude) return null

          return (
            <Marker
              key={sample.id}
              position={[sample.latitude, sample.longitude]}
              icon={markerIcon}
            >
              <Popup>
                <div className="text-sm">
                  <div><b>Sample ID:</b> {sample.sample_id}</div>
                  <div><b>Biome:</b> {sample.env_biome}</div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
