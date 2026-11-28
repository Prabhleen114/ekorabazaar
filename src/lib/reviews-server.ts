import crypto from 'crypto';
import prisma from '@/lib/db';
import catalogProducts from '@/lib/data/products.json';
import {
  getCanonicalProductId,
  CONFIRMED_DUPLICATE_MAPPINGS,
  MOULD_DUPLICATE_MAPPINGS,
} from '@/lib/product-redirects';
import {
  buildProductReviewUrl,
  buildReviewWhatsAppMessage,
  buildReviewWhatsAppShareUrl,
  computeReviewStats,
  isOrderEligibleForVerifiedReview,
  PublicProductReview,
  ReviewStatsSummary,
  toPublicReview,
} from '@/lib/reviews';
import { ProductStatus, ReviewStatus, Prisma } from '@prisma/client';

export class ReviewServiceError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ReviewServiceError';
  }
}

function getAllProductIdAliases(canonicalId: string): string[] {
  const allMappings = [...CONFIRMED_DUPLICATE_MAPPINGS, ...MOULD_DUPLICATE_MAPPINGS];
  const aliases = allMappings
    .filter((m) => m.canonicalId === canonicalId)
    .map((m) => m.deprecatedId);
  return Array.from(new Set([canonicalId, ...aliases]));
}

function extractCustomerEmailFromOrder(order: {
  customer?: { email?: string | null } | null;
  addressSnapshot?: unknown;
}): string | null {
  const snap = (order.addressSnapshot as Record<string, unknown> | null) || null;
  const snapEmail = typeof snap?.email === 'string' ? snap.email.trim().toLowerCase() : null;
  const userEmail = order.customer?.email?.trim().toLowerCase() || null;

  if (snapEmail && !snapEmail.startsWith('guest_')) return snapEmail;
  if (userEmail && !userEmail.startsWith('guest_') && !userEmail.endsWith('@ekorabazaar.in')) {
    return userEmail;
  }
  return userEmail || snapEmail || null;
}

/**
 * Ensures a Product row exists in PostgreSQL for both DB-native products and fallback catalog products.
 * Returns { exists, publishable, canonicalId, product }.
 */
export async function ensureProductExistsForReview(rawProductId: string): Promise<{
  exists: boolean;
  publishable: boolean;
  canonicalId: string;
  product: { id: string; title: string; imageUrl: string | null } | null;
}> {
  const canonicalId = getCanonicalProductId(String(rawProductId).trim());
  if (!canonicalId) {
    return { exists: false, publishable: false, canonicalId: '', product: null };
  }

  const existing = await prisma.product.findUnique({
    where: { id: canonicalId },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      status: true,
      isActive: true,
      sellerId: true,
      seller: { select: { accountStatus: true } },
    },
  });

  if (existing) {
    const publishable =
      existing.status === ProductStatus.PUBLISHED &&
      existing.isActive !== false &&
      (existing.sellerId === null || existing.seller?.accountStatus === 'ACTIVE');
    return {
      exists: true,
      publishable,
      canonicalId,
      product: { id: existing.id, title: existing.title, imageUrl: existing.imageUrl },
    };
  }

  const catalogItem = (catalogProducts as Array<Record<string, unknown>>).find(
    (p) => String(p.id) === canonicalId
  );

  if (!catalogItem) {
    return { exists: false, publishable: false, canonicalId, product: null };
  }

  const officialUser = await prisma.user.upsert({
    where: { email: 'official@ekorabazaar.in' },
    update: {},
    create: { email: 'official@ekorabazaar.in', role: 'SELLER' },
  });

  const officialSeller = await prisma.seller.upsert({
    where: { id: 'EKO-OFFICIAL-01' },
    update: {},
    create: {
      id: 'EKO-OFFICIAL-01',
      userId: officialUser.id,
      brandName: 'Ekora Official Supplier',
      accountStatus: 'ACTIVE',
      applicationStatus: 'APPROVED',
    },
  });

  const priceNum =
    typeof catalogItem.price === 'number'
      ? catalogItem.price
      : parseFloat(String(catalogItem.price || '0'));
  const rawPricePaise = Math.max(0, Math.round((isNaN(priceNum) ? 0 : priceNum) * 100));
  const rawTiers = Array.isArray(catalogItem.tiers) ? catalogItem.tiers : [];
  const rawImages = Array.isArray(catalogItem.images)
    ? catalogItem.images.filter((img): img is string => typeof img === 'string' && img.length > 0)
    : [];

  const created = await prisma.product.upsert({
    where: { id: canonicalId },
    update: {},
    create: {
      id: canonicalId,
      title: String(catalogItem.name || 'Untitled Product'),
      description: typeof catalogItem.description === 'string' ? catalogItem.description : null,
      price: rawPricePaise,
      customerPrice: rawPricePaise,
      stock: catalogItem.inStock === false || catalogItem.isQuoteOnly === true ? 0 : 500,
      status: ProductStatus.PUBLISHED,
      isActive: true,
      sellerId: officialSeller.id,
      source: 'EKORA_OFFICIAL',
      category:
        typeof catalogItem.category === 'string'
          ? catalogItem.category
          : 'General Silicone Moulds',
      imageUrl: typeof catalogItem.image === 'string' ? catalogItem.image : '/og-image.jpg',
      images:
        rawImages.length > 0
          ? rawImages
          : typeof catalogItem.image === 'string'
          ? [catalogItem.image]
          : [],
      wholesaleTiers: rawTiers.map((t: Record<string, unknown>) => ({
        ...t,
        price: Math.round((Number(t.price) || 0) * 100),
      })),
    },
    select: { id: true, title: true, imageUrl: true },
  });

  return {
    exists: true,
    publishable: true,
    canonicalId,
    product: created,
  };
}

