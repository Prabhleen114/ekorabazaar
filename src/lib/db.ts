import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined }

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    // Determine the best direct database connection string.
    // Prefer DATABASE_URL (which connects to the transaction pooler, port 6543)
    // Avoid DIRECT_URL or session poolers in serverless/production runtime to prevent EMAXCONNSESSION.
    let connectionString = process.env.DATABASE_URL
    if (!connectionString || connectionString.startsWith('prisma://')) {
      connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DIRECT_URL
    }

    if (!connectionString) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('CRITICAL CONFIG ERROR: Database connection string is missing in production.')
      }
    }
    let finalConnectionString = connectionString || "postgresql://postgres:postgres@localhost:5432/placeholder"

    // If using Supabase pooler on port 5432 (session mode), automatically use port 6543 (transaction mode)
    // for runtime queries with pg.Pool to prevent the 15-connection max limit
    if (finalConnectionString.includes('pooler.supabase.com:5432')) {
      finalConnectionString = finalConnectionString.replace(':5432', ':6543')
    }

    const isLocalhost = finalConnectionString.includes('localhost') || finalConnectionString.includes('127.0.0.1')
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || process.env.npm_lifecycle_event === 'build'
    const maxPoolSize = isBuildPhase ? 1 : 2

    const pool = new pg.Pool({
      connectionString: finalConnectionString,
      max: maxPoolSize,
      connectionTimeoutMillis: 20000,
      idleTimeoutMillis: 30000,
      ssl: isLocalhost ? false : { rejectUnauthorized: false }
    })
    const adapter = new PrismaPg(pool)
    globalForPrisma.prisma = new PrismaClient({ adapter })
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
