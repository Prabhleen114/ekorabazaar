import { NextResponse, NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/db";
import { OrderStatus } from "@prisma/client";

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
    const period = searchParams.get("period") || "30d"; // 7d, 30d, 90d, 12m, all
    
    let startDate: Date | undefined;
    const now = new Date();
    
    if (period === "7d") {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (period === "30d") {
      startDate = new Date(now.setDate(now.getDate() - 30));
    } else if (period === "90d") {
      startDate = new Date(now.setDate(now.getDate() - 90));
    } else if (period === "12m") {
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
    }

    const dateFilter = startDate ? { gte: startDate } : undefined;

    // 1. Overall KPIs
    const [totalRegistered, ordersAgg, newCustomersCount] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER", createdAt: dateFilter } }),
      prisma.order.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: { status: { in: COMPLETED_STATUSES }, createdAt: dateFilter }
      }),
      // Customers whose FIRST completed order was in this period
      // Since it's hard to do purely in Prisma natively without subqueries, we'll approximate new customers as users registered in this period who have orders.
      prisma.user.count({ 
        where: { 
          role: "CUSTOMER", 
          createdAt: dateFilter,
          orders: { some: { status: { in: COMPLETED_STATUSES } } }
        } 
      })
    ]);

    // 2. Repeat customers & Segmentation base
    const userOrderCounts = await prisma.order.groupBy({
      by: ["customerId"],
      _count: { id: true },
      _sum: { total: true },
      _max: { createdAt: true },
      where: { 
        status: { in: COMPLETED_STATUSES },
        createdAt: dateFilter
      }
    });

    const activeCustomers = userOrderCounts.length;
    const repeatCustomers = userOrderCounts.filter(u => u._count.id > 1).length;
    const highValueCustomers = userOrderCounts.filter(u => (u._sum.total || 0) > 1000000).length; // > 10,000 INR

    const totalRevenue = ordersAgg._sum.total || 0;
    const totalOrders = ordersAgg._count.id;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const ordersPerCustomer = activeCustomers > 0 ? totalOrders / activeCustomers : 0;
    const repeatPurchaseRate = activeCustomers > 0 ? (repeatCustomers / activeCustomers) * 100 : 0;

    // 3. Charts: Revenue & Orders over time
    // We will group by day (if <= 90d) or month (if > 90d)
    const orders = await prisma.order.findMany({
      where: { status: { in: COMPLETED_STATUSES }, createdAt: dateFilter },
      select: { total: true, createdAt: true, customerId: true },
      orderBy: { createdAt: 'asc' }
    });

    // Grouping logic in memory (safe for typical B2B volume, avoids complex raw SQL across DB providers)
    const chartDataMap = new Map<string, { date: string; revenue: number; orders: number; uniqueCustomers: Set<string> }>();
    
    const isDaily = period === "7d" || period === "30d" || period === "90d";
    
    for (const o of orders) {
      const dateKey = isDaily 
        ? o.createdAt.toISOString().split("T")[0] // YYYY-MM-DD
        : o.createdAt.toISOString().substring(0, 7); // YYYY-MM
        
      if (!chartDataMap.has(dateKey)) {
        chartDataMap.set(dateKey, { date: dateKey, revenue: 0, orders: 0, uniqueCustomers: new Set() });
      }
      const point = chartDataMap.get(dateKey)!;
      point.revenue += o.total;
      point.orders += 1;
      point.uniqueCustomers.add(o.customerId);
    }

    const chartData = Array.from(chartDataMap.values()).map(p => ({
      date: p.date,
      revenue: p.revenue,
      orders: p.orders,
      activeCustomers: p.uniqueCustomers.size
    }));

    return NextResponse.json({
      kpis: {
        totalRegistered,
        activeCustomers,
        newCustomersCount,
        repeatCustomers,
        totalRevenue,
        avgOrderValue,
        ordersPerCustomer,
        repeatPurchaseRate
      },
      segments: {
        new: newCustomersCount,
        repeat: repeatCustomers,
        highValue: highValueCustomers,
        inactive: totalRegistered - activeCustomers // simplistic proxy
      },
      chartData
    });
  } catch (err: any) {
    console.error("[Intelligence Analytics API Error]:", err);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
