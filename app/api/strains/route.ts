// app/api/strains/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  const strains = await prisma.strain.findMany()
  return NextResponse.json(strains)
}
