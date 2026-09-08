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
  console.log("Fetching products...")
  const products = await prisma.product.findMany({ select: { id: true, title: true, category: true } })
  console.log(`Found ${products.length} products. Categorizing...`)

  let updated = 0
  
  // We'll update in batches for speed
  for (const p of products) {
    const t = p.title.toLowerCase()
    let newCategory = "General Silicone Moulds"
    
    if (t.includes("fondant") || t.includes("baking") || t.includes("cake") || t.includes("chocolate")) {
      newCategory = "Culinary & Fondant Moulds"
    } else if (t.includes("candle") || t.includes("pillar") || t.includes("wax")) {
      newCategory = "Candle & Pillar Moulds"
    } else if (t.includes("concrete") || t.includes("tray") || t.includes("coaster") || t.includes("dish") || t.includes("resin") || t.includes("jar") || t.includes("planter")) {
      newCategory = "Eco-Resin & Stone Moulds"
    } else if (t.includes("soap") || t.includes("bar")) {
      newCategory = "Soap & Bar Moulds"
    }
    
    if (p.category !== newCategory) {
      await prisma.product.update({
        where: { id: p.id },
        data: { category: newCategory }
      })
      updated++
      if (updated % 500 === 0) console.log(`Updated ${updated} products...`)
    }
  }
  
  console.log(`Finished! Updated ${updated} products categories based on title mapping.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
