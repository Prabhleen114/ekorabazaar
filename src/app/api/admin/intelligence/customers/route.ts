import { NextResponse, NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/db";
import { OrderStatus, Role } from "@prisma/client";

export const dynamic = "force-dynamic";

const COMPLETED_STATUSES: OrderStatus[] = [
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "IN_TRANSIT",
  "DELIVERED"
];

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("q")?.toLowerCase() || "";
    const segment = searchParams.get("segment") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 20;
    const skip = (page - 1) * limit;

    // Build base user where
    const where: any = { role: Role.CUSTOMER };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { addresses: { some: { phone: { contains: search } } } }
      ];
    }

    // Advanced filtering based on segments requires examining orders.
    // We will pull the users matching the base filter first (up to a reasonable limit for complex segments)
    // Actually, for robust B2B it's better to fetch users and join their orders.
    
    if (segment === "repeat") {
      // Must have >= 2 completed orders
      // In Prisma, we can't do direct HAVING count > 1. 
      // We'll find customer IDs via groupBy first.
      const repeatIds = await prisma.order.groupBy({
        by: ['customerId'],
        _count: { id: true },
        where: { status: { in: COMPLETED_STATUSES } },
        having: { id: { _count: { gt: 1 } } }
      });
      where.id = { in: repeatIds.map(r => r.customerId) };
    } else if (segment === "new") {
      // Registered in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      where.createdAt = { gte: thirtyDaysAgo };
    } else if (segment === "inactive") {
      // No completed orders
      where.orders = { none: { status: { in: COMPLETED_STATUSES } } };
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          addresses: { take: 1, orderBy: { isDefault: "desc" } },
          orders: {
            where: { status: { in: COMPLETED_STATUSES } },
            select: { total: true, createdAt: true, id: true },
            orderBy: { createdAt: "desc" }
          }
        }
      })
    ]);

    // Calculate RFM & Segments for the returned users
    const customers = users.map(user => {
      const orders = user.orders;
      const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
      const totalOrders = orders.length;
      const firstOrder = orders.length > 0 ? orders[orders.length - 1].createdAt : null;
      const lastOrder = orders.length > 0 ? orders[0].createdAt : null;
      
      let recencyDays = -1;
      if (lastOrder) {
        recencyDays = Math.floor((new Date().getTime() - new Date(lastOrder).getTime()) / (1000 * 3600 * 24));
      }

      // Determine segment
      let calculatedSegment = "New";
      if (totalOrders > 1) calculatedSegment = "Repeat";
      if (totalSpent > 1000000) calculatedSegment = "High Value"; // > 10k INR overrides Repeat
      if (totalOrders === 0) calculatedSegment = "Inactive";
      if (totalOrders > 0 && recencyDays > 90) calculatedSegment = "At Risk";

      return {
        id: user.id,
        name: user.name || user.addresses[0]?.name || "Unknown",
        email: user.email,
        phone: user.addresses[0]?.phone || null,
        joinedAt: user.createdAt,
        totalOrders,
        totalSpent,
        aov: totalOrders > 0 ? totalSpent / totalOrders : 0,
        lastOrderDate: lastOrder,
        firstOrderDate: firstOrder,
        recencyDays,
        segment: calculatedSegment
      };
    });

    return NextResponse.json({
      customers,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (err: any) {
    console.error("[Intelligence Customers API Error]:", err);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
