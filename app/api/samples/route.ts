import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  try {
    if (id) {
      const sample = await prisma.sample.findUnique({
        where: { id },
      })
      return NextResponse.json(sample)
    }

    const samples = await prisma.sample.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(samples)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const sample = await prisma.sample.create({ data })
    return NextResponse.json(sample)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 