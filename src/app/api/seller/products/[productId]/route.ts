import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireSellerOwnership } from '@/lib/auth'
import { ProductStatus } from '@prisma/client'

export async function PATCH(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await params
    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const { title, description, price, stock, imageUrl } = body

    // Verify ownership implicitly by fetching product
    const product = await prisma.product.findUnique({ where: { id: productId } })
    
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    
    // Explicit ownership check
    await requireSellerOwnership(product.sellerId!)

    // Only active sellers can edit
    const seller = await prisma.seller.findUnique({ where: { id: product.sellerId! } })
    if (!seller || seller.accountStatus !== 'ACTIVE') {
      return NextResponse.json({ error: "Your account must be active to edit products." }, { status: 403 })
    }

    // Rules: Seller can only edit DRAFT or REJECTED products
    if (product.status !== ProductStatus.DRAFT && product.status !== ProductStatus.REJECTED) {
      return NextResponse.json({ error: "You can only edit products that are in DRAFT or REJECTED status." }, { status: 400 })
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(price !== undefined && { price: parseInt(price, 10) }),
        ...(stock !== undefined && { stock: parseInt(stock, 10) }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        // If it was rejected, editing returns it to DRAFT
        ...(product.status === ProductStatus.REJECTED && { 
            status: ProductStatus.DRAFT, 
            rejectionReason: null 
        })
      }
    })

    return NextResponse.json({ success: true, product: updatedProduct })
  } catch (error: any) {
    console.error("Edit Seller Product Error:", error)
    if (error.message.startsWith("FORBIDDEN") || error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
