import fs from 'fs';
import path from 'path';

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

export async function runCharacterization(): Promise<SnapshotResult[]> {
  const results: SnapshotResult[] = [];

  async function testRoute(
    route: string,
    method: string,
    handlerPromise: Promise<any>,
    req: Request,
    params?: any
  ) {
    try {
      const mod = await handlerPromise;
      const fn = mod[method];
      if (!fn) {
        throw new Error(`Handler for ${method} on ${route} not found`);
      }
      const res = await fn(req, params ? { params: Promise.resolve(params) } : undefined);
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

      results.push({
        route,
        method,
        status,
        contentType,
        location,
        hasSetCookie,
        bodyShape
      });
    } catch (err: any) {
      results.push({
        route,
        method,
        status: 500,
        contentType: 'error',
        location: null,
        hasSetCookie: false,
        bodyShape: { error: err.message }
      });
    }
  }

  // 1. Auth routes
  await testRoute('/api/auth/me', 'GET', import('@/app/api/auth/me/route'), new Request('http://localhost:3000/api/auth/me'));
  await testRoute('/api/auth/login', 'POST', import('@/app/api/auth/login/route'), new Request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }));
  await testRoute('/api/auth/signup', 'POST', import('@/app/api/auth/signup/route'), new Request('http://localhost:3000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }));
  await testRoute('/api/auth/logout', 'POST', import('@/app/api/auth/logout/route'), new Request('http://localhost:3000/api/auth/logout', { method: 'POST' }));
  await testRoute('/api/auth/google', 'GET', import('@/app/api/auth/google/route'), new Request('http://localhost:3000/api/auth/google'));
  await testRoute('/api/auth/google/callback', 'GET', import('@/app/api/auth/google/callback/route'), new Request('http://localhost:3000/api/auth/google/callback'));

  // 2. Cart routes
  await testRoute('/api/cart', 'GET', import('@/app/api/cart/route'), new Request('http://localhost:3000/api/cart'));
  await testRoute('/api/cart', 'POST', import('@/app/api/cart/route'), new Request('http://localhost:3000/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }));
  await testRoute('/api/cart/guest', 'POST', import('@/app/api/cart/guest/route'), new Request('http://localhost:3000/api/cart/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [] })
  }));
  await testRoute('/api/cart/sync', 'POST', import('@/app/api/cart/sync/route'), new Request('http://localhost:3000/api/cart/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [] })
  }));
  await testRoute('/api/cart/[itemId]', 'PATCH', import('@/app/api/cart/[itemId]/route'), new Request('http://localhost:3000/api/cart/item-123', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity: 2 })
  }), { itemId: 'item-123' });
  await testRoute('/api/cart/[itemId]', 'DELETE', import('@/app/api/cart/[itemId]/route'), new Request('http://localhost:3000/api/cart/item-123', {
    method: 'DELETE'
  }), { itemId: 'item-123' });

  // 3. Checkout routes
  await testRoute('/api/checkout/quote', 'POST', import('@/app/api/checkout/quote/route'), new Request('http://localhost:3000/api/checkout/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [] })
  }));
  await testRoute('/api/checkout/recommendations', 'GET', import('@/app/api/checkout/recommendations/route'), new Request('http://localhost:3000/api/checkout/recommendations'));
  await testRoute('/api/checkout/create-order', 'POST', import('@/app/api/checkout/create-order/route'), new Request('http://localhost:3000/api/checkout/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }));
  await testRoute('/api/checkout/confirm-payment', 'POST', import('@/app/api/checkout/confirm-payment/route'), new Request('http://localhost:3000/api/checkout/confirm-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }));
  await testRoute('/api/checkout/callback', 'GET', import('@/app/api/checkout/callback/route'), new Request('http://localhost:3000/api/checkout/callback'));

  // 4. Account & Addresses
  await testRoute('/api/account/orders', 'GET', import('@/app/api/account/orders/route'), new Request('http://localhost:3000/api/account/orders'));
  await testRoute('/api/addresses', 'GET', import('@/app/api/addresses/route'), new Request('http://localhost:3000/api/addresses'));
  await testRoute('/api/addresses', 'POST', import('@/app/api/addresses/route'), new Request('http://localhost:3000/api/addresses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }));
  await testRoute('/api/addresses/[id]', 'PUT', import('@/app/api/addresses/[id]/route'), new Request('http://localhost:3000/api/addresses/addr-1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }), { id: 'addr-1' });
  await testRoute('/api/addresses/[id]', 'DELETE', import('@/app/api/addresses/[id]/route'), new Request('http://localhost:3000/api/addresses/addr-1', {
    method: 'DELETE'
  }), { id: 'addr-1' });

  // 5. Admin routes
  await testRoute('/api/admin/coupons', 'GET', import('@/app/api/admin/coupons/route'), new Request('http://localhost:3000/api/admin/coupons'));
  await testRoute('/api/admin/coupons', 'POST', import('@/app/api/admin/coupons/route'), new Request('http://localhost:3000/api/admin/coupons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }));
  await testRoute('/api/admin/coupons/[id]', 'GET', import('@/app/api/admin/coupons/[id]/route'), new Request('http://localhost:3000/api/admin/coupons/cpn-1'), { id: 'cpn-1' });
  await testRoute('/api/admin/coupons/[id]', 'PUT', import('@/app/api/admin/coupons/[id]/route'), new Request('http://localhost:3000/api/admin/coupons/cpn-1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }), { id: 'cpn-1' });
  await testRoute('/api/admin/coupons/[id]', 'DELETE', import('@/app/api/admin/coupons/[id]/route'), new Request('http://localhost:3000/api/admin/coupons/cpn-1', {
    method: 'DELETE'
  }), { id: 'cpn-1' });

  await testRoute('/api/admin/leads', 'GET', import('@/app/api/admin/leads/route'), new Request('http://localhost:3000/api/admin/leads'));
  await testRoute('/api/admin/leads', 'POST', import('@/app/api/admin/leads/route'), new Request('http://localhost:3000/api/admin/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }));
  await testRoute('/api/admin/orders', 'GET', import('@/app/api/admin/orders/route'), new Request('http://localhost:3000/api/admin/orders'));
  await testRoute('/api/admin/orders/restore-expired', 'POST', import('@/app/api/admin/orders/restore-expired/route'), new Request('http://localhost:3000/api/admin/orders/restore-expired', {
    method: 'POST'
  }));
  await testRoute('/api/admin/orders/[id]', 'GET', import('@/app/api/admin/orders/[id]/route'), new Request('http://localhost:3000/api/admin/orders/ord-1'), { id: 'ord-1' });
  await testRoute('/api/admin/orders/[id]', 'PATCH', import('@/app/api/admin/orders/[id]/route'), new Request('http://localhost:3000/api/admin/orders/ord-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }), { id: 'ord-1' });
  await testRoute('/api/admin/orders/[id]/ship', 'POST', import('@/app/api/admin/orders/[id]/ship/route'), new Request('http://localhost:3000/api/admin/orders/ord-1/ship', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }), { id: 'ord-1' });
  await testRoute('/api/admin/price-requests/[id]', 'PATCH', import('@/app/api/admin/price-requests/[id]/route'), new Request('http://localhost:3000/api/admin/price-requests/pr-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }), { id: 'pr-1' });
  await testRoute('/api/admin/products/[productId]/approve', 'POST', import('@/app/api/admin/products/[productId]/approve/route'), new Request('http://localhost:3000/api/admin/products/p1/approve', {
    method: 'POST'
  }), { productId: 'p1' });
  await testRoute('/api/admin/products/[productId]/reject', 'POST', import('@/app/api/admin/products/[productId]/reject/route'), new Request('http://localhost:3000/api/admin/products/p1/reject', {
    method: 'POST'
  }), { productId: 'p1' });
  await testRoute('/api/admin/sellers/[sellerId]/approve', 'POST', import('@/app/api/admin/sellers/[sellerId]/approve/route'), new Request('http://localhost:3000/api/admin/sellers/s1/approve', {
    method: 'POST'
  }), { sellerId: 's1' });
  await testRoute('/api/admin/sellers/[sellerId]/reactivate', 'POST', import('@/app/api/admin/sellers/[sellerId]/reactivate/route'), new Request('http://localhost:3000/api/admin/sellers/s1/reactivate', {
    method: 'POST'
  }), { sellerId: 's1' });
  await testRoute('/api/admin/sellers/[sellerId]/reject', 'POST', import('@/app/api/admin/sellers/[sellerId]/reject/route'), new Request('http://localhost:3000/api/admin/sellers/s1/reject', {
    method: 'POST'
  }), { sellerId: 's1' });
  await testRoute('/api/admin/sellers/[sellerId]/suspend', 'POST', import('@/app/api/admin/sellers/[sellerId]/suspend/route'), new Request('http://localhost:3000/api/admin/sellers/s1/suspend', {
    method: 'POST'
  }), { sellerId: 's1' });

  // 6. Seller routes
  await testRoute('/api/seller/payment/create-order', 'POST', import('@/app/api/seller/payment/create-order/route'), new Request('http://localhost:3000/api/seller/payment/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }));
  await testRoute('/api/seller/payment/confirm-payment', 'POST', import('@/app/api/seller/payment/confirm-payment/route'), new Request('http://localhost:3000/api/seller/payment/confirm-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }));
  await testRoute('/api/seller/products', 'GET', import('@/app/api/seller/products/route'), new Request('http://localhost:3000/api/seller/products'));
  await testRoute('/api/seller/products', 'POST', import('@/app/api/seller/products/route'), new Request('http://localhost:3000/api/seller/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }));
  await testRoute('/api/seller/products/[productId]', 'GET', import('@/app/api/seller/products/[productId]/route'), new Request('http://localhost:3000/api/seller/products/p1'), { productId: 'p1' });
  await testRoute('/api/seller/products/[productId]', 'PUT', import('@/app/api/seller/products/[productId]/route'), new Request('http://localhost:3000/api/seller/products/p1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }), { productId: 'p1' });
  await testRoute('/api/seller/products/[productId]', 'DELETE', import('@/app/api/seller/products/[productId]/route'), new Request('http://localhost:3000/api/seller/products/p1', {
    method: 'DELETE'
  }), { productId: 'p1' });
  await testRoute('/api/seller/products/[productId]/submit', 'POST', import('@/app/api/seller/products/[productId]/submit/route'), new Request('http://localhost:3000/api/seller/products/p1/submit', {
    method: 'POST'
  }), { productId: 'p1' });
  await testRoute('/api/seller/upload-image', 'POST', import('@/app/api/seller/upload-image/route'), new Request('http://localhost:3000/api/seller/upload-image', {
    method: 'POST'
  }));
  await testRoute('/api/seller-application', 'POST', import('@/app/api/seller-application/route'), new Request('http://localhost:3000/api/seller-application', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }));

  // 7. Webhooks & Cron
  await testRoute('/api/webhooks/razorpay', 'POST', import('@/app/api/webhooks/razorpay/route'), new Request('http://localhost:3000/api/webhooks/razorpay', {
    method: 'POST',
    body: JSON.stringify({ event: 'test' })
  }));
  await testRoute('/api/webhooks/shiprocket', 'POST', import('@/app/api/webhooks/shiprocket/route'), new Request('http://localhost:3000/api/webhooks/shiprocket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }));
  await testRoute('/api/cron/restore-expired', 'GET', import('@/app/api/cron/restore-expired/route'), new Request('http://localhost:3000/api/cron/restore-expired'));
  await testRoute('/api/cron/intelligence', 'GET', import('@/app/api/cron/intelligence/route'), new Request('http://localhost:3000/api/cron/intelligence'));

  // 8. Misc routes
  await testRoute('/api/collect', 'POST', import('@/app/api/collect/route'), new Request('http://localhost:3000/api/collect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }));
  await testRoute('/api/events', 'POST', import('@/app/api/events/route'), new Request('http://localhost:3000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }));
  await testRoute('/api/trending', 'GET', import('@/app/api/trending/route'), new Request('http://localhost:3000/api/trending'));
  await testRoute('/api/search/suggestions', 'GET', import('@/app/api/search/suggestions/route'), new Request('http://localhost:3000/api/search/suggestions?q=candle'));
  await testRoute('/api/docs/[slug]/[type]', 'GET', import('@/app/api/docs/[slug]/[type]/route'), new Request('http://localhost:3000/api/docs/375/coa'), { slug: '375', type: 'coa' });
  await testRoute('/api/apply', 'POST', import('@/app/api/apply/route'), new Request('http://localhost:3000/api/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }));
  await testRoute('/api/products', 'GET', import('@/app/api/products/route'), new Request('http://localhost:3000/api/products?page=1&limit=5'));
  await testRoute('/api/coupons/validate', 'POST', import('@/app/api/coupons/validate/route'), new Request('http://localhost:3000/api/coupons/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'INVALID' })
  }));
  await testRoute('/api/track-hesitation', 'POST', import('@/app/api/track-hesitation/route'), new Request('http://localhost:3000/api/track-hesitation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }));
  await testRoute('/sitemap_index.xml', 'GET', import('@/app/sitemap_index.xml/route'), new Request('http://localhost:3000/sitemap_index.xml'));

  return results;
}

if (require.main === module || process.argv[1]?.endsWith('characterize-routes.ts')) {
  runCharacterization().then((results) => {
    const outPath = path.join(process.cwd(), 'docs', 'api-characterization-baseline.json');
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`Characterized ${results.length} endpoints successfully -> ${outPath}`);
  }).catch((err) => {
    console.error('Characterization failed:', err);
    process.exit(1);
  });
}
