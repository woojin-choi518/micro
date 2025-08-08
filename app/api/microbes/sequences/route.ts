import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get('latitude') || '');
    const longitude = parseFloat(searchParams.get('longitude') || '');

    if (isNaN(latitude) || isNaN(longitude)) {
      return new NextResponse('Invalid latitude or longitude', { status: 400 });
    }

    const records = await prisma.polarMicrobe.findMany({
      where: {
        latitude,
        longitude,
      },
      select: {
        id: true,
        sequence: true,
      },
    });

    const seqMap = records.reduce<Record<string, string | null>>((acc, { id, sequence }) => {
      acc[id] = sequence;
      return acc;
    }, {});

    return new NextResponse(JSON.stringify(seqMap), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // CORS 허용 (개발용)
      },
    });
  } catch (error) {
    console.error('Sequence API Error:', error);
    return new NextResponse('Failed to fetch sequences', { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}