import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic'; // 동적 라우팅 명시
const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startYear = searchParams.get('startYear');
    const endYear = searchParams.get('endYear');

    // 쿼리 조건 구성
    const where: any = {
      latitude: { not: null },
      longitude: { not: null },
    };

    // startYear와 endYear가 제공된 경우 year 필터 추가
    if (startYear && endYear) {
      where.year = {
        gte: parseInt(startYear),
        lte: parseInt(endYear),
      };
    }

    const microbes = await prisma.polarMicrobe.findMany({
      where,
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
  } finally {
    await prisma.$disconnect();
  }
}