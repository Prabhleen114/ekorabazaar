import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { userId, flag, resolved = true } = body;

    if (!userId || !flag) {
      return NextResponse.json({ error: "userId and flag are required" }, { status: 400 });
    }

    const updated = await prisma.customerFlag.update({
      where: {
        userId_flag: {
          userId,
          flag,
        },
      },
      data: {
        resolved: Boolean(resolved),
        lastUpdatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Flag ${flag} marked as ${resolved ? "resolved" : "pending"}`,
      updated,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message?.includes("Admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Resolve Flag Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update flag" },
      { status: 500 }
    );
  }
}
