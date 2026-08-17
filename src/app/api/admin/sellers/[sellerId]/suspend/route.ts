import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { SellerAccountStatus } from '@prisma/client'

export async function POST(req: Request, { params }: { params: Promise<{ sellerId: string }> }) {
  try {
    const session = await requireAdmin()
    const { sellerId } = await params
    const body = await req.json().catch(() => ({}))
    const { reason } = body

    if (!sellerId) {
      return NextResponse.json({ error: "Missing sellerId" }, { status: 400 })
    }
    
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ error: "Suspension reason is required" }, { status: 400 })
    }

    const seller = await prisma.seller.findUnique({ where: { id: sellerId } })
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 })
    }

    const updatedSeller = await prisma.seller.update({
      where: { id: sellerId },
      data: {
        accountStatus: SellerAccountStatus.DISABLED,
      }
    })

    await logAudit(session.userId!, 'ADMIN_SUSPEND_SELLER', sellerId, {
      reason: reason.trim(),
      oldAccStatus: seller.accountStatus
    })

    return NextResponse.json({ success: true, seller: updatedSeller })
  } catch (error: any) {
    console.error("Admin Suspend Seller Error:", error)
    if (error.message.startsWith("FORBIDDEN") || error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
