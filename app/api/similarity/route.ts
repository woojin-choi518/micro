// app/api/similarity/route.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { driver } from '@/app/lib/neo4j'

export async function GET(req: NextRequest) {
  const biome      = req.nextUrl.searchParams.get('biome')    ?? ''
  const minCount   = req.nextUrl.searchParams.get('minCount') ?? '1'
  const limitPairs = req.nextUrl.searchParams.get('limitPairs') ?? '100'

  const session = driver.session()
  try {
    const result = await session.run(
      `
      MATCH (a:Sample)-[r:SHARED_ASV]->(b:Sample)
      WHERE ($biome = '' OR a.biome = $biome) AND r.count >= toInteger($minCount)
      WITH a,b,r
      ORDER BY r.count DESC
      LIMIT toInteger($limitPairs)
      WITH
        collect(DISTINCT { id:a.id, biome:a.biome }) +
        collect(DISTINCT { id:b.id, biome:b.biome }) AS nodes,
        collect({ source:a.id, target:b.id, value:toInteger(r.count) }) AS rawLinks
      RETURN nodes, rawLinks
      `,
      { biome, minCount, limitPairs }
    )
    await session.close()

    if (!result.records.length)
      return NextResponse.json({ nodes: [], links: [] })

    const { nodes, rawLinks } = result.records[0].toObject()
    const links = (rawLinks as any[]).map(l => ({
      source: l.source,
      target: l.target,
      value: l.value.toNumber()
    }))

    return NextResponse.json({ nodes, links })
  } catch (e) {
    await session.close()
    return NextResponse.json({ nodes: [], links: [], error:(e as Error).message }, { status:500 })
  }
}
