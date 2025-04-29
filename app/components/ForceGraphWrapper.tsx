'use client'

import dynamic from 'next/dynamic'

// 서버에서는 절대 import 안 되게 dynamic으로!
const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d'),
  { ssr: false }
)

export default ForceGraph2D
