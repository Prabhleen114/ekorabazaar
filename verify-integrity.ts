import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config({ path: '.env' })
dotenv.config({ path: '.env.local' })

const connectionString = process.env.DIRECT_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("=== 1. DATABASE INTEGRITY ===")
  const total = await prisma.product.count()
  console.log(`Total Products: ${total}`)
  
  const statusCounts = await prisma.product.groupBy({ by: ['status'], _count: { id: true } })
  console.log(`By Status:`, statusCounts)
  
  const sellerCounts = await prisma.product.groupBy({ by: ['sellerId'], _count: { id: true } })
  console.log(`By Seller ID:`, sellerCounts)
  
  const categoryCounts = await prisma.product.groupBy({ by: ['category'], _count: { id: true } })
  console.log(`By Category:`, categoryCounts)
  
  const nullCategory = await prisma.product.count({ where: { category: null } })
  console.log(`NULL Category: ${nullCategory}`)
  
  const nullSeller = await prisma.product.count({ where: { sellerId: null } })
  console.log(`NULL Seller ID: ${nullSeller}`)
  
  const inactiveSellerProducts = await prisma.product.count({ where: { seller: { accountStatus: { not: 'ACTIVE' } } } })
  console.log(`Inactive Seller Products: ${inactiveSellerProducts}`)
  
  const publishedNoValidSeller = await prisma.product.count({ where: { status: 'PUBLISHED', seller: null } })
  console.log(`PUBLISHED but no seller: ${publishedNoValidSeller}`)

  console.log("\n=== 2. CATEGORY SAMPLES ===")
  const categories = [
    "Soap & Bar Moulds", "General Silicone Moulds", "Culinary & Fondant Moulds", 
    "Candle & Pillar Moulds", "Eco-Resin & Stone Moulds"
  ]
  
  for (const cat of categories) {
    console.log(`\n-- ${cat} --`)
    const samples = await prisma.product.findMany({ where: { category: cat }, take: 10, select: { title: true, category: true } })
    samples.forEach(s => console.log(`  ${s.title}`))
  }

  console.log("\n=== 6. NON-PUBLISHED PRODUCT ===")
  const nonPub = await prisma.product.findFirst({ where: { status: { not: 'PUBLISHED' } }, include: { seller: true } })
  if (nonPub) {
    console.log(`ID: ${nonPub.id} | Name: ${nonPub.title} | Status: ${nonPub.status} | Seller: ${nonPub.seller?.brandName} (${nonPub.sellerId})`)
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
