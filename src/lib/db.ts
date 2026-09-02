import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined }

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    // Determine the best direct database connection string.
    // If Vercel sets DATABASE_URL to a prisma:// accelerate URL, we bypass it for adapter-pg.
    // DIRECT_URL and POSTGRES_URL_NON_POOLING are standard fallbacks for direct PostgreSQL.
    // We prefer DATABASE_URL (transaction-mode pooler) because we use pg.Pool.
    // DIRECT_URL should only be used by prisma migrate.
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DIRECT_URL

    if (connectionString && !connectionString.startsWith('prisma://')) {
      const pool = new pg.Pool({ connectionString, max: 2 }) // limit pool size for build
      const adapter = new PrismaPg(pool)
      globalForPrisma.prisma = new PrismaClient({ adapter })
    } else {
      // Initialize normally to prevent build-time constructor crashes.
      // If DATABASE_URL is truly missing or is an unhandled accelerate URL,
      // actual DB queries at runtime will gracefully throw connection errors.
      globalForPrisma.prisma = new PrismaClient()
    }
  }
  return globalForPrisma.prisma
}

// Safely export a lazy proxy. Next.js statically collects routes at build time, 
// which imports this file. Deferring instantiation ensures production builds never crash 
// due to unavailable DB connections during static analysis.
const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    if (prop === 'then') {
      return undefined; // Bypass promise resolution checks
    }
    const client = getPrismaClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

export default prisma
