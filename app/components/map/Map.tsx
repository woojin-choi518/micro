'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useMemo, useState } from 'react'
import { Sample, ASVCount } from '@/app/lib/types'
import MarkerClusterGroup from 'react-leaflet-cluster'
import SampleDetailPanel from './SampleDetailPanel'
import ASVViewer from '../asv/ASVViewer'
import Select from 'react-select'

// 마커 아이콘
const defaultIcon = L.icon({
  iconUrl: '/images/virus.png',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
})

const selectedIcon = L.icon({
  iconUrl: '/images/Location-marker.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
})

function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

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
  const [locationName, setLocationName] = useState<string>('') // ✅ 지역명
  const [zoom, setZoom] = useState(5)
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)

  const handleLocationSelect = async (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng })

    // ✅ 지역명 불러오기
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      const data = await res.json()
      const name = data.display_name.split(',').slice(0, 2).join(', ')
      setLocationName(name)
    } catch {
      setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    }
  }

  const uniqueFeatures = useMemo(() => {
    return Array.from(new Set(samples.map(s => s.env_feature).filter(Boolean))) as string[]
  }, [samples])

  const featureOptions = uniqueFeatures.map(f => ({ value: f, label: f }))

  const nearbyASVs: ASVCount[] = useMemo(() => {
    if (!selectedLocation) return []

    const R = 6371
    const d2r = Math.PI / 180

    const nearby = samples.filter(sample => {
      if (!sample.latitude || !sample.longitude) return false
      const dLat = (sample.latitude - selectedLocation.lat) * d2r
      const dLon = (sample.longitude - selectedLocation.lng) * d2r
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(selectedLocation.lat * d2r) *
        Math.cos(sample.latitude * d2r) *
        Math.sin(dLon / 2) ** 2
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c <= 10
    })

    const countMap: Record<string, ASVCount> = {}

    nearby.forEach(sample => {
      if (selectedFeature && sample.env_feature !== selectedFeature) return
      sample.top5_asv.forEach(seq => {
        if (!countMap[seq]) {
          countMap[seq] = {
            sequence: seq,
            count: 0,
            features: {},
            name: seq.slice(0, 8) + '...',
          }
        }
        countMap[seq].count++
        const feature = sample.env_feature || 'unknown'
        countMap[seq].features[feature] = (countMap[seq].features[feature] || 0) + 1
      })
    })

    return Object.values(countMap).sort((a, b) => b.count - a.count)
  }, [samples, selectedLocation, selectedFeature])

  const totalSamples = useMemo(() => {
    return selectedFeature
      ? samples.filter(s => s.env_feature === selectedFeature).length
      : samples.length
  }, [samples, selectedFeature])

  return (
    <div className="space-y-4">
      <div className="h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] relative rounded-lg overflow-hidden shadow-lg border border-green-100">
        <MapContainer
          center={[40.7831, -73.9712]}
          zoom={zoom}
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

          {selectedLocation && (
            <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={selectedIcon}>
              <Popup>선택된 위치</Popup>
            </Marker>
          )}

          <MarkerClusterGroup chunkedLoading removeOutsideVisibleBounds showCoverageOnHover={false}>
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

      <div className="max-w-sm">
        <Select
          isClearable
          placeholder="환경 특징으로 필터링"
          options={featureOptions}
          value={selectedFeature ? { value: selectedFeature, label: selectedFeature } : null}
          onChange={(option) => setSelectedFeature(option?.value ?? null)}
        />
      </div>

      {/* ✅ 지역명 추가 */}
      {selectedLocation && (
        <ASVViewer
          asvs={nearbyASVs}
          totalSamples={totalSamples}
          selectedFeature={selectedFeature}
          locationName={locationName}
        />
      )}
    </div>
  )
}
