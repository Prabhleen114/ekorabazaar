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
    const { title, description, category, price, stock, moq, imageUrl, wholesaleTiers } = body

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

    const updateData: any = {
      ...(title && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(category !== undefined && { category: category?.trim() || null }),
      ...(stock !== undefined && { stock: parseInt(stock, 10) }),
      ...(moq !== undefined && { moq: parseInt(moq, 10) }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      ...(wholesaleTiers !== undefined && { wholesaleTiers: wholesaleTiers || null }),
    }

    // If it was rejected, editing safe fields doesn't necessarily make it draft, 
    // but usually editing a rejected product resubmits it or sets to draft.
    if (product.status === ProductStatus.REJECTED) {
      updateData.status = ProductStatus.DRAFT;
      updateData.rejectionReason = null;
    }

    // Handle Price Changes
    if (price !== undefined && parseInt(price, 10) !== product.price) {
      const newPrice = parseInt(price, 10);
      
      // If product is not yet approved/published, just update the price directly
      if (product.status === ProductStatus.DRAFT || product.status === ProductStatus.REJECTED) {
        updateData.price = newPrice;
      } else {
        // Product is PUBLISHED or PENDING_APPROVAL. Create a PriceChangeRequest.
        // Don't modify the live price.
        
        // Cancel any existing pending price requests for this product
        await prisma.priceChangeRequest.updateMany({
          where: { productId: product.id, status: 'PENDING' },
          data: { status: 'REJECTED', adminComment: 'Superseded by new request' }
        });

        // Create new request
        await prisma.priceChangeRequest.create({
          data: {
            productId: product.id,
            sellerId: product.sellerId!,
            oldPrice: product.price,
            requestedPrice: newPrice
          }
        });
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData
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
