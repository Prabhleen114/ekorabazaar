import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

async function checkAdmin() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
  const pool = new pg.Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    const adminEmail = process.env.ADMIN_SEED_EMAIL
    if (!adminEmail) {
      console.log('ADMIN_SEED_EMAIL not found in env')
      return
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (adminUser) {
      console.log(`User found: ${adminUser.email}`)
      console.log(`Role: ${adminUser.role}`)
      console.log(`Hash Length: ${adminUser.passwordHash?.length}`)
      console.log(`Is Bcrypt Hash: ${adminUser.passwordHash?.startsWith('$2b$')}`)
    } else {
      console.log('Admin user not found.')
    }
  } catch (e) {
    console.error(e)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()
