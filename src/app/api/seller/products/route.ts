import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireSeller } from '@/lib/auth'
import { ProductStatus } from '@prisma/client'

export async function POST(req: Request) {
  try {
    const session = await requireSeller()
    const body = await req.json().catch(() => ({}))
    const { title, description, price, stock, imageUrl } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }
    
    if (price === undefined || isNaN(parseInt(price, 10)) || parseInt(price, 10) <= 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 })
    }

    // Verify seller is ACTIVE
    const seller = await prisma.seller.findUnique({ where: { id: session.sellerId! } })
    if (!seller || seller.accountStatus !== 'ACTIVE') {
      return NextResponse.json({ error: "Your account must be active to create products." }, { status: 403 })
    }

    const product = await prisma.product.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        price: parseInt(price, 10),
        stock: stock !== undefined ? parseInt(stock, 10) : 0,
        imageUrl: imageUrl || null,
        sellerId: session.sellerId!,
        source: 'SELLER',
        status: ProductStatus.DRAFT
      }
    })

    return NextResponse.json({ success: true, product })
  } catch (error: any) {
    console.error("Create Seller Product Error:", error)
    if (error.message.startsWith("FORBIDDEN") || error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
