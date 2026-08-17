import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { ProductStatus } from '@prisma/client'

export async function POST(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const session = await requireAdmin()
    const { productId } = await params
    const body = await req.json().catch(() => ({}))
    const { rejectionReason } = body

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 })
    }
    
    if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim().length === 0) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        status: ProductStatus.REJECTED,
        rejectionReason: rejectionReason.trim()
      }
    })

    await logAudit(session.userId!, 'ADMIN_REJECT_PRODUCT', productId, {
      reason: rejectionReason
    })

    return NextResponse.json({ success: true, product: updatedProduct })
  } catch (error: any) {
    console.error("Admin Reject Product Error:", error)
    if (error.message.startsWith("FORBIDDEN") || error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