/**
 * Fetches published (APPROVED) reviews and rating summary for a product.
 * Strips all private customer information and safely degrades on DB error.
 */
export async function getPublicProductReviews(rawProductId: string): Promise<{
  productId: string;
  stats: ReviewStatsSummary;
  reviews: PublicProductReview[];
}> {
  const productId = getCanonicalProductId(String(rawProductId).trim());
  if (!productId) {
    return { productId: '', stats: computeReviewStats([]), reviews: [] };
  }

  try {
    const rows = await prisma.review.findMany({
      where: {
        productId,
        status: ReviewStatus.APPROVED,
      },
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        productId: true,
        rating: true,
        title: true,
        comment: true,
        reviewerName: true,
        isVerifiedPurchase: true,
        createdAt: true,
      },
    });

    const reviews = rows.map(toPublicReview);
    const stats = computeReviewStats(reviews);

    return {
      productId,
      stats,
      reviews,
    };
  } catch (err) {
    console.warn('[Reviews] Failed to load public reviews for product:', productId, err);
    return {
      productId,
      stats: computeReviewStats([]),
      reviews: [],
    };
  }
}

/**
 * Verifies a review invite token for a specific product without exposing customer PII.
 */
export async function verifyReviewTokenForProduct(token: string, rawProductId: string) {
  const cleanToken = token.trim();
  const canonicalId = getCanonicalProductId(String(rawProductId).trim());
  if (!cleanToken || !canonicalId) {
    return {
      valid: false,
      alreadyReviewed: false,
      verifiedPurchaseEligible: false,
      reason: 'Missing review token or product ID.',
    };
  }

  const record = await prisma.reviewToken.findUnique({
    where: { token: cleanToken },
    include: {
      order: {
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          payments: { select: { status: true } },
        },
      },
      orderItem: {
        select: {
          id: true,
          productId: true,
          productNameSnapshot: true,
        },
      },
      review: {
        select: { id: true, status: true },
      },
    },
  });

  if (!record) {
    return {
      valid: false,
      alreadyReviewed: false,
      verifiedPurchaseEligible: false,
      reason: 'Invalid review link.',
    };
  }

  if (getCanonicalProductId(record.productId) !== canonicalId) {
    return {
      valid: false,
      alreadyReviewed: false,
      verifiedPurchaseEligible: false,
      reason: 'This review link belongs to a different product.',
    };
  }

  if (record.revokedAt) {
    return {
      valid: false,
      alreadyReviewed: false,
      verifiedPurchaseEligible: false,
      reason: 'This review link has been revoked.',
    };
  }

  if (record.expiresAt && record.expiresAt <= new Date()) {
    return {
      valid: false,
      alreadyReviewed: false,
      verifiedPurchaseEligible: false,
      reason: 'This review link has expired.',
    };
  }

  if (record.usedAt || record.review) {
    return {
      valid: false,
      alreadyReviewed: true,
      verifiedPurchaseEligible: false,
      productName: record.orderItem?.productNameSnapshot,
      orderRef: record.orderId.slice(0, 8).toUpperCase(),
      reason: 'A review has already been submitted for this purchase.',
    };
  }

  const eligible = isOrderEligibleForVerifiedReview(record.order);
  if (!eligible) {
    return {
      valid: false,
      alreadyReviewed: false,
      verifiedPurchaseEligible: false,
      reason: 'This order is not currently eligible for a verified purchase review.',
    };
  }

  return {
    valid: true,
    alreadyReviewed: false,
    verifiedPurchaseEligible: true,
    productName: record.orderItem?.productNameSnapshot,
    orderRef: record.orderId.slice(0, 8).toUpperCase(),
  };
}

