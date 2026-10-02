import { NextResponse, NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/db";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// Eligible non-cancelled/non-failed orders
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

    // 1. Overall KPIs - Registration vs Orders
    const [newRegistrations, allRegistrations, periodOrdersAgg] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER", createdAt: dateFilter } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.order.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: { status: { in: COMPLETED_STATUSES }, createdAt: dateFilter }
      })
    ]);

    // 2. Fetch all lifetime customer grouping to calculate precise segments
    const allCustomerOrderStats = await prisma.order.groupBy({
      by: ["customerId"],
      _count: { id: true },
      _sum: { total: true },
      _max: { createdAt: true },
      _min: { createdAt: true },
      where: { 
        status: { in: COMPLETED_STATUSES }
      }
    });

    const activeCustomersLifetime = allCustomerOrderStats.length;
    const neverPurchased = allRegistrations - activeCustomersLifetime;

    let newCustomersCount = 0;
    let repeatCustomersCount = 0;
    let highValueCustomersCount = 0;
    let inactiveCustomersCount = 0;
    let atRiskCustomersCount = 0;
    let activeCustomersInPeriod = 0;

    const currentTime = new Date().getTime();

    // Calculate segments exactly as defined
    for (const stats of allCustomerOrderStats) {
      const firstOrderTime = stats._min.createdAt ? stats._min.createdAt.getTime() : 0;
      const lastOrderTime = stats._max.createdAt ? stats._max.createdAt.getTime() : 0;
      const orderCount = stats._count.id;
      const lifetimeSpend = stats._sum.total || 0;
      
      const recencyDays = Math.floor((currentTime - lastOrderTime) / (1000 * 3600 * 24));

      // Is "New Customer" in selected period?
      if (!startDate || firstOrderTime >= startDate.getTime()) {
        newCustomersCount++;
      }

      // Did they purchase in this period?
      if (!startDate || lastOrderTime >= startDate.getTime()) {
        activeCustomersInPeriod++;
      }

      // Lifetime Segments
      if (orderCount >= 2) {
        repeatCustomersCount++;
      }
      
      if (lifetimeSpend > HIGH_VALUE_THRESHOLD) {
        highValueCustomersCount++;
      }

      if (recencyDays >= INACTIVITY_DAYS) {
        inactiveCustomersCount++;
      } else if (recencyDays >= AT_RISK_DAYS) {
        atRiskCustomersCount++;
      }
    }

    const totalRevenue = periodOrdersAgg._sum.total || 0;
    const totalOrders = periodOrdersAgg._count.id;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const ordersPerCustomer = activeCustomersInPeriod > 0 ? totalOrders / activeCustomersInPeriod : 0;
    
    // Repeat Purchase Rate: out of all lifetime customers who have purchased, how many bought 2+ times
    const repeatPurchaseRate = activeCustomersLifetime > 0 ? (repeatCustomersCount / activeCustomersLifetime) * 100 : 0;

    // 3. Charts: Revenue & Orders over time
    const orders = await prisma.order.findMany({
      where: { status: { in: COMPLETED_STATUSES }, createdAt: dateFilter },
      select: { total: true, createdAt: true, customerId: true },
      orderBy: { createdAt: 'asc' }
    });

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
        newRegistrations,
        allRegistrations,
        activeCustomersInPeriod,
        activeCustomersLifetime,
        newCustomersCount,
        repeatCustomersCount,
        totalRevenue,
        avgOrderValue,
        ordersPerCustomer,
        repeatPurchaseRate
      },
      segments: {
        new: newCustomersCount,
        repeat: repeatCustomersCount,
        highValue: highValueCustomersCount,
        inactive: inactiveCustomersCount,
        atRisk: atRiskCustomersCount,
        neverPurchased: neverPurchased
      },
      chartData
    });
  } catch (err: any) {
    console.error("[Intelligence Analytics API Error]:", err);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
