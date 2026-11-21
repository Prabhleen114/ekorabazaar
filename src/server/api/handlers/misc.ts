import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import prisma from '@/lib/db';
import { ciStore as rootCiStore } from '@/lib/e2e-store';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import products from '@/lib/data/products.json';
import catalogProducts from '@/lib/data/products.json';
import { DEPARTMENTS } from '@/lib/taxonomy';
import {
  sanitizeSearchQuery,
  expandQueryTokens,
  expandQueryTokenGroups,
  scoreProduct,
  autocorrectTokenGroups,
} from '@/lib/search';
import { filterAndSortCatalogProducts, ProductFilterParams } from '@/lib/product-filters';
import { getUnifiedCatalog } from '@/lib/catalog';
import { getSession } from '@/lib/session';
import { validateBody, ValidateCouponSchema } from '@/lib/validation';
import {
  normalizeCouponCode,
  validateCouponEligibility,
} from '@/lib/coupons';
import { ProductStatus, Prisma } from '@prisma/client';
import { normalizeProductBasePriceToINR } from '@/lib/pricing';
import { requireAdmin } from '@/lib/auth';
import { ciStore } from '@/customer-intelligence/lib/e2e-store';
import { fetchGA4Analytics } from '@/customer-intelligence/lib/ga4-service';
import { getLiveSessionInspection } from '@/customer-intelligence/lib/db-intelligence';
import { GET as adminIntelligenceGet } from '@/customer-intelligence/api/admin/route';
import { GET as adminIntelligenceAnalyticsGet } from '@/customer-intelligence/api/admin/analytics/route';
import { GET as adminIntelligenceCustomersGet } from '@/customer-intelligence/api/admin/customers/route';
import { POST as adminIntelligenceResolvePost } from '@/customer-intelligence/api/admin/resolve/route';
import { POST as adminIntelligenceRunJobsPost } from '@/customer-intelligence/api/admin/run-jobs/route';
import { POST as trackHesitationPost } from '@/customer-intelligence/api/track-hesitation/route';
import { RouteContext } from '../types';

