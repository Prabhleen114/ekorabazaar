import { NextResponse } from 'next/server';
import products from '@/lib/data/products.json';

export const dynamic = 'force-dynamic';

export async function GET() {
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

        const trendingPaths = response.rows?.map((row: any) => row.dimensionValues?.[0].value) || [];
        const trendingIds = trendingPaths
          .map((p: any) => p?.replace('/products/', '').split('?')[0])
          .filter(Boolean);

        if (trendingIds.length > 0) {
          const matched = (products as any[]).filter((p: any) => trendingIds.includes(String(p.id)));
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
        console.warn('GA4 Analytics Data API query failed, falling back to curated bestsellers:', gaError);
      }
    }

    // Curated Studio Bestseller Fallback (High-intent formulation essentials)
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
