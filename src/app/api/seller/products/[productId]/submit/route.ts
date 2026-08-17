import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireSellerOwnership } from '@/lib/auth'
import { ProductStatus } from '@prisma/client'

export async function POST(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await params
    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { id: productId } })
    
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    
    // Explicit ownership check
    await requireSellerOwnership(product.sellerId!)

    // Only active sellers can submit
    const seller = await prisma.seller.findUnique({ where: { id: product.sellerId! } })
    if (!seller || seller.accountStatus !== 'ACTIVE') {
      return NextResponse.json({ error: "Your account must be active to submit products." }, { status: 403 })
    }

    if (product.status !== ProductStatus.DRAFT) {
      return NextResponse.json({ error: "Only DRAFT products can be submitted for approval." }, { status: 400 })
    }
    
    // Basic validation before submission
    if (!product.title || product.price <= 0) {
      return NextResponse.json({ error: "Product is incomplete and cannot be submitted." }, { status: 400 })
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        status: ProductStatus.PENDING_APPROVAL
      }
    })

    return NextResponse.json({ success: true, product: updatedProduct })
  } catch (error: any) {
    console.error("Submit Seller Product Error:", error)
    if (error.message.startsWith("FORBIDDEN") || error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
