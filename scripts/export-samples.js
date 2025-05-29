// scripts/export-samples.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const data = await prisma.sample.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      sample_id: true,
      env_biome: true,
      env_feature: true,
      description: true,
      latitude: true,
      longitude: true,
    }
  });

  const out = path.join(process.cwd(), 'public', 'samples.json');
  fs.writeFileSync(out, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ Exported ${data.length} samples to ${out}`);
}

main()
  .catch(err => {
    console.error('❌ export-samples failed:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
