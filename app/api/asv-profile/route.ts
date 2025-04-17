// ✅ API endpoint: /app/api/asv-profile/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const asvSeqs: string[] = body.asvSeqs

    if (!Array.isArray(asvSeqs) || asvSeqs.length === 0) {
      return NextResponse.json({ error: 'No ASV sequences provided' }, { status: 400 })
    }

    const results = await prisma.taxonomy.findMany({
      where: {
        asvSeq: { in: asvSeqs },
      },
    })

    return NextResponse.json(results)
  } catch (err) {
    console.error('Error in /api/asv-profile:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
