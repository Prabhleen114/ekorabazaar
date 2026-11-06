import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ciStore } from "@/customer-intelligence/lib/e2e-store";
import { fetchGA4Analytics } from "@/customer-intelligence/lib/ga4-service";
import { getLiveSessionInspection } from "@/customer-intelligence/lib/db-intelligence";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = req.nextUrl.searchParams;
    const filterCause = searchParams.get("cause") || "all";
    const search = searchParams.get("q") || "";

    // 1. Fetch live Google Analytics 4 data (if API credentials configured)
    const ga4Result = await fetchGA4Analytics();

    // 2. Hydrate store with real live records from PostgreSQL
    await ciStore.loadFromDatabase();

    // 3. Assemble true, unpolluted data
    const today = ciStore.getTodayDashboard();
    const lostSessions = ciStore.getLostSessions(filterCause, search);
    const funnel = ciStore.getFunnelData(ga4Result.funnel);
    const demand = ciStore.getDemandReports();
    const customers = ciStore.getCustomersProfiles();
    const suppliers = ciStore.getSupplierData();
    const actionsAndResults = ciStore.getActionsAndResults();
    const systemHealth = ciStore.getSystemHealth();

    return NextResponse.json({
      success: true,
      ga4: {
        isConfigured: ga4Result.isConfigured,
        measurementId: ga4Result.measurementId,
        message: ga4Result.message,
        traffic: ga4Result.traffic || null,
        topProducts: ga4Result.topProducts || [],
      },
      today,
      lostSessions,
      funnel,
      demand,
      customers,
      suppliers,
      actionsAndResults,
      systemHealth,
    });
  } catch (error: any) {
    console.error("GET intelligence-e2e error:", error);
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const action = body.action;

    // Inspect Session: Full Cart & Visit Journey Breakdown
    if (action === "inspect_session") {
      const { session_id } = body;
      if (!session_id) {
        return NextResponse.json({ error: "session_id is required" }, { status: 400 });
      }

      const inspection = await getLiveSessionInspection(
        session_id,
        ciStore.rawEvents,
        ciStore.sessions
      );

      if (!inspection) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, ...inspection });
    }

    if (action === "handle_session") {
      const { session_id, handled_by } = body;
      const updated = ciStore.markSessionHandled(session_id, handled_by || "Admin");
      return NextResponse.json({ success: true, updated });
    }

    if (action === "explain_session") {
      const { session_id } = body;
      const result = ciStore.generateExplainAndDraft(session_id);
      return NextResponse.json({ success: true, ...result });
    }

    if (action === "run_synthetic_tests") {
      const testResults = ciStore.runSyntheticTestVerification();
      return NextResponse.json({ success: true, ...testResults });
    }

    if (action === "add_synonym") {
      const { raw_term, canonical_term, notes } = body;
      const newSyn = {
        id: `syn_${Date.now()}`,
        raw_term: raw_term.trim().toLowerCase(),
        canonical_term: canonical_term.trim().toLowerCase(),
        notes: notes || "",
      };
      ciStore.searchSynonyms.push(newSyn);
      return NextResponse.json({ success: true, synonym: newSyn });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST intelligence-e2e error:", error);
    return NextResponse.json({ error: error.message || "Action failed" }, { status: 500 });
  }
}
