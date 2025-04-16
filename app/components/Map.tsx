'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useMemo, useState } from 'react'
import ASVProfile from './ASVProfile'
import { Sample } from '@/app/lib/types'
import MarkerClusterGroup from 'react-leaflet-cluster'
import SampleDetailPanel from './SampleDetailPanel'

// 고정 마커 아이콘 (기본)
const defaultIcon = L.icon({
  iconUrl: '/images/virus.png',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
})

// 선택된 마커 아이콘 (위치 클릭 시)
const selectedIcon = L.icon({
  iconUrl: '/images/Location-marker.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
})

// 위치 선택 처리
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

  return (
    <div className="space-y-4">
      <div className="h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] relative rounded-lg overflow-hidden shadow-lg border border-green-100">
        <MapContainer
          center={[40.7831, -73.9712]} // 맨해튼 중심
          zoom={7}
          minZoom={3}
          maxZoom={16}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ZoomHandler onZoomChange={setZoom} />
          <LocationMarker onLocationSelect={handleLocationSelect} />

          {/* 선택 위치 마커 */}
          {selectedLocation && (
            <Marker
              position={[selectedLocation.lat, selectedLocation.lng]}
              icon={selectedIcon}
            >
              <Popup>
                Selected Location
              </Popup>
            </Marker>
          )}

          <MarkerClusterGroup 
            chunkedLoading
            removeOutsideVisibleBounds
            showCoverageOnHover={false}
          >
            {samples.map(sample => {
              if (!sample.latitude || !sample.longitude) return null

              return (
                <Marker
                  key={sample.id}
                  position={[sample.latitude, sample.longitude]}
                  icon={defaultIcon}
                >
                  <Popup>
                    <SampleDetailPanel sample={sample} />
                  </Popup>
                </Marker>
              )
            })}
          </MarkerClusterGroup>
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
