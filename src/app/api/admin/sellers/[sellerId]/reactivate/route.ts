import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { SellerApplicationStatus, SellerAccountStatus } from '@prisma/client'

export async function POST(req: Request, { params }: { params: Promise<{ sellerId: string }> }) {
  try {
    const session = await requireAdmin()
    const { sellerId } = await params

    if (!sellerId) {
      return NextResponse.json({ error: "Missing sellerId" }, { status: 400 })
    }

    const seller = await prisma.seller.findUnique({ where: { id: sellerId } })
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 })
    }
    
    if (seller.applicationStatus !== SellerApplicationStatus.APPROVED) {
       return NextResponse.json({ error: "Cannot reactivate a seller who is not approved" }, { status: 400 })
    }

    const updatedSeller = await prisma.seller.update({
      where: { id: sellerId },
      data: {
        accountStatus: SellerAccountStatus.ACTIVE,
      }
    })

    await logAudit(session.userId!, 'ADMIN_REACTIVATE_SELLER', sellerId, {
      oldAccStatus: seller.accountStatus
    })

    return NextResponse.json({ success: true, seller: updatedSeller })
  } catch (error: any) {
    console.error("Admin Reactivate Seller Error:", error)
    if (error.message.startsWith("FORBIDDEN") || error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
