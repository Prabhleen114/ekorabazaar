import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { ciStore } from "@/lib/e2e-store";

export const dynamic = "force-dynamic";

const EventPayloadSchema = z.object({
  event_id: z.string().min(5),
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
      term: z.string().optional(),
      content: z.string().optional(),
    })
    .optional(),
  props: z.record(z.string(), z.any()).optional(),
  ts: z.string().optional(),
  consent: z.boolean().optional().default(true),
});

const BatchSchema = z.union([
  EventPayloadSchema,
  z.array(EventPayloadSchema),
  z.object({ events: z.array(EventPayloadSchema) }),
]);

// In-memory set of processed event IDs for instantaneous de-duplication
const seenEventIds = new Set<string>();

// Rate-limiting map: tracks event counts in rolling 1-minute window per IP / identifier
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX_PER_MINUTE = 120;

// Strictly necessary server-side events allowed even without consent
const STRICTLY_NECESSARY_EVENTS = new Set([
  "payment_attempt",
  "payment_fail",
  "purchase",
  "api_error",
  "client_error",
]);

export function isBotUserAgent(userAgent: string): boolean {
  if (!userAgent) return false;
  return /bot|crawler|spider|headless|crawl|slurp|facebookexternalhit|whatsapp|preview|bytespider/i.test(
    userAgent
  );
}

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + 60000 });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX_PER_MINUTE;
}

export async function POST(req: NextRequest) {
  try {
    const userAgent = req.headers.get("user-agent") || "";
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown-ip";

    // 1. Bot filtering
    if (isBotUserAgent(userAgent)) {
      return NextResponse.json({ success: true, dropped: "bot" });
    }

    // 2. Rate limiting check
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
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

    const acceptedEvents: any[] = [];
    const dbEventsToInsert: any[] = [];
    const identityLinksToUpsert: { anonymousId: string; customerId: string }[] = [];

    for (const evt of eventsList) {
      // 3. De-duplicate on event_id
      if (seenEventIds.has(evt.event_id)) {
        continue;
      }
      seenEventIds.add(evt.event_id);
      if (seenEventIds.size > 50000) {
        seenEventIds.clear();
      }

      // 4. Consent check: if consent is false, reject non-essential behavioural events
      const hasConsent = evt.consent !== false;
      if (!hasConsent && !STRICTLY_NECESSARY_EVENTS.has(evt.event_name)) {
        continue;
      }

      // 5. Staff / Internal tagging
      const isInternal =
        evt.customer_id === "prabhleen.kaur1306@gmail.com" ||
        evt.customer_id === "aryann1217@gmail.com" ||
        evt.props?.is_internal === true;

      const isSynthetic = evt.props?.is_synthetic === true;
      const eventTimestamp = evt.ts ? new Date(evt.ts) : new Date();

      const record = {
        event_id: evt.event_id,
        ts: eventTimestamp.toISOString(),
        anonymous_id: evt.anonymous_id,
        session_id: evt.session_id,
        customer_id: evt.customer_id || null,
        event_name: evt.event_name,
        product_id: evt.product_id || null,
        page_path: evt.page_path || "/",
        device: evt.device || "desktop",
        utm: evt.utm || undefined,
        props: evt.props || undefined,
        is_bot: false,
        is_internal: isInternal,
        is_synthetic: isSynthetic,
      };

      // Add to fast in-memory store for instantaneous portal UI feedback
      ciStore.rawEvents.push(record);

      // Prepare database record for Postgres
      dbEventsToInsert.push({
        eventId: evt.event_id,
        ts: eventTimestamp,
        anonymousId: evt.anonymous_id,
        sessionId: evt.session_id,
        customerId: evt.customer_id || null,
        eventName: evt.event_name,
        productId: evt.product_id || null,
        pagePath: evt.page_path || "/",
        device: evt.device || "desktop",
        utm: evt.utm || undefined,
        props: evt.props || undefined,
        isBot: false,
        isInternal,
        isSynthetic,
      });

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
        identityLinksToUpsert.push({
          anonymousId: evt.anonymous_id,
          customerId: evt.customer_id,
        });
      }

      acceptedEvents.push(record);
    }

    // 6. Asynchronous persistence to PostgreSQL
    if (dbEventsToInsert.length > 0) {
      prisma.cIEvent
        .createMany({
          data: dbEventsToInsert,
          skipDuplicates: true,
        })
        .catch((err) => {
          console.error("[CI Collector DB write error]:", err);
        });
    }

    if (identityLinksToUpsert.length > 0) {
      Promise.all(
        identityLinksToUpsert.map((link) =>
          prisma.cIIdentityLink
            .upsert({
              where: {
                anonymousId_customerId: {
                  anonymousId: link.anonymousId,
                  customerId: link.customerId,
                },
              },
              create: {
                anonymousId: link.anonymousId,
                customerId: link.customerId,
                linkedAt: new Date(),
              },
              update: {},
            })
            .catch(() => {})
        )
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      processed: eventsList.length,
      accepted: acceptedEvents.length,
    });
  } catch (error: any) {
    console.error("[Collector API Error]:", error);
    return NextResponse.json({ error: "Collector failure" }, { status: 500 });
  }
}
