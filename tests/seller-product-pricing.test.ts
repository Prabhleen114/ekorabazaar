import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { handlePostSellerProduct, handlePatchSellerProductById } from '@/server/api/handlers/seller';
import prisma from '@/lib/db';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ userId: 'user-1', sellerId: 'seller-1' }),
  requireSeller: vi.fn().mockResolvedValue({ userId: 'user-1', sellerId: 'seller-1' }),
  requireSellerOwnership: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/db', () => {
  return {
    default: {
      seller: {
        findUnique: vi.fn().mockResolvedValue({ id: 'seller-1', accountStatus: 'ACTIVE' }),
      },
      product: {
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'prod-new', ...data })),
        findUnique: vi.fn().mockResolvedValue({
          id: 'prod-existing',
          title: 'Existing Mould',
          price: 350,
          status: 'DRAFT',
          sellerId: 'seller-1',
        }),
        update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'prod-existing', ...data })),
      },
      priceChangeRequest: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue({ id: 'pcr-1' }),
      },
    },
  };
});

describe('Seller Product Pricing Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enforces that incoming integer Rupee submissions are stored directly as integer Rupees', async () => {
    const req = new NextRequest('http://localhost:3000/api/seller/products', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Artisan Soap Mould',
        price: 358, // Sent as integer Rupees
        wholesaleTiers: [
          { minQty: 1, maxQty: 9, price: 358, discountPct: 0 },
          { minQty: 10, maxQty: 49, price: 340, discountPct: 5 },
          { minQty: 50, maxQty: null, price: 322, discountPct: 10 },
        ],
      }),
    });

    const res = await handlePostSellerProduct(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify DB received integer Rupees, NEVER 35800 paise
    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Artisan Soap Mould',
          price: 360, // 358 rounded to nearest ₹5 per B2B rounding rules is 360 (within 2% cap: (360-358)/358 = 0.55%)
          source: 'SELLER',
        }),
      })
    );

    const createdData = (prisma.product.create as any).mock.calls[0][0].data;
    expect(createdData.price).toBeLessThan(1000); // Guarantees Rupees, not 35800 paise
    expect(Number.isInteger(createdData.price)).toBe(true);
    expect(createdData.wholesaleTiers[0].price).toBe(360);
    expect(createdData.wholesaleTiers[1].price).toBe(340);
  });

  it('enforces that legacy paise submissions (e.g. 35800 from forms) are normalized to integer Rupees in DB', async () => {
    const req = new NextRequest('http://localhost:3000/api/seller/products', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Yellow Angel Girl Mould',
        price: 35800, // Legacy paise submission
        isPaise: true,
        wholesaleTiers: [
          { minQty: 1, maxQty: 9, price: 35800, discountPct: 0 },
          { minQty: 10, maxQty: 49, price: 34000, discountPct: 5 },
        ],
      }),
    });

    const res = await handlePostSellerProduct(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    const createdData = (prisma.product.create as any).mock.calls[0][0].data;
    expect(createdData.price).toBe(360); // Integer Rupees
    expect(createdData.price).not.toBe(35800);
    expect(createdData.wholesaleTiers[0].price).toBe(360);
    expect(createdData.wholesaleTiers[1].price).toBe(340);
  });

  it('enforces that product updates via handlePatchSellerProductById store integer Rupees in DB', async () => {
    const req = new NextRequest('http://localhost:3000/api/seller/products/prod-existing', {
      method: 'PATCH',
      body: JSON.stringify({
        price: 450, // Rupees
        wholesaleTiers: [
          { minQty: 1, maxQty: 9, price: 450, discountPct: 0 },
          { minQty: 10, maxQty: 49, price: 425, discountPct: 5 },
        ],
      }),
    });

    const res = await handlePatchSellerProductById(req, {
      params: Promise.resolve({ productId: 'prod-existing' }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    const updatedData = (prisma.product.update as any).mock.calls[0][0].data;
    expect(updatedData.price).toBe(450); // Integer Rupees
    expect(updatedData.price).not.toBe(45000);
    expect(updatedData.wholesaleTiers[0].price).toBe(450);
    expect(updatedData.wholesaleTiers[1].price).toBe(425);
  });
});
