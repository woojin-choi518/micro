'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useMemo, useState } from 'react'
import ASVProfile from './ASVProfile'
import { Sample } from '@/app/lib/types'

// 동적 마커 아이콘 생성 함수
function DynamicMarkerIcon(zoomLevel: number) {
  return L.icon({
    iconUrl: '/images/micro_icon.png',
    iconSize: [zoomLevel * 3, zoomLevel * 3],
    iconAnchor: [zoomLevel * 1.5, zoomLevel * 3],
  })
}

// 지도 클릭 시 위치 선택 처리
function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// 줌 변경 감지 핸들러
function ZoomHandler({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap()
  useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom())
    },
  })
  return null
}

export default function Map({ samples }: { samples: Sample[] }) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | undefined>()
  const [zoom, setZoom] = useState(5)

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng })
  }

  const markerIcon = useMemo(() => DynamicMarkerIcon(zoom), [zoom])

  return (
    <div className="space-y-4">
      <div className="h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] relative rounded-lg overflow-hidden shadow-lg border border-green-100">
        <MapContainer
          center={[40.7, -73.9]} // New York
          zoom={zoom}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ZoomHandler onZoomChange={setZoom} />
          <LocationMarker onLocationSelect={handleLocationSelect} />

          {samples.map(sample => {
            if (!sample.latitude || !sample.longitude) return null

            return (
              <Marker
                key={sample.id}
                position={[sample.latitude, sample.longitude]}
                icon={markerIcon}
              >
                <Popup>
                  <div className="p-2 space-y-2 text-sm max-w-[250px] break-words">
                    <div>
                      <span className="font-semibold">Sample ID:</span><br />
                      <span className="break-all">{sample.sample_id}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Physical Specimen:</span>{' '}
                      <span className={sample.physical_specimen_remaining ? 'text-green-600' : 'text-red-600'}>
                        {sample.physical_specimen_remaining ? 'Available' : 'Not Available'}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold">Environment:</span>{' '}
                      {sample.env_biome}
                    </div>
                    <div>
                      <span className="font-semibold">Feature:</span>{' '}
                      {sample.env_feature || 'Not specified'}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      {selectedLocation && (
        <ASVProfile
          samples={samples}
          selectedLocation={selectedLocation}
          radius={10}
        />
      )}
    </div>
  )
}
