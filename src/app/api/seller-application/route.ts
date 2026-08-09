import { NextRequest, NextResponse } from "next/server";
import { CONSENT_VERSION } from "@/lib/consentVersion";
import fs from "fs";
import path from "path";

/**
 * POST /api/seller-application
 *
 * Server-side entry point for all seller onboarding submissions.
 *
 * Consent enforcement (P0):
 *  - mandatoryAccepted must be boolean true (not string, not null)
 *  - version must match CONSENT_VERSION
 *  - timestamp is discarded from client and replaced server-side
 *
 * The client-side checkbox remains the UX gate. This route is the
 * authoritative enforcement layer that cannot be bypassed via browser.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Consent Validation ──────────────────────────────────────────────────
    const consent = body.legalConsent;

    // Case C: legalConsent missing entirely
    if (!consent || typeof consent !== "object") {
      return NextResponse.json(
        { error: "Missing legal consent. Consent is required to submit an application." },
        { status: 400 }
      );
    }

    // Case B & D: mandatoryAccepted must be exactly boolean true
    if (consent.mandatoryAccepted !== true) {
      return NextResponse.json(
        { error: "Mandatory legal consent must be explicitly accepted." },
        { status: 400 }
      );
    }

    // Case F: consent version must match the current policy version
    if (consent.version !== CONSENT_VERSION) {
      return NextResponse.json(
        {
          error: `Consent version mismatch. Expected ${CONSENT_VERSION}, received ${consent.version ?? "(missing)"}.`,
        },
        { status: 400 }
      );
    }

    // Case E: marketingAccepted must be a boolean (true or false both accepted)
    if (typeof consent.marketingAccepted !== "boolean") {
      return NextResponse.json(
        { error: "marketingAccepted must be a boolean." },
        { status: 400 }
      );
    }

    // ── Application Data Validation ─────────────────────────────────────────
    const { fullName, email, mobile, brandName } = body;
    if (!fullName || !email || !mobile || !brandName) {
      return NextResponse.json(
        { error: "Missing required application fields: fullName, email, mobile, brandName." },
        { status: 400 }
      );
    }

    // ── Build the document ────────────────────────────────────────
    // Destructure to explicitly exclude any client-supplied legalConsent object.
    // We build the consent record ourselves server-side.
    const {
      legalConsent: _clientConsent, // intentionally discarded
      ...applicationFields
    } = body;

    const docData = {
      id: Math.random().toString(36).substring(2, 9),
      ...applicationFields,
      status: "Payment Pending",
      applicationStage: "Submitted",
      source: "seller-onboarding",
      // Server-side timestamps — cannot be forged by client
      createdAt: new Date().toISOString(),
      legalConsent: {
        version: CONSENT_VERSION,               // from server constant, not client
        timestamp: new Date().toISOString(),    // generated server-side
        mandatoryAccepted: true,                // validated above
        marketingAccepted: consent.marketingAccepted,
      },
    };

    // ── Persistence Layer ───────────────────────────────────────────
    // Using local JSON file for persistence as per project architecture.
    try {
      const filePath = path.join(process.cwd(), "applications.json");
      let currentApps = [];
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        currentApps = JSON.parse(fileContent || "[]");
      }
      currentApps.push(docData);
      fs.writeFileSync(filePath, JSON.stringify(currentApps, null, 2), "utf-8");
    } catch (fsErr) {
      console.error("Failed to write to local applications.json:", fsErr);
      return NextResponse.json(
        { error: "Failed to persist application. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Seller application API error:", err);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
