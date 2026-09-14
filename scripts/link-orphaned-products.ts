import { PrismaClient, SellerAccountStatus, SellerApplicationStatus } from '@prisma/client'
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
  console.log('=== Step 1: Checking Official Active Seller ===')
  
  // Ensure default official seller exists and is ACTIVE
  let seller = await prisma.seller.findUnique({ where: { id: 'EKO-SELL-000001' } })
  if (!seller) {
    let adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: 'official@ekorabazaar.in',
          role: 'ADMIN'
        }
      })
    }
    seller = await prisma.seller.create({
      data: {
        id: 'EKO-SELL-000001',
        userId: adminUser.id,
        brandName: 'Ekora Technology',
        accountStatus: SellerAccountStatus.ACTIVE,
        applicationStatus: SellerApplicationStatus.APPROVED
      }
    })
    console.log('Created official seller: EKO-SELL-000001')
  } else if (seller.accountStatus !== SellerAccountStatus.ACTIVE) {
    seller = await prisma.seller.update({
      where: { id: 'EKO-SELL-000001' },
      data: {
        accountStatus: SellerAccountStatus.ACTIVE,
        applicationStatus: SellerApplicationStatus.APPROVED
      }
    })
    console.log('Updated seller EKO-SELL-000001 to ACTIVE')
  } else {
    console.log('Official seller EKO-SELL-000001 is already ACTIVE')
  }

  console.log('\n=== Step 2: Checking Product Counts ===')
  const totalInDb = await prisma.product.count()
  const publishedInDb = await prisma.product.count({ where: { status: 'PUBLISHED' } })
  const publishedWithNoSeller = await prisma.product.count({
    where: {
      status: 'PUBLISHED',
      OR: [{ sellerId: null }, { sellerId: '' }]
    }
  })
  const publishedWithActiveSeller = await prisma.product.count({
    where: {
      status: 'PUBLISHED',
      seller: { accountStatus: 'ACTIVE' }
    }
  })

  console.log(`Total Products in DB: ${totalInDb}`)
  console.log(`Published Products in DB: ${publishedInDb}`)
  console.log(`Published without Seller: ${publishedWithNoSeller}`)
  console.log(`Published with ACTIVE Seller: ${publishedWithActiveSeller}`)

  if (publishedWithNoSeller > 0) {
    console.log(`\n=== Step 3: Linking ${publishedWithNoSeller} orphaned products to EKO-SELL-000001 ===`)
    const updated = await prisma.product.updateMany({
      where: {
        status: 'PUBLISHED',
        OR: [{ sellerId: null }, { sellerId: '' }]
      },
      data: {
        sellerId: 'EKO-SELL-000001'
      }
    })
    console.log(`Successfully linked ${updated.count} products to EKO-SELL-000001!`)
  }

  const finalPublishedActive = await prisma.product.count({
    where: {
      status: 'PUBLISHED',
      seller: { accountStatus: 'ACTIVE' }
    }
  })
  console.log(`\nFinal Active Published Products: ${finalPublishedActive}`)
}

main()
  .catch(e => {
    console.error('Error linking orphaned products:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
