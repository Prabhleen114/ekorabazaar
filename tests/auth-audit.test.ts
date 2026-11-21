import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock session and db before importing handlers
vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  default: {
    seller: {
      count: vi.fn().mockResolvedValue(10),
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockImplementation(({ where }: any) => {
        if (where.id === 'seller-1' || where.userId === 'user-seller-1') {
          return Promise.resolve({
            id: 'seller-1',
            userId: 'user-seller-1',
            brandName: 'Test Seller',
            accountStatus: 'ACTIVE',
            applicationStatus: 'APPROVED',
            businessDetails: { gstStatus: 'VERIFIED' },
            _count: { products: 5, payments: 2 },
            products: [],
          });
        }
        return Promise.resolve(null);
      }),
      update: vi.fn().mockResolvedValue({ id: 'seller-1' }),
    },
    product: {
      count: vi.fn().mockResolvedValue(20),
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockImplementation(({ where }: any) => {
        if (where.id === 'prod-owned') {
          return Promise.resolve({
            id: 'prod-owned',
            sellerId: 'seller-1',
            price: 10000,
            title: 'Owned Product',
          });
        }
        if (where.id === 'prod-other') {
          return Promise.resolve({
            id: 'prod-other',
            sellerId: 'seller-2',
            price: 20000,
            title: 'Other Product',
          });
        }
        return Promise.resolve(null);
      }),
      delete: vi.fn().mockResolvedValue({ id: 'prod-owned' }),
      update: vi.fn().mockResolvedValue({ id: 'prod-owned' }),
    },
    order: {
      count: vi.fn().mockResolvedValue(30),
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      aggregate: vi.fn().mockResolvedValue({ _sum: { total: 500000 } }),
    },
    orderItem: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    priceChangeRequest: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    coupon: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

// Mock supabase to avoid network calls during tests
vi.mock('@/lib/supabase', () => ({
  supabaseServer: {
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } }),
      }),
    },
  },
  isSupabaseConfigured: true,
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { getSession } from '@/lib/session';
import {
  handleGetAdminOverview,
  handleGetAdminProducts,
  handleGetAdminSellers,
  handleGetAdminPriceRequests,
  handleGetAdminCoupons,
  handleGetAdminOrders,
  handleGetAdminLeads,
  handlePostAdminProductApprove,
  handlePostAdminSellerApprove,
} from '@/server/api/handlers/admin';

import {
  handleGetSellerOverview,
  handleGetSellerOrders,
  handleGetSellerProducts,
  handleGetSellerProductById,
  handleDeleteSellerProductById,
  handleGetSellerProfile,
  handlePostSellerProduct,
  handlePostSellerUploadImage,
} from '@/server/api/handlers/seller';

