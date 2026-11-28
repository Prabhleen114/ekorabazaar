import { getCanonicalProductId } from '@/lib/product-redirects';

export const REVIEW_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ekorabazaar.in';

export const ELIGIBLE_REVIEW_ORDER_STATUSES = [
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'IN_TRANSIT',
  'DELIVERED',
] as const;

export type RatingBucket = 1 | 2 | 3 | 4 | 5;

export interface ReviewDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface ReviewStatsSummary {
  averageRating: number;
  totalReviews: number;
  distribution: ReviewDistribution;
}

export interface PublicProductReview {
  id: string;
  productId: string;
  rating: number;
  title: string | null;
  comment: string;
  reviewerName: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

/**
 * Checks whether an order qualifies for Verified Purchase review status.
 * Excludes PAYMENT_PENDING, CANCELLED, REFUND_INITIATED, REFUNDED, and unpaid orders.
 */
export function isOrderEligibleForVerifiedReview(order: {
  status?: string | null;
  paymentStatus?: string | null;
  payments?: Array<{ status?: string | null }> | null;
}): boolean {
  if (!order || !order.status) return false;
  if (!ELIGIBLE_REVIEW_ORDER_STATUSES.includes(order.status as (typeof ELIGIBLE_REVIEW_ORDER_STATUSES)[number])) {
    return false;
  }
  if (order.paymentStatus === 'FAILED' || order.paymentStatus === 'REFUNDED') {
    return false;
  }
  if (order.paymentStatus === 'CAPTURED') {
    return true;
  }
  if (Array.isArray(order.payments)) {
    return order.payments.some((p) => p?.status === 'CAPTURED');
  }
  return false;
}

/**
 * Computes average rating (rounded to 1 decimal), total review count, and 5->1 star distribution.
 * Never fabricates ratings when there are zero genuine reviews.
 */
export function computeReviewStats(reviews: Array<{ rating: number }>): ReviewStatsSummary {
  const distribution: ReviewDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  let validCount = 0;

  for (const r of reviews) {
    const rating = Math.round(Number(r.rating));
    if (rating >= 1 && rating <= 5) {
      distribution[rating as RatingBucket] += 1;
      sum += rating;
      validCount += 1;
    }
  }

  return {
    averageRating: validCount > 0 ? Math.round((sum / validCount) * 10) / 10 : 0,
    totalReviews: validCount,
    distribution,
  };
}

/**
 * Projects a DB Review record into a safe public DTO, stripping private fields
 * (reviewerEmail, userId, orderId, orderItemId, reviewTokenId, moderationNote).
 */
export function toPublicReview(review: {
  id: string;
  productId: string;
  rating: number;
  title?: string | null;
  comment: string;
  reviewerName?: string | null;
  isVerifiedPurchase: boolean;
  createdAt: Date | string;
}): PublicProductReview {
  const trimmedName = typeof review.reviewerName === 'string' ? review.reviewerName.trim() : '';
  return {
    id: review.id,
    productId: review.productId,
    rating: review.rating,
    title: review.title?.trim() || null,
    comment: review.comment,
    reviewerName: trimmedName || (review.isVerifiedPurchase ? 'Verified Buyer' : 'Ekora Customer'),
    isVerifiedPurchase: Boolean(review.isVerifiedPurchase),
    createdAt:
      review.createdAt instanceof Date
        ? review.createdAt.toISOString()
        : new Date(review.createdAt).toISOString(),
  };
}

/**
 * Builds the direct product review URL that automatically opens & scrolls to the review form.
 * Uses canonical product ID/slug and optionally attaches a secure reviewToken.
 */
export function buildProductReviewUrl(
  productIdOrSlug: string,
  reviewToken?: string | null,
  baseUrl: string = REVIEW_BASE_URL
): string {
  const canonicalId = getCanonicalProductId(String(productIdOrSlug).trim());
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const url = new URL(`${cleanBase}/products/${encodeURIComponent(canonicalId)}`);
  url.searchParams.set('writeReview', 'true');
  if (reviewToken && reviewToken.trim()) {
    url.searchParams.set('reviewToken', reviewToken.trim());
  }
  return url.toString();
}

/**
 * Builds the polite pre-filled WhatsApp share message and wa.me URL for an order product.
 */
export function buildReviewWhatsAppMessage(productName: string, reviewUrl: string): string {
  const cleanName = productName.trim() || 'your purchase';
  return `Hello! Thank you for shopping with Ekora Bazaar. We hope you liked your purchase. We'd love to hear your feedback about ${cleanName}. Please share your experience here: ${reviewUrl}`;
}

export function normalizeIndianWhatsAppPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return null;
}

export function buildReviewWhatsAppShareUrl(
  productName: string,
  reviewUrl: string,
  customerPhone?: string | null
): string {
  const message = buildReviewWhatsAppMessage(productName, reviewUrl);
  const waPhone = normalizeIndianWhatsAppPhone(customerPhone);
  const base = waPhone ? `https://wa.me/${waPhone}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(message)}`;
}
