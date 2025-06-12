// app/api/trees/route.ts

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const samples = await prisma.treeSample.findMany({
      select: {
        id: true,
        group: true,
        area: true,
        latitude: true,
        longitude: true,
        declineSymptoms: true,
        replicates: true,
        springSampling: true,
        summerSampling: true,
        compartments: true,
        microorganisms: true,
      },
      orderBy: { id: 'asc' },
    })

    // Date → ISO 문자열로 변환
    const payload = samples.map(s => ({
      ...s,
      springSampling: s.springSampling.toISOString(),
      summerSampling: s.summerSampling.toISOString(),
    }))

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    console.error('API /api/trees error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tree samples' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
