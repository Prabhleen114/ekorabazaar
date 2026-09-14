import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let body: any = null;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json") || contentType.includes("text/plain")) {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    }

    if (!body) {
      return NextResponse.json({ error: "Empty event payload" }, { status: 400 });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[API /api/events Received]:", body);
    }

    const eventName = body.eventName || body.event_name || "unknown_event";
    const sessionId = body.sessionId || body.session_id || "ses_anonymous";
    const productId = body.productId || body.product_id || null;
    const userId = body.userId || body.user_id || null;
    const metadata = body.metadata || body;

    let createdId: string | null = null;

    try {
      const prisma = (await import("@/lib/db")).default;
      const created = await prisma.event.create({
        data: {
          eventName,
          sessionId,
          userId: userId || null,
          productId: productId || null,
          metadata: metadata,
        },
        select: { id: true },
      });
      createdId = created.id.toString();
    } catch (dbError: any) {
      // Gracefully handle DB offline / table push pending
      if (process.env.NODE_ENV !== "production") {
        console.warn("[API /api/events DB Persistence Notice]:", dbError.message || dbError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      eventId: createdId,
      receivedAt: new Date().toISOString() 
    });
  } catch (err: any) {
    console.error("Error processing event beacon:", err);
    return NextResponse.json({ error: "Failed to log event" }, { status: 500 });
  }
}
