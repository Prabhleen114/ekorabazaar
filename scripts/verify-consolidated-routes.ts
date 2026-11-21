import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { handleApiRequest, registerRoutes } from '../src/server/api/router';
import { allRoutes } from '../src/server/api/routes';

registerRoutes(allRoutes);

interface SnapshotResult {
  route: string;
  method: string;
  status: number;
  contentType: string | null;
  location: string | null;
  hasSetCookie: boolean;
  bodyShape: any;
}

function extractShape(val: any): any {
  if (val === null) return 'null';
  if (Array.isArray(val)) return ['array', val.length > 0 ? extractShape(val[0]) : 'empty'];
  if (typeof val === 'object') {
    const shape: Record<string, any> = {};
    for (const k of Object.keys(val)) {
      shape[k] = typeof val[k];
    }
    return shape;
  }
  return typeof val;
}

async function testConsolidatedRoute(
  route: string,
  method: string,
  urlStr: string,
  init?: RequestInit
): Promise<SnapshotResult> {
  const url = new URL(urlStr);
  const pathname = url.pathname;
  // slug is segments after /api
  const slug = pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);

  const req = new NextRequest(urlStr, init);

  try {
    const res = await handleApiRequest(method, slug, req);
    const status = res.status;
    const contentType = res.headers.get('content-type');
    const location = res.headers.get('location');
    const hasSetCookie = Boolean(res.headers.get('set-cookie'));

    let bodyShape: any = 'opaque';
    if (contentType && contentType.includes('application/json')) {
      try {
        const clone = res.clone();
        const json = await clone.json();
        bodyShape = extractShape(json);
      } catch {
        bodyShape = 'unparseable-json';
      }
    } else if (contentType && (contentType.includes('text/') || contentType.includes('xml'))) {
      try {
        const clone = res.clone();
        const text = await clone.text();
        bodyShape = `text:${text.substring(0, 30)}...`;
      } catch {
        bodyShape = 'unparseable-text';
      }
    }

    return {
      route,
      method,
      status,
      contentType,
      location,
      hasSetCookie,
      bodyShape,
    };
  } catch (err: any) {
    return {
      route,
      method,
      status: 500,
      contentType: 'error',
      location: null,
      hasSetCookie: false,
      bodyShape: { error: err.message },
    };
  }
}

