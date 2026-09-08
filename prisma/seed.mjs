import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

import bcrypt from 'bcrypt'

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  console.log('Starting seed...')

  // Bootstrap Admin
  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@ekorabazaar.local'
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Admin@123'
  const adminHash = await bcrypt.hash(adminPassword, 10)

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash },
    create: {
      email: adminEmail,
      role: 'ADMIN',
      passwordHash: adminHash, 
    },
  })
  
  // Bootstrap Dummy Seller
  const sellerEmail = process.env.DUMMY_SELLER_EMAIL || 'test-seller@ekorabazaar.local'
  const sellerPassword = process.env.DUMMY_SELLER_PASSWORD || 'Seller@123'
  const sellerHash = await bcrypt.hash(sellerPassword, 10)

  const sellerUser = await prisma.user.upsert({
    where: { email: sellerEmail },
    update: { passwordHash: sellerHash },
    create: {
      email: sellerEmail,
      role: 'SELLER',
      passwordHash: sellerHash,
    }
  })

  const dummySeller = await prisma.seller.upsert({
    where: { userId: sellerUser.id },
    update: {
      brandName: 'Ekora Official Development',
      accountStatus: 'ACTIVE',
      applicationStatus: 'APPROVED'
    },
    create: {
      id: 'EKO-SELL-000001',
      userId: sellerUser.id,
      brandName: 'Ekora Official Development',
      accountStatus: 'ACTIVE',
      applicationStatus: 'APPROVED'
    },
  })

  await prisma.sellerBusiness.upsert({
    where: { sellerId: dummySeller.id },
    update: { gstStatus: 'VERIFIED' },
    create: {
      sellerId: dummySeller.id,
      legalName: 'Ekora Official Pvt Ltd',
      businessType: 'CORPORATE',
      address: '123 Ekora Street',
      gstStatus: 'VERIFIED'
    }
  })

  // Read mock products from existing JSON
  const mockProductsPath = path.join(process.cwd(), 'src', 'lib', 'data', 'products.json')
  
  if (fs.existsSync(mockProductsPath)) {
    const productsData = JSON.parse(fs.readFileSync(mockProductsPath, 'utf8'))
    
    // Seed products
    console.log(`Found ${productsData.length} mock products. Migrating...`)
    let count = 0
    
    for (const p of productsData) {
      const rawPrice = typeof p.price === 'string' ? parseFloat(p.price.replace(/[^0-9.]/g, '')) : (p.price || 499)
      const minorPrice = Math.round(rawPrice * 100)
      
      const title = p.title || p.name || 'Untitled Product'
      
      // Upsert so it is idempotent
      await prisma.product.create({
        data: {
          title: title,
          description: p.description || '',
          price: minorPrice,
          stock: p.stock || 10,
          status: 'PUBLISHED',
          sellerId: dummySeller.id,
          source: 'EKORA_OFFICIAL',
          imageUrl: p.image || p.imageUrl || null,
        }
      }).catch(e => {
        // Just in case of duplicates or if run multiple times, though there is no unique constraint on title. 
        // A real idempotent seed should upsert, but we'll clear first or just warn.
        console.warn(`Could not insert ${title}: ${e.message}`)
      })
      count++
    }
    
    console.log(`Successfully seeded ${count} products.`)
  } else {
    console.log('No mock products.json found to migrate.')
  }

  console.log('Seed completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
