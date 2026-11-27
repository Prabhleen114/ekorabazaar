import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// ─── In-memory stateful mocks for end-to-end workflow testing ─────────────────

const mockState = vi.hoisted(() => ({
  orders: new Map<string, any>(),
  shipments: new Map<string, any>(),
  notes: new Map<string, any>(),
  leads: new Map<string, any>(),
  products: new Map<string, any>(),
  categories: [
    { id: 'cat-1', name: 'Candle Waxes & Additives', slug: 'candle-waxes-additives' },
    { id: 'cat-2', name: 'Fragrance Oils', slug: 'fragrance-oils' },
  ],
  orderUpdates: [] as any[],
  orderItemUpdates: [] as any[],
}));

function resetMockState() {
  mockState.orders.clear();
  mockState.shipments.clear();
  mockState.notes.clear();
  mockState.leads.clear();
  mockState.products.clear();
  mockState.orderUpdates = [];
  mockState.orderItemUpdates = [];

  mockState.orders.set('ord-confirmed-1', {
    id: 'ord-confirmed-1',
    customerId: 'cust-1',
    status: 'PROCESSING',
    paymentStatus: 'CAPTURED',
    shippingStatus: 'NOT_CREATED',
    subtotal: 24000,
    discount: 0,
    tax: 0,
    shipping: 9000,
    total: 33000,
    currency: 'INR',
    awbCode: null,
    courierName: null,
    trackingUrl: null,
    shippedAt: null,
    deliveredAt: null,
    cancellationReason: null,
    isSynthetic: false,
    addressSnapshot: { name: 'Asha Craft', phone: '9876543210', city: 'Jaipur' },
    customer: { id: 'cust-1', name: 'Asha Craft', email: 'asha@example.com', phone: '9876543210' },
    items: [
      {
        id: 'oi-1',
        orderId: 'ord-confirmed-1',
        productId: 'prod-catalog-1',
        productNameSnapshot: 'Soy Wax Flakes',
        priceSnapshot: 24000,
        quantity: 1,
        subtotal: 24000,
      },
    ],
    payments: [{ id: 'pay-1', status: 'CAPTURED', amount: 33000, currency: 'INR', createdAt: new Date() }],
    statusHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  mockState.orders.set('ord-cancelled-1', {
    id: 'ord-cancelled-1',
    customerId: 'cust-2',
    status: 'CANCELLED',
    paymentStatus: 'PENDING',
    shippingStatus: 'NOT_CREATED',
    subtotal: 50000,
    discount: 0,
    tax: 0,
    shipping: 9000,
    total: 59000,
    currency: 'INR',
    cancellationReason: 'Payment timeout (auto-expired)',
    isSynthetic: false,
    addressSnapshot: { name: 'Ravi Studio', phone: '9988776655', city: 'Delhi' },
    customer: { id: 'cust-2', name: 'Ravi Studio', email: 'ravi@example.com', phone: '9988776655' },
    items: [
      {
        id: 'oi-2',
        orderId: 'ord-cancelled-1',
        productId: 'prod-seller-1',
        productNameSnapshot: 'Amber Candle Jar',
        priceSnapshot: 25000,
        quantity: 2,
        subtotal: 50000,
      },
    ],
    payments: [{ id: 'pay-2', status: 'FAILED', failureReason: 'Window expired', amount: 59000, createdAt: new Date() }],
    statusHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  mockState.products.set('prod-catalog-1', {
    id: 'prod-catalog-1',
    title: 'Soy Wax Flakes',
    description: 'Clean burning soy wax',
    price: 24000, // paise (₹240)
    customerPrice: 24000,
    mrp: 30000, // paise (₹300)
    stock: 100,
    status: 'PUBLISHED',
    isActive: true,
    adminManaged: false,
    source: 'CATALOG',
    category: 'Candle Waxes & Additives',
    categoryId: 'cat-1',
    imageUrl: '/images/products/soy-wax.jpg',
    images: ['/images/products/soy-wax.jpg'],
    lockedFields: [],
    wholesaleTiers: [
      { minQty: 1, maxQty: 9, price: 240, discountPct: 0 },
      { minQty: 10, maxQty: null, price: 210, discountPct: 12.5 },
    ],
    sellerId: null,
    seller: null,
    updatedAt: new Date(),
  });

  mockState.products.set('prod-seller-1', {
    id: 'prod-seller-1',
    title: 'Amber Candle Jar',
    description: '200ml amber glass jar',
    price: 250, // rupees (₹250)
    customerPrice: 250,
    mrp: 320, // rupees (₹320)
    stock: 40,
    status: 'PUBLISHED',
    isActive: true,
    adminManaged: false,
    source: 'SELLER',
    category: 'Candle Jars & Containers',
    categoryId: null,
    imageUrl: 'https://example.supabase.co/storage/v1/object/public/product-images/jar.jpg',
    images: ['https://example.supabase.co/storage/v1/object/public/product-images/jar.jpg'],
    lockedFields: [],
    wholesaleTiers: [{ minQty: 1, maxQty: 9, price: 250, discountPct: 0 }],
    sellerId: 'seller-1',
    seller: { id: 'seller-1', brandName: 'Glass Studio', accountStatus: 'ACTIVE' },
    updatedAt: new Date(),
  });
}

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseServer: {
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'admin/uploaded.png' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/product-images/admin/uploaded.png' },
        }),
      }),
    },
  },
}));

