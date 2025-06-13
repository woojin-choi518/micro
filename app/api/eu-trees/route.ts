// app/api/eu-trees/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const [trees, metrics, phylums] = await Promise.all([
      // your protected‐tree data
      prisma.treeSample.findMany({
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
      }),
      // sequencing metrics
      prisma.metric.findMany({
        orderBy: { id: 'asc' },
      }),
      // phylum abundance ranges
      prisma.phylumAbundance.findMany({
        orderBy: { id: 'asc' },
      }),
    ]);

    return NextResponse.json({ trees, metrics, phylums }, { status: 200 });
  } catch (err) {
    console.error('GET /api/eu-trees error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
