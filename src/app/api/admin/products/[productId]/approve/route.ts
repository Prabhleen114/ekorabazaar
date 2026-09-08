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
    
    // Admin can supply an optional customerPrice
    const customerPrice = body.customerPrice ? parseInt(body.customerPrice, 10) : undefined

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (product.status !== ProductStatus.PENDING_APPROVAL) {
      return NextResponse.json({ error: "Product is not pending approval" }, { status: 400 })
    }

    let finalCustomerPrice = product.price
    if (customerPrice !== undefined) {
       if (isNaN(customerPrice) || customerPrice <= 0) {
         return NextResponse.json({ error: "Invalid customerPrice provided" }, { status: 400 })
       }
       finalCustomerPrice = customerPrice
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        status: ProductStatus.PUBLISHED,
        customerPrice: finalCustomerPrice
      }
    })

    await logAudit(session.userId!, 'ADMIN_APPROVE_PRODUCT', productId, {
      sellerPrice: product.price,
      customerPrice: finalCustomerPrice
    })
    
    if (finalCustomerPrice !== product.price) {
        await logAudit(session.userId!, 'ADMIN_PRICE_CHANGE', productId, {
            oldCustomerPrice: product.customerPrice,
            newCustomerPrice: finalCustomerPrice
        })
    }

    return NextResponse.json({ success: true, product: updatedProduct })
  } catch (error: any) {
    console.error("Admin Approve Product Error:", error)
    if (error.message.startsWith("FORBIDDEN") || error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
