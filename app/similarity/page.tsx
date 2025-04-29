'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import ForceGraph2D from '@/app/components/ForceGraphWrapper'
import DetailPanel from '@/app/components/DetailPanel'
import type { Sample } from '@/app/lib/types'



interface Node {
  id: string
  biome: string
}
interface Link {
  source: string
  target: string
  value: number
}
interface GraphData {
  nodes: Node[]
  links: Link[]
}

export default function SimilarityPage() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [biome, setBiome] = useState('')
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  // 1) 샘플 메타데이터 로드
  useEffect(() => {
    fetch('/api/samples')
      .then(r => r.json())
      .then(setSamples)
      .catch(console.error)
  }, [])

  // 2) Biome 변경 시: 선택 초기화 + 그래프 데이터 패치치
  useEffect(() => {
    setSelectedNode(null)     
    setLoading(true)
    setError(null)

    const params = new URLSearchParams()
    if (biome) params.set('biome', biome)
    params.set('minCount', '1')
    params.set('limitPairs', '200')

    fetch(`/api/similarity?${params.toString()}`)
      .then(r => {
        if (!r.ok) throw new Error(r.statusText)
        return r.json() as Promise<GraphData>
      })
      .then(data => {
        setGraphData(data)
      })
      .catch(err => {
        console.error(err)
        setError(err.message)
        setGraphData({ nodes: [], links: [] })
      })
      .finally(() => setLoading(false))
  }, [biome])

  const uniqueBiomes = Array.from(new Set(samples.map(s => s.env_biome))).sort()
  const hasData = graphData.nodes.length > 0
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-green-50 to-white">
      <motion.div
        className="mb-6 p-6 bg-green-100 rounded-xl shadow text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-extrabold text-green-700">Sample Similarity</h1>
      </motion.div>

      {/* Biome 선택 */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-green-700 font-medium">Biome 선택:</label>
        <select
          className="border border-green-300 rounded px-3 py-2 bg-white text-green-800"
          value={biome}
          onChange={e => setBiome(e.target.value)}
        >
          <option value="">전체 보기</option>
          {uniqueBiomes.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Force-Graph */}
      <div
        ref={containerRef}
        className="relative h-[600px] bg-white rounded-lg shadow border overflow-hidden"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            Loading …
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-red-500">
            Error: {error}
          </div>
        )}
        {!loading && !error && !hasData && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            데이터가 없습니다.
          </div>
        )}
        {hasData && (
          <ForceGraph2D
          graphData={graphData}
          width={containerRef.current?.clientWidth ?? 800}
          height={600}
        
          //노드에 라벨 표시
          nodeCanvasObject={(node, ctx, globalScale) => {
            const size = 6
            const n = node as any
            // 1) 원
            ctx.beginPath()
            ctx.arc(n.x, n.y, size, 0, 2 * Math.PI, false)
            ctx.fillStyle = n.color
            ctx.fill()
        
            // 2) 라벨
            const label = n.id
            const fontSize = 12 / globalScale
            ctx.font = `${fontSize}px Sans-Serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'
            ctx.fillStyle = '#222'
            ctx.fillText(label, n.x, n.y + size + 2)
          }}
        
          // Link width
          linkWidth={link => {
            const v = (link as any).value
            return v > 0 ? Math.min(v, 10) : 1
          }}
        
          // count
          linkCanvasObjectMode={() => 'after'}
          linkCanvasObject={(link, ctx) => {
            const l = link as any
            const { x: x1, y: y1 } = l.source as any
            const { x: x2, y: y2 } = l.target as any
            const mx = (x1 + x2) / 2
            const my = (y1 + y2) / 2
        
            ctx.font = `8px Sans-Serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = '#555'
            ctx.fillText(String(l.value), mx, my)
          }}
        
          // 컬러링, 파티클 등
          nodeAutoColorBy="biome"
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalParticleWidth={1.5}
        
          // 마우스 오버 / 클릭릭
          nodeLabel={node => `${(node as any).id}\nbiome: ${(node as any).biome}`}
          linkLabel={link => `Shared count: ${(link as any).value}`}
          onNodeClick={node => setSelectedNode(node as any)}
        />
        )}
      </div>

      {selectedNode && (
        <DetailPanel selectedNode={selectedNode} links={graphData.links} />
      )}
    </main>
  )
}

