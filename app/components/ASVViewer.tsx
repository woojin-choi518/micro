'use client'

import { useState, useEffect } from 'react'
import ASVProfileList from './ASVProfileList'
import ASVProfileCharts from './ASVProfileCharts'
import { ASVCount, TaxonomyInfo } from '@/app/lib/types'

interface ASVViewerProps {
  asvs: ASVCount[]
  totalSamples: number
  selectedFeature: string | null
  locationName: string
}

export default function ASVViewer({
  asvs,
  totalSamples,
  selectedFeature,
  locationName
}: ASVViewerProps) {
  const [taxonomyMap, setTaxonomyMap] = useState<Record<string, TaxonomyInfo>>({})
  const [view, setView] = useState<'list' | 'chart'>('list')

  useEffect(() => {
    const fetchTaxonomy = async () => {
      const seqs = asvs.map(a => a.sequence)
      try {
        const res = await fetch('/api/asv-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ asvSeqs: seqs }),
        })
        const data = await res.json()
        const map: Record<string, TaxonomyInfo> = {}
        data.forEach((item: TaxonomyInfo) => {
          map[item.asvSeq] = item
        })
        setTaxonomyMap(map)
      } catch (e) {
        console.error('taxonomy fetch error', e)
      }
    }

    if (asvs.length > 0) {
      fetchTaxonomy()
    }
  }, [asvs])

  const enriched = asvs.map(a => ({
    ...a,
    name: taxonomyMap[a.sequence]?.species || taxonomyMap[a.sequence]?.genus || 'Unknown species',
    taxonomy: taxonomyMap[a.sequence],
  }))

  return (
    <div className="space-y-4 bg-green-50 border border-green-100 p-4 rounded-lg shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h2 className="text-base md:text-lg font-bold text-green-700">
          선택한 위치: <span className="text-gray-800">{locationName || '알 수 없음'}</span>
        </h2>

        <div className="flex gap-2">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-1 rounded-md text-sm font-semibold border transition-all ${
              view === 'list'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-green-700 border-green-400 hover:bg-green-100'
            }`}
          >
            리스트 보기
          </button>
          <button
            onClick={() => setView('chart')}
            className={`px-4 py-1 rounded-md text-sm font-semibold border transition-all ${
              view === 'chart'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-green-700 border-green-400 hover:bg-green-100'
            }`}
          >
            그래프 보기
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <ASVProfileList
          asvs={enriched}
          totalSamples={totalSamples}
          selectedFeature={selectedFeature}
          taxonomyMap={taxonomyMap}
          onSelect={(seq) => console.log('Selected ASV:', seq)}
        />
      ) : (
        <ASVProfileCharts data={enriched} />
      )}
    </div>
  )
}
