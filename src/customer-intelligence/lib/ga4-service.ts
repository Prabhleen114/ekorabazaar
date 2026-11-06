import { BetaAnalyticsDataClient } from "@google-analytics/data";

export interface GA4TrafficMetrics {
  activeUsers: number;
  sessions: number;
  screenPageViews: number;
  bounceRate: number;
}

export interface GA4FunnelData {
  views: number;
  carts: number;
  checkouts: number;
  purchases: number;
  stages: {
    stage: string;
    label: string;
    count: number;
    dropPct: number;
    dropCount: number;
  }[];
  deviceSplit: {
    mobile: { visits: number; carts: number; purchases: number };
    desktop: { visits: number; carts: number; purchases: number };
    tablet: { visits: number; carts: number; purchases: number };
  };
  sourceSplit: {
    source: string;
    visits: number;
    conversionRate: string;
  }[];
}

export interface GA4TopProduct {
  path: string;
  views: number;
}

export interface GA4ReportResult {
  isConfigured: boolean;
  measurementId: string;
  message?: string;
  traffic?: GA4TrafficMetrics;
  funnel?: GA4FunnelData;
  topProducts?: GA4TopProduct[];
}

export async function fetchGA4Analytics(): Promise<GA4ReportResult> {
  const measurementId = process.env.NEXT_PUBLIC_GA_ID || "G-YTRDDR6JBB";
  const propertyId = process.env.GA4_PROPERTY_ID;
  const clientEmail = process.env.GA_CLIENT_EMAIL;
  const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!propertyId || !clientEmail || !privateKey) {
    return {
      isConfigured: false,
      measurementId,
      message:
        "Google Analytics 4 API credentials (GA4_PROPERTY_ID, GA_CLIENT_EMAIL, GA_PRIVATE_KEY) not configured. Client tracking active via G-YTRDDR6JBB.",
    };
  }

  try {
    const client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
    });

    // 1. Fetch Traffic & User Totals (Last 7 Days)
    const [trafficRes] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "bounceRate" },
      ],
    });

    const trafficRow = trafficRes.rows?.[0];
    const activeUsers = Number(trafficRow?.metricValues?.[0]?.value || 0);
    const sessions = Number(trafficRow?.metricValues?.[1]?.value || 0);
    const screenPageViews = Number(trafficRow?.metricValues?.[2]?.value || 0);
    const bounceRate = Number(trafficRow?.metricValues?.[3]?.value || 0);

    // 2. Fetch Ecommerce Funnel Events
    const [eventsRes] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          inListFilter: {
            values: ["view_item", "add_to_cart", "begin_checkout", "purchase", "page_view"],
          },
        },
      },
    });

    const eventCounts: Record<string, number> = {};
    for (const row of eventsRes.rows || []) {
      const name = row.dimensionValues?.[0]?.value;
      const count = Number(row.metricValues?.[0]?.value || 0);
      if (name) eventCounts[name] = count;
    }

    const views = eventCounts["view_item"] || 0;
    const carts = eventCounts["add_to_cart"] || 0;
    const checkouts = eventCounts["begin_checkout"] || 0;
    const purchases = eventCounts["purchase"] || 0;
    const visits = sessions || eventCounts["page_view"] || 0;

    // 3. Fetch Device Split
    const [deviceRes] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "sessions" }, { name: "ecommercePurchases" }],
    });

    const deviceSplit = {
      mobile: { visits: 0, carts: 0, purchases: 0 },
      desktop: { visits: 0, carts: 0, purchases: 0 },
      tablet: { visits: 0, carts: 0, purchases: 0 },
    };

    for (const row of deviceRes.rows || []) {
      const cat = (row.dimensionValues?.[0]?.value || "").toLowerCase();
      const sess = Number(row.metricValues?.[0]?.value || 0);
      const purch = Number(row.metricValues?.[1]?.value || 0);
      if (cat === "mobile") deviceSplit.mobile = { visits: sess, carts: 0, purchases: purch };
      else if (cat === "desktop") deviceSplit.desktop = { visits: sess, carts: 0, purchases: purch };
      else if (cat === "tablet") deviceSplit.tablet = { visits: sess, carts: 0, purchases: purch };
    }

    // 4. Fetch Traffic Sources
    const [sourceRes] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }, { name: "ecommercePurchases" }],
      limit: 6,
    });

    const sourceSplit = (sourceRes.rows || []).map((row) => {
      const source = row.dimensionValues?.[0]?.value || "Direct";
      const sVisits = Number(row.metricValues?.[0]?.value || 0);
      const sPurch = Number(row.metricValues?.[1]?.value || 0);
      const rate = sVisits > 0 ? ((sPurch / sVisits) * 100).toFixed(1) + "%" : "0.0%";
      return { source, visits: sVisits, conversionRate: rate };
    });

    // 5. Fetch Top Product Views
    const [productsRes] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      dimensionFilter: {
        filter: {
          fieldName: "pagePath",
          stringFilter: { matchType: "BEGINS_WITH", value: "/products/" },
        },
      },
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 10,
    });

    const topProducts = (productsRes.rows || []).map((row) => ({
      path: row.dimensionValues?.[0]?.value || "",
      views: Number(row.metricValues?.[0]?.value || 0),
    }));

    // Build stages
    const stages = [
      {
        stage: "visit",
        label: "Site Visitors",
        count: visits,
        dropPct: 0,
        dropCount: 0,
      },
      {
        stage: "view",
        label: "Product PDP Views",
        count: views,
        dropPct: visits > 0 ? Math.round(((visits - views) / visits) * 100) : 0,
        dropCount: Math.max(0, visits - views),
      },
      {
        stage: "cart",
        label: "Added to Cart",
        count: carts,
        dropPct: views > 0 ? Math.round(((views - carts) / views) * 100) : 0,
        dropCount: Math.max(0, views - carts),
      },
      {
        stage: "checkout",
        label: "Initiated Checkout",
        count: checkouts,
        dropPct: carts > 0 ? Math.round(((carts - checkouts) / carts) * 100) : 0,
        dropCount: Math.max(0, carts - checkouts),
      },
      {
        stage: "purchase",
        label: "Confirmed Orders",
        count: purchases,
        dropPct: checkouts > 0 ? Math.round(((checkouts - purchases) / checkouts) * 100) : 0,
        dropCount: Math.max(0, checkouts - purchases),
      },
    ];

    return {
      isConfigured: true,
      measurementId,
      traffic: {
        activeUsers,
        sessions,
        screenPageViews,
        bounceRate: Math.round(bounceRate * 100),
      },
      funnel: {
        views,
        carts,
        checkouts,
        purchases,
        stages,
        deviceSplit,
        sourceSplit,
      },
      topProducts,
    };
  } catch (err: any) {
    console.error("[GA4 Service Error]:", err);
    return {
      isConfigured: false,
      measurementId,
      message: `GA4 Data API query failed: ${err.message || String(err)}`,
    };
  }
}
