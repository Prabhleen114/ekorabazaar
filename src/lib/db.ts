import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Ensure we don't create multiple instances during hot-reloads in development
let prisma: PrismaClient

if (!globalForPrisma.prisma) {
  const connectionString = process.env.DATABASE_URL
  if (connectionString) {
    const pool = new pg.Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    globalForPrisma.prisma = new PrismaClient({ adapter })
  } else {
    globalForPrisma.prisma = new PrismaClient()
  }
}

prisma = globalForPrisma.prisma

export default prisma
