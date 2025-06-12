// pages/api/trees.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const trees = await prisma.protectedTree.findMany({
      select: { 
          provinceName: true,
          districtName: true,
          managingAgency: true,
          designationNumber: true,
          protectionDesignationDate: true,
          scientificName: true,
          treeCategory: true,
          treeAge: true,
          roadNameAddress: true,
          latitude: true, 
          longitude: true }
    });
  return NextResponse.json(trees, { status: 200 });
  } catch (error) {
    console.error('API /api/trees error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trees' },
      { status: 500 }
    );
  } finally {
    // Prisma 연결 정리
    await prisma.$disconnect();
  }
}