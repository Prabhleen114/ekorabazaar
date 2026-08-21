import { PrismaClient, GSTStatus } from '@prisma/client'
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
  const sellerId = 'EKO-SELL-000001'

  const seller = await prisma.seller.findUnique({
    where: { id: sellerId },
    include: { businessDetails: true, user: true, _count: { select: { products: true } } }
  })

  if (!seller) {
    console.log("Seller EKO-SELL-000001 not found!")
    return
  }

  // Ensure SellerBusiness exists and update
  const updatedBusiness = await prisma.sellerBusiness.upsert({
    where: { sellerId: sellerId },
    update: {
      legalName: 'EKORA TECHNOLOGIES',
      businessType: 'PARTNERSHIP', // Usually mapped from 'Constitution of Business'
      address: 'N/A, Islam Pur Road, Shyam Mandir, ISLAMPUR POKHAR RAM LAL LANE, Muzaffarpur, Muzaffarpur, Bihar, 842001, India',
      gstin: '10AAHFE1465G1ZR',
      gstStatus: GSTStatus.VERIFIED, // Mapped from 'Active'
      
      tradeName: 'EKORA TECHNOLOGIES',
      taxpayerType: 'Regular',
      constitutionOfBusiness: 'Partnership',
      gstRegistrationDate: '02/07/2026',
      
      city: 'Muzaffarpur',
      district: 'Muzaffarpur',
      state: 'Bihar',
      pincode: '842001',
      country: 'India',
      addressType: 'Principal Place of Business',
      
      natureOfBusiness: ['Retail Business', 'Import', 'Export', 'Supplier of Services', 'Others']
    },
    create: {
      sellerId: sellerId,
      legalName: 'EKORA TECHNOLOGIES',
      businessType: 'PARTNERSHIP',
      address: 'N/A, Islam Pur Road, Shyam Mandir, ISLAMPUR POKHAR RAM LAL LANE, Muzaffarpur, Muzaffarpur, Bihar, 842001, India',
      gstin: '10AAHFE1465G1ZR',
      gstStatus: GSTStatus.VERIFIED,
      
      tradeName: 'EKORA TECHNOLOGIES',
      taxpayerType: 'Regular',
      constitutionOfBusiness: 'Partnership',
      gstRegistrationDate: '02/07/2026',
      
      city: 'Muzaffarpur',
      district: 'Muzaffarpur',
      state: 'Bihar',
      pincode: '842001',
      country: 'India',
      addressType: 'Principal Place of Business',
      
      natureOfBusiness: ['Retail Business', 'Import', 'Export', 'Supplier of Services', 'Others']
    }
  })

  console.log("--- UPDATED SELLER DETAILS ---")
  console.log(`Seller ID: ${seller.id}`)
  console.log(`Seller Display Name: ${seller.brandName}`)
  console.log(`Legal Business Name: ${updatedBusiness.legalName}`)
  console.log(`GSTIN: ${updatedBusiness.gstin}`)
  console.log(`GST Status: ${updatedBusiness.gstStatus}`)
  console.log(`Registered Address: ${updatedBusiness.address}`)
  console.log(`Number of linked products: ${seller._count.products}`)
  console.log(`Login email linked to this seller: ${seller.user.email}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