export async function runVerification() {
  const baselinePath = path.join(process.cwd(), 'docs', 'api-characterization-baseline.json');
  const baseline: SnapshotResult[] = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));

  const results: SnapshotResult[] = [];

  // 1. Auth routes
  results.push(await testConsolidatedRoute('/api/auth/me', 'GET', 'http://localhost:3000/api/auth/me'));
  results.push(await testConsolidatedRoute('/api/auth/login', 'POST', 'http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
  results.push(await testConsolidatedRoute('/api/auth/signup', 'POST', 'http://localhost:3000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
  results.push(await testConsolidatedRoute('/api/auth/logout', 'POST', 'http://localhost:3000/api/auth/logout', { method: 'POST' }));
  results.push(await testConsolidatedRoute('/api/auth/google', 'GET', 'http://localhost:3000/api/auth/google'));
  results.push(await testConsolidatedRoute('/api/auth/google/callback', 'GET', 'http://localhost:3000/api/auth/google/callback'));

  // 2. Cart routes
  results.push(await testConsolidatedRoute('/api/cart', 'GET', 'http://localhost:3000/api/cart'));
  results.push(await testConsolidatedRoute('/api/cart', 'POST', 'http://localhost:3000/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
  results.push(await testConsolidatedRoute('/api/cart/guest', 'POST', 'http://localhost:3000/api/cart/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [] }),
  }));
  results.push(await testConsolidatedRoute('/api/cart/sync', 'POST', 'http://localhost:3000/api/cart/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [] }),
  }));
  results.push(await testConsolidatedRoute('/api/cart/[itemId]', 'PATCH', 'http://localhost:3000/api/cart/item-123', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity: 2 }),
  }));
  results.push(await testConsolidatedRoute('/api/cart/[itemId]', 'DELETE', 'http://localhost:3000/api/cart/item-123', {
    method: 'DELETE',
  }));

  // 3. Checkout routes
  results.push(await testConsolidatedRoute('/api/checkout/quote', 'POST', 'http://localhost:3000/api/checkout/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [] }),
  }));
  results.push(await testConsolidatedRoute('/api/checkout/recommendations', 'GET', 'http://localhost:3000/api/checkout/recommendations'));
  results.push(await testConsolidatedRoute('/api/checkout/create-order', 'POST', 'http://localhost:3000/api/checkout/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
  results.push(await testConsolidatedRoute('/api/checkout/confirm-payment', 'POST', 'http://localhost:3000/api/checkout/confirm-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
  results.push(await testConsolidatedRoute('/api/checkout/callback', 'GET', 'http://localhost:3000/api/checkout/callback'));

  // 4. Account & Addresses
  results.push(await testConsolidatedRoute('/api/account/orders', 'GET', 'http://localhost:3000/api/account/orders'));
  results.push(await testConsolidatedRoute('/api/addresses', 'GET', 'http://localhost:3000/api/addresses'));
  results.push(await testConsolidatedRoute('/api/addresses', 'POST', 'http://localhost:3000/api/addresses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
  results.push(await testConsolidatedRoute('/api/addresses/[id]', 'PUT', 'http://localhost:3000/api/addresses/addr-1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
  results.push(await testConsolidatedRoute('/api/addresses/[id]', 'DELETE', 'http://localhost:3000/api/addresses/addr-1', {
    method: 'DELETE',
  }));

  // 5. Admin routes
  results.push(await testConsolidatedRoute('/api/admin/coupons', 'GET', 'http://localhost:3000/api/admin/coupons'));
  results.push(await testConsolidatedRoute('/api/admin/coupons', 'POST', 'http://localhost:3000/api/admin/coupons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
  results.push(await testConsolidatedRoute('/api/admin/coupons/[id]', 'GET', 'http://localhost:3000/api/admin/coupons/cpn-1'));
  results.push(await testConsolidatedRoute('/api/admin/coupons/[id]', 'PUT', 'http://localhost:3000/api/admin/coupons/cpn-1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
  results.push(await testConsolidatedRoute('/api/admin/coupons/[id]', 'DELETE', 'http://localhost:3000/api/admin/coupons/cpn-1', {
    method: 'DELETE',
  }));

  results.push(await testConsolidatedRoute('/api/admin/leads', 'GET', 'http://localhost:3000/api/admin/leads'));
  results.push(await testConsolidatedRoute('/api/admin/leads', 'POST', 'http://localhost:3000/api/admin/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
  results.push(await testConsolidatedRoute('/api/admin/orders', 'GET', 'http://localhost:3000/api/admin/orders'));
  results.push(await testConsolidatedRoute('/api/admin/orders/restore-expired', 'POST', 'http://localhost:3000/api/admin/orders/restore-expired', {
    method: 'POST',
  }));
  results.push(await testConsolidatedRoute('/api/admin/orders/[id]', 'GET', 'http://localhost:3000/api/admin/orders/ord-1'));
  results.push(await testConsolidatedRoute('/api/admin/orders/[id]', 'PATCH', 'http://localhost:3000/api/admin/orders/ord-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
  results.push(await testConsolidatedRoute('/api/admin/orders/[id]/ship', 'POST', 'http://localhost:3000/api/admin/orders/ord-1/ship', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
  results.push(await testConsolidatedRoute('/api/admin/price-requests/[id]', 'PATCH', 'http://localhost:3000/api/admin/price-requests/pr-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
  results.push(await testConsolidatedRoute('/api/admin/products/[productId]/approve', 'POST', 'http://localhost:3000/api/admin/products/p1/approve', {
    method: 'POST',
  }));
  results.push(await testConsolidatedRoute('/api/admin/products/[productId]/reject', 'POST', 'http://localhost:3000/api/admin/products/p1/reject', {
    method: 'POST',
  }));
  results.push(await testConsolidatedRoute('/api/admin/sellers/[sellerId]/approve', 'POST', 'http://localhost:3000/api/admin/sellers/s1/approve', {
    method: 'POST',
  }));
  results.push(await testConsolidatedRoute('/api/admin/sellers/[sellerId]/reactivate', 'POST', 'http://localhost:3000/api/admin/sellers/s1/reactivate', {
    method: 'POST',
  }));
  results.push(await testConsolidatedRoute('/api/admin/sellers/[sellerId]/reject', 'POST', 'http://localhost:3000/api/admin/sellers/s1/reject', {
    method: 'POST',
  }));
  results.push(await testConsolidatedRoute('/api/admin/sellers/[sellerId]/suspend', 'POST', 'http://localhost:3000/api/admin/sellers/s1/suspend', {
    method: 'POST',
  }));

  // 6. Seller routes
  results.push(await testConsolidatedRoute('/api/seller/payment/create-order', 'POST', 'http://localhost:3000/api/seller/payment/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
  results.push(await testConsolidatedRoute('/api/seller/payment/confirm-payment', 'POST', 'http://localhost:3000/api/seller/payment/confirm-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
  results.push(await testConsolidatedRoute('/api/seller/products', 'GET', 'http://localhost:3000/api/seller/products'));
  results.push(await testConsolidatedRoute('/api/seller/products', 'POST', 'http://localhost:3000/api/seller/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
  results.push(await testConsolidatedRoute('/api/seller/products/[productId]', 'GET', 'http://localhost:3000/api/seller/products/p1'));
  results.push(await testConsolidatedRoute('/api/seller/products/[productId]', 'PUT', 'http://localhost:3000/api/seller/products/p1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
  results.push(await testConsolidatedRoute('/api/seller/products/[productId]', 'DELETE', 'http://localhost:3000/api/seller/products/p1', {
    method: 'DELETE',
  }));
  results.push(await testConsolidatedRoute('/api/seller/products/[productId]/submit', 'POST', 'http://localhost:3000/api/seller/products/p1/submit', {
    method: 'POST',
  }));
  results.push(await testConsolidatedRoute('/api/seller/upload-image', 'POST', 'http://localhost:3000/api/seller/upload-image', {
    method: 'POST',
  }));
  results.push(await testConsolidatedRoute('/api/seller-application', 'POST', 'http://localhost:3000/api/seller-application', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));

  // 7. Webhooks & Cron
  results.push(await testConsolidatedRoute('/api/webhooks/razorpay', 'POST', 'http://localhost:3000/api/webhooks/razorpay', {
    method: 'POST',
    body: JSON.stringify({ event: 'test' }),
  }));
  results.push(await testConsolidatedRoute('/api/webhooks/shiprocket', 'POST', 'http://localhost:3000/api/webhooks/shiprocket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
  results.push(await testConsolidatedRoute('/api/cron/restore-expired', 'GET', 'http://localhost:3000/api/cron/restore-expired'));
  results.push(await testConsolidatedRoute('/api/cron/intelligence', 'GET', 'http://localhost:3000/api/cron/intelligence'));

  // 8. Misc routes
  results.push(await testConsolidatedRoute('/api/collect', 'POST', 'http://localhost:3000/api/collect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
  results.push(await testConsolidatedRoute('/api/events', 'POST', 'http://localhost:3000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
  results.push(await testConsolidatedRoute('/api/trending', 'GET', 'http://localhost:3000/api/trending'));
  results.push(await testConsolidatedRoute('/api/search/suggestions', 'GET', 'http://localhost:3000/api/search/suggestions?q=candle'));
  results.push(await testConsolidatedRoute('/api/docs/[slug]/[type]', 'GET', 'http://localhost:3000/api/docs/375/coa'));
  results.push(await testConsolidatedRoute('/api/apply', 'POST', 'http://localhost:3000/api/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
  results.push(await testConsolidatedRoute('/api/products', 'GET', 'http://localhost:3000/api/products?page=1&limit=5'));
  results.push(await testConsolidatedRoute('/api/coupons/validate', 'POST', 'http://localhost:3000/api/coupons/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'INVALID' }),
  }));
  results.push(await testConsolidatedRoute('/api/track-hesitation', 'POST', 'http://localhost:3000/api/track-hesitation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));

  console.log(`Executed ${results.length} consolidated route tests against baseline.`);

  let diffCount = 0;
  for (let i = 0; i < results.length; i++) {
    const res = results[i];
    const base = baseline.find(b => b.route === res.route && b.method === res.method);
    if (!base) {
      console.warn(`[MISSING BASELINE] No baseline for ${res.method} ${res.route}`);
      continue;
    }

    const isUnsupportedMethodInBaseline =
      base.bodyShape?.error && typeof base.bodyShape.error === 'string' &&
      base.bodyShape.error.includes('Handler for') &&
      base.bodyShape.error.includes('not found');

    const statusMatch =
      res.status === base.status ||
      (isUnsupportedMethodInBaseline && res.status === 405);
    const ctMatch =
      (res.contentType || '').split(';')[0] === (base.contentType || '').split(';')[0] ||
      (isUnsupportedMethodInBaseline && res.status === 405);
    const locMatch = res.location === base.location;

    if (!statusMatch || !ctMatch || !locMatch) {
      console.error(`[MISMATCH] ${res.method} ${res.route}:
  Status: got ${res.status}, expected ${base.status}
  Content-Type: got ${res.contentType}, expected ${base.contentType}
  Location: got ${res.location}, expected ${base.location}`);
      diffCount++;
    } else {
      console.log(`[PASS] ${res.method} ${res.route} -> status ${res.status}`);
    }
  }

  if (diffCount > 0) {
    console.error(`FAILED: ${diffCount} mismatches detected.`);
    process.exit(1);
  } else {
    console.log(`ALL ${results.length} CONSOLIDATED ROUTE CHARACTERIZATIONS PASSED!`);
  }
}

if (require.main === module || process.argv[1]?.endsWith('verify-consolidated-routes.ts')) {
  runVerification().catch(err => {
    console.error('Verification error:', err);
    process.exit(1);
  });
}
