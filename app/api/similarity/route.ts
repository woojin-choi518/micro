// // app/api/similarity/route.ts
// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'
// import { driver } from '@/app/lib/neo4j'

// export async function GET(req: NextRequest) {
//   const biome      = req.nextUrl.searchParams.get('biome')    ?? ''
//   const minCount   = req.nextUrl.searchParams.get('minCount') ?? '1'
//   const limitPairs = req.nextUrl.searchParams.get('limitPairs') ?? '100'

//   const session = driver.session()
//   try {
//     console.log('▶ NEO4J_URI =', process.env.NEO4J_URI)
//     console.log('▶ NEO4J_USER =', process.env.NEO4J_USER)
//     const session = driver.session()
//     // ② 간단한 테스트 쿼리
//     const test = await session.run('RETURN 1 AS v')
//     console.log('▶ Neo4j test record:', test.records[0].get('v').toInt())
//     session.close()
//     const result = await session.run(
//       `
//       MATCH (a:Sample)-[r:SHARED_ASV]->(b:Sample)
//       WHERE ($biome = '' OR a.biome = $biome) AND r.count >= toInteger($minCount)
//       WITH a,b,r
//       ORDER BY r.count DESC
//       LIMIT toInteger($limitPairs)
//       WITH
//         collect(DISTINCT { id:a.id, biome:a.biome }) +
//         collect(DISTINCT { id:b.id, biome:b.biome }) AS nodes,
//         collect({ source:a.id, target:b.id, value:toInteger(r.count) }) AS rawLinks
//       RETURN nodes, rawLinks
//       `,
//       { biome, minCount, limitPairs }
//     )
//     await session.close()

//     if (!result.records.length)
//       return NextResponse.json({ nodes: [], links: [] })

//     const { nodes, rawLinks } = result.records[0].toObject()
//     const links = (rawLinks as any[]).map(l => ({
//       source: l.source,
//       target: l.target,
//       value: l.value.toNumber()
//     }))

//     return NextResponse.json({ nodes, links })
//   } catch (e) {
//     await session.close()
//     return NextResponse.json({ nodes: [], links: [], error:(e as Error).message }, { status:500 })
//   }
// }

// app/api/similarity/route.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { driver } from '@/app/lib/neo4j'

export async function GET(req : NextRequest) {
  const biome      = req.nextUrl.searchParams.get('biome')    ?? ''
  const minCount   = req.nextUrl.searchParams.get('minCount') ?? '1'
  const limitPairs = req.nextUrl.searchParams.get('limitPairs') ?? '100'

  // 1) 환경변수 로그
  console.log('▶ NEO4J_URI =', process.env.NEO4J_URI)
  console.log('▶ NEO4J_USER =', process.env.NEO4J_USER)

  const session = driver.session()
  try {
    // 2) 테스트 쿼리
    const test = await session.run('RETURN 1 AS v')
    console.log('▶ Neo4j test record:', test.records[0].get('v').toInt())

    // 3) 실제 로직
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

    // 4) 세션 닫기
    await session.close()

    // 5) 결과 파싱 후 응답
    if (!result.records.length)
      return NextResponse.json({ nodes: [], links: [] })

    const { nodes, rawLinks } = result.records[0].toObject()
    const links = rawLinks.map((l: any) => ({
      source: l.source,
      target: l.target,
      value: l.value.toNumber()
    }))

    return NextResponse.json({ nodes, links })

  } catch (e: any) {
    // 👉 에러를 반드시 찍어 봅니다
    console.error('❌ Neo4j 연결 에러:', e)
    await session.close()
    return NextResponse.json(
      { nodes: [], links: [], error: e.message },
      { status: 500 }
    )
  }
}
