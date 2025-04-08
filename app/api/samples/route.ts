// app/api/samples/route.ts
import { prisma } from '@/app/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const samples = await prisma.sample.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500
  })

  return NextResponse.json(samples)
}