vi.mock('@/lib/db', () => {
  const prismaMock: any = {
    $transaction: async (fn: any) => fn(prismaMock),
    order: {
      findMany: vi.fn().mockImplementation(async ({ where }: any = {}) => {
        const all = Array.from(mockState.orders.values());
        // Simulate basic filtering used in tests
        return all.filter((o) => {
          if (where?.customerId && o.customerId !== where.customerId) return false;
          if (where?.status?.not && o.status === where.status.not) return false;
          if (where?.status?.in && !where.status.in.includes(o.status)) return false;
          if (where?.NOT?.status?.in && where.NOT.status.in.includes(o.status)) return false;
          return true;
        }).map((o) => ({
          ...o,
          shipments: Array.from(mockState.shipments.values()).filter((s) => s.orderId === o.id),
        }));
      }),
      count: vi.fn().mockImplementation(async ({ where }: any = {}) => {
        const list = await prismaMock.order.findMany({ where });
        return list.length;
      }),
      findUnique: vi.fn().mockImplementation(async ({ where, include }: any) => {
        const o = mockState.orders.get(where.id);
        if (!o) return null;
        const copy: any = { ...o };
        if (include?.shipments) {
          copy.shipments = Array.from(mockState.shipments.values()).filter((s) => s.orderId === o.id);
        }
        if (include?.adminNotes) {
          copy.adminNotes = Array.from(mockState.notes.values()).filter((n) => n.orderId === o.id);
        }
        return copy;
      }),
      update: vi.fn().mockImplementation(async ({ where, data }: any) => {
        mockState.orderUpdates.push({ where, data });
        const o = mockState.orders.get(where.id);
        if (!o) throw new Error('Order not found');
        const updated = { ...o, ...data, updatedAt: new Date() };
        mockState.orders.set(where.id, updated);
        return updated;
      }),
    },
    orderItem: {
      update: vi.fn().mockImplementation(async (args: any) => {
        mockState.orderItemUpdates.push(args);
        return {};
      }),
      updateMany: vi.fn().mockImplementation(async (args: any) => {
        mockState.orderItemUpdates.push(args);
        return { count: 0 };
      }),
    },
    orderStatusHistory: {
      create: vi.fn().mockResolvedValue({ id: 'hist-1' }),
    },
    orderShipment: {
      count: vi.fn().mockImplementation(async ({ where }: any = {}) => {
        return Array.from(mockState.shipments.values()).filter((s) => !where?.orderId || s.orderId === where.orderId).length;
      }),
      create: vi.fn().mockImplementation(async ({ data }: any) => {
        const id = `ship-${mockState.shipments.size + 1}`;
        const row = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        mockState.shipments.set(id, row);
        return row;
      }),
      findUnique: vi.fn().mockImplementation(async ({ where }: any) => mockState.shipments.get(where.id) || null),
      update: vi.fn().mockImplementation(async ({ where, data }: any) => {
        const s = mockState.shipments.get(where.id);
        const updated = { ...s, ...data, updatedAt: new Date() };
        mockState.shipments.set(where.id, updated);
        return updated;
      }),
      delete: vi.fn().mockImplementation(async ({ where }: any) => {
        const s = mockState.shipments.get(where.id);
        mockState.shipments.delete(where.id);
        return s;
      }),
    },
    orderAdminNote: {
      findMany: vi.fn().mockImplementation(async ({ where }: any) => {
        return Array.from(mockState.notes.values()).filter((n) => n.orderId === where.orderId);
      }),
      findUnique: vi.fn().mockImplementation(async ({ where }: any) => mockState.notes.get(where.id) || null),
      create: vi.fn().mockImplementation(async ({ data }: any) => {
        const id = `note-${mockState.notes.size + 1}`;
        const row = {
          id,
          ...data,
          author: { id: data.authorId, name: 'Admin User', email: 'admin@ekorabazaar.in' },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockState.notes.set(id, row);
        return row;
      }),
      update: vi.fn().mockImplementation(async ({ where, data }: any) => {
        const n = mockState.notes.get(where.id);
        const updated = { ...n, ...data, updatedAt: new Date(Date.now() + 5000) };
        mockState.notes.set(where.id, updated);
        return updated;
      }),
      delete: vi.fn().mockImplementation(async ({ where }: any) => {
        const n = mockState.notes.get(where.id);
        mockState.notes.delete(where.id);
        return n;
      }),
    },
    lead: {
      findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
        if (where.dedupeKey) {
          return Array.from(mockState.leads.values()).find((l) => l.dedupeKey === where.dedupeKey) || null;
        }
        return mockState.leads.get(where.id) || null;
      }),
      findFirst: vi.fn().mockImplementation(async ({ where }: any) => {
        const all = Array.from(mockState.leads.values());
        if (where?.OR) {
          for (const clause of where.OR) {
            const match = all.find(
              (l) =>
                (clause.id && l.id === clause.id) ||
                (clause.orderId && l.orderId === clause.orderId) ||
                (clause.dedupeKey && l.dedupeKey === clause.dedupeKey)
            );
            if (match) return match;
          }
        }
        return null;
      }),
      findMany: vi.fn().mockImplementation(async ({ where }: any = {}) => {
        return Array.from(mockState.leads.values()).filter((l) => {
          if (where?.source && l.source !== where.source) return false;
          if (where?.status && l.status !== where.status) return false;
          return true;
        });
      }),
      count: vi.fn().mockImplementation(async ({ where }: any = {}) => {
        const rows = await prismaMock.lead.findMany({ where });
        return rows.length;
      }),
      groupBy: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation(async ({ data }: any) => {
        const id = `lead-${mockState.leads.size + 1}`;
        const row = { id, ...data, createdAt: data.createdAt || new Date(), updatedAt: new Date() };
        mockState.leads.set(id, row);
        return row;
      }),
      update: vi.fn().mockImplementation(async ({ where, data }: any) => {
        const existing = where.dedupeKey
          ? Array.from(mockState.leads.values()).find((l) => l.dedupeKey === where.dedupeKey)
          : mockState.leads.get(where.id);
        const updated = { ...existing, ...data, updatedAt: new Date() };
        mockState.leads.set(updated.id, updated);
        return updated;
      }),
      upsert: vi.fn().mockImplementation(async ({ where, create, update }: any) => {
        const existing = Array.from(mockState.leads.values()).find((l) => l.dedupeKey === where.dedupeKey);
        if (existing) {
          const updated = { ...existing, ...update, updatedAt: new Date() };
          mockState.leads.set(existing.id, updated);
          return updated;
        }
        const id = `lead-${mockState.leads.size + 1}`;
        const row = { id, ...create, createdAt: create.createdAt || new Date(), updatedAt: new Date() };
        mockState.leads.set(id, row);
        return row;
      }),
      updateMany: vi.fn().mockImplementation(async ({ where, data }: any) => {
        let count = 0;
        for (const [id, l] of mockState.leads.entries()) {
          const matchesOrder =
            where?.OR?.some((c: any) => (c.orderId && l.orderId === c.orderId) || (c.dedupeKey && l.dedupeKey === c.dedupeKey)) ||
            (where?.OR?.some((c: any) => (c.customerId && l.customerId === c.customerId) || (c.customerEmail && l.customerEmail === c.customerEmail)));
          const matchesStatus = !where?.status?.in || where.status.in.includes(l.status);
          if (matchesOrder && matchesStatus) {
            mockState.leads.set(id, { ...l, ...data, updatedAt: new Date() });
            count++;
          }
        }
        return { count };
      }),
    },
    cart: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    category: {
      findMany: vi.fn().mockResolvedValue(mockState.categories),
      findFirst: vi.fn().mockImplementation(async ({ where }: any) => {
        const target = where?.name?.equals?.toLowerCase();
        return mockState.categories.find((c) => c.name.toLowerCase() === target) || null;
      }),
    },
    product: {
      findMany: vi.fn().mockImplementation(async ({ where }: any = {}) => {
        return Array.from(mockState.products.values()).filter((p) => {
          if (where?.category?.equals && p.category.toLowerCase() !== where.category.equals.toLowerCase()) {
            return false;
          }
          if (where?.status && p.status !== where.status) return false;
          if (where?.isActive !== undefined && p.isActive !== where.isActive) return false;
          return true;
        });
      }),
      findUnique: vi.fn().mockImplementation(async ({ where }: any) => mockState.products.get(where.id) || null),
      groupBy: vi.fn().mockResolvedValue([
        { category: 'Candle Waxes & Additives', _count: { _all: 1 } },
        { category: 'Candle Jars & Containers', _count: { _all: 1 } },
      ]),
      update: vi.fn().mockImplementation(async ({ where, data }: any) => {
        const p = mockState.products.get(where.id);
        const updated = { ...p, ...data, updatedAt: new Date() };
        mockState.products.set(where.id, updated);
        return updated;
      }),
    },
  };
  return { default: prismaMock };
});

