import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'
import { spawn } from 'child_process'

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const delay = (ms) => new Promise(res => setTimeout(res, ms))

async function main() {
  console.log('1. Cleaning up DB...')
  const email = 'e2e_test@ekorabazaar.local'
  const password = 'SecurePassword123'
  await prisma.user.deleteMany({ where: { email } })

  console.log('2. Starting Next.js production server...')
  const server = spawn('npm.cmd', ['start'], { stdio: 'pipe' })
  
  await delay(6000)

  try {
    console.log('3. Simulating Onboarding Submission (POST /api/seller-application)...')
    const onboardRes = await fetch('http://localhost:3000/api/seller-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        brandName: 'E2E Test Brand',
        legalName: 'E2E Test Inc',
        address: '123 Test St',
        gstNumber: '22AAAAA0000A1Z5'
      })
    })

    if (!onboardRes.ok) {
      throw new Error(`Onboarding failed: ${onboardRes.statusText}`)
    }
    const onboardData = await onboardRes.json()
    console.log('Onboarding success:', onboardData)

    console.log('4. Verifying DB state...')
    const user = await prisma.user.findUnique({ where: { email }, include: { seller: true } })
    
    if (!user) throw new Error('User not found in DB')
    if (user.role !== 'SELLER') throw new Error(`Role is ${user.role}, expected SELLER`)
    if (!user.passwordHash) throw new Error('Password is not hashed')
    if (user.seller.accountStatus !== 'DISABLED') throw new Error(`Seller accountStatus is ${user.seller.accountStatus}, expected DISABLED`)
    console.log('DB Verification passed!')

    console.log('5. Simulating Creator Login (POST /api/auth/login)...')
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.statusText}`)
    }
    
    const cookies = loginRes.headers.get('set-cookie')
    if (!cookies || !cookies.includes('session=')) {
      throw new Error('No session cookie set!')
    }

    const loginData = await loginRes.json()
    console.log('Login success! Redirecting to:', loginData.redirectTo)

    console.log('? All E2E checks passed successfully!')
  } catch (error) {
    console.error('? E2E Test Failed:', error.message)
  } finally {
    console.log('Killing server...')
    server.kill()
    await prisma.()
    process.exit(0)
  }
}

main()
