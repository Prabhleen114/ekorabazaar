import { PrismaClient, Role } from '@prisma/client'
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
  const seller = await prisma.seller.findUnique({
    where: { id: 'EKO-SELL-000001' },
    include: { user: true }
  })

  if (!seller) {
    console.log("Seller EKO-SELL-000001 not found!")
    return
  }

  if (!seller.user) {
    console.log("Seller EKO-SELL-000001 has no associated user!")
    return
  }

  const email = seller.user.email
  const newPassword = 'EkoraTech@123'
  const newPasswordHash = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: seller.user.id },
    data: { passwordHash: newPasswordHash, role: Role.SELLER }
  })

  console.log("--- CREDENTIALS ---")
  console.log(`Seller Name: ${seller.brandName}`)
  console.log(`Seller ID: ${seller.id}`)
  console.log(`Login Email: ${email}`)
  console.log(`Login Password: ${newPassword}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
