import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import { getCategoryId } from "@/lib/categories";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Pagination
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1);
    
    // Strict boundary enforcement for limit parameter
    const rawLimit = searchParams.get("limit");
    const parsedLimit = parseInt(rawLimit || "24", 10);
    const limit = (isNaN(parsedLimit) || parsedLimit <= 0) ? 24 : Math.min(parsedLimit, 24);
    
    const skip = (page - 1) * limit;

    // Filters
    const categoryRaw = searchParams.get("category");
    const category = categoryRaw ? getCategoryId(categoryRaw) : null;
    const q = searchParams.get("q");
    const priceOption = searchParams.get("priceOption");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const inStockOnly = searchParams.get("inStockOnly") === "true";
    const sortBy = searchParams.get("sortBy") || "recommended";

    // Build Where Clause
    const where: any = {
      status: ProductStatus.PUBLISHED,
      seller: { accountStatus: 'ACTIVE' },
    };

    if (category) {
      where.category = category;
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } }
      ];
    }

    if (inStockOnly) {
      where.stock = { gt: 0 };
    }

    // Price filtering (Prices in DB are in paise)
    if (priceOption === "under_500") {
      where.price = { lt: 500 * 100 };
    } else if (priceOption === "500_1500") {
      where.price = { gte: 500 * 100, lte: 1500 * 100 };
    } else if (priceOption === "1500_3000") {
      where.price = { gte: 1500 * 100, lte: 3000 * 100 };
    } else if (priceOption === "over_3000") {
      where.price = { gt: 3000 * 100 };
    } else if (priceOption === "custom") {
      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = parseInt(minPrice, 10) * 100;
        if (maxPrice) where.price.lte = parseInt(maxPrice, 10) * 100;
      }
    }

    // Sort Options
    let orderBy: any = undefined;
    if (sortBy === "price_asc") {
      orderBy = { price: 'asc' };
    } else if (sortBy === "price_desc") {
      orderBy = { price: 'desc' };
    } else if (sortBy === "newest") {
      orderBy = { createdAt: 'desc' };
    }

    // Fetch Total for Pagination Metadata
    const totalProducts = await prisma.product.count({ where });

    // Fetch Paginated Products
    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      // Minimal payload - do NOT include `seller: true` to protect privacy and reduce payload
      select: {
        id: true,
        title: true,
        category: true,
        price: true,
        customerPrice: true,
        imageUrl: true,
        stock: true,
        description: true
      }
    });

    const mappedProducts = products.map(p => {
      // Calculate effective price securely on server
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

    return NextResponse.json({
      products: mappedProducts,
      pagination: {
        page,
        limit,
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        hasNextPage: skip + limit < totalProducts
      }
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
