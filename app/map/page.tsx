'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { Sample } from '@/app/lib/types'
import SearchInput from '../components/SearchInput'

const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
})

export default function MapPage() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [showBiomes, setShowBiomes] = useState(false)
  const [showRegions, setShowRegions] = useState(false)

  useEffect(() => {
    fetch('/samples.json')
      .then(res => res.json())
      .then(data => {
        setSamples(data)
      })
      .catch(error => {
        console.error('Error fetching samples:', error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const uniqueBiomes = Array.from(new Set(samples.map(s => s.env_biome)))
  const uniqueRegions = Array.from(
    new Set(samples.map(s => s.env_feature).filter(Boolean))
  )

  const filteredSamples = samples.filter(
    s =>
      s.env_biome.toLowerCase().includes(query.toLowerCase()) ||
      (s.env_feature || '').toLowerCase().includes(query.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white">
        <div className="text-green-600 text-xl">Loading samples...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-green-50 to-white">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 p-6 rounded-2xl bg-green-100 shadow-md text-center"
      >
        <h1 className="text-4xl font-extrabold text-green-700 mb-2">
          Microbiome Map
        </h1>
        <p className="text-green-700 text-lg font-medium">
          Explore your local microbiome data!
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white rounded-xl shadow text-center">
          <p className="text-sm text-gray-500">Total Samples</p>
          <p className="text-3xl font-bold text-green-700">
            {samples.length}
          </p>
        </div>
        <div
          className="p-4 bg-white rounded-xl shadow text-center cursor-pointer hover:bg-green-50"
          onClick={() => setShowBiomes(!showBiomes)}
        >
          <p className="text-sm text-gray-500">Unique Biomes</p>
          <p className="text-3xl font-bold text-green-700">
            {uniqueBiomes.length}
          </p>
        </div>
        <div
          className="p-4 bg-white rounded-xl shadow text-center cursor-pointer hover:bg-green-50"
          onClick={() => setShowRegions(!showRegions)}
        >
          <p className="text-sm text-gray-500">Regions</p>
          <p className="text-3xl font-bold text-green-700">
            {uniqueRegions.length}
          </p>
        </div>
      </div>

      {/* Toggle Lists */}
      {showBiomes && (
        <div className="mb-6 p-4 bg-white border border-green-100 rounded-lg shadow">
          <h3 className="font-bold text-green-700 mb-2">Biomes</h3>
          <div className="flex flex-wrap gap-2 text-sm">
            {uniqueBiomes.map(b => (
              <span
                key={b}
                className="bg-green-100 text-green-700 px-3 py-1 rounded-full"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      )}
      {showRegions && (
        <div className="mb-6 p-4 bg-white border border-green-100 rounded-lg shadow">
          <h3 className="font-bold text-green-700 mb-2">Regions</h3>
          <div className="flex flex-wrap gap-2 text-sm">
            {uniqueRegions.map(r => (
              <span
                key={r as string}
                className="bg-green-100 text-green-700 px-3 py-1 rounded-full"
              >
                {r as string}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <SearchInput value={query} onChange={setQuery} />

      {/* Map */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <Map samples={filteredSamples} />
      </motion.div>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-gray-400">
        Data Source: Earth Microbiome Project
      </footer>
    </main>
  )
}
