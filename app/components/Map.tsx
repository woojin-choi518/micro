'use client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'

interface Sample {
  id: string
  biome: string
  feature: string | null
  type: string | null
  latitude: number | null
  longitude: number | null
  description: string | null
  createdAt: string
}

export default function Map({ samples }: { samples: Sample[] }) {
  // ✅ 아이콘 이미지 깨짐 방지
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })
  }, [])

  return (
    <MapContainer
      center={[40.7831, -73.9712]} // 🗽 맨해튼 중심
      zoom={15}
      scrollWheelZoom={true}
      className="h-[80vh] w-full rounded-lg shadow-md"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {samples
        .filter((s) => s.latitude !== null && s.longitude !== null)
        .map((sample) => (
          <Marker
            key={sample.id}
            position={[sample.latitude as number, sample.longitude as number]}
          >
            <Popup className="text-sm">
              <p><strong>Biome:</strong> {sample.biome}</p>
              <p><strong>Feature:</strong> {sample.feature || 'Unknown'}</p>
              <p><strong>Type:</strong> {sample.type || 'Unknown'}</p>
              <p><strong>Description:</strong> {sample.description || '-'}</p>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  )
}
