'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { Sample } from '@/app/lib/types'


const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <p>🗺️ Loading map...</p>,
})

export default function MapPage() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch('/api/samples')
      .then((res) => res.json())
      .then((data) => {
        setSamples(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching samples:', error)
        setLoading(false)
      })
  }, [])

  const filteredSamples = samples.filter((s) =>
    s.env_biome.toLowerCase().includes(query.toLowerCase())
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
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 p-4 rounded-2xl bg-green-100 shadow-md text-center"
      >
        <h1 className="text-3xl font-extrabold text-green-700 mb-2">
          Microbiome Map
        </h1>
        <p className="text-green-600 text-lg font-semibold">
          Explore your local microbiome data!
        </p>
      </motion.div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white rounded-xl shadow text-center">
          <p className="text-sm text-gray-500">Total Samples</p>
          <p className="text-2xl font-bold text-green-700">{samples.length}</p>
        </div>
        <div className="p-4 bg-white rounded-xl shadow text-center">
          <p className="text-sm text-gray-500">Unique Biomes</p>
          <p className="text-2xl font-bold text-green-700">
            {new Set(samples.map((s) => s.env_biome)).size}
          </p>
        </div>
        <div className="p-4 bg-white rounded-xl shadow text-center">
          <p className="text-sm text-gray-500">Regions</p>
          <p className="text-2xl font-bold text-green-700">
            {new Set(samples.map((s) => s.env_feature)).size}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by Region or Biome..."
        className="mb-6 p-3 w-full rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

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
