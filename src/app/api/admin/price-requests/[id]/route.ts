import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    
    const body = await req.json().catch(() => ({}))
    const { action } = body // 'APPROVE' | 'REJECT'

    const priceReq = await prisma.priceChangeRequest.findUnique({ where: { id } })
    
    if (!priceReq) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }
    
    if (priceReq.status !== 'PENDING') {
      return NextResponse.json({ error: "Request is already processed" }, { status: 400 })
    }

    if (action === 'APPROVE') {
      // Execute in a transaction: Update request status and update product price
      await prisma.$transaction([
        prisma.priceChangeRequest.update({
          where: { id },
          data: { 
            status: 'APPROVED', 
            reviewedAt: new Date(),
            reviewedBy: admin.userId
          }
        }),
        prisma.product.update({
          where: { id: priceReq.productId },
          data: { price: priceReq.requestedPrice }
        })
      ])
    } else if (action === 'REJECT') {
      await prisma.priceChangeRequest.update({
        where: { id },
        data: { 
          status: 'REJECTED', 
          reviewedAt: new Date(),
          reviewedBy: admin.userId
        }
      })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Admin Price Request Error:", error)
    if (error.message.startsWith("FORBIDDEN") || error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