function createDummyRequest(url: string, method = 'GET', body?: any): NextRequest {
  const init: any = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

const mockContext = (params: Record<string, string> = {}) => ({
  params: Promise.resolve(params),
});

describe('AUTH AUDIT: Admin & Seller Endpoint Security Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Unauthenticated Requests (No Session Cookie) -> 401', () => {
    beforeEach(() => {
      (getSession as any).mockResolvedValue(null);
    });

    it('returns 401 for all Admin GET endpoints when unauthenticated', async () => {
      const resOverview = await handleGetAdminOverview(createDummyRequest('/api/admin/overview'));
      expect(resOverview.status).toBe(401);

      const resProducts = await handleGetAdminProducts(createDummyRequest('/api/admin/products'));
      expect(resProducts.status).toBe(401);

      const resSellers = await handleGetAdminSellers(createDummyRequest('/api/admin/sellers'));
      expect(resSellers.status).toBe(401);

      const resPrices = await handleGetAdminPriceRequests(createDummyRequest('/api/admin/price-requests'));
      expect(resPrices.status).toBe(401);

      const resCoupons = await handleGetAdminCoupons(createDummyRequest('/api/admin/coupons'));
      expect(resCoupons.status).toBe(401);

      const resOrders = await handleGetAdminOrders(createDummyRequest('/api/admin/orders'));
      expect(resOrders.status).toBe(401);

      const resLeads = await handleGetAdminLeads(createDummyRequest('/api/admin/leads'));
      expect(resLeads.status).toBe(401);
    });

    it('returns 401 for Admin POST action endpoints when unauthenticated', async () => {
      const resApprove = await handlePostAdminProductApprove(
        createDummyRequest('/api/admin/products/p1/approve', 'POST', { customerPrice: 200 }),
        mockContext({ productId: 'p1' })
      );
      expect(resApprove.status).toBe(401);

      const resSellerApprove = await handlePostAdminSellerApprove(
        createDummyRequest('/api/admin/sellers/s1/approve', 'POST'),
        mockContext({ sellerId: 's1' })
      );
      expect(resSellerApprove.status).toBe(401);
    });

    it('returns 401 for all Seller endpoints when unauthenticated', async () => {
      const resOverview = await handleGetSellerOverview(createDummyRequest('/api/seller/overview'));
      expect(resOverview.status).toBe(401);

      const resOrders = await handleGetSellerOrders(createDummyRequest('/api/seller/orders'));
      expect(resOrders.status).toBe(401);

      const resProducts = await handleGetSellerProducts(createDummyRequest('/api/seller/products'));
      expect(resProducts.status).toBe(401);

      const resProductById = await handleGetSellerProductById(
        createDummyRequest('/api/seller/products/p1'),
        mockContext({ productId: 'p1' })
      );
      expect(resProductById.status).toBe(401);

      const resDeleteProduct = await handleDeleteSellerProductById(
        createDummyRequest('/api/seller/products/p1', 'DELETE'),
        mockContext({ productId: 'p1' })
      );
      expect(resDeleteProduct.status).toBe(401);

      const resProfile = await handleGetSellerProfile(createDummyRequest('/api/seller/profile'));
      expect(resProfile.status).toBe(401);

      const resCreateProduct = await handlePostSellerProduct(
        createDummyRequest('/api/seller/products', 'POST', { title: 'Test' })
      );
      expect(resCreateProduct.status).toBe(401);
    });
  });

  describe('2. Wrong Role (Customer calling Admin or Seller routes) -> 403', () => {
    beforeEach(() => {
      (getSession as any).mockResolvedValue({
        userId: 'cust-123',
        role: 'CUSTOMER',
        sellerId: null,
      });
    });

    it('returns 403 when a Customer calls Admin endpoints', async () => {
      const resOverview = await handleGetAdminOverview(createDummyRequest('/api/admin/overview'));
      expect(resOverview.status).toBe(403);

      const resProducts = await handleGetAdminProducts(createDummyRequest('/api/admin/products'));
      expect(resProducts.status).toBe(403);

      const resCoupons = await handleGetAdminCoupons(createDummyRequest('/api/admin/coupons'));
      expect(resCoupons.status).toBe(403);
    });

    it('returns 403 when a Customer calls Seller endpoints', async () => {
      const resOverview = await handleGetSellerOverview(createDummyRequest('/api/seller/overview'));
      expect(resOverview.status).toBe(403);

      const resOrders = await handleGetSellerOrders(createDummyRequest('/api/seller/orders'));
      expect(resOrders.status).toBe(403);

      const resProducts = await handleGetSellerProducts(createDummyRequest('/api/seller/products'));
      expect(resProducts.status).toBe(403);

      const resCreateProduct = await handlePostSellerProduct(
        createDummyRequest('/api/seller/products', 'POST', { title: 'Test' })
      );
      expect(resCreateProduct.status).toBe(403);
    });
  });

  describe('3. Wrong Role (Seller calling Admin routes) -> 403', () => {
    beforeEach(() => {
      (getSession as any).mockResolvedValue({
        userId: 'user-seller-1',
        role: 'SELLER',
        sellerId: 'seller-1',
      });
    });

    it('returns 403 when a Seller attempts to access Admin endpoints', async () => {
      const resOverview = await handleGetAdminOverview(createDummyRequest('/api/admin/overview'));
      expect(resOverview.status).toBe(403);

      const resSellers = await handleGetAdminSellers(createDummyRequest('/api/admin/sellers'));
      expect(resSellers.status).toBe(403);

      const resOrders = await handleGetAdminOrders(createDummyRequest('/api/admin/orders'));
      expect(resOrders.status).toBe(403);
    });
  });

  describe('4. Resource Ownership Isolation (Seller A vs Seller B) -> 403', () => {
    beforeEach(() => {
      // Authenticated as seller-1
      (getSession as any).mockResolvedValue({
        userId: 'user-seller-1',
        role: 'SELLER',
        sellerId: 'seller-1',
      });
    });

    it('allows seller-1 to access their own product (prod-owned)', async () => {
      const res = await handleGetSellerProductById(
        createDummyRequest('/api/seller/products/prod-owned'),
        mockContext({ productId: 'prod-owned' })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.product.id).toBe('prod-owned');
    });

    it('returns 403 when seller-1 attempts to access seller-2 product (prod-other)', async () => {
      const res = await handleGetSellerProductById(
        createDummyRequest('/api/seller/products/prod-other'),
        mockContext({ productId: 'prod-other' })
      );
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Forbidden');
    });

    it('returns 403 when seller-1 attempts to delete seller-2 product (prod-other)', async () => {
      const res = await handleDeleteSellerProductById(
        createDummyRequest('/api/seller/products/prod-other', 'DELETE'),
        mockContext({ productId: 'prod-other' })
      );
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Forbidden');
    });
  });

  describe('5. Authorized Access (Admin & Seller with correct credentials)', () => {
    it('allows Admin user to access Admin endpoints successfully', async () => {
      (getSession as any).mockResolvedValue({
        userId: 'admin-1',
        role: 'ADMIN',
      });

      const resOverview = await handleGetAdminOverview(createDummyRequest('/api/admin/overview'));
      expect(resOverview.status).toBe(200);
      const overviewData = await resOverview.json();
      expect(overviewData.totalSellers).toBe(10);
      expect(overviewData.totalProducts).toBe(20);

      const resProducts = await handleGetAdminProducts(createDummyRequest('/api/admin/products'));
      expect(resProducts.status).toBe(200);

      const resSellers = await handleGetAdminSellers(createDummyRequest('/api/admin/sellers'));
      expect(resSellers.status).toBe(200);
    });

    it('allows Seller user to access their own dashboard overview, orders, and profile', async () => {
      (getSession as any).mockResolvedValue({
        userId: 'user-seller-1',
        role: 'SELLER',
        sellerId: 'seller-1',
      });

      const resOverview = await handleGetSellerOverview(createDummyRequest('/api/seller/overview'));
      expect(resOverview.status).toBe(200);
      const overviewData = await resOverview.json();
      expect(overviewData.seller.id).toBe('seller-1');

      const resOrders = await handleGetSellerOrders(createDummyRequest('/api/seller/orders'));
      expect(resOrders.status).toBe(200);
      const ordersData = await resOrders.json();
      expect(ordersData.locked).toBe(false);

      const resProfile = await handleGetSellerProfile(createDummyRequest('/api/seller/profile'));
      expect(resProfile.status).toBe(200);
      const profileData = await resProfile.json();
      expect(profileData.seller.brandName).toBe('Test Seller');
    });
  });
});
