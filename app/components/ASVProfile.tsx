'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Select from 'react-select'

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

interface ASVCount {
  sequence: string
  count: number
  features: { [key: string]: number }
}

interface TaxonomyInfo {
  asvSeq: string
  domain?: string
  phylum?: string
  class?: string
  order?: string
  family?: string
  genus?: string
  species?: string
  confidence?: number
}

interface ASVProfileProps {
  samples: Sample[]
  selectedLocation?: { lat: number; lng: number }
  radius?: number
}

export default function ASVProfile({
  samples,
  selectedLocation,
  radius = 10,
}: ASVProfileProps) {
  const [nearbyASVs, setNearbyASVs] = useState<ASVCount[]>([])
  const [taxonomyMap, setTaxonomyMap] = useState<{ [asv: string]: TaxonomyInfo }>({})
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)
  const [locationName, setLocationName] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const uniqueFeatures = Array.from(new Set(samples.map(s => s.env_feature).filter(Boolean))) as string[]
  const featureOptions = uniqueFeatures.map(f => ({ value: f, label: f }))

  useEffect(() => {
    if (!selectedLocation) return

    const fetchLocationName = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${selectedLocation.lat}&lon=${selectedLocation.lng}&format=json`
        )
        const data = await res.json()
        const name = data.display_name.split(',').slice(0, 2).join(', ')
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
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(selectedLocation.lat * d2r) *
        Math.cos(sample.latitude * d2r) *
        Math.sin(dLon / 2) ** 2
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c <= radius
    })

    const asvCounts: Record<string, { count: number; features: Record<string, number> }> = {}
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
        features: data.features,
      }))
      .filter(asv => asv.count > 0)
      .sort((a, b) => b.count - a.count)

    setNearbyASVs(sortedASVs)

    // 🔽 taxonomy 정보 가져오기
    const fetchTaxonomy = async () => {
      try {
        const asvSeqs = sortedASVs.map(a => a.sequence)
        const res = await fetch('/api/asv-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ asvSeqs }),
        })
        const data = await res.json()
        const map: { [asv: string]: TaxonomyInfo } = {}
        data.forEach((item: TaxonomyInfo) => {
          map[item.asvSeq] = item
        })
        setTaxonomyMap(map)
      } catch (err) {
        console.error('Taxonomy fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTaxonomy()
  }, [selectedLocation, samples, radius, selectedFeature])

  const totalSamples = selectedFeature
    ? samples.filter(s => s.env_feature === selectedFeature).length
    : samples.length

  if (!selectedLocation) {
    return <div className="p-4 text-gray-500">지도에서 위치를 선택해주세요.</div>
  }

  if (loading) {
    return <div className="p-4 text-gray-500">로딩 중...</div>
  }

  return (
    <motion.div className="p-4 bg-white rounded-lg shadow-md border border-green-200"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold text-green-700">
          {locationName} 주변 {radius}km ASV 분포
        </h2>
        <div className="w-full md:w-64 text-sm">
          <Select
            isClearable
            placeholder="환경 특징으로 필터링"
            options={featureOptions}
            value={selectedFeature ? { value: selectedFeature, label: selectedFeature } : null}
            onChange={(option) => setSelectedFeature(option?.value ?? null)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {nearbyASVs.map(({ sequence, count, features }) => {
          const taxonomy = taxonomyMap[sequence]
          const speciesName = taxonomy?.species || 'Unknown species'
          const isExpanded = expanded === sequence

          return (
            <div
              key={sequence}
              className="p-4 bg-green-50 rounded-xl border border-green-100 shadow hover:shadow-md transition cursor-pointer"
              onClick={() => setExpanded(prev => prev === sequence ? null : sequence)}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="text-green-800 font-semibold">{speciesName}</div>
                <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  출현: {count}회 / {(count / totalSamples * 100).toFixed(1)}%
                </div>
              </div>

              {!selectedFeature && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {Object.entries(features).map(([f, c]) => (
                    <span key={f} className="text-xs bg-green-200 text-green-900 px-2 py-1 rounded">
                      {f}: {c}회
                    </span>
                  ))}
                </div>
              )}

              {isExpanded && taxonomy && (
                <div className="mt-2 text-sm text-gray-700 space-y-1">
                  <div><b>Domain:</b> {taxonomy.domain}</div>
                  <div><b>Phylum:</b> {taxonomy.phylum}</div>
                  <div><b>Class:</b> {taxonomy.class}</div>
                  <div><b>Order:</b> {taxonomy.order}</div>
                  <div><b>Family:</b> {taxonomy.family}</div>
                  <div><b>Genus:</b> {taxonomy.genus}</div>
                  <div><b>Species:</b> {taxonomy.species}</div>
                  <div><b>ASV Sequence:</b> <span className="font-mono break-all">{sequence}</span></div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
