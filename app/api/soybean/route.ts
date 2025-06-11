// app/api/locations/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET 메서드가 호출되었을 때 동작하는 핸들러
export async function GET() {
  try {
    // Prisma를 통해 LocationInfo 테이블의 원하는 컬럼만 뽑아온다
    const soybean = await prisma.locationInfo.findMany({
      select: {
        location: true,
        city: true,
        latitude: true,
        longitude: true,
        species: true,
        yield_g: true,
        diversity: true,
        main_microbiome: true,
        contribution: true,
      },
    });

    // JSON 형태로 반환
    return NextResponse.json(soybean, { status: 200 });
  } catch (error) {
    console.error('API /api/soybean error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch soybean' },
      { status: 500 }
    );
  } finally {
    // Prisma 연결 정리
    await prisma.$disconnect();
  }
}
