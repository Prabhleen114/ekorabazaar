import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { HesitationEventSchema } from "@/customer-intelligence/lib/validation";

// Backend endpoint that ONLY accepts authentic, validated hesitation data.
export async function POST(req: Request) {
  try {
    const raw = await req.json();
    // Validate the incoming payload – reject any malformed or hallucinated data.
    const parseResult = HesitationEventSchema.safeParse(raw);
    if (!parseResult.success) {
      console.warn("Invalid hesitation payload", parseResult.error.format());
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }
    const { type, data, url } = parseResult.data;

    console.log(`[HESITATION TRACKED] Type: ${type} | URL: ${url} | Data:`, data);

    // Persist the validated event (e.g., to a generic Event table).
    await prisma.event.create({
      data: {
        userId: "anonymous",
        sessionId: "anonymous",
        eventName: "HESITATION_EVENT",
        metadata: {
          hesitationType: type,
          url,
          ...data,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Hesitation tracking error:", error);
    // Return a safe error response – never expose internal details to the client.
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
