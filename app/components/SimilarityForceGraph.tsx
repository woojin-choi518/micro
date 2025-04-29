'use client'

import dynamic from 'next/dynamic'
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

interface Node {
  id: string
}

interface Link {
  source: string
  target: string
  sharedCount: number
}

interface SimilarityForceGraphProps {
  nodes: Node[]
  links: Link[]
}

export default function SimilarityForceGraph({ nodes, links }: SimilarityForceGraphProps) {
    
  return (
    <div className="h-[75vh] w-full bg-white rounded-lg shadow-md p-4">
      <ForceGraph2D
        graphData={{ nodes, links }}
        nodeLabel="id"
        nodeAutoColorBy="id"
        linkWidth={(link) => Math.min(link.sharedCount || 1, 5)}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
      />
    </div>
  )
}