import { getSession } from '@/lib/session';
import {
  handleGetAdminOrders,
  handleGetAdminOrderById,
  handlePostAdminOrderShipment,
  handlePatchAdminOrderShipment,
  handleDeleteAdminOrderShipment,
  handleGetAdminOrderNotes,
  handlePostAdminOrderNote,
  handlePatchAdminOrderNote,
  handleDeleteAdminOrderNote,
  handleGetAdminLeads,
  handleGetAdminLeadById,
  handlePatchAdminLeadById,
} from '@/server/api/handlers/admin';
import {
  handleGetAdminProductCategories,
  handleGetAdminManageProducts,
  handlePatchAdminManageProduct,
  handlePostAdminUploadImage,
} from '@/server/api/handlers/admin-products';
import { handleGetAccountOrders } from '@/server/api/handlers/account';
import { handleGetOrderSummary } from '@/server/api/handlers/checkout';
import {
  CONFIRMED_ORDER_WHERE,
  isConfirmedOrder,
  upsertOrderLead,
  markCustomerLeadsConverted,
  captureAbandonedCheckoutLead,
} from '@/lib/leads-server';
import {
  normalizeProductBasePriceToINR,
  normalizeProductMrpToINR,
  calculateItemPrice,
} from '@/lib/pricing';

