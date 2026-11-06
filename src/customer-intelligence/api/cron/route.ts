import { NextRequest, NextResponse } from "next/server";
import { runIntelligenceFlagJobs } from "@/customer-intelligence/lib/intelligence";
import { runAllIntelligenceCronJobs } from "@/customer-intelligence/lib/cron-jobs";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron route — runs every hour automatically.
 * Secured with CRON_SECRET env var so only Vercel's scheduler can trigger it.
 * Schedule: "0 * * * *" (see vercel.json)
 */
export async function GET(req: NextRequest) {
  // Verify the request is from Vercel's cron scheduler or admin
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const flagsResult = await runIntelligenceFlagJobs();
    const ciRollupResult = await runAllIntelligenceCronJobs();

    console.log(
      `[Cron Intelligence] Completed at ${new Date().toISOString()} — flags: ${flagsResult.totalFlagsGenerated}, sessions: ${ciRollupResult.sessionizer.sessionsProcessed}, diagnosed: ${ciRollupResult.diagnosis.diagnosedCount}`
    );

    return NextResponse.json({
      success: true,
      runAt: new Date().toISOString(),
      flags: flagsResult,
      pipeline: ciRollupResult,
    });
  } catch (err: any) {
    console.error("[Cron Intelligence Error]:", err);
    return NextResponse.json(
      { error: err.message || "Cron job failed" },
      { status: 500 }
    );
  }
}
