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
  const seller = await prisma.seller.update({
    where: { id: 'EKO-SELL-000001' },
    data: { brandName: 'Ekora Technology' }
  })
  
  // Also check if EKO-TECH-0001 was created and if so, delete it if it has 0 products
  try {
    const techSeller = await prisma.seller.findUnique({ where: { id: 'EKO-TECH-0001' }, include: { products: true } })
    if (techSeller && techSeller.products.length === 0) {
      await prisma.seller.delete({ where: { id: 'EKO-TECH-0001' } })
      console.log("Deleted unused EKO-TECH-0001 mock seller")
    }
  } catch(e) {}
  
  console.log("Updated seller EKO-SELL-000001 brandName to:", seller.brandName)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
