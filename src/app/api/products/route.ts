import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ProductStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { 
        status: ProductStatus.PUBLISHED,
        seller: { accountStatus: 'ACTIVE' }
      },
      include: { seller: true }
    });

    const mappedProducts = products.map(p => {
      const effectivePricePaise = p.customerPrice ?? p.price;
      return {
        id: p.id,
        name: p.title,
        category: p.category || "General Silicone Moulds",
        price: effectivePricePaise / 100, // Convert to INR
        image: p.imageUrl || "/og-image.jpg",
        inStock: p.stock > 0,
        bulkDiscountAvailable: false,
        maxDiscount: 0,
        description: p.description
      };
    });

    return NextResponse.json(mappedProducts);
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