function makeReq(url: string, method = 'GET', body?: any): NextRequest {
  const init: any = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

const ctx = (params: Record<string, string>) => ({ params: Promise.resolve(params) });

describe('Ekora Admin Portal Enhancements — Full End-to-End Verification', () => {
  beforeEach(() => {
    resetMockState();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. MULTI-SHIPMENT ORDER TRACKING
  // -------------------------------------------------------------------------
  describe('1. Multi-Shipment Order Tracking Management', () => {
    beforeEach(() => {
      (getSession as any).mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
    });

    it('supports adding multiple shipments to one order without overwriting earlier shipments, editing, removing, and showing them to customer', async () => {
      // Add Shipment 1 (Delhivery)
      const res1 = await handlePostAdminOrderShipment(
        makeReq('/api/admin/orders/ord-confirmed-1/shipments', 'POST', {
          courierName: 'Delhivery',
          awbCode: '123456',
          trackingUrl: 'https://www.delhivery.com/track/123456',
          status: 'SHIPPED',
        }),
        ctx({ id: 'ord-confirmed-1' })
      );
      expect(res1.status).toBe(201);
      const data1 = await res1.json();
      expect(data1.shipment.shipmentNumber).toBe(1);
      expect(data1.shipment.courierName).toBe('Delhivery');
      expect(data1.shipment.awbCode).toBe('123456');

      // Add Shipment 2 (Blue Dart) to the SAME order
      const res2 = await handlePostAdminOrderShipment(
        makeReq('/api/admin/orders/ord-confirmed-1/shipments', 'POST', {
          courierName: 'Blue Dart',
          awbCode: '789012',
          trackingUrl: 'https://www.bluedart.com/track/789012',
          status: 'IN_TRANSIT',
        }),
        ctx({ id: 'ord-confirmed-1' })
      );
      expect(res2.status).toBe(201);
      const data2 = await res2.json();
      expect(data2.shipment.shipmentNumber).toBe(2);

      // Verify both shipments exist on admin order details
      const adminDetailRes = await handleGetAdminOrderById(
        makeReq('/api/admin/orders/ord-confirmed-1'),
        ctx({ id: 'ord-confirmed-1' })
      );
      const adminDetail = await adminDetailRes.json();
      expect(adminDetail.order.shipments).toHaveLength(2);
      expect(adminDetail.order.shipments[0].awbCode).toBe('123456');
      expect(adminDetail.order.shipments[1].awbCode).toBe('789012');
      // Payment info preserved
      expect(adminDetail.order.paymentStatus).toBe('CAPTURED');
      expect(adminDetail.order.total).toBe(33000);

      // Edit Shipment 1 -> does not affect Shipment 2
      const editRes = await handlePatchAdminOrderShipment(
        makeReq(`/api/admin/orders/ord-confirmed-1/shipments/${data1.shipment.id}`, 'PATCH', {
          status: 'DELIVERED',
          awbCode: '123456-UPDATED',
        }),
        ctx({ id: 'ord-confirmed-1', shipmentId: data1.shipment.id })
      );
      expect(editRes.status).toBe(200);
      const editData = await editRes.json();
      expect(editData.shipment.status).toBe('DELIVERED');
      expect(editData.shipment.awbCode).toBe('123456-UPDATED');

      // Customer sees BOTH shipments on /api/account/orders
      (getSession as any).mockResolvedValue({ userId: 'cust-1', role: 'CUSTOMER' });
      const custRes = await handleGetAccountOrders(makeReq('/api/account/orders'));
      expect(custRes.status).toBe(200);
      const custData = await custRes.json();
      expect(custData.orders).toHaveLength(1);
      expect(custData.orders[0].shipments).toHaveLength(2);
      expect(custData.orders[0].shipments[0].courierName).toBe('Delhivery');
      expect(custData.orders[0].shipments[0].status).toBe('DELIVERED');
      expect(custData.orders[0].shipments[1].courierName).toBe('Blue Dart');
      expect(custData.orders[0].shipments[1].awbCode).toBe('789012');

      // Remove Shipment 1 as Admin -> Shipment 2 remains
      (getSession as any).mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
      const delRes = await handleDeleteAdminOrderShipment(
        makeReq(`/api/admin/orders/ord-confirmed-1/shipments/${data1.shipment.id}`, 'DELETE'),
        ctx({ id: 'ord-confirmed-1', shipmentId: data1.shipment.id })
      );
      expect(delRes.status).toBe(200);

      (getSession as any).mockResolvedValue({ userId: 'cust-1', role: 'CUSTOMER' });
      const custAfterDel = await (await handleGetAccountOrders(makeReq('/api/account/orders'))).json();
      expect(custAfterDel.orders[0].shipments).toHaveLength(1);
      expect(custAfterDel.orders[0].shipments[0].awbCode).toBe('789012');
    });

    it('rejects unsafe javascript: tracking URLs', async () => {
      const res = await handlePostAdminOrderShipment(
        makeReq('/api/admin/orders/ord-confirmed-1/shipments', 'POST', {
          courierName: 'Delhivery',
          awbCode: '123456',
          trackingUrl: 'javascript:alert(1)',
        }),
        ctx({ id: 'ord-confirmed-1' })
      );
      expect(res.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // 2. PRIVATE ADMIN ORDER NOTES & AUTHORIZATION ISOLATION
  // -------------------------------------------------------------------------
  describe('2. Private Admin Order Notes & Security Isolation', () => {
    it('allows Admin to add, edit, and delete notes, and blocks Customers/Sellers/Unauthenticated', async () => {
      // Unauthenticated -> 401
      (getSession as any).mockResolvedValue(null);
      expect(
        (await handleGetAdminOrderNotes(makeReq('/api/admin/orders/ord-confirmed-1/notes'), ctx({ id: 'ord-confirmed-1' }))).status
      ).toBe(401);

      // Customer -> 403
      (getSession as any).mockResolvedValue({ userId: 'cust-1', role: 'CUSTOMER' });
      expect(
        (
          await handlePostAdminOrderNote(
            makeReq('/api/admin/orders/ord-confirmed-1/notes', 'POST', { content: 'Hack' }),
            ctx({ id: 'ord-confirmed-1' })
          )
        ).status
      ).toBe(403);

      // Seller -> 403
      (getSession as any).mockResolvedValue({ userId: 'seller-u1', role: 'SELLER', sellerId: 'seller-1' });
      expect(
        (
          await handleGetAdminOrderNotes(
            makeReq('/api/admin/orders/ord-confirmed-1/notes'),
            ctx({ id: 'ord-confirmed-1' })
          )
        ).status
      ).toBe(403);

      // Admin -> CRUD works
      (getSession as any).mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
      const addRes = await handlePostAdminOrderNote(
        makeReq('/api/admin/orders/ord-confirmed-1/notes', 'POST', {
          content: 'Fragile items - double bubble wrap',
        }),
        ctx({ id: 'ord-confirmed-1' })
      );
      expect(addRes.status).toBe(201);
      const { note } = await addRes.json();
      expect(note.content).toBe('Fragile items - double bubble wrap');

      // Verify customer API NEVER exposes adminNotes even when notes exist in DB
      (getSession as any).mockResolvedValue({ userId: 'cust-1', role: 'CUSTOMER' });
      const custOrders = await (await handleGetAccountOrders(makeReq('/api/account/orders'))).json();
      expect(custOrders.orders[0].adminNotes).toBeUndefined();
      expect(JSON.stringify(custOrders)).not.toContain('Fragile items');

      // Verify public checkout order-summary NEVER exposes adminNotes
      const summaryRes = await handleGetOrderSummary(
        makeReq('/api/checkout/order-summary?orderId=ord-confirmed-1')
      );
      const summaryJson = await summaryRes.json();
      expect(summaryJson.order.adminNotes).toBeUndefined();
      expect(JSON.stringify(summaryJson)).not.toContain('Fragile items');

      // Verify email template never reads adminNotes
      const emailSource = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/email.ts'), 'utf8');
      expect(emailSource).not.toContain('adminNotes');

      // Edit & Delete as Admin
      (getSession as any).mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
      const editRes = await handlePatchAdminOrderNote(
        makeReq(`/api/admin/orders/ord-confirmed-1/notes/${note.id}`, 'PATCH', {
          content: 'Updated internal remark',
        }),
        ctx({ id: 'ord-confirmed-1', noteId: note.id })
      );
      expect(editRes.status).toBe(200);
      expect((await editRes.json()).note.content).toBe('Updated internal remark');

      const delRes = await handleDeleteAdminOrderNote(
        makeReq(`/api/admin/orders/ord-confirmed-1/notes/${note.id}`, 'DELETE'),
        ctx({ id: 'ord-confirmed-1', noteId: note.id })
      );
      expect(delRes.status).toBe(200);

      const listAfter = await (
        await handleGetAdminOrderNotes(makeReq('/api/admin/orders/ord-confirmed-1/notes'), ctx({ id: 'ord-confirmed-1' }))
      ).json();
      expect(listAfter.notes).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // 3. SEPARATE ORDERS AND LEADS MANAGEMENT
  // -------------------------------------------------------------------------
  describe('3. Separate Orders and Leads Management', () => {
    it('classifies confirmed vs unpaid/cancelled orders strictly and handles lead deduplication & conversion', async () => {
      expect(isConfirmedOrder({ status: 'PAID', paymentStatus: 'CAPTURED' })).toBe(true);
      expect(isConfirmedOrder({ status: 'PROCESSING', paymentStatus: 'CAPTURED' })).toBe(true);
      expect(isConfirmedOrder({ status: 'DELIVERED', paymentStatus: 'PENDING', payments: [{ status: 'CAPTURED' }] })).toBe(true);
      expect(isConfirmedOrder({ status: 'CANCELLED', paymentStatus: 'PENDING' })).toBe(false);
      expect(isConfirmedOrder({ status: 'PAYMENT_PENDING', paymentStatus: 'PENDING' })).toBe(false);
      expect(isConfirmedOrder({ status: 'PAID', paymentStatus: 'PENDING', payments: [] })).toBe(false);

      // Admin Orders endpoint uses CONFIRMED_ORDER_WHERE (excludes CANCELLED / PAYMENT_PENDING)
      (getSession as any).mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
      const ordersRes = await handleGetAdminOrders(makeReq('/api/admin/orders'));
      expect(ordersRes.status).toBe(200);
      const ordersData = await ordersRes.json();
      expect(ordersData.orders.map((o: any) => o.id)).toEqual(['ord-confirmed-1']);
      expect(CONFIRMED_ORDER_WHERE.status).toEqual({
        in: ['PAID', 'PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'REFUND_INITIATED', 'REFUNDED'],
      });

      // Sync cancelled order into Lead twice -> NO duplicate lead!
      await upsertOrderLead('ord-cancelled-1');
      await upsertOrderLead('ord-cancelled-1');
      expect(mockState.leads.size).toBe(1);

      const leadsRes = await handleGetAdminLeads(makeReq('/api/admin/leads?source=CANCELLED_ORDER'));
      const leadsData = await leadsRes.json();
      expect(leadsData.leads).toHaveLength(1);
      expect(leadsData.leads[0].source).toBe('CANCELLED_ORDER');
      expect(leadsData.leads[0].customerName).toBe('Ravi Studio');
      expect(leadsData.leads[0].customerEmail).toBe('ravi@example.com');
      expect(leadsData.leads[0].customerPhone).toBe('9988776655');
      expect(leadsData.leads[0].orderValue).toBe(59000);
      expect(leadsData.leads[0].itemsSnapshot[0].quantity).toBe(2);

      // Historical cancelled order itself is preserved in DB
      expect(mockState.orders.has('ord-cancelled-1')).toBe(true);

      // Capture abandoned checkout lead
      await captureAbandonedCheckoutLead({
        sessionKey: 'sess-abandoned-1',
        customerId: 'cust-2',
        customerName: 'Ravi Studio',
        customerEmail: 'ravi@example.com',
        customerPhone: '9988776655',
        items: [{ productId: 'prod-1', productName: 'Wax', quantity: 1, unitPricePaise: 24000, subtotalPaise: 24000 }],
        orderValuePaise: 24000,
      });
      expect(mockState.leads.size).toBe(2);

      // Customer later completes checkout -> leads mark as CONVERTED
      await markCustomerLeadsConverted({
        orderId: 'ord-new-paid-99',
        customerId: 'cust-2',
        customerEmail: 'ravi@example.com',
        customerPhone: '9988776655',
      });

      for (const lead of mockState.leads.values()) {
        expect(lead.status).toBe('CONVERTED');
        expect(lead.convertedOrderId).toBe('ord-new-paid-99');
      }

      // Admin can inspect and update lead status
      const firstLeadId = Array.from(mockState.leads.keys())[0];
      const detailRes = await handleGetAdminLeadById(makeReq(`/api/admin/leads/${firstLeadId}`), ctx({ id: firstLeadId }));
      expect(detailRes.status).toBe(200);
      const patchRes = await handlePatchAdminLeadById(
        makeReq(`/api/admin/leads/${firstLeadId}`, 'PATCH', { status: 'CONTACTED' }),
        ctx({ id: firstLeadId })
      );
      expect(patchRes.status).toBe(200);
      expect((await patchRes.json()).lead.status).toBe('CONTACTED');
    });
  });

  // -------------------------------------------------------------------------
  // 4. PRODUCT MANAGEMENT, INR PRICING CONVENTION & ORDER IMMUTABILITY
  // -------------------------------------------------------------------------
  describe('4. Product Management, Pricing Units, Images & Order Immutability', () => {
    beforeEach(() => {
      (getSession as any).mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
    });

    it('lists categories and filters products by category', async () => {
      const catRes = await handleGetAdminProductCategories();
      expect(catRes.status).toBe(200);
      const catData = await catRes.json();
      expect(catData.categories.some((c: any) => c.name === 'Candle Waxes & Additives')).toBe(true);

      const listRes = await handleGetAdminManageProducts(
        makeReq('/api/admin/product-management/products?category=Candle%20Waxes%20%26%20Additives')
      );
      expect(listRes.status).toBe(200);
      const listData = await listRes.json();
      expect(listData.products.some((p: any) => p.id === 'prod-catalog-1')).toBe(true);
    });

    it('updates MRP, selling price (respecting paise vs rupee convention), description, images, and availability without modifying historical orders', async () => {
      // 1) Edit CATALOG product (stored in paise in DB) -> ₹350 MRP, ₹275 Selling Price
      const resCatalog = await handlePatchAdminManageProduct(
        makeReq('/api/admin/product-management/products/prod-catalog-1', 'PATCH', {
          title: 'Soy Wax Flakes Premium',
          category: 'Candle Waxes & Additives',
          mrp: 350,
          sellingPrice: 275,
          stock: 80,
          description: 'Updated pure soy wax description',
          isActive: true,
          status: 'PUBLISHED',
          images: ['https://test.supabase.co/storage/v1/object/public/product-images/admin/new-wax.jpg'],
        }),
        ctx({ id: 'prod-catalog-1' })
      );
      expect(resCatalog.status).toBe(200);
      const updatedCatalogDto = (await resCatalog.json()).product;
      expect(updatedCatalogDto.sellingPriceINR).toBe(275);
      expect(updatedCatalogDto.mrpINR).toBe(350);

      // Verify raw DB stored values respect CATALOG paise convention (27500 & 35000)
      const rawCatalogDb = mockState.products.get('prod-catalog-1');
      expect(rawCatalogDb.price).toBe(27500);
      expect(rawCatalogDb.customerPrice).toBe(27500);
      expect(rawCatalogDb.mrp).toBe(35000);
      expect(normalizeProductBasePriceToINR(rawCatalogDb)).toBe(275);
      expect(normalizeProductMrpToINR(rawCatalogDb)).toBe(350);
      expect(calculateItemPrice(rawCatalogDb, 1)).toBe(275);

      // 2) Edit SELLER product (stored in rupees in DB) -> ₹400 MRP, ₹299 Selling Price
      const resSeller = await handlePatchAdminManageProduct(
        makeReq('/api/admin/product-management/products/prod-seller-1', 'PATCH', {
          title: 'Amber Candle Jar V2',
          category: 'Candle Jars & Containers',
          mrp: 400,
          sellingPrice: 299,
          stock: 25,
          description: 'Updated jar description',
          isActive: true,
          status: 'PUBLISHED',
        }),
        ctx({ id: 'prod-seller-1' })
      );
      expect(resSeller.status).toBe(200);
      const rawSellerDb = mockState.products.get('prod-seller-1');
      expect(rawSellerDb.price).toBe(299);
      expect(rawSellerDb.mrp).toBe(400);
      expect(normalizeProductBasePriceToINR(rawSellerDb)).toBe(299);
      expect(normalizeProductMrpToINR(rawSellerDb)).toBe(400);
      expect(calculateItemPrice(rawSellerDb, 1)).toBe(299);

      // CRITICAL: Historical Order & OrderItem prices MUST NEVER be modified
      expect(mockState.orderUpdates).toHaveLength(0);
      expect(mockState.orderItemUpdates).toHaveLength(0);
      expect(mockState.orders.get('ord-confirmed-1').items[0].priceSnapshot).toBe(24000);
    });

    it('rejects MRP lower than Selling Price and validates uploaded image magic bytes', async () => {
      const invalidPricing = await handlePatchAdminManageProduct(
        makeReq('/api/admin/product-management/products/prod-seller-1', 'PATCH', {
          title: 'Amber Candle Jar',
          category: 'Candle Jars & Containers',
          mrp: 150,
          sellingPrice: 299,
        }),
        ctx({ id: 'prod-seller-1' })
      );
      expect(invalidPricing.status).toBe(400);

      // Upload valid PNG image
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      const formData = new FormData();
      formData.append('file', new File([pngBytes], 'test.png', { type: 'image/png' }));
      const uploadReq = new NextRequest(new URL('/api/admin/upload-image', 'http://localhost:3000'), {
        method: 'POST',
        body: formData as any,
      });
      const uploadRes = await handlePostAdminUploadImage(uploadReq);
      expect(uploadRes.status).toBe(200);
      const uploadJson = await uploadRes.json();
      expect(uploadJson.success).toBe(true);
      expect(uploadJson.url).toContain('supabase.co');
    });
  });
});
