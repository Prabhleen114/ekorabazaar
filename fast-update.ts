import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })
dotenv.config({ path: '.env.local' })

const connectionString = process.env.DIRECT_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Running fast SQL updates...")
  
  await prisma.$executeRawUnsafe(`UPDATE "Product" SET category = 'Culinary & Fondant Moulds' WHERE title ILIKE '%fondant%' OR title ILIKE '%baking%' OR title ILIKE '%cake%' OR title ILIKE '%chocolate%'`)
  await prisma.$executeRawUnsafe(`UPDATE "Product" SET category = 'Candle & Pillar Moulds' WHERE title ILIKE '%candle%' OR title ILIKE '%pillar%' OR title ILIKE '%wax%'`)
  await prisma.$executeRawUnsafe(`UPDATE "Product" SET category = 'Eco-Resin & Stone Moulds' WHERE title ILIKE '%concrete%' OR title ILIKE '%tray%' OR title ILIKE '%coaster%' OR title ILIKE '%dish%' OR title ILIKE '%resin%' OR title ILIKE '%jar%' OR title ILIKE '%planter%'`)
  await prisma.$executeRawUnsafe(`UPDATE "Product" SET category = 'Soap & Bar Moulds' WHERE title ILIKE '%soap%' OR title ILIKE '%bar%'`)
  
  // Set anything remaining that is still default or null to 'General Silicone Moulds'
  await prisma.$executeRawUnsafe(`UPDATE "Product" SET category = 'General Silicone Moulds' WHERE category IS NULL OR category = 'General'`)
  
  console.log("SQL Updates complete. Checking counts...")
  
  const grouped = await prisma.product.groupBy({
    by: ['category'],
    _count: { id: true }
  })
  
  console.log("Categories assigned:")
  console.log(grouped)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