// ==========================================
// 1. COLLECT HANDLER
// ==========================================
const EventPayloadSchema = z.object({
  event_id: z.string().min(5),
  anonymous_id: z.string().min(3),
  session_id: z.string().min(3),
  customer_id: z.string().nullable().optional(),
  event_name: z.string().min(2),
  product_id: z.string().nullable().optional(),
  page_path: z.string().optional(),
  device: z.enum(['mobile', 'desktop', 'tablet']).optional(),
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

const seenEventIds = new Set<string>();
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX_PER_MINUTE = 120;

const STRICTLY_NECESSARY_EVENTS = new Set([
  'payment_attempt',
  'payment_fail',
  'purchase',
  'api_error',
  'client_error',
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

export async function handleCollect(req: NextRequest) {
  try {
    const userAgent = req.headers.get('user-agent') || '';
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown-ip';

    if (isBotUserAgent(userAgent)) {
      return NextResponse.json({ success: true, dropped: 'bot' });
    }

    if (isRateLimited(clientIp)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const raw = await req.json();
    const parseResult = BatchSchema.safeParse(raw);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid event batch schema', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    let eventsList: z.infer<typeof EventPayloadSchema>[] = [];
    if (Array.isArray(parseResult.data)) {
      eventsList = parseResult.data;
    } else if ('events' in parseResult.data && Array.isArray(parseResult.data.events)) {
      eventsList = parseResult.data.events;
    } else {
      eventsList = [parseResult.data as z.infer<typeof EventPayloadSchema>];
    }

    const acceptedEvents: any[] = [];
    const dbEventsToInsert: any[] = [];
    const identityLinksToUpsert: { anonymousId: string; customerId: string }[] = [];

    for (const evt of eventsList) {
      if (seenEventIds.has(evt.event_id)) {
        continue;
      }
      seenEventIds.add(evt.event_id);
      if (seenEventIds.size > 50000) {
        seenEventIds.clear();
      }

      const hasConsent = evt.consent !== false;
      if (!hasConsent && !STRICTLY_NECESSARY_EVENTS.has(evt.event_name)) {
        continue;
      }

      const isInternal =
        evt.customer_id === 'prabhleen.kaur1306@gmail.com' ||
        evt.customer_id === 'aryann1217@gmail.com' ||
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
        page_path: evt.page_path || '/',
        device: evt.device || 'desktop',
        utm: evt.utm || undefined,
        props: evt.props || undefined,
        is_bot: false,
        is_internal: isInternal,
        is_synthetic: isSynthetic,
      };

      rootCiStore.rawEvents.push(record);

      dbEventsToInsert.push({
        eventId: evt.event_id,
        ts: eventTimestamp,
        anonymousId: evt.anonymous_id,
        sessionId: evt.session_id,
        customerId: evt.customer_id || null,
        eventName: evt.event_name,
        productId: evt.product_id || null,
        pagePath: evt.page_path || '/',
        device: evt.device || 'desktop',
        utm: evt.utm || undefined,
        props: evt.props || undefined,
        isBot: false,
        isInternal,
        isSynthetic,
      });

      if (evt.customer_id && evt.anonymous_id) {
        const alreadyLinked = rootCiStore.identityLinks.some(
          (l) => l.anonymous_id === evt.anonymous_id && l.customer_id === evt.customer_id
        );
        if (!alreadyLinked) {
          rootCiStore.identityLinks.push({
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

    if (dbEventsToInsert.length > 0) {
      prisma.cIEvent
        .createMany({
          data: dbEventsToInsert,
          skipDuplicates: true,
        })
        .catch((err) => {
          console.error('[CI Collector DB write error]:', err);
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
    console.error('[Collector API Error]:', error);
    return NextResponse.json({ error: 'Collector failure' }, { status: 500 });
  }
}

// ==========================================
// 2. EVENTS HANDLER
// ==========================================
export async function handleEvents(req: NextRequest) {
  try {
    let body: any = null;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json') || contentType.includes('text/plain')) {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    }

    if (!body) {
      return NextResponse.json({ error: 'Empty event payload' }, { status: 400 });
    }

    const eventName = body.eventName || body.event_name || 'unknown_event';
    const sessionId = body.sessionId || body.session_id || 'ses_anonymous';
    const productId = body.productId || body.product_id || null;
    const userId = body.userId || body.user_id || null;
    const metadata = body.metadata || body;

    let createdId: string | null = null;

    try {
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
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[API /api/events DB Persistence Notice]:', dbError.message || dbError);
      }
    }

    return NextResponse.json({
      success: true,
      eventId: createdId,
      receivedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error processing event beacon:', err);
    return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
  }
}

// ==========================================
// 3. TRENDING HANDLER
// ==========================================
export async function handleTrending() {
  try {
    const clientEmail = process.env.GA_CLIENT_EMAIL;
    const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const propertyId = process.env.GA4_PROPERTY_ID;

    if (clientEmail && privateKey && propertyId) {
      try {
        const { BetaAnalyticsDataClient } = await import('@google-analytics/data');
        const analyticsDataClient = new BetaAnalyticsDataClient({
          credentials: {
            client_email: clientEmail,
            private_key: privateKey,
          },
        });

        const [response] = await analyticsDataClient.runReport({
          property: `properties/${propertyId}`,
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          dimensionFilter: {
            filter: {
              fieldName: 'pagePath',
              stringFilter: { matchType: 'BEGINS_WITH', value: '/products/' },
            },
          },
          limit: 8,
        });

        const trendingPaths =
          response.rows?.map((row: any) => row.dimensionValues?.[0].value) || [];
        const trendingIds = trendingPaths
          .map((p: any) => p?.replace('/products/', '').split('?')[0])
          .filter(Boolean);

        if (trendingIds.length > 0) {
          const matched = (products as any[]).filter((p: any) =>
            trendingIds.includes(String(p.id))
          );
          if (matched.length >= 4) {
            return NextResponse.json(
              { trending: matched.slice(0, 6) },
              {
                headers: {
                  'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400',
                },
              }
            );
          }
        }
      } catch (gaError) {
        console.warn(
          'GA4 Analytics Data API query failed, falling back to curated bestsellers:',
          gaError
        );
      }
    }

    const fallbackIds = ['790', '904', '907', '905', '909', '910'];
    let curated = products.filter((p) => fallbackIds.includes(String(p.id)));
    if (curated.length < 4) {
      curated = products.slice(0, 6);
    }

    return NextResponse.json(
      { trending: curated.slice(0, 6) },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { trending: products.slice(0, 6) },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  }
}

// ==========================================
// 4. SEARCH SUGGESTIONS HANDLER
// ==========================================
export interface SuggestionItem {
  type: 'product' | 'category' | 'trending';
  label: string;
  href: string;
  category?: string;
  price?: number;
  image?: string;
  badge?: string;
  score?: number;
}

const TRENDING_B2B_SEARCHES: SuggestionItem[] = [
  { type: 'trending', label: 'Soy Wax 464 Wholesale', href: '/shop?q=Soy+Wax+464', badge: 'High Demand' },
  { type: 'trending', label: 'Silicone Candle Moulds Wholesale', href: '/shop?q=Silicone+Candle+Moulds', badge: 'Top Category' },
  { type: 'trending', label: 'IFRA Certified Fragrance Oils', href: '/shop?category=Fragrance+%26+Flavour+Oils', badge: 'Lab-Tested' },
  { type: 'trending', label: 'Amber Glass Jars with Metal Lids', href: '/shop?q=Amber+Glass+Jars', badge: 'Packaging' },
  { type: 'trending', label: 'Melt & Pour Soap Base (SLS-Free)', href: '/shop?q=Melt+and+Pour+Soap+Base', badge: 'Raw Material' },
  { type: 'trending', label: 'Cosmetic Mica Powder Pigments', href: '/shop?category=Colourants+%26+Pigments', badge: 'Bulk Supplier' },
];

let suggestionIndex: SuggestionItem[] | null = null;

function buildSuggestionIndex(): SuggestionItem[] {
  if (suggestionIndex) return suggestionIndex;

  const entries: SuggestionItem[] = [];

  for (const dept of DEPARTMENTS) {
    for (const sub of dept.subcategories) {
      entries.push({
        type: 'category',
        label: sub,
        href: '/shop?category=' + encodeURIComponent(sub),
        category: dept.name,
        score: 12,
      });
    }
  }

  const seen = new Set<string>();
  for (const p of catalogProducts as any[]) {
    const name = (p.name || p.title || '').trim();
    const id = String(p.id);
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());

    entries.push({
      type: 'product',
      label: name,
      href: '/products/' + id,
      category: p.category || undefined,
      price: typeof p.price === 'number' ? p.price : undefined,
      image: p.image || undefined,
      score: 5,
    });
  }

  suggestionIndex = entries;
  return suggestionIndex;
}

export async function handleSearchSuggestions(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQ = searchParams.get('q');

    const normalized = sanitizeSearchQuery(rawQ);

    if (!normalized || normalized.length < 2) {
      return NextResponse.json(
        { suggestions: [], trending: TRENDING_B2B_SEARCHES },
        { headers: { 'Cache-Control': 'public, s-maxage=300' } }
      );
    }

    const query = normalized.substring(0, 150).toLowerCase();
    const tokenGroups = expandQueryTokenGroups(query);
    const tokens = expandQueryTokens(query);

    const index = buildSuggestionIndex();

    const scored: Array<{ entry: SuggestionItem; score: number }> = [];

    for (const entry of index) {
      const label = entry.label.toLowerCase();
      const cat = (entry.category || '').toLowerCase();

      const matchesAll = tokenGroups.every((group) =>
        group.some((token) => label.includes(token) || cat.includes(token))
      );

      if (!matchesAll) continue;

      let score = 0;

      if (label.startsWith(query)) score += 120;
      else if (label.includes(query)) score += 70;

      if (cat.includes(query)) score += 30;

      for (const token of tokens) {
        if (token.length < 2) continue;
        if (label.startsWith(token)) score += 25;
        else if (label.includes(token)) score += 10;
        if (cat.includes(token)) score += 8;
      }

      if (entry.type === 'category' && score > 0) score += 10;

      if (score > 0) {
        scored.push({ entry, score: score + (entry.score || 0) });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    let topSuggestions = scored.slice(0, 8).map((s) => s.entry);

    try {
      const conditions: any[] = [Prisma.sql`p.status = 'PUBLISHED'`];

      for (const group of tokenGroups) {
        const groupConds: any[] = [];
        for (const token of group) {
          const likePattern = `%${token}%`;
          groupConds.push(Prisma.sql`p.title ILIKE ${likePattern}`);
          if (token.length >= 4) {
            groupConds.push(Prisma.sql`strict_word_similarity(${token}, p.title) > 0.32`);
          }
        }
        if (groupConds.length > 0) {
          conditions.push(Prisma.sql`(${Prisma.join(groupConds, ' OR ')})`);
        }
      }

      const whereClause = Prisma.join(conditions, ' AND ');
      const dbMatches = await prisma.$queryRaw<any[]>`
        SELECT p.id, p.title, p.category, p.price, p."customerPrice", p."imageUrl", p.description,
               strict_word_similarity(${normalized}, p.title) as db_score
        FROM "Product" p
        WHERE ${whereClause}
        ORDER BY strict_word_similarity(${normalized}, p.title) DESC
        LIMIT 15
      `;

      const dbTitles = dbMatches.map((p) => p.title || '');
      const correctedTokenGroups =
        dbTitles.length > 0 ? autocorrectTokenGroups(tokenGroups, dbTitles) : tokenGroups;

      const scoredDbMatches = dbMatches.map((p) => {
        const prod = {
          name: p.title,
          category: p.category,
          description: p.description || '',
          inStock: true,
        };
        return {
          row: p,
          score:
            scoreProduct(prod, normalized, correctedTokenGroups) +
            (p.db_score ? Number(p.db_score) * 100 : 0),
        };
      });
      scoredDbMatches.sort((a, b) => b.score - a.score);

      for (const { row } of scoredDbMatches.slice(0, 5)) {
        const productHref = '/products/' + row.id;
        if (!topSuggestions.some((s) => s.href === productHref)) {
          topSuggestions.push({
            type: 'product',
            label: row.title,
            href: productHref,
            category: row.category || undefined,
            price: Math.round(normalizeProductBasePriceToINR(row)),
            image: row.imageUrl || undefined,
            score: 0,
          });
        }
      }
    } catch (e) {
      console.error('DB suggestion query error:', e);
    }

    const seen = new Set<string>();
    const suggestions: SuggestionItem[] = [];
    for (const entry of topSuggestions.slice(0, 8)) {
      if (!seen.has(entry.href)) {
        seen.add(entry.href);
        suggestions.push({
          type: entry.type,
          label: entry.label,
          href: entry.href,
          category: entry.category,
          price: entry.price,
          image: entry.image,
          badge: entry.badge,
        });
      }
    }

    return NextResponse.json(
      { suggestions, trending: TRENDING_B2B_SEARCHES, query: normalized },
      { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' } }
    );
  } catch (error) {
    console.error('Search suggestions error:', error);
    return NextResponse.json(
      { suggestions: [], trending: TRENDING_B2B_SEARCHES },
      { status: 500 }
    );
  }
}

// ==========================================
// 5. DOCS HANDLER
// ==========================================
const ALLOWED_DOC_TYPES: Record<string, string> = {
  coa: 'Certificate of Analysis (COA)',
  tds: 'Technical Data Sheet (TDS)',
  msds: 'Material Safety Data Sheet (MSDS / SDS)',
  ifra: 'IFRA 51st Amendment Conformity Certificate',
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getTrustedDocUrl(rawUrl: unknown, reqUrl: string): URL | null {
  if (typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('//') || trimmed.includes('\\')) return null;

  if (trimmed.startsWith('/')) {
    try {
      return new URL(trimmed, reqUrl);
    } catch {
      return null;
    }
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return null;

    const trustedOrigins = new Set<string>([
      'https://www.ekorabazaar.in',
      'https://ekorabazaar.in',
    ]);

    if (process.env.NEXT_PUBLIC_APP_URL) {
      try {
        trustedOrigins.add(new URL(process.env.NEXT_PUBLIC_APP_URL).origin);
      } catch {}
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        trustedOrigins.add(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin);
      } catch {}
    }

    if (trustedOrigins.has(parsed.origin)) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

function buildHtmlResponse(
  docTitle: string,
  docType: string,
  productName: string,
  productId: string,
  productCategory: string
): NextResponse {
  const safeDocTitle = escapeHtml(docTitle);
  const safeProductName = escapeHtml(productName);
  const safeProductId = escapeHtml(productId);
  const safeProductCategory = escapeHtml(productCategory);

  const safeProductHref = /^[a-zA-Z0-9_\-]+$/.test(productId)
    ? `/products/${encodeURIComponent(productId)}`
    : '/shop';

  const waQuery = encodeURIComponent(
    `Hi, I would like to request batch technical documentation for ${productName} (SKU: ${productId})`
  );
  const mailSubject = encodeURIComponent(`Batch Document Request - ${productName}`);
  const mailBody = encodeURIComponent(
    `Product ID: ${productId}\nDocument Type: ${docType.toUpperCase()}\nBusiness Name:\nOrder ID (if placed):`
  );

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeDocTitle} Status - ${safeProductName} | Ekora Bazaar</title>
  <meta name="robots" content="noindex, nofollow">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1f2937; line-height: 1.6; padding: 40px 20px; background: #faf8f5; margin: 0; }
    .container { max-width: 640px; margin: 40px auto; background: #ffffff; border: 1px solid #e7e3dc; border-radius: 16px; padding: 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 8px; }
    .meta-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 18px; margin: 20px 0; font-size: 13px; }
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .meta-row:last-child { margin-bottom: 0; }
    .meta-label { color: #6b7280; font-weight: 500; }
    .meta-val { color: #111827; font-weight: 600; }
    p { font-size: 14px; color: #4b5563; margin: 16px 0; }
    .notice { background: #fdfbf7; border-left: 3px solid #d9531e; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #4b5563; margin: 20px 0; }
    .actions { display: flex; gap: 12px; margin-top: 24px; flex-wrap: wrap; }
    .btn-primary { background: #d9531e; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; display: inline-block; }
    .btn-secondary { background: #f3f4f6; color: #1f2937; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; display: inline-block; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">Document Verification</span>
    <h1>${safeDocTitle}</h1>

    <div class="meta-box">
      <div class="meta-row">
        <span class="meta-label">Product / Material:</span>
        <span class="meta-val">${safeProductName}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">SKU / ID:</span>
        <span class="meta-val">${safeProductId}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Category:</span>
        <span class="meta-val">${safeProductCategory}</span>
      </div>
    </div>

    <div class="notice">
      <strong>Verification Policy:</strong> To ensure complete chemical and regulatory integrity, Ekora Bazaar provides verified, batch-specific documentation (including COA, Technical Data Sheets, and MSDS) directly with wholesale dispatch or upon commercial order verification. We do not generate synthetic or generic test data online.
    </div>

    <p>
      If you require lot-specific testing records, IFRA conformity thresholds, or technical formulation specifications for an active commercial order or bulk evaluation, please submit your inquiry directly to our verification desk:
    </p>

    <div class="actions">
      <a href="https://wa.me/919041500605?text=${waQuery}" class="btn-primary" target="_blank" rel="noopener noreferrer">Request via WhatsApp</a>
      <a href="mailto:ekorabazaar@gmail.com?subject=${mailSubject}&amp;body=${mailBody}" class="btn-secondary">Email Support</a>
      <a href="${safeProductHref}" class="btn-secondary">Back to Product</a>
    </div>

    <div class="footer">
      Ekora Bazaar B2B Sourcing Desk &bull; www.ekorabazaar.in
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export async function handleDocs(req: NextRequest, { params }: RouteContext) {
  const { slug, type } = await params;

  const rawType = (type || '').toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(ALLOWED_DOC_TYPES, rawType)) {
    return buildHtmlResponse(
      'Technical Compliance Document',
      'DOC',
      'Document Not Found',
      'N/A',
      'Wholesale Raw Materials'
    );
  }

  const docType = rawType;
  const docTitle = ALLOWED_DOC_TYPES[docType];

  const rawSlug = (slug || '').replace(/\.pdf$/i, '').trim();
  const isValidSlug = Boolean(rawSlug && rawSlug.length <= 120 && !/[<>'"\\;`]/i.test(rawSlug));

  if (!isValidSlug) {
    return buildHtmlResponse(
      docTitle,
      docType,
      'Product Not Found',
      'Invalid Request',
      'Wholesale Raw Materials'
    );
  }

  const cleanSlug = rawSlug;

  let product: { id: string; name: string; category?: string; documentUrls?: any } | null = null;

  try {
    const dbProduct = await prisma.product.findUnique({
      where: { id: cleanSlug },
      select: { id: true, title: true, category: true, status: true },
    });
    if (dbProduct && dbProduct.status === ProductStatus.PUBLISHED) {
      product = {
        id: dbProduct.id,
        name: dbProduct.title,
        category: dbProduct.category || 'Wholesale Raw Materials',
        documentUrls: (dbProduct as any).documentUrls || null,
      };
    }
  } catch {}

  if (!product) {
    const staticItem = (catalogProducts as any[]).find(
      (p) =>
        String(p.id) === cleanSlug ||
        p.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === cleanSlug
    );
    if (staticItem) {
      product = {
        id: String(staticItem.id),
        name: staticItem.name || staticItem.title || 'Raw Material',
        category: staticItem.category || 'Wholesale Raw Materials',
        documentUrls: staticItem.documentUrls || staticItem.documents || null,
      };
    }
  }

  if (
    product &&
    product.documentUrls &&
    typeof product.documentUrls === 'object' &&
    Object.prototype.hasOwnProperty.call(product.documentUrls, docType)
  ) {
    const candidateUrl = product.documentUrls[docType];
    const trustedUrl = getTrustedDocUrl(candidateUrl, req.url);

    if (trustedUrl) {
      return NextResponse.redirect(trustedUrl);
    }
  }

  const productName = product ? product.name : cleanSlug.replace(/-/g, ' ');
  const productId = product ? product.id : cleanSlug;
  const productCategory = product?.category || 'Craft & Cosmetic Raw Materials';

  return buildHtmlResponse(docTitle, docType, productName, productId, productCategory);
}

// ==========================================
// 6. APPLY HANDLER
// ==========================================
export async function handleApply(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limitResult = rateLimit(`apply:${ip}`, { limit: 5, windowMs: 60000 });
    if (!limitResult.success) {
      return NextResponse.json(
        {
          error: `Too many submissions. Please wait ${limitResult.reset} seconds before trying again.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(limitResult.reset) },
        }
      );
    }

    const body = await req.json();
    const { name, handle, category, description, email, isCreator, isWholesale, source } = body;

    if (source === 'why-ekora-page') {
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }
    } else {
      if (!name || !handle || !category) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
    }

    const leadData = {
      id: Math.random().toString(36).substring(2, 9),
      name: name || 'N/A',
      handle: handle || 'N/A',
      category: category || 'N/A',
      description: description || 'N/A',
      email: email || 'N/A',
      isCreator: isCreator !== undefined ? isCreator : true,
      isWholesale: isWholesale !== undefined ? isWholesale : false,
      source: source || 'start-selling-page',
      timestamp: new Date().toISOString(),
    };

    try {
      const filePath = path.join(process.cwd(), 'applications.json');
      let currentApps = [];
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        currentApps = JSON.parse(fileContent || '[]');
      }
      currentApps.push(leadData);
      fs.writeFileSync(filePath, JSON.stringify(currentApps, null, 2), 'utf-8');
    } catch (fsErr) {
      console.error('Failed to write to local applications.json:', fsErr);
    }

    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const subject = `New Ekora Application: ${leadData.name || leadData.email}`;
        const textContent = `
New Application Received:
---------------------------
Source: ${leadData.source}
Name: ${leadData.name}
Instagram: ${leadData.handle}
Category: ${leadData.category}
Email: ${leadData.email}
Creator Interest: ${leadData.isCreator ? 'Yes' : 'No'}
Wholesale Interest: ${leadData.isWholesale ? 'Yes' : 'No'}
Description: ${leadData.description}
Timestamp: ${leadData.timestamp}
        `;

        await transporter.sendMail({
          from: `"Ekora Forms" <${smtpUser}>`,
          to: 'ekoratech@gmail.com',
          subject: subject,
          text: textContent,
        });
      } catch (mailErr) {
        console.error('Nodemailer failed to send email:', mailErr);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Application API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ==========================================
// 7. PRODUCTS CATALOG HANDLER
// ==========================================
export async function handleProducts(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const filterParams: ProductFilterParams = {
    q: searchParams.get('q'),
    category: searchParams.get('category'),
    department: searchParams.get('department'),
    discipline: searchParams.get('discipline'),
    priceOption: searchParams.get('priceOption'),
    minPrice: searchParams.get('minPrice'),
    maxPrice: searchParams.get('maxPrice'),
    inStockOnly: searchParams.get('inStockOnly'),
    sort: searchParams.get('sort') || searchParams.get('sortBy') || searchParams.get('order'),
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '48',
  };

  const { catalog: allProducts, facets: baseFacets } = await getUnifiedCatalog();

  const result = filterAndSortCatalogProducts(allProducts, filterParams);
  const normalizedQ = sanitizeSearchQuery(filterParams.q);
  const searchTokens = normalizedQ ? expandQueryTokens(normalizedQ) : [];
  const hasSearch = Boolean(normalizedQ);
  const hasMore = result.page * result.limit < result.total;

  return NextResponse.json({
    items: result.items,
    products: result.items,
    total: result.total,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      hasMore,
    },
    facets: baseFacets,
    activeFilters: filterParams,
    meta: {
      query: normalizedQ,
      tokens: searchTokens,
      hasSearch,
    },
  });
}

// ==========================================
// 8. COUPONS VALIDATE HANDLER
// ==========================================
export async function handleCouponsValidate(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const validation = validateBody(ValidateCouponSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ valid: false, error: validation.error }, { status: 400 });
    }

    const { code } = validation.data;
    const normalizedCode = normalizeCouponCode(code);

    let subtotalPaise = 0;
    if (validation.data.subtotalPaise !== undefined) {
      subtotalPaise = Math.round(validation.data.subtotalPaise);
    } else if (validation.data.subtotal !== undefined) {
      subtotalPaise = Math.round(validation.data.subtotal * 100);
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!coupon) {
      return NextResponse.json(
        { valid: false, error: 'Invalid coupon code. Please check and try again.' },
        { status: 404 }
      );
    }

    let customerUsageCount = 0;
    const session = await getSession();
    if (session?.userId) {
      customerUsageCount = await prisma.couponUsage.count({
        where: { couponId: coupon.id, userId: session.userId },
      });
    }

    const eligibility = validateCouponEligibility(coupon, {
      subtotalPaise,
      usageCountForCustomer: session?.userId ? customerUsageCount : undefined,
    });

    if (!eligibility.valid) {
      return NextResponse.json({ valid: false, error: eligibility.error }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmountPaise: eligibility.discountPaise,
        discountAmountRupees: eligibility.discountPaise / 100,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
      },
    });
  } catch (error: any) {
    console.error('Coupon validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Unable to validate coupon at this time.' },
      { status: 500 }
    );
  }
}

// ==========================================
// 9. CUSTOMER INTELLIGENCE RE-EXPORTS
// ==========================================
export async function handleTrackHesitation(req: NextRequest) {
  return trackHesitationPost(req);
}

export async function handleAdminIntelligence(req: NextRequest) {
  return adminIntelligenceGet(req);
}

export async function handleAdminIntelligenceAnalytics(req: NextRequest) {
  return adminIntelligenceAnalyticsGet(req);
}

export async function handleAdminIntelligenceCustomers(req: NextRequest) {
  return adminIntelligenceCustomersGet(req);
}

export async function handleAdminIntelligenceResolve(req: NextRequest) {
  return adminIntelligenceResolvePost(req);
}

export async function handleAdminIntelligenceRunJobs(req: NextRequest) {
  return (adminIntelligenceRunJobsPost as any)();
}

export async function handleAdminIntelligenceE2EGet(req: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = req.nextUrl.searchParams;
    const filterCause = searchParams.get('cause') || 'all';
    const search = searchParams.get('q') || '';

    const ga4Result = await fetchGA4Analytics();
    await ciStore.loadFromDatabase();

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
    console.error('GET intelligence-e2e error:', error);
    return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function handleAdminIntelligenceE2EPost(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const action = body.action;

    if (action === 'inspect_session') {
      const { session_id } = body;
      if (!session_id) {
        return NextResponse.json({ error: 'session_id is required' }, { status: 400 });
      }

      const inspection = await getLiveSessionInspection(
        session_id,
        ciStore.rawEvents,
        ciStore.sessions
      );

      if (!inspection) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, ...inspection });
    }

    if (action === 'handle_session') {
      const { session_id, handled_by } = body;
      const updated = ciStore.markSessionHandled(session_id, handled_by || 'Admin');
      return NextResponse.json({ success: true, updated });
    }

    if (action === 'explain_session') {
      const { session_id } = body;
      const result = ciStore.generateExplainAndDraft(session_id);
      return NextResponse.json({ success: true, ...result });
    }

    if (action === 'run_synthetic_tests') {
      const testResults = ciStore.runSyntheticTestVerification();
      return NextResponse.json({ success: true, ...testResults });
    }

    if (action === 'add_synonym') {
      const { raw_term, canonical_term, notes } = body;
      const newSyn = {
        id: `syn_${Date.now()}`,
        raw_term: raw_term.trim().toLowerCase(),
        canonical_term: canonical_term.trim().toLowerCase(),
        notes: notes || '',
      };
      ciStore.searchSynonyms.push(newSyn);
      return NextResponse.json({ success: true, synonym: newSyn });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('POST intelligence-e2e error:', error);
    return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 });
  }
}
