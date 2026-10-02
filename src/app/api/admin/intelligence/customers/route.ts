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

const HIGH_VALUE_THRESHOLD = 1000000; // ₹10,000 in paise
const INACTIVITY_DAYS = 90;
const AT_RISK_DAYS = 60;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("q")?.toLowerCase() || "";
    const segment = searchParams.get("segment") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 20;
    const skip = (page - 1) * limit;

    const where: any = { role: Role.CUSTOMER };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { addresses: { some: { phone: { contains: search } } } }
      ];
    }

    if (segment === "repeat") {
      const repeatIds = await prisma.order.groupBy({
        by: ['customerId'],
        _count: { id: true },
        where: { status: { in: COMPLETED_STATUSES } },
        having: { id: { _count: { gte: 2 } } }
      });
      where.id = { in: repeatIds.map(r => r.customerId) };
    } else if (segment === "never") {
      where.orders = { none: { status: { in: COMPLETED_STATUSES } } };
    }

    // High Value, New, Inactive, At Risk require more complex aggregations,
    // so we handle those filtering largely on the frontend or with targeted Prisma queries in a broader scale system.
    // For now, if someone selects "highValue", we filter it mathematically via grouping:
    if (segment === "highValue") {
      const highValIds = await prisma.order.groupBy({
        by: ['customerId'],
        _sum: { total: true },
        where: { status: { in: COMPLETED_STATUSES } },
        having: { total: { _sum: { gt: HIGH_VALUE_THRESHOLD } } }
      });
      where.id = { in: highValIds.map(r => r.customerId) };
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

    const currentTime = new Date().getTime();

    const customers = users.map(user => {
      const orders = user.orders;
      const mTotalSpent = orders.reduce((sum, o) => sum + o.total, 0); // Monetary (M)
      const fTotalOrders = orders.length; // Frequency (F)
      const firstOrder = orders.length > 0 ? orders[orders.length - 1].createdAt : null;
      const lastOrder = orders.length > 0 ? orders[0].createdAt : null;
      
      let rRecencyDays = -1; // Recency (R)
      if (lastOrder) {
        rRecencyDays = Math.floor((currentTime - new Date(lastOrder).getTime()) / (1000 * 3600 * 24));
      }

      // Determine precise MUTUALLY EXCLUSIVE segment based on rules
      let calculatedSegment = "Never Purchased";
      
      if (fTotalOrders > 0) {
        if (rRecencyDays > 90) {
          calculatedSegment = "Inactive";
        } else if (rRecencyDays > 60) {
          calculatedSegment = "At Risk";
        } else {
          // Recency <= 60
          const daysSinceFirst = firstOrder ? Math.floor((currentTime - new Date(firstOrder).getTime()) / (1000 * 3600 * 24)) : 0;
          if (daysSinceFirst <= 30) {
            calculatedSegment = "New";
          } else {
            calculatedSegment = "Active/Repeat";
          }
        }
      }

      return {
        id: user.id,
        name: user.name || user.addresses[0]?.name || "Unknown",
        email: user.email,
        phone: user.addresses[0]?.phone || null,
        joinedAt: user.createdAt,
        totalOrders: fTotalOrders,
        totalSpent: mTotalSpent,
        aov: fTotalOrders > 0 ? mTotalSpent / fTotalOrders : 0,
        lastOrderDate: lastOrder,
        firstOrderDate: firstOrder,
        recencyDays: rRecencyDays,
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
