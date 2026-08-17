import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ProductStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { status: ProductStatus.PUBLISHED },
      include: { seller: true }
    });

    const mappedProducts = products.map(p => ({
      ...p,
      price: p.customerPrice ?? p.price,
      // hide customerPrice so the frontend just consumes `price`
      customerPrice: undefined 
    }));

    return NextResponse.json(mappedProducts);
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
