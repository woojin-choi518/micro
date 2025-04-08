import { prisma } from './prisma'

export async function getSamples() {
  return await prisma.sample.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500
  })
}