import fs from 'fs'
import { parse } from 'csv-parse/sync'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const file = fs.readFileSync('data/soil_metadata.csv')
  const records = parse(file, {
    columns: true,
    skip_empty_lines: true,
  }) as any[]

  const rawSamples = records.map((r) => ({
    id: r['#SampleID'],
    biome: r['env_biome'] || 'Unknown',
    feature: r['env_feature'] || null,
    type: r['sample_type'] || null,
    latitude: r['latitude'] ? parseFloat(r['latitude']) : null,
    longitude: r['longitude'] ? parseFloat(r['longitude']) : null,
    description: r['description'] || null,
  }))

  // ✅ 중복 제거 + 정확한 타입 지정
  const samples: Prisma.SampleCreateManyInput[] = Array.from(
    new Map(rawSamples.map((s) => [s.id, s])).values()
  )

  await prisma.sample.deleteMany()
  console.log('🗑️ All existing samples deleted.')
  await new Promise((res) => setTimeout(res, 1000))

  await prisma.sample.createMany({
    data: samples,
    skipDuplicates: true,
  })

  console.log(`✅ Inserted ${samples.length} unique samples into DB`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
