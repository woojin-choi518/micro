// app/components/DetailPanel.tsx
'use client'

import React, { useState, useEffect, useMemo } from 'react'

interface DetailPanelProps {
  selectedNode: { id: string; biome: string }
  links: Array<{ source: string; target: string; value: number }>
}

export default function DetailPanel({ selectedNode, links }: DetailPanelProps) {
  // 유틸: source/target가 문자열 또는 노드 객체일 때 ID 추출
  const getId = (x: string | { id: string }) =>
    typeof x === 'string' ? x : (x as any).id

  // ① 그래프 링크에서 실제 연결된 이웃 ID만 추출
  const neighbors = useMemo(
    () =>
      links
        .map(l => {
          const s = getId(l.source as any)
          const t = getId(l.target as any)
          if (s === selectedNode.id) return t
          if (t === selectedNode.id) return s
          return null
        })
        .filter((x): x is string => x !== null),
    [links, selectedNode.id]
  )

  // ② sharedMap: neighbor → sequences[]
  const [sharedMap, setSharedMap] = useState<Record<string, string[]>>({})

  // ③ selectedNode 또는 neighbors 변경 시 API 호출
  useEffect(() => {
    if (!selectedNode.id || neighbors.length === 0) {
      setSharedMap({})
      return
    }
    const params = new URLSearchParams({
      sampleId: selectedNode.id,
      neighbors: neighbors.join(',')
    })
    fetch(`/api/shared-asvs?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          console.error('shared-asvs 비배열 응답:', data)
          setSharedMap({})
          return
        }
        const map: Record<string, string[]> = {}
        data.forEach((item: any) => {
          if (
            item &&
            typeof item.neighbor === 'string' &&
            Array.isArray(item.sequences)
          ) {
            map[item.neighbor] = item.sequences
          }
        })
        setSharedMap(map)
      })
      .catch(err => {
        console.error('shared-asvs fetch 에러:', err)
        setSharedMap({})
      })
  }, [selectedNode.id, neighbors])

  return (
    <div className="mt-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-2 break-words text-gray-800">
        Sample name: {selectedNode.id}
      </h2>
      <p className="font-medium mb-4 text-gray-700">
        <strong>Biome:</strong> {selectedNode.biome}
      </p>

      <h3 className="font-medium mb-2 text-gray-800">
        Shared ASVs with neighbors:
      </h3>
      {neighbors.length === 0 ? (
        <p className="text-sm text-gray-500">No neighbors in graph.</p>
      ) : (
        neighbors.map(nb => {
          // edge.value 찾을 때도 getId 사용
          const edge = links.find(l => {
            const s = getId(l.source as any)
            const t = getId(l.target as any)
            return (
              (s === selectedNode.id && t === nb) ||
              (t === selectedNode.id && s === nb)
            )
          })!
          return (
            <div key={nb} className="mb-4 p-4 border rounded bg-gray-50">
              <p className="mb-1 text-gray-800">
                <strong>Neighbor:</strong> {nb}
              </p>
              <p className="mb-2 text-gray-800">
                <strong>Count:</strong> {edge.value}
              </p>

              {sharedMap[nb]?.length ? (
                <ul className="list-disc list-inside max-h-40 overflow-y-auto text-sm text-gray-800">
                  {sharedMap[nb].map((seq, i) => (
                    <li key={i} className="break-words my-0.5">{seq}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">
                  No shared ASV sequences.
                </p>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
