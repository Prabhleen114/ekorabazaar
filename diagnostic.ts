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
  console.log("=== SELLER STATUS ===")
  const seller = await prisma.seller.findUnique({ where: { id: 'EKO-SELL-000001' } })
  console.log(seller)

  console.log("\n=== PRODUCTS SUMMARY ===")
  const totalProducts = await prisma.product.count()
  const publishedProducts = await prisma.product.count({ where: { status: 'PUBLISHED' } })
  const publishedByEkora = await prisma.product.count({ where: { status: 'PUBLISHED', sellerId: 'EKO-SELL-000001' } })
  console.log(`Total Products: ${totalProducts}`)
  console.log(`Published Products: ${publishedProducts}`)
  console.log(`Published by Ekora Technology: ${publishedByEkora}`)

  console.log("\n=== PRODUCT SAMPLE ===")
  const sampleProducts = await prisma.product.findMany({ take: 5, orderBy: { createdAt: 'desc' } })
  for (const p of sampleProducts) {
    console.log(`[${p.id}] ${p.title} | status:${p.status} | sellerId:${p.sellerId} | stock:${p.stock} | price:${p.price} | custPrice:${p.customerPrice}`)
    // I need to check if there's a category field! 
    console.log(`Category field value:`, (p as any).category)
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
