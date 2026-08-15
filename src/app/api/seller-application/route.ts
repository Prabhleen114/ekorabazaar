import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { SellerApplicationStatus } from '@prisma/client'

export async function POST(req: Request) {
  try {
    const session = await requireAuth()

    const body = await req.json()
    const { brandName, legalName, address, gstNumber, panNumber } = body

    // Create or update the seller application
    const seller = await prisma.seller.upsert({
      where: { userId: session.userId! },
      update: {
        brandName,
        applicationStatus: SellerApplicationStatus.PENDING_PAYMENT,
      },
      create: {
        userId: session.userId!,
        brandName,
        applicationStatus: SellerApplicationStatus.PENDING_PAYMENT,
      },
    })

    const business = await prisma.sellerBusiness.upsert({
      where: { sellerId: seller.id },
      update: {
        legalName,
        address,
        gstNumber,
        panNumber,
      },
      create: {
        sellerId: seller.id,
        legalName,
        address,
        gstNumber,
        panNumber,
      },
    })

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
