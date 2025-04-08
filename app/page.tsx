// ✅ app/page.tsx – 초록 테마 + 애니메이션 포함된 필터 UI + 지도 렌더링
'use client'
import { useEffect, useState } from 'react'
import Map from './components/Map'
import { motion } from 'framer-motion'

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

export default function HomePage() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [biomeFilter, setBiomeFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [featureFilter, setFeatureFilter] = useState('')

  useEffect(() => {
    fetch('/api/samples')
      .then((res) => res.json())
      .then((data) => setSamples(data))
  }, [])

  const biomes = Array.from(new Set(samples.map((s) => s.biome))).filter(Boolean).sort()
  const types = Array.from(new Set(samples.map((s) => s.type))).filter((type): type is string => type !== null).sort()
  const features = Array.from(new Set(samples.map((s) => s.feature))).filter(Boolean).sort()

  const filteredSamples = samples.filter((s) => {
    return (
      (biomeFilter === '' || s.biome === biomeFilter) &&
      (typeFilter === '' || s.type === typeFilter) &&
      (featureFilter === '' || s.feature === featureFilter)
    )
  })

  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-green-50 to-white">
      <motion.h1
        className="text-3xl font-extrabold mb-6 flex items-center text-green-700"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span className="ml-2">Microbiome Map</span>
      </motion.h1>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div>
          <label className="block text-sm font-medium text-green-800 mb-1">Biome</label>
          <select
            value={biomeFilter}
            onChange={(e) => setBiomeFilter(e.target.value)}
            className="w-full border border-green-300 rounded px-3 py-2 text-sm shadow-sm text-green-900 bg-white"
          >
            <option value="">All biomes</option>
            {biomes.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-green-800 mb-1">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full border border-green-300 rounded px-3 py-2 text-sm shadow-sm text-green-900 bg-white"
          >
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-green-800 mb-1">Feature</label>
          <select
            value={featureFilter}
            onChange={(e) => setFeatureFilter(e.target.value)}
            className="w-full border border-green-300 rounded px-3 py-2 text-sm shadow-sm text-green-900 bg-white"
          >
            <option value="">All features</option>
            {features.map((f) => (
              f && <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </motion.div>

      <Map samples={filteredSamples} />
    </main>
  )
}
