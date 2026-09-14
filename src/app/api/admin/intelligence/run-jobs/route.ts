import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { runIntelligenceFlagJobs } from "@/lib/intelligence";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await requireAdmin();
    const result = await runIntelligenceFlagJobs();
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message?.includes("Admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Run Intelligence Jobs Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute intelligence jobs" },
      { status: 500 }
    );
  }
}
