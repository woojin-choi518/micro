// ✅ 1. API Route: app/api/microbes/route.ts
// Fetch PolarMicrobe data from DB and return as JSON
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const microbes = await prisma.polarMicrobe.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        ncbi_id: true,
        organism: true,
        latitude: true,
        longitude: true,
        collection_date: true,
        sequence: true,
        year: true,
      },
    });
    return NextResponse.json(microbes);
  } catch (error) {
    console.error('API Error:', error);
    return new NextResponse('Failed to fetch microbes', { status: 500 });
  }
}