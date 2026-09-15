import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/db";
import { FLAG_DEFINITIONS } from "@/lib/intelligence";
import { WHATSAPP_TEMPLATES } from "@/lib/intelligence-messages";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = req.nextUrl.searchParams;
    const filterFlag = searchParams.get("flag") || "";
    const filterStatus = searchParams.get("status") || "pending"; // 'pending' | 'resolved' | 'all'
    const searchQuery = searchParams.get("q") || "";

    const whereClause: any = {};

    if (filterFlag) {
      whereClause.flag = filterFlag;
    }

    if (filterStatus === "pending") {
      whereClause.resolved = false;
    } else if (filterStatus === "resolved") {
      whereClause.resolved = true;
    }

    if (searchQuery.trim()) {
      whereClause.user = {
        OR: [
          { email: { contains: searchQuery.trim(), mode: "insensitive" } },
          {
            addresses: {
              some: {
                OR: [
                  { name: { contains: searchQuery.trim(), mode: "insensitive" } },
                  { phone: { contains: searchQuery.trim() } },
                ],
              },
            },
          },
        ],
      };
    }

    const [flags, totalCount, pendingCount, resolvedCount] = await Promise.all([
      prisma.customerFlag.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              addresses: {
                take: 1,
                orderBy: { createdAt: "desc" },
                select: {
                  name: true,
                  phone: true,
                  city: true,
                  state: true,
                },
              },
              orders: {
                select: {
                  id: true,
                  total: true,
                  status: true,
                  createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: 2,
              },
            },
          },
        },
        orderBy: { lastUpdatedAt: "desc" },
        take: 100,
      }),
      prisma.customerFlag.count(),
      prisma.customerFlag.count({ where: { resolved: false } }),
      prisma.customerFlag.count({ where: { resolved: true } }),
    ]);

    // Format flags with definitions and human-readable metadata
    const formattedFlags = flags.map((item) => {
      const def = FLAG_DEFINITIONS[item.flag] || {
        key: item.flag,
        label: item.flag.replace(/_/g, " "),
        description: "Customer behavioral flag",
        suggestedAction: "Follow up with customer directly.",
        badgeColor: "bg-gray-100 text-gray-800 border-gray-300",
        category: "other",
      };

      const primaryAddress = item.user.addresses[0];
      const customerName = primaryAddress?.name || item.user.email.split("@")[0];
      const customerPhone = primaryAddress?.phone || "N/A";
      const customerLocation = primaryAddress ? `${primaryAddress.city}, ${primaryAddress.state}` : "Unknown";

      const evidence: string[] = Array.isArray(item.evidence)
        ? (item.evidence as any[]).map((e) => String(e))
        : [String(item.evidence)];

      // Generate personalized WhatsApp message for this specific customer + flag
      const templateDef = WHATSAPP_TEMPLATES[item.flag];
      const waTemplate = templateDef
        ? templateDef.message(customerName, evidence)
        : `Hi ${customerName}, this is the Ekora Wholesale team. We wanted to reach out regarding your recent activity on our platform. How can we help?`;

      return {
        id: `${item.userId}_${item.flag}`,
        userId: item.userId,
        flag: item.flag,
        flagMeta: def,
        evidence,
        resolved: item.resolved,
        firstDetectedAt: item.firstDetectedAt,
        lastUpdatedAt: item.lastUpdatedAt,
        waTemplate,
        customer: {
          name: customerName,
          email: item.user.email,
          phone: customerPhone,
          location: customerLocation,
          role: item.user.role,
          recentOrders: item.user.orders,
        },
      };
    });

    return NextResponse.json({
      flags: formattedFlags,
      stats: {
        total: totalCount,
        pending: pendingCount,
        resolved: resolvedCount,
      },
      flagDefinitions: FLAG_DEFINITIONS,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message?.includes("Admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET Intelligence Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load intelligence data" },
      { status: 500 }
    );
  }
}
