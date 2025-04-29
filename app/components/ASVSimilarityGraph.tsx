'use client'

import { useState } from 'react'

export default function ASVSimilarityGraph({ sampleId }: { sampleId: string }) {
  const [similarSamples, setSimilarSamples] = useState<{ sampleId: string; sharedCount: number }[]>([])

  async function fetchSimilarity() {
    const res = await fetch('/api/similarity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleId }),
    })
    const data = await res.json()
    setSimilarSamples(data) 
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <button
        onClick={fetchSimilarity}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        유사한 샘플 찾기
      </button>

      <div className="mt-4">
        {similarSamples.map((s) => (
          <div key={s.sampleId} className="text-sm text-gray-700">
            🔗 {s.sampleId} ({s.sharedCount}개 공유된 ASV)
          </div>
        ))}
      </div>
    </div>
  )
}