/**
 * Submits a customer product review.
 * - All new reviews start as PENDING for admin moderation.
 * - Verified Purchase is granted ONLY server-side via a valid ReviewToken OR authenticated eligible order.
 * - Prevents duplicate reviews per purchase and per unverified customer submission.
 */
export async function submitProductReview(input: {
  productId: string;
  rating: number;
  title?: string | null;
  comment: string;
  reviewerName?: string | null;
  reviewerEmail?: string | null;
  reviewToken?: string | null;
  sessionUserId?: string | null;
}) {
  const productCheck = await ensureProductExistsForReview(input.productId);
  if (!productCheck.exists || !productCheck.publishable) {
    throw new ReviewServiceError(404, 'Product not found or unavailable for reviews.');
  }

  const canonicalId = productCheck.canonicalId;
  const cleanTitle = input.title?.trim() || null;
  const cleanComment = input.comment.trim();
  const cleanName = input.reviewerName?.trim() || null;
  const cleanEmail = input.reviewerEmail?.trim().toLowerCase() || null;

  // Path A: Token-backed Verified Purchase submission
  if (input.reviewToken && input.reviewToken.trim()) {
    const tokenStr = input.reviewToken.trim();
    const tokenRecord = await prisma.reviewToken.findUnique({
      where: { token: tokenStr },
      include: {
        order: {
          include: {
            customer: { select: { id: true, email: true, name: true } },
            payments: { select: { status: true } },
          },
        },
        orderItem: true,
        review: { select: { id: true } },
      },
    });

    if (!tokenRecord) {
      throw new ReviewServiceError(400, 'Invalid review link token.');
    }

    if (getCanonicalProductId(tokenRecord.productId) !== canonicalId) {
      throw new ReviewServiceError(400, 'This review link does not match the selected product.');
    }

    if (tokenRecord.revokedAt) {
      throw new ReviewServiceError(400, 'This review link is no longer active.');
    }

    if (tokenRecord.expiresAt && tokenRecord.expiresAt <= new Date()) {
      throw new ReviewServiceError(400, 'This review link has expired.');
    }

    if (tokenRecord.usedAt || tokenRecord.review) {
      throw new ReviewServiceError(409, 'A review has already been submitted for this purchase.');
    }

    if (!isOrderEligibleForVerifiedReview(tokenRecord.order)) {
      throw new ReviewServiceError(
        403,
        'Only paid or completed orders are eligible for Verified Purchase reviews.'
      );
    }

    const existingForItem = await prisma.review.findUnique({
      where: { orderItemId: tokenRecord.orderItemId },
      select: { id: true },
    });

    if (existingForItem) {
      throw new ReviewServiceError(409, 'A review has already been submitted for this purchase.');
    }

    const derivedEmail = cleanEmail || extractCustomerEmailFromOrder(tokenRecord.order);

    const created = await prisma.$transaction(async (tx) => {
      const claim = await tx.reviewToken.updateMany({
        where: {
          id: tokenRecord.id,
          usedAt: null,
          revokedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });

      if (claim.count === 0) {
        throw new ReviewServiceError(409, 'A review has already been submitted for this purchase.');
      }

      return tx.review.create({
        data: {
          productId: canonicalId,
          userId: tokenRecord.order.customerId,
          orderId: tokenRecord.orderId,
          orderItemId: tokenRecord.orderItemId,
          reviewTokenId: tokenRecord.id,
          rating: input.rating,
          title: cleanTitle,
          comment: cleanComment,
          reviewerName: cleanName,
          reviewerEmail: derivedEmail,
          isVerifiedPurchase: true,
          status: ReviewStatus.PENDING,
        },
      });
    });

    return {
      review: toPublicReview(created),
      status: created.status,
      isVerifiedPurchase: true,
    };
  }

  // Path B: Authenticated customer submission (verify against their completed/eligible orders)
  if (input.sessionUserId) {
    const user = await prisma.user.findUnique({
      where: { id: input.sessionUserId },
      select: { id: true, email: true, name: true },
    });

    const aliasIds = getAllProductIdAliases(canonicalId);
    const matchingItems = await prisma.orderItem.findMany({
      where: {
        productId: { in: aliasIds },
        order: { customerId: input.sessionUserId },
      },
      include: {
        order: {
          include: {
            payments: { select: { status: true } },
          },
        },
        review: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const eligibleItems = matchingItems.filter((item) => isOrderEligibleForVerifiedReview(item.order));

    if (eligibleItems.length > 0) {
      const unreviewedItem = eligibleItems.find((item) => !item.review);
      if (!unreviewedItem) {
        throw new ReviewServiceError(
          409,
          'You have already submitted a review for your purchase of this product.'
        );
      }

      const created = await prisma.review.create({
        data: {
          productId: canonicalId,
          userId: input.sessionUserId,
          orderId: unreviewedItem.orderId,
          orderItemId: unreviewedItem.id,
          rating: input.rating,
          title: cleanTitle,
          comment: cleanComment,
          reviewerName: cleanName,
          reviewerEmail: cleanEmail || user?.email || null,
          isVerifiedPurchase: true,
          status: ReviewStatus.PENDING,
        },
      });

      return {
        review: toPublicReview(created),
        status: created.status,
        isVerifiedPurchase: true,
      };
    }

    // Authenticated user with NO eligible order -> non-verified review, 1 per product
    const existingUnverified = await prisma.review.findFirst({
      where: {
        productId: canonicalId,
        userId: input.sessionUserId,
        status: { in: [ReviewStatus.PENDING, ReviewStatus.APPROVED] },
      },
      select: { id: true },
    });

    if (existingUnverified) {
      throw new ReviewServiceError(409, 'You have already submitted a review for this product.');
    }

    const created = await prisma.review.create({
      data: {
        productId: canonicalId,
        userId: input.sessionUserId,
        rating: input.rating,
        title: cleanTitle,
        comment: cleanComment,
        reviewerName: cleanName,
        reviewerEmail: cleanEmail || user?.email || null,
        isVerifiedPurchase: false,
        status: ReviewStatus.PENDING,
      },
    });

    return {
      review: toPublicReview(created),
      status: created.status,
      isVerifiedPurchase: false,
    };
  }

  // Path C: Guest submission (never verified purchase)
  if (cleanEmail) {
    const duplicateByEmail = await prisma.review.findFirst({
      where: {
        productId: canonicalId,
        reviewerEmail: cleanEmail,
        status: { in: [ReviewStatus.PENDING, ReviewStatus.APPROVED] },
      },
      select: { id: true },
    });

    if (duplicateByEmail) {
      throw new ReviewServiceError(
        409,
        'A review with this email has already been submitted for this product.'
      );
    }
  }

  const created = await prisma.review.create({
    data: {
      productId: canonicalId,
      rating: input.rating,
      title: cleanTitle,
      comment: cleanComment,
      reviewerName: cleanName,
      reviewerEmail: cleanEmail,
      isVerifiedPurchase: false,
      status: ReviewStatus.PENDING,
    },
  });

  return {
    review: toPublicReview(created),
    status: created.status,
    isVerifiedPurchase: false,
  };
}

/**
 * Admin helper: gets or creates a secure ReviewToken and share URLs for a specific OrderItem.
 */
export async function getOrCreateOrderItemReviewShareLink(params: {
  orderId: string;
  orderItemId: string;
  adminUserId: string;
}) {
  const orderItem = await prisma.orderItem.findFirst({
    where: {
      id: params.orderItemId,
      orderId: params.orderId,
    },
    include: {
      order: {
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          payments: { select: { status: true } },
        },
      },
      reviewToken: true,
      review: { select: { id: true, status: true, rating: true, createdAt: true } },
    },
  });

  if (!orderItem) {
    throw new ReviewServiceError(404, 'Order item not found for this order.');
  }

  const productCheck = await ensureProductExistsForReview(orderItem.productId);
  if (!productCheck.exists) {
    throw new ReviewServiceError(404, 'Product associated with this order item no longer exists.');
  }

  const canonicalId = productCheck.canonicalId;
  const eligible = isOrderEligibleForVerifiedReview(orderItem.order);
  const snap = (orderItem.order.addressSnapshot as Record<string, unknown> | null) || null;
  const customerPhone =
    (typeof snap?.phone === 'string' && snap.phone) || orderItem.order.customer?.phone || null;

  if (!eligible) {
    throw new ReviewServiceError(
      400,
      'Review links with verified purchase eligibility can only be generated for paid/confirmed orders.'
    );
  }

  let tokenRecord = orderItem.reviewToken;
  const isExpiredOrRevoked =
    tokenRecord &&
    (Boolean(tokenRecord.revokedAt) ||
      (tokenRecord.expiresAt !== null && tokenRecord.expiresAt <= new Date()));

  if (!tokenRecord || isExpiredOrRevoked) {
    const newToken = crypto.randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    if (tokenRecord) {
      tokenRecord = await prisma.reviewToken.update({
        where: { id: tokenRecord.id },
        data: {
          token: newToken,
          productId: canonicalId,
          createdById: params.adminUserId,
          expiresAt,
          revokedAt: null,
        },
      });
    } else {
      tokenRecord = await prisma.reviewToken.create({
        data: {
          token: newToken,
          orderId: orderItem.orderId,
          orderItemId: orderItem.id,
          productId: canonicalId,
          createdById: params.adminUserId,
          expiresAt,
        },
      });
    }
  }

  const reviewUrl = buildProductReviewUrl(canonicalId, tokenRecord.token);
  const productName = orderItem.productNameSnapshot || productCheck.product?.title || 'Product';
  const whatsappMessage = buildReviewWhatsAppMessage(productName, reviewUrl);
  const whatsappUrl = buildReviewWhatsAppShareUrl(productName, reviewUrl, customerPhone);

  return {
    orderId: orderItem.orderId,
    orderItemId: orderItem.id,
    productId: canonicalId,
    productName,
    token: tokenRecord.token,
    reviewUrl,
    whatsappMessage,
    whatsappUrl,
    alreadyReviewed: Boolean(orderItem.review || tokenRecord.usedAt),
    existingReviewStatus: orderItem.review?.status || null,
    expiresAt: tokenRecord.expiresAt?.toISOString() || null,
  };
}

/**
 * Admin query for reviews with filters (product, rating, status, date range, search).
 */
export async function queryAdminReviews(filters: {
  status?: string;
  rating?: number | null;
  productId?: string;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 20));
  const skip = (page - 1) * limit;

  const where: Prisma.ReviewWhereInput = {};

  if (filters.status && ['PENDING', 'APPROVED', 'REJECTED'].includes(filters.status.toUpperCase())) {
    where.status = filters.status.toUpperCase() as ReviewStatus;
  }

  if (filters.rating && filters.rating >= 1 && filters.rating <= 5) {
    where.rating = filters.rating;
  }

  if (filters.productId && filters.productId.trim() && filters.productId !== 'ALL') {
    where.productId = getCanonicalProductId(filters.productId.trim());
  }

  if (filters.dateFrom || filters.dateTo) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      if (!isNaN(from.getTime())) createdAt.gte = from;
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      if (!isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        createdAt.lte = to;
      }
    }
    if (Object.keys(createdAt).length > 0) {
      where.createdAt = createdAt;
    }
  }

  if (filters.q && filters.q.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { comment: { contains: q, mode: 'insensitive' } },
      { title: { contains: q, mode: 'insensitive' } },
      { reviewerName: { contains: q, mode: 'insensitive' } },
      { reviewerEmail: { contains: q, mode: 'insensitive' } },
      { orderId: { contains: q, mode: 'insensitive' } },
      { product: { title: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const [reviews, total, statusGroups, approvedAgg, productSummaries, reviewedProducts] =
    await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          product: {
            select: { id: true, title: true, imageUrl: true, category: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
          order: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              addressSnapshot: true,
              customer: { select: { name: true, email: true } },
            },
          },
        },
      }),
      prisma.review.count({ where }),
      prisma.review.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.review.aggregate({
        where: { status: ReviewStatus.APPROVED },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.review.groupBy({
        by: ['productId'],
        where: { status: ReviewStatus.APPROVED },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.product.findMany({
        where: { reviews: { some: {} } },
        select: { id: true, title: true },
        orderBy: { title: 'asc' },
      }),
    ]);

  const counts = { ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 };
  for (const grp of statusGroups) {
    counts[grp.status] = grp._count._all;
    counts.ALL += grp._count._all;
  }

  const productStatsMap = new Map<string, { averageRating: number; reviewCount: number }>();
  for (const ps of productSummaries) {
    productStatsMap.set(ps.productId, {
      averageRating: ps._avg.rating ? Math.round(ps._avg.rating * 10) / 10 : 0,
      reviewCount: ps._count._all,
    });
  }

  const formatted = reviews.map((r) => {
    const snap = (r.order?.addressSnapshot as Record<string, unknown> | null) || null;
    const customerName =
      r.reviewerName ||
      r.user?.name ||
      (typeof snap?.name === 'string' ? snap.name : null) ||
      r.order?.customer?.name ||
      null;
    const customerEmail =
      r.reviewerEmail ||
      (r.order ? extractCustomerEmailFromOrder(r.order) : null) ||
      (r.user?.email && !r.user.email.startsWith('guest_') ? r.user.email : null);
    const pStats = productStatsMap.get(r.productId) || { averageRating: 0, reviewCount: 0 };

    return {
      id: r.id,
      productId: r.productId,
      productTitle: r.product?.title || r.productId,
      productImage: r.product?.imageUrl || null,
      productCategory: r.product?.category || null,
      productAverageRating: pStats.averageRating,
      productReviewCount: pStats.reviewCount,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      reviewerName: r.reviewerName,
      customerName,
      customerEmail,
      orderId: r.orderId,
      orderItemId: r.orderItemId,
      isVerifiedPurchase: r.isVerifiedPurchase,
      status: r.status,
      moderationNote: r.moderationNote,
      moderatedAt: r.moderatedAt ? r.moderatedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  });

  return {
    reviews: formatted,
    counts,
    overallStats: {
      approvedAverageRating: approvedAgg._avg.rating
        ? Math.round(approvedAgg._avg.rating * 10) / 10
        : 0,
      approvedCount: approvedAgg._count._all,
    },
    products: reviewedProducts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
