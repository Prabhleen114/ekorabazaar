import { PrismaClient, Role, SellerAccountStatus, SellerApplicationStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })
dotenv.config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = 'seller.test@ekorabazaar.in'
  const password = 'TestSeller@123'
  
  // Clean up if it already exists
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    await prisma.sellerBusiness.deleteMany({ where: { seller: { userId: existingUser.id } } })
    await prisma.product.deleteMany({ where: { seller: { userId: existingUser.id } } })
    await prisma.seller.deleteMany({ where: { userId: existingUser.id } })
    await prisma.user.delete({ where: { id: existingUser.id } })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: Role.SELLER,
      seller: {
        create: {
          id: 'EKO-TEST-' + Date.now(),
          brandName: 'Test Seller Brand',
          accountStatus: SellerAccountStatus.ACTIVE,
          applicationStatus: SellerApplicationStatus.APPROVED,
          businessDetails: {
            create: {
              legalName: 'Test Seller Business Ltd',
              businessType: 'SOLE_PROPRIETORSHIP',
              address: '123 Test Street, Test City',
              gstin: '22AAAAA0000A1Z5'
            }
          }
        }
      }
    },
    include: {
      seller: true
    }
  })

  console.log(`Successfully created test seller account: ${user.email} with Seller ID: ${user.seller?.id}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
