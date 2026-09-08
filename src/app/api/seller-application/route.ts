import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession, createSession } from '@/lib/session'
import { requireAuth } from '@/lib/auth'
import { SellerApplicationStatus, SellerAccountStatus } from '@prisma/client'
import bcrypt from 'bcrypt'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    const body = await req.json()
    const { brandName, legalName, address, gstNumber, panNumber, email, password } = body

    let currentUserId = session?.userId

    // If not authenticated, we must create a new user account
    if (!currentUserId) {
      if (!email || !password) {
        return NextResponse.json({ error: "Authentication required or missing account creation fields." }, { status: 400 })
      }

      // Check for duplicate email
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) {
        return NextResponse.json({ error: "An account with this email already exists. Please log in." }, { status: 409 })
      }

      // Hash password and create User
      const passwordHash = await bcrypt.hash(password, 10)
      const newUser = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: 'SELLER'
        }
      })

      currentUserId = newUser.id
    }

    // Create or update the seller application
    const seller = await prisma.seller.upsert({
      where: { userId: currentUserId },
      update: {
        brandName,
        applicationStatus: SellerApplicationStatus.UNDER_REVIEW,
      },
      create: {
        id: `EKO-SELL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        userId: currentUserId,
        brandName,
        applicationStatus: SellerApplicationStatus.UNDER_REVIEW,
        accountStatus: SellerAccountStatus.DISABLED,
      },
    })

    const business = await prisma.sellerBusiness.upsert({
      where: { sellerId: seller.id },
      update: {
        legalName,
        address,
        gstin: gstNumber || panNumber || '',
      },
      create: {
        sellerId: seller.id,
        legalName,
        businessType: 'INDIVIDUAL', // default or extract from body if available
        address,
        gstin: gstNumber || panNumber || '',
      },
    })

    // Do NOT automatically create a session.
    // The creator must manually log in from the success page.

    return NextResponse.json({ success: true, sellerId: seller.id, status: seller.applicationStatus })
  } catch (error: any) {
    console.error("Seller Application API Error:", error)
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await requireAuth()

    const seller = await prisma.seller.findUnique({
      where: { userId: session.userId! },
      include: { businessDetails: true }
    })

    if (!seller) {
      return NextResponse.json({ error: "Seller application not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, application: seller })
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
