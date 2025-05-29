#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-commonjs */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

async function main() {
  const prisma = new PrismaClient()
  try {
    // top5_asv 까지 포함해서 내보내기
    const samples = await prisma.sample.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        sample_id: true,
        env_biome: true,
        env_feature: true,
        latitude: true,
        longitude: true,
        description: true,
        physical_specimen_remaining: true,
        top5_asv: true,            // ← 여기 추가
      },
    })

    const outFile = path.resolve(__dirname, '../public/samples.json')
    fs.writeFileSync(outFile, JSON.stringify(samples, null, 2), 'utf-8')
    console.log(`✅ Exported ${samples.length} samples to ${outFile}`)
  } catch (err) {
    console.error('❌ export-samples.js failed:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
