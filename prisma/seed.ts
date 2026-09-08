import { PrismaClient, Role, SellerAccountStatus, SellerApplicationStatus } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create a default admin user and EKORA_OFFICIAL seller
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ekorabazaar.local' },
    update: {},
    create: {
      email: 'admin@ekorabazaar.local',
      role: Role.ADMIN,
      passwordHash: 'dummy_hash', // In real system, this would be properly hashed
    },
  })
  
  // Also create a dummy seller user
  const sellerUser = await prisma.user.upsert({
    where: { email: 'test-seller@ekorabazaar.local' },
    update: {},
    create: {
      email: 'test-seller@ekorabazaar.local',
      role: Role.SELLER,
      passwordHash: 'dummy_hash',
    }
  })

  const dummySeller = await prisma.seller.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      id: 'EKO-SELL-000001',
      userId: sellerUser.id,
      brandName: 'Ekora Official',
      accountStatus: SellerAccountStatus.ACTIVE,
      applicationStatus: SellerApplicationStatus.APPROVED,
    },
  })

  // Read mock products from existing JSON
  const mockProductsPath = path.join(process.cwd(), 'src', 'lib', 'data', 'products.json')
  
  if (fs.existsSync(mockProductsPath)) {
    const productsData = JSON.parse(fs.readFileSync(mockProductsPath, 'utf8'))
    
    // Seed products
    console.log(`Found ${productsData.length} mock products. Migrating...`)
    let count = 0
    
    for (const p of productsData) {
      // Create a predictable ID or use the one from JSON if it has one.
      const rawPrice = typeof p.price === 'string' ? parseFloat(p.price.replace(/[^0-9.]/g, '')) : (p.price || 499)
      const minorPrice = Math.round(rawPrice * 100) // Convert to paise
      
      const title = p.title || p.name || 'Untitled Product'
      
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
