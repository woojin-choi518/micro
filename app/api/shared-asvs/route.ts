// app/api/shared-asvs/route.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { driver } from '@/app/lib/neo4j'

export async function GET(req: NextRequest) {
  const sampleId = req.nextUrl.searchParams.get('sampleId')
  const neighParam = req.nextUrl.searchParams.get('neighbors') ?? ''
  if (!sampleId) {
    return NextResponse.json({ error: 'sampleId is required' }, { status: 400 })
  }

  // comma-separated → 배열
  const neighbors = neighParam
    .split(',')
    .map(s => s.trim())
    .filter(s => s)

  const session = driver.session()
  try {
    // b.id IN $neighbors 조건 추가
    const cypher = `
      MATCH (a:Sample {id:$sampleId})-[:HAS_ASV]->(asv:ASV)<-[:HAS_ASV]-(b:Sample)
      WHERE a.id <> b.id
        ${neighbors.length ? 'AND b.id IN $neighbors' : ''}
      RETURN
        b.id                          AS neighbor,
        collect(DISTINCT asv.sequence) AS sequences
    `
    const params: any = { sampleId }
    if (neighbors.length) params.neighbors = neighbors

    const result = await session.run(cypher, params)
    await session.close()

    // 배열 형태로 리턴
    const data = result.records.map(r => ({
      neighbor:  r.get('neighbor'),
      sequences: r.get('sequences')
    }))
    return NextResponse.json(data)
  } catch (e) {
    await session.close()
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    )
  }
}
