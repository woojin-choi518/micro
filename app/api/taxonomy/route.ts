import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const asvSeq = searchParams.get('asvSeq')
  const query = searchParams.get('query')

  try {
    if (asvSeq) {
      const taxonomy = await prisma.taxonomy.findUnique({
        where: { asvSeq },
      })
      return NextResponse.json(taxonomy)
    }

    if (query) {
      const results = await prisma.taxonomy.findMany({
        where: {
          OR: [
            { domain: { contains: query } },
            { phylum: { contains: query } },
            { class: { contains: query } },
            { order: { contains: query } },
            { family: { contains: query } },
            { genus: { contains: query } },
            { species: { contains: query } },
          ],
        },
      })
      return NextResponse.json(results)
    }

    const taxonomy = await prisma.taxonomy.findMany()
    return NextResponse.json(taxonomy)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 