import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getSession } from '@/lib/session';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { logAudit } from '@/lib/audit';
import {
  AdminModerateReviewSchema,
  CreateReviewSchema,
  validateBody,
} from '@/lib/validation';
import {
  getOrCreateOrderItemReviewShareLink,
  getPublicProductReviews,
  queryAdminReviews,
  ReviewServiceError,
  submitProductReview,
  verifyReviewTokenForProduct,
} from '@/lib/reviews-server';
import { getCanonicalProductId } from '@/lib/product-redirects';
import { RouteContext, handleAuthError } from '../types';
import { ReviewStatus } from '@prisma/client';

const OrderItemReviewLinkBodySchema = z.object({
  orderItemId: z.string().trim().min(1, 'Order item ID is required'),
});

/**
 * GET /api/products/:id/reviews
 * Public endpoint returning APPROVED reviews & rating stats (zero customer PII).
 */
export async function handleGetProductReviews(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const data = await getPublicProductReviews(id);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Public product reviews GET error:', error);
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 });
  }
}

/**
 * POST /api/products/:id/reviews
 * Submits a customer review (starts as PENDING for admin moderation).
 */
export async function handlePostProductReview(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const clientIp = getClientIp(req);

    const ipRate = rateLimit(`review:submit:${clientIp}`, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!ipRate.success) {
      return NextResponse.json(
        { error: 'Too many review submissions. Please wait a few minutes and try again.' },
        {
          status: 429,
          headers: { 'Retry-After': String(ipRate.reset) },
        }
      );
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const validation = validateBody(CreateReviewSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;

    // Honeypot anti-spam check
    if (data.website && data.website.trim().length > 0) {
      return NextResponse.json({ error: 'Review submission rejected.' }, { status: 400 });
    }

    const session = await getSession().catch(() => null);
    const sessionUserId = session?.userId || null;

    const result = await submitProductReview({
      productId: id,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      reviewerName: data.reviewerName,
      reviewerEmail: data.reviewerEmail,
      reviewToken: data.reviewToken,
      sessionUserId,
    });

    return NextResponse.json(
      {
        success: true,
        review: result.review,
        status: result.status,
        isVerifiedPurchase: result.isVerifiedPurchase,
        message: 'Thank you! Your review has been submitted and is awaiting admin approval.',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof ReviewServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Product review POST error:', error);
    return NextResponse.json({ error: 'Failed to submit review.' }, { status: 500 });
  }
}

/**
 * GET /api/reviews/verify-token?token=...&productId=...
 * Verifies whether an invite token is valid for verified purchase review (no PII returned).
 */
export async function handleVerifyReviewToken(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token') || '';
    const productId = searchParams.get('productId') || '';

    const result = await verifyReviewTokenForProduct(token, productId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Verify review token GET error:', error);
    return NextResponse.json(
      { valid: false, alreadyReviewed: false, verifiedPurchaseEligible: false, reason: 'Verification failed.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/reviews
 * Admin list of all reviews with filters (status, rating, productId, dateFrom, dateTo, q).
 */
export async function handleGetAdminReviews(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'ALL';
    const ratingParam = searchParams.get('rating');
    const rating = ratingParam && ratingParam !== 'ALL' ? parseInt(ratingParam, 10) : null;
    const productId = searchParams.get('productId') || 'ALL';
    const q = searchParams.get('q') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const data = await queryAdminReviews({
      status,
      rating: rating && !isNaN(rating) ? rating : null,
      productId,
      q,
      dateFrom,
      dateTo,
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 20 : limit,
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error('Admin reviews GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/reviews/:id
 * Admin approve / reject / move back to pending.
 */
export async function handlePatchAdminReview(req: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const existing = await prisma.review.findUnique({
      where: { id },
      select: { id: true, productId: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
    }

    const rawBody = await req.json().catch(() => null);
    const validation = validateBody(AdminModerateReviewSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { status, moderationNote } = validation.data;

    const updated = await prisma.review.update({
      where: { id },
      data: {
        status: status as ReviewStatus,
        moderatedById: admin.userId,
        moderatedAt: new Date(),
        ...(moderationNote !== undefined
          ? { moderationNote: moderationNote?.trim() || null }
          : {}),
      },
    });

    await logAudit(admin.userId, 'ADMIN_MODERATE_REVIEW', id, {
      previousStatus: existing.status,
      newStatus: updated.status,
      productId: existing.productId,
    });

    try {
      const canonicalId = getCanonicalProductId(existing.productId);
      revalidatePath(`/products/${canonicalId}`);
    } catch {}

    return NextResponse.json({
      success: true,
      review: {
        id: updated.id,
        status: updated.status,
        moderationNote: updated.moderationNote,
        moderatedAt: updated.moderatedAt?.toISOString() || null,
      },
    });
  } catch (error: unknown) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error('Admin review PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/reviews/:id
 * Admin delete a review permanently.
 */
export async function handleDeleteAdminReview(_req: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const existing = await prisma.review.findUnique({
      where: { id },
      select: { id: true, productId: true, rating: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
    }

    await prisma.review.delete({
      where: { id },
    });

    await logAudit(admin.userId, 'ADMIN_DELETE_REVIEW', id, {
      productId: existing.productId,
      previousStatus: existing.status,
      rating: existing.rating,
    });

    try {
      const canonicalId = getCanonicalProductId(existing.productId);
      revalidatePath(`/products/${canonicalId}`);
    } catch {}

    return NextResponse.json({ success: true, id });
  } catch (error: unknown) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error('Admin review DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}

/**
 * POST /api/admin/orders/:id/review-link
 * Admin generates or retrieves a secure product review link for a specific order item.
 */
export async function handlePostAdminOrderReviewLink(req: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { id: orderId } = await params;

    const rawBody = await req.json().catch(() => null);
    const validation = validateBody(OrderItemReviewLinkBodySchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const result = await getOrCreateOrderItemReviewShareLink({
      orderId,
      orderItemId: validation.data.orderItemId,
      adminUserId: admin.userId,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    if (error instanceof ReviewServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Admin order review link error:', error);
    return NextResponse.json({ error: 'Failed to generate review link' }, { status: 500 });
  }
}
