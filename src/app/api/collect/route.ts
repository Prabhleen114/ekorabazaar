import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ciStore } from "@/lib/e2e-store";

const EventPayloadSchema = z.object({
  event_id: z.string().uuid().or(z.string().min(5)),
  anonymous_id: z.string().min(3),
  session_id: z.string().min(3),
  customer_id: z.string().nullable().optional(),
  event_name: z.string().min(2),
  product_id: z.string().nullable().optional(),
  page_path: z.string().optional(),
  device: z.enum(["mobile", "desktop", "tablet"]).optional(),
  utm: z
    .object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
    })
    .optional(),
  props: z.record(z.string(), z.any()).optional(),
  ts: z.string().optional(),
});

const BatchSchema = z.union([
  EventPayloadSchema,
  z.array(EventPayloadSchema),
  z.object({ events: z.array(EventPayloadSchema) }),
]);

// Set of processed event IDs for de-duplication
const seenEventIds = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const userAgent = req.headers.get("user-agent") || "";
    // Bot filtering
    const isBot =
      /bot|crawler|spider|headless|crawl|slurp|facebookexternalhit|whatsapp/i.test(
        userAgent
      );

    if (isBot) {
      return NextResponse.json({ success: true, dropped: "bot" });
    }

    const raw = await req.json();
    const parseResult = BatchSchema.safeParse(raw);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid event batch schema", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    let eventsList: z.infer<typeof EventPayloadSchema>[] = [];
    if (Array.isArray(parseResult.data)) {
      eventsList = parseResult.data;
    } else if ("events" in parseResult.data && Array.isArray(parseResult.data.events)) {
      eventsList = parseResult.data.events;
    } else {
      eventsList = [parseResult.data as z.infer<typeof EventPayloadSchema>];
    }

    const acceptedCount: number[] = [];

    for (const evt of eventsList) {
      // De-duplicate on event_id
      if (seenEventIds.has(evt.event_id)) {
        continue;
      }
      seenEventIds.add(evt.event_id);
      if (seenEventIds.size > 20000) {
        seenEventIds.clear();
      }

      // Check internal staff flag
      const isInternal =
        evt.customer_id === "prabhleen.kaur1306@gmail.com" ||
        evt.customer_id === "aryann1217@gmail.com";

      const record = {
        event_id: evt.event_id,
        ts: evt.ts || new Date().toISOString(),
        anonymous_id: evt.anonymous_id,
        session_id: evt.session_id,
        customer_id: evt.customer_id || null,
        event_name: evt.event_name,
        product_id: evt.product_id || null,
        page_path: evt.page_path || "/",
        device: evt.device || "desktop",
        utm: evt.utm,
        props: evt.props,
        is_bot: false,
        is_internal: isInternal,
      };

      ciStore.rawEvents.push(record);

      // Identity stitching
      if (evt.customer_id && evt.anonymous_id) {
        const alreadyLinked = ciStore.identityLinks.some(
          (l) =>
            l.anonymous_id === evt.anonymous_id && l.customer_id === evt.customer_id
        );
        if (!alreadyLinked) {
          ciStore.identityLinks.push({
            anonymous_id: evt.anonymous_id,
            customer_id: evt.customer_id,
            linked_at: new Date().toISOString(),
          });
        }
      }

      acceptedCount.push(1);
    }

    return NextResponse.json({
      success: true,
      processed: eventsList.length,
      accepted: acceptedCount.length,
    });
  } catch (error: any) {
    console.error("[Collector API Error]:", error);
    return NextResponse.json({ error: "Collector failure" }, { status: 500 });
  }
}
