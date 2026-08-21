import { PrismaClient, Role, SellerAccountStatus, SellerApplicationStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })
dotenv.config({ path: '.env.local' })

const connectionString = process.env.DIRECT_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = 'admin@ekoratech.com'
  
  let user = await prisma.user.findUnique({ where: { email }, include: { seller: true } })
  if (!user) {
    const passwordHash = await bcrypt.hash('EkoraAdmin@123', 10)
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: Role.ADMIN,
      },
      include: { seller: true }
    })
  }

  let seller = await prisma.seller.findFirst({ where: { brandName: 'Ekora Technology' } })
  if (!seller) {
    seller = await prisma.seller.create({
      data: {
        id: 'EKO-TECH-0001',
        userId: user.id,
        brandName: 'Ekora Technology',
        accountStatus: SellerAccountStatus.ACTIVE,
        applicationStatus: SellerApplicationStatus.APPROVED,
      }
    })
  }

  const orphanedProducts = await prisma.product.findMany({
    where: {
      OR: [
        { sellerId: null },
        { sellerId: "" }
      ]
    }
  })

  console.log(`Found ${orphanedProducts.length} orphaned products.`)

  if (orphanedProducts.length > 0) {
    const res = await prisma.product.updateMany({
      where: {
        OR: [
          { sellerId: null },
          { sellerId: "" }
        ]
      },
      data: {
        sellerId: seller.id
      }
    })
    console.log(`Updated ${res.count} products to belong to Ekora Technology (${seller.id})`)
  }

  console.log(`Ekora Technology Seller ID: ${seller.id}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
