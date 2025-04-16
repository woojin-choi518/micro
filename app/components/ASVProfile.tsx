'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Select from 'react-select'
import { FaBacteria } from 'react-icons/fa6'

interface Sample {
  id: string
  sample_id: string
  env_biome: string
  env_feature: string | null
  sample_type: string | null
  latitude: number | null
  longitude: number | null
  description: string | null
  top5_asv: string[]
}

interface ASVProfileProps {
  samples: Sample[]
  selectedLocation?: { lat: number; lng: number }
  radius?: number // km 단위
}

interface ASVCount {
  sequence: string
  count: number
  features: { [key: string]: number }
}

export default function ASVProfile({
  samples,
  selectedLocation,
  radius = 10
}: ASVProfileProps) {
  const [nearbyASVs, setNearbyASVs] = useState<ASVCount[]>([])
  const [loading, setLoading] = useState(false)
  const [locationName, setLocationName] = useState<string>('')
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)

  const uniqueFeatures = Array.from(new Set(
    samples.map(sample => sample.env_feature).filter((f): f is string => !!f)
  )).sort()

  const featureOptions = uniqueFeatures.map(f => ({ value: f, label: f }))

  useEffect(() => {
    if (!selectedLocation) return

    const fetchLocationName = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${selectedLocation.lat}&lon=${selectedLocation.lng}&format=json`
        )
        const data = await res.json()
        const name = data.address.road
          ? `${data.address.road}, ${data.address.city || data.address.state}`
          : data.display_name.split(',').slice(0, 2).join(', ')
        setLocationName(name)
      } catch {
        setLocationName(`${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`)
      }
    }

    fetchLocationName()
  }, [selectedLocation])

  useEffect(() => {
    if (!selectedLocation) return
    setLoading(true)

    const R = 6371
    const d2r = Math.PI / 180

    const nearbySamples = samples.filter(sample => {
      if (!sample.latitude || !sample.longitude) return false

      const dLat = (sample.latitude - selectedLocation.lat) * d2r
      const dLon = (sample.longitude - selectedLocation.lng) * d2r
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(selectedLocation.lat * d2r) *
          Math.cos(sample.latitude * d2r) *
          Math.sin(dLon / 2) ** 2
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distance = R * c

      return distance <= radius
    })

    const asvCounts: {
      [key: string]: {
        count: number
        features: { [key: string]: number }
      }
    } = {}

    nearbySamples.forEach(sample => {
      sample.top5_asv.forEach(asv => {
        if (!asvCounts[asv]) {
          asvCounts[asv] = { count: 0, features: {} }
        }
        asvCounts[asv].count++
        const feature = sample.env_feature || 'unknown'
        asvCounts[asv].features[feature] = (asvCounts[asv].features[feature] || 0) + 1
      })
    })

    const sortedASVs = Object.entries(asvCounts)
      .map(([sequence, data]) => ({
        sequence,
        count: selectedFeature ? (data.features[selectedFeature] || 0) : data.count,
        features: data.features
      }))
      .filter(asv => asv.count > 0)
      .sort((a, b) => b.count - a.count)

    setNearbyASVs(sortedASVs)
    setLoading(false)
  }, [selectedLocation, samples, radius, selectedFeature])

  if (!selectedLocation) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg border border-green-100">
        <p className="text-gray-600">지도에서 위치를 선택해주세요.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg border border-green-100 animate-pulse">
        <p className="text-gray-500">데이터를 불러오는 중...</p>
      </div>
    )
  }

  const totalSamples = selectedFeature
    ? samples.filter(s => s.env_feature === selectedFeature).length
    : samples.length

  return (
    <motion.div
      className="p-6 bg-white rounded-lg shadow-lg border border-green-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h3 className="text-2xl font-bold text-green-800 flex items-center gap-2">
          <FaBacteria className="text-green-600" />
          {locationName} 주변 {radius}km 내 ASV 분포
        </h3>
        <div className="w-full md:w-64 text-sm">
          <Select
            isClearable
            placeholder="환경 특징으로 필터링"
            options={featureOptions}
            value={selectedFeature ? { value: selectedFeature, label: selectedFeature } : null}
            onChange={(option) => setSelectedFeature(option?.value ?? null)}
            styles={{
              placeholder: (base) => ({ ...base, color: '#1e3a1e', fontWeight: '500' })
            }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {nearbyASVs.length > 0 ? (
          nearbyASVs.map(({ sequence, count, features }, index) => (
            <div
              key={index}
              className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg 
                         shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-green-800">
                  출현 빈도: {count}회
                </span>
                <span className="text-xs border border-green-300 text-green-700 bg-white px-2 py-1 rounded-full">
                  {((count / totalSamples) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="font-mono text-sm bg-white p-2 rounded-md text-gray-700 break-words">
                {sequence}
              </div>
              {!selectedFeature && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(features).map(([feature, featureCount]) => (
                    <span key={feature} className="text-xs bg-green-200 text-green-900 px-2 py-1 rounded-full">
                      {feature}: {featureCount}회
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500">
            선택된 위치 주변에서 발견된 ASV가 없습니다.
            {selectedFeature && ` (${selectedFeature} 특징에서)`}
          </p>
        )}
      </div>
    </motion.div>
  )
}