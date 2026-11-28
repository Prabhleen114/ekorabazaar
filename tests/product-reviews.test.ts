import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// ─── Typed In-Memory Mocks ────────────────────────────────────────────────────

type MockRecord = Record<string, unknown>;

interface MockReviewRow {
  id: string;
  productId: string;
  userId: string | null;
  orderId: string | null;
  orderItemId: string | null;
  reviewTokenId: string | null;
  rating: number;
  title: string | null;
  comment: string;
  reviewerName: string | null;
  reviewerEmail: string | null;
  isVerifiedPurchase: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  moderatedById: string | null;
  moderatedAt: Date | null;
  moderationNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MockTokenRow {
  id: string;
  token: string;
  orderId: string;
  orderItemId: string;
  productId: string;
  createdById: string | null;
  expiresAt: Date | null;
  usedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const mockState = vi.hoisted(() => ({
  session: null as { userId: string; role: 'CUSTOMER' | 'SELLER' | 'ADMIN'; sellerId: string | null } | null,
  users: new Map<string, MockRecord>(),
  products: new Map<string, MockRecord>(),
  orders: new Map<string, MockRecord>(),
  orderItems: new Map<string, MockRecord>(),
  reviewTokens: new Map<string, MockTokenRow>(),
  reviews: new Map<string, MockReviewRow>(),
  auditLogs: [] as MockRecord[],
}));

let idSeq = 1;
function nextId(prefix: string) {
  idSeq += 1;
  return `${prefix}-${idSeq}`;
}

function resetState() {
  idSeq = 1;
  mockState.session = null;
  mockState.users.clear();
  mockState.products.clear();
  mockState.orders.clear();
  mockState.orderItems.clear();
  mockState.reviewTokens.clear();
  mockState.reviews.clear();
  mockState.auditLogs = [];

  mockState.users.set('admin-1', {
    id: 'admin-1',
    name: 'Ekora Admin',
    email: 'admin@ekorabazaar.in',
    role: 'ADMIN',
  });

  mockState.users.set('cust-1', {
    id: 'cust-1',
    name: 'Ananya Sharma',
    email: 'ananya@example.com',
    phone: '9876543210',
    role: 'CUSTOMER',
  });

  mockState.users.set('cust-2', {
    id: 'cust-2',
    name: 'Vikram Patel',
    email: 'vikram@example.com',
    phone: '9988776655',
    role: 'CUSTOMER',
  });

  mockState.products.set('prod-ethanol', {
    id: 'prod-ethanol',
    title: 'Perfumer Grade Ethanol 99.9%',
    category: 'Perfumery Solvents & Alcohols',
    imageUrl: '/images/products/ethanol.jpg',
    status: 'PUBLISHED',
    isActive: true,
    sellerId: null,
    seller: null,
    price: 45000,
    stock: 100,
  });

  mockState.products.set('prod-soy-wax', {
    id: 'prod-soy-wax',
    title: '464 Natural Soy Wax Flakes',
    category: 'Candle Waxes & Additives',
    imageUrl: '/images/products/soy-wax.jpg',
    status: 'PUBLISHED',
    isActive: true,
    sellerId: null,
    seller: null,
    price: 32000,
    stock: 80,
  });

  mockState.orders.set('ord-paid-multi', {
    id: 'ord-paid-multi',
    customerId: 'cust-1',
    status: 'DELIVERED',
    paymentStatus: 'CAPTURED',
    addressSnapshot: { name: 'Ananya Sharma', phone: '9876543210', email: 'ananya@example.com' },
    payments: [{ id: 'pay-1', status: 'CAPTURED' }],
    createdAt: new Date('2026-11-20T10:00:00Z'),
  });

  mockState.orderItems.set('oi-ethanol', {
    id: 'oi-ethanol',
    orderId: 'ord-paid-multi',
    productId: 'prod-ethanol',
    productNameSnapshot: 'Perfumer Grade Ethanol 99.9%',
    priceSnapshot: 45000,
    quantity: 2,
    subtotal: 90000,
    createdAt: new Date('2026-11-20T10:00:00Z'),
  });

  mockState.orderItems.set('oi-soy', {
    id: 'oi-soy',
    orderId: 'ord-paid-multi',
    productId: 'prod-soy-wax',
    productNameSnapshot: '464 Natural Soy Wax Flakes',
    priceSnapshot: 32000,
    quantity: 1,
    subtotal: 32000,
    createdAt: new Date('2026-11-20T10:00:00Z'),
  });

  mockState.orders.set('ord-cancelled', {
    id: 'ord-cancelled',
    customerId: 'cust-2',
    status: 'CANCELLED',
    paymentStatus: 'PENDING',
    addressSnapshot: { name: 'Vikram Patel', phone: '9988776655' },
    payments: [{ id: 'pay-2', status: 'FAILED' }],
    createdAt: new Date('2026-11-21T10:00:00Z'),
  });

  mockState.orderItems.set('oi-cancelled-ethanol', {
    id: 'oi-cancelled-ethanol',
    orderId: 'ord-cancelled',
    productId: 'prod-ethanol',
    productNameSnapshot: 'Perfumer Grade Ethanol 99.9%',
    priceSnapshot: 45000,
    quantity: 1,
    subtotal: 45000,
    createdAt: new Date('2026-11-21T10:00:00Z'),
  });
}

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(async () => mockState.session),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(async () => {
    if (!mockState.session) throw new Error('UNAUTHORIZED');
    return mockState.session;
  }),
  requireAdmin: vi.fn(async () => {
    if (!mockState.session) throw new Error('UNAUTHORIZED');
    if (mockState.session.role !== 'ADMIN') throw new Error('FORBIDDEN: Admin access required.');
    return mockState.session;
  }),
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(async (actorId: string, action: string, entityId: string, metadata: MockRecord) => {
    mockState.auditLogs.push({ actorId, action, entityId, metadata });
  }),
}));

vi.mock('@/lib/rate-limit', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
  rateLimit: vi.fn(() => ({ success: true, limit: 10, remaining: 9, reset: 900 })),
}));

interface ReviewWhereFilter {
  productId?: string;
  userId?: string;
  reviewerEmail?: string;
  rating?: number;
  status?: string | { in?: string[] };
  createdAt?: { gte?: Date; lte?: Date };
  OR?: Array<Record<string, { contains?: string } & { title?: { contains?: string } }>>;
}

vi.mock('@/lib/db', () => {
  const hydrateReview = (r: MockReviewRow) => {
    const product = mockState.products.get(r.productId) || null;
    const user = r.userId ? mockState.users.get(r.userId) || null : null;
    const orderRaw = r.orderId ? mockState.orders.get(r.orderId) : undefined;
    const order = orderRaw
      ? {
          ...orderRaw,
          customer: mockState.users.get(String(orderRaw.customerId)) || null,
        }
      : null;
    return { ...r, product, user, order };
  };

  const hydrateToken = (t: MockTokenRow) => {
    const orderRaw = mockState.orders.get(t.orderId) || null;
    const order = orderRaw
      ? {
          ...orderRaw,
          customer: mockState.users.get(String(orderRaw.customerId)) || null,
        }
      : null;
    const orderItem = mockState.orderItems.get(t.orderItemId) || null;
    const review = Array.from(mockState.reviews.values()).find((r) => r.reviewTokenId === t.id) || null;
    return { ...t, order, orderItem, review };
  };

  const matchReviewWhere = (r: MockReviewRow, where: ReviewWhereFilter = {}): boolean => {
    if (where.productId && r.productId !== where.productId) return false;
    if (where.userId && r.userId !== where.userId) return false;
    if (where.reviewerEmail && r.reviewerEmail !== where.reviewerEmail) return false;
    if (where.rating && r.rating !== where.rating) return false;
    if (where.status) {
      if (typeof where.status === 'string' && r.status !== where.status) return false;
      if (typeof where.status === 'object' && where.status.in && !where.status.in.includes(r.status)) {
        return false;
      }
    }
    if (where.createdAt) {
      const dt = new Date(r.createdAt).getTime();
      if (where.createdAt.gte && dt < new Date(where.createdAt.gte).getTime()) return false;
      if (where.createdAt.lte && dt > new Date(where.createdAt.lte).getTime()) return false;
    }
    if (where.OR && Array.isArray(where.OR)) {
      const productTitle = String(mockState.products.get(r.productId)?.title || '');
      const qMatched = where.OR.some((clause) => {
        if (clause.comment?.contains) {
          return String(r.comment || '').toLowerCase().includes(clause.comment.contains.toLowerCase());
        }
        if (clause.title?.contains) {
          return String(r.title || '').toLowerCase().includes(clause.title.contains.toLowerCase());
        }
        if (clause.reviewerName?.contains) {
          return String(r.reviewerName || '').toLowerCase().includes(clause.reviewerName.contains.toLowerCase());
        }
        if (clause.reviewerEmail?.contains) {
          return String(r.reviewerEmail || '').toLowerCase().includes(clause.reviewerEmail.contains.toLowerCase());
        }
        if (clause.orderId?.contains) {
          return String(r.orderId || '').toLowerCase().includes(clause.orderId.contains.toLowerCase());
        }
        if (clause.product?.title?.contains) {
          return productTitle.toLowerCase().includes(clause.product.title.contains.toLowerCase());
        }
        return false;
      });
      if (!qMatched) return false;
    }
    return true;
  };

  const prismaMock: MockRecord = {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id) return mockState.users.get(where.id) || null;
        if (where.email) {
          return Array.from(mockState.users.values()).find((u) => u.email === where.email) || null;
        }
        return null;
      }),
      upsert: vi.fn(async ({ where, create }: { where: { email: string }; create: MockRecord }) => {
        const existing = Array.from(mockState.users.values()).find((u) => u.email === where.email);
        if (existing) return existing;
        const created = { id: nextId('user'), ...create };
        mockState.users.set(created.id, created);
        return created;
      }),
    },
    seller: {
      upsert: vi.fn(async ({ where, create }: { where: { id: string }; create: MockRecord }) => ({
        id: where.id,
        ...create,
      })),
    },
    product: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => mockState.products.get(where.id) || null),
      upsert: vi.fn(async ({ where, create }: { where: { id: string }; create: MockRecord }) => {
        const existing = mockState.products.get(where.id);
        if (existing) return existing;
        const created = { ...create, seller: { accountStatus: 'ACTIVE' } };
        mockState.products.set(where.id, created);
        return created;
      }),
      findMany: vi.fn(async ({ where }: { where?: { reviews?: { some?: MockRecord } } }) => {
        let rows = Array.from(mockState.products.values());
        if (where?.reviews?.some) {
          const reviewedPids = new Set(Array.from(mockState.reviews.values()).map((r) => r.productId));
          rows = rows.filter((p) => reviewedPids.has(String(p.id)));
        }
        return rows;
      }),
    },
    orderItem: {
      findFirst: vi.fn(async ({ where }: { where: { id: string; orderId?: string } }) => {
        const row = Array.from(mockState.orderItems.values()).find(
          (oi) => oi.id === where.id && (!where.orderId || oi.orderId === where.orderId)
        );
        if (!row) return null;
        const orderRaw = mockState.orders.get(String(row.orderId)) || null;
        const order = orderRaw
          ? { ...orderRaw, customer: mockState.users.get(String(orderRaw.customerId)) || null }
          : null;
        const reviewToken =
          Array.from(mockState.reviewTokens.values()).find((t) => t.orderItemId === row.id) || null;
        const review =
          Array.from(mockState.reviews.values()).find((r) => r.orderItemId === row.id) || null;
        return { ...row, order, reviewToken, review };
      }),
      findMany: vi.fn(
        async ({
          where,
        }: {
          where?: { productId?: { in?: string[] }; order?: { customerId?: string } };
        }) => {
          const rows = Array.from(mockState.orderItems.values()).filter((oi) => {
            if (where?.productId?.in && !where.productId.in.includes(String(oi.productId))) return false;
            if (where?.order?.customerId) {
              const ord = mockState.orders.get(String(oi.orderId));
              if (!ord || ord.customerId !== where.order.customerId) return false;
            }
            return true;
          });
          return rows.map((row) => {
            const order = mockState.orders.get(String(row.orderId)) || null;
            const review =
              Array.from(mockState.reviews.values()).find((r) => r.orderItemId === row.id) || null;
            return { ...row, order, review };
          });
        }
      ),
    },
    reviewToken: {
      findUnique: vi.fn(async ({ where }: { where: { token?: string; id?: string } }) => {
        const t = Array.from(mockState.reviewTokens.values()).find((row) =>
          where.token ? row.token === where.token : row.id === where.id
        );
        return t ? hydrateToken(t) : null;
      }),
      create: vi.fn(async ({ data }: { data: Omit<MockTokenRow, 'id' | 'usedAt' | 'revokedAt' | 'createdAt' | 'updatedAt'> }) => {
        const row: MockTokenRow = {
          id: nextId('rt'),
          usedAt: null,
          revokedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        mockState.reviewTokens.set(row.id, row);
        return row;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<MockTokenRow> }) => {
        const existing = mockState.reviewTokens.get(where.id)!;
        const updated = { ...existing, ...data, updatedAt: new Date() };
        mockState.reviewTokens.set(where.id, updated);
        return updated;
      }),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string; usedAt?: null; revokedAt?: null };
          data: Partial<MockTokenRow>;
        }) => {
          const existing = mockState.reviewTokens.get(where.id);
          if (!existing) return { count: 0 };
          if (where.usedAt === null && existing.usedAt !== null) return { count: 0 };
          if (where.revokedAt === null && existing.revokedAt !== null) return { count: 0 };
          mockState.reviewTokens.set(where.id, { ...existing, ...data, updatedAt: new Date() });
          return { count: 1 };
        }
      ),
    },
    review: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string; orderItemId?: string } }) => {
        const found = Array.from(mockState.reviews.values()).find((r) =>
          where.id
            ? r.id === where.id
            : where.orderItemId
            ? r.orderItemId === where.orderItemId
            : false
        );
        return found || null;
      }),
      findFirst: vi.fn(async ({ where }: { where: ReviewWhereFilter }) => {
        const found = Array.from(mockState.reviews.values()).find((r) =>
          matchReviewWhere(r, where)
        );
        return found || null;
      }),
      findMany: vi.fn(
        async ({ where, skip = 0, take = 50 }: { where?: ReviewWhereFilter; skip?: number; take?: number }) => {
          return Array.from(mockState.reviews.values())
            .filter((r) => matchReviewWhere(r, where))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(skip, skip + take)
            .map(hydrateReview);
        }
      ),
      count: vi.fn(async ({ where }: { where?: ReviewWhereFilter }) => {
        return Array.from(mockState.reviews.values()).filter((r) =>
          matchReviewWhere(r, where)
        ).length;
      }),
      groupBy: vi.fn(async ({ by, where }: { by: Array<keyof MockReviewRow>; where?: ReviewWhereFilter }) => {
        const filtered = Array.from(mockState.reviews.values()).filter((r) =>
          matchReviewWhere(r, where)
        );
        const key = by[0];
        const buckets = new Map<string, number[]>();
        for (const row of filtered) {
          const k = String(row[key]);
          if (!buckets.has(k)) buckets.set(k, []);
          buckets.get(k)!.push(row.rating);
        }
        return Array.from(buckets.entries()).map(([k, ratings]) => ({
          [key]: k,
          _count: { _all: ratings.length },
          _avg: {
            rating:
              ratings.length > 0
                ? ratings.reduce((s, n) => s + n, 0) / ratings.length
                : null,
          },
        }));
      }),
      aggregate: vi.fn(async ({ where }: { where?: ReviewWhereFilter }) => {
        const filtered = Array.from(mockState.reviews.values()).filter((r) =>
          matchReviewWhere(r, where)
        );
        const avg =
          filtered.length > 0
            ? filtered.reduce((s, r) => s + r.rating, 0) / filtered.length
            : null;
        return { _avg: { rating: avg }, _count: { _all: filtered.length } };
      }),
      create: vi.fn(async ({ data }: { data: Partial<MockReviewRow> & { productId: string; rating: number; comment: string } }) => {
        if (data.orderItemId) {
          const dup = Array.from(mockState.reviews.values()).find(
            (r) => r.orderItemId === data.orderItemId
          );
          if (dup) throw new Error('Unique constraint failed on orderItemId');
        }
        const row: MockReviewRow = {
          id: nextId('rev'),
          orderId: null,
          orderItemId: null,
          reviewTokenId: null,
          userId: null,
          title: null,
          reviewerName: null,
          reviewerEmail: null,
          isVerifiedPurchase: false,
          status: 'PENDING',
          moderatedById: null,
          moderatedAt: null,
          moderationNote: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        mockState.reviews.set(row.id, row);
        return row;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<MockReviewRow> }) => {
        const existing = mockState.reviews.get(where.id)!;
        const updated = { ...existing, ...data, updatedAt: new Date() };
        mockState.reviews.set(where.id, updated);
        return updated;
      }),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const existing = mockState.reviews.get(where.id);
        mockState.reviews.delete(where.id);
        return existing;
      }),
    },
    $transaction: vi.fn(async (fn: (tx: MockRecord) => Promise<unknown>) => fn(prismaMock)),
  };

  return { default: prismaMock };
});

import {
  handleGetProductReviews,
  handlePostProductReview,
  handleVerifyReviewToken,
  handleGetAdminReviews,
  handlePatchAdminReview,
  handleDeleteAdminReview,
  handlePostAdminOrderReviewLink,
} from '@/server/api/handlers/reviews';
import {
  buildProductReviewUrl,
  buildReviewWhatsAppMessage,
  buildReviewWhatsAppShareUrl,
  computeReviewStats,
} from '@/lib/reviews';
import { generateProductSchema } from '@/lib/seo';

describe('Product Review & Rating System End-to-End Tests', () => {
  beforeEach(() => {
    resetState();
  });

  it('1. Customer submits review -> starts PENDING -> hidden from public & schema -> Admin approves -> visible publicly & in JSON-LD', async () => {
    const initialPublicRes = await handleGetProductReviews(
      new NextRequest('http://localhost/api/products/prod-ethanol/reviews'),
      { params: Promise.resolve({ id: 'prod-ethanol' }) }
    );
    const initialData = await initialPublicRes.json();
    expect(initialData.stats.totalReviews).toBe(0);
    expect(initialData.stats.averageRating).toBe(0);

    const emptySchema = generateProductSchema(
      mockState.products.get('prod-ethanol'),
      'Ekora Bazaar',
      initialData
    );
    expect(emptySchema.aggregateRating).toBeUndefined();
    expect(emptySchema.review).toBeUndefined();

    const postReq = new NextRequest('http://localhost/api/products/prod-ethanol/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: 5,
        title: 'Clean solvent for perfumery',
        comment: 'Zero off-odors and evaporates cleanly on scent strips.',
        reviewerName: 'Meera Studio',
        reviewerEmail: 'meera@private.com',
        isVerifiedPurchase: true,
      }),
    });
    const postRes = await handlePostProductReview(postReq, {
      params: Promise.resolve({ id: 'prod-ethanol' }),
    });
    expect(postRes.status).toBe(201);
    const postData = await postRes.json();
    expect(postData.status).toBe('PENDING');
    expect(postData.isVerifiedPurchase).toBe(false);

    const stillPendingRes = await handleGetProductReviews(
      new NextRequest('http://localhost/api/products/prod-ethanol/reviews'),
      { params: Promise.resolve({ id: 'prod-ethanol' }) }
    );
    const stillPendingData = await stillPendingRes.json();
    expect(stillPendingData.reviews).toHaveLength(0);

    mockState.session = { userId: 'admin-1', role: 'ADMIN', sellerId: null };
    const adminListRes = await handleGetAdminReviews(
      new NextRequest('http://localhost/api/admin/reviews?status=PENDING')
    );
    expect(adminListRes.status).toBe(200);
    const adminListData = await adminListRes.json();
    expect(adminListData.counts.PENDING).toBe(1);
    expect(adminListData.reviews[0].customerEmail).toBe('meera@private.com');
    expect(adminListData.reviews[0].productTitle).toBe('Perfumer Grade Ethanol 99.9%');

    const reviewId = adminListData.reviews[0].id;

    const approveRes = await handlePatchAdminReview(
      new NextRequest(`http://localhost/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      }),
      { params: Promise.resolve({ id: reviewId }) }
    );
    expect(approveRes.status).toBe(200);

    const publicRes = await handleGetProductReviews(
      new NextRequest('http://localhost/api/products/prod-ethanol/reviews'),
      { params: Promise.resolve({ id: 'prod-ethanol' }) }
    );
    const publicData = await publicRes.json();
    expect(publicData.stats.totalReviews).toBe(1);
    expect(publicData.stats.averageRating).toBe(5);
    expect(publicData.stats.distribution[5]).toBe(1);
    expect(publicData.reviews[0].reviewerName).toBe('Meera Studio');
    expect(publicData.reviews[0].reviewerEmail).toBeUndefined();
    expect(publicData.reviews[0].orderId).toBeUndefined();

    const populatedSchema = generateProductSchema(
      mockState.products.get('prod-ethanol'),
      'Ekora Bazaar',
      publicData
    );
    expect(populatedSchema.aggregateRating).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 5,
      reviewCount: 1,
      bestRating: 5,
      worstRating: 1,
    });
    expect(populatedSchema.review).toHaveLength(1);
    expect(populatedSchema.review[0].reviewBody).toContain('Zero off-odors');
  });

  it('2. Multi-product order: Admin generates independent Share Review Links & WhatsApp messages -> customer redeems Verified Purchase -> duplicate rejected', async () => {
    mockState.session = { userId: 'admin-1', role: 'ADMIN', sellerId: null };

    const shareEthanolRes = await handlePostAdminOrderReviewLink(
      new NextRequest('http://localhost/api/admin/orders/ord-paid-multi/review-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderItemId: 'oi-ethanol' }),
      }),
      { params: Promise.resolve({ id: 'ord-paid-multi' }) }
    );
    expect(shareEthanolRes.status).toBe(200);
    const shareEthanol = await shareEthanolRes.json();

    expect(shareEthanol.productId).toBe('prod-ethanol');
    expect(shareEthanol.reviewUrl).toContain('/products/prod-ethanol');
    expect(shareEthanol.reviewUrl).toContain('writeReview=true');
    expect(shareEthanol.reviewUrl).toContain(`reviewToken=${encodeURIComponent(shareEthanol.token)}`);
    expect(shareEthanol.whatsappMessage).toContain('Perfumer Grade Ethanol 99.9%');
    expect(shareEthanol.whatsappMessage).toContain(shareEthanol.reviewUrl);
    expect(shareEthanol.whatsappUrl).toContain('https://wa.me/919876543210?text=');

    const shareSoyRes = await handlePostAdminOrderReviewLink(
      new NextRequest('http://localhost/api/admin/orders/ord-paid-multi/review-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderItemId: 'oi-soy' }),
      }),
      { params: Promise.resolve({ id: 'ord-paid-multi' }) }
    );
    expect(shareSoyRes.status).toBe(200);
    const shareSoy = await shareSoyRes.json();

    expect(shareSoy.productId).toBe('prod-soy-wax');
    expect(shareSoy.token).not.toBe(shareEthanol.token);
    expect(shareSoy.reviewUrl).toContain('/products/prod-soy-wax');
    expect(shareSoy.whatsappMessage).toContain('464 Natural Soy Wax Flakes');

    mockState.session = null;
    const verifyRes = await handleVerifyReviewToken(
      new NextRequest(
        `http://localhost/api/reviews/verify-token?token=${encodeURIComponent(
          shareEthanol.token
        )}&productId=prod-ethanol`
      )
    );
    const verifyData = await verifyRes.json();
    expect(verifyData.valid).toBe(true);
    expect(verifyData.verifiedPurchaseEligible).toBe(true);

    const wrongProductSubmit = await handlePostProductReview(
      new NextRequest('http://localhost/api/products/prod-soy-wax/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 5,
          comment: 'Trying wrong product with ethanol token',
          reviewToken: shareEthanol.token,
        }),
      }),
      { params: Promise.resolve({ id: 'prod-soy-wax' }) }
    );
    expect(wrongProductSubmit.status).toBe(400);

    const verifiedSubmit = await handlePostProductReview(
      new NextRequest('http://localhost/api/products/prod-ethanol/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 4,
          title: 'Great packaging',
          comment: 'Arrived leak-proof and performs consistently in reed diffusers.',
          reviewToken: shareEthanol.token,
        }),
      }),
      { params: Promise.resolve({ id: 'prod-ethanol' }) }
    );
    expect(verifiedSubmit.status).toBe(201);
    const verifiedData = await verifiedSubmit.json();
    expect(verifiedData.isVerifiedPurchase).toBe(true);
    expect(verifiedData.review.reviewerName).toBe('Verified Buyer');

    const dupSubmit = await handlePostProductReview(
      new NextRequest('http://localhost/api/products/prod-ethanol/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 5,
          comment: 'Trying to submit twice for same order item.',
          reviewToken: shareEthanol.token,
        }),
      }),
      { params: Promise.resolve({ id: 'prod-ethanol' }) }
    );
    expect(dupSubmit.status).toBe(409);

    const soyVerifyRes = await handleVerifyReviewToken(
      new NextRequest(
        `http://localhost/api/reviews/verify-token?token=${encodeURIComponent(
          shareSoy.token
        )}&productId=prod-soy-wax`
      )
    );
    expect((await soyVerifyRes.json()).valid).toBe(true);
  });

  it('3. Authenticated customer purchase verification & cancelled order rejection', async () => {
    mockState.session = { userId: 'cust-1', role: 'CUSTOMER', sellerId: null };
    const authRes = await handlePostProductReview(
      new NextRequest('http://localhost/api/products/prod-soy-wax/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 5,
          comment: 'Melts evenly with smooth jar adhesion.',
          reviewerName: 'Ananya',
        }),
      }),
      { params: Promise.resolve({ id: 'prod-soy-wax' }) }
    );
    expect(authRes.status).toBe(201);
    const authData = await authRes.json();
    expect(authData.isVerifiedPurchase).toBe(true);

    const dupAuthRes = await handlePostProductReview(
      new NextRequest('http://localhost/api/products/prod-soy-wax/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 5,
          comment: 'Second review for same purchase should fail.',
        }),
      }),
      { params: Promise.resolve({ id: 'prod-soy-wax' }) }
    );
    expect(dupAuthRes.status).toBe(409);

    mockState.session = { userId: 'cust-2', role: 'CUSTOMER', sellerId: null };
    const cancelledBuyerRes = await handlePostProductReview(
      new NextRequest('http://localhost/api/products/prod-ethanol/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 3,
          comment: 'Asking about batch availability before reordering.',
        }),
      }),
      { params: Promise.resolve({ id: 'prod-ethanol' }) }
    );
    expect(cancelledBuyerRes.status).toBe(201);
    expect((await cancelledBuyerRes.json()).isVerifiedPurchase).toBe(false);

    mockState.session = { userId: 'admin-1', role: 'ADMIN', sellerId: null };
    const cancelledLinkRes = await handlePostAdminOrderReviewLink(
      new NextRequest('http://localhost/api/admin/orders/ord-cancelled/review-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderItemId: 'oi-cancelled-ethanol' }),
      }),
      { params: Promise.resolve({ id: 'ord-cancelled' }) }
    );
    expect(cancelledLinkRes.status).toBe(400);
  });

  it('4. Security, validation, admin filters, reject & delete workflows', async () => {
    mockState.session = { userId: 'cust-1', role: 'CUSTOMER', sellerId: null };
    const unauthAdmin = await handleGetAdminReviews(
      new NextRequest('http://localhost/api/admin/reviews')
    );
    expect(unauthAdmin.status).toBe(403);

    mockState.session = null;
    const badRating = await handlePostProductReview(
      new NextRequest('http://localhost/api/products/prod-ethanol/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 6, comment: 'Too high rating!' }),
      }),
      { params: Promise.resolve({ id: 'prod-ethanol' }) }
    );
    expect(badRating.status).toBe(400);

    const botSpam = await handlePostProductReview(
      new NextRequest('http://localhost/api/products/prod-ethanol/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 5,
          comment: 'Spam bot review text here',
          website: 'https://spam.example.com',
        }),
      }),
      { params: Promise.resolve({ id: 'prod-ethanol' }) }
    );
    expect(botSpam.status).toBe(400);

    await handlePostProductReview(
      new NextRequest('http://localhost/api/products/prod-ethanol/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 5,
          title: 'Best solvent',
          comment: 'Excellent purity for perfume making.',
          reviewerEmail: 'a@test.com',
        }),
      }),
      { params: Promise.resolve({ id: 'prod-ethanol' }) }
    );
    await handlePostProductReview(
      new NextRequest('http://localhost/api/products/prod-ethanol/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 2,
          comment: 'Bottle cap felt slightly loose.',
          reviewerEmail: 'b@test.com',
        }),
      }),
      { params: Promise.resolve({ id: 'prod-ethanol' }) }
    );

    mockState.session = { userId: 'admin-1', role: 'ADMIN', sellerId: null };
    const filterByRatingRes = await handleGetAdminReviews(
      new NextRequest('http://localhost/api/admin/reviews?rating=2&productId=prod-ethanol')
    );
    const filterByRatingData = await filterByRatingRes.json();
    expect(filterByRatingData.reviews).toHaveLength(1);
    const twoStarId = filterByRatingData.reviews[0].id;

    const rejectRes = await handlePatchAdminReview(
      new NextRequest(`http://localhost/api/admin/reviews/${twoStarId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      }),
      { params: Promise.resolve({ id: twoStarId }) }
    );
    expect(rejectRes.status).toBe(200);

    const deleteRes = await handleDeleteAdminReview(
      new NextRequest(`http://localhost/api/admin/reviews/${twoStarId}`, { method: 'DELETE' }),
      { params: Promise.resolve({ id: twoStarId }) }
    );
    expect(deleteRes.status).toBe(200);
    expect(mockState.reviews.has(twoStarId)).toBe(false);
  });

  it('5. Pure helpers & UI wiring verification (URL, WhatsApp format, mobile accessibility, sidebar)', () => {
    const url = buildProductReviewUrl('3108', 'tok_123');
    expect(url).toBe('https://ekorabazaar.in/products/3108?writeReview=true&reviewToken=tok_123');

    const msg = buildReviewWhatsAppMessage('Ethanol', url);
    expect(msg).toBe(
      `Hello! Thank you for shopping with Ekora Bazaar. We hope you liked your purchase. We'd love to hear your feedback about Ethanol. Please share your experience here: ${url}`
    );

    const waUrl = buildReviewWhatsAppShareUrl('Ethanol', url, '9876543210');
    expect(waUrl.startsWith('https://wa.me/919876543210?text=')).toBe(true);

    const stats = computeReviewStats([{ rating: 5 }, { rating: 4 }, { rating: 5 }]);
    expect(stats.averageRating).toBe(4.7);
    expect(stats.totalReviews).toBe(3);
    expect(stats.distribution).toEqual({ 5: 2, 4: 1, 3: 0, 2: 0, 1: 0 });

    const adminLayoutSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/admin/layout.tsx'),
      'utf8'
    );
    expect(adminLayoutSrc).toContain('/admin/reviews');
    expect(adminLayoutSrc).toContain('Reviews');

    const pdpSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/products/[id]/page.tsx'),
      'utf8'
    );
    expect(pdpSrc).toContain('ProductReviewsSection');
    expect(pdpSrc).toContain('getPublicProductReviews');

    const reviewSectionSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/ProductReviewsSection.tsx'),
      'utf8'
    );
    expect(reviewSectionSrc).toContain('text-base');
    expect(reviewSectionSrc).toContain('w-11 h-11');
    expect(reviewSectionSrc).toContain('<Suspense fallback={null}>');

    const orderDetailSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/admin/orders/detail/page.tsx'),
      'utf8'
    );
    expect(orderDetailSrc).toContain('OrderItemReviewShare');
  });
});
