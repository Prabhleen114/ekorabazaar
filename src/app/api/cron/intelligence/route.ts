import { NextRequest, NextResponse } from "next/server";
import { runIntelligenceFlagJobs } from "@/lib/intelligence";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron route — runs every hour automatically.
 * Secured with CRON_SECRET env var so only Vercel's scheduler can trigger it.
 * Schedule: "0 * * * *" (see vercel.json)
 */
export async function GET(req: NextRequest) {
  // Verify the request is from Vercel's cron scheduler
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runIntelligenceFlagJobs();

    console.log(
      `[Cron Intelligence] Run at ${result.runAt} — ${result.totalFlagsGenerated} flags generated`,
      result.flagCounts
    );

    return NextResponse.json({
      success: result.success,
      runAt: result.runAt,
      totalFlagsGenerated: result.totalFlagsGenerated,
      flagCounts: result.flagCounts,
    });
  } catch (err: any) {
    console.error("[Cron Intelligence Error]:", err);
    return NextResponse.json(
      { error: err.message || "Cron job failed" },
      { status: 500 }
    );
  }
}
