"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Star,
  CheckCircle2,
  MessageSquarePlus,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { PublicProductReview, ReviewStatsSummary } from "@/lib/reviews";

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  initialStats: ReviewStatsSummary;
  initialReviews: PublicProductReview[];
}

interface TokenVerificationState {
  checked: boolean;
  loading: boolean;
  valid: boolean;
  alreadyReviewed: boolean;
  verifiedPurchaseEligible: boolean;
  orderRef?: string;
  reason?: string;
}

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

function StarRow({
  rating,
  sizeClass = "w-4 h-4",
}: {
  rating: number;
  sizeClass?: string;
}) {
  const rounded = Math.round(rating);
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= rounded
              ? "fill-amber-400 text-amber-500"
              : "fill-stone-100 text-stone-300"
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Isolated query-param reader wrapped in <Suspense fallback={null}> so the main
 * reviews section remains 100% SSR-rendered for SEO crawlability.
 */
function ReviewUrlActivator({
  onActivate,
}: {
  onActivate: (opts: { writeReview: boolean; reviewToken: string | null }) => void;
}) {
  const searchParams = useSearchParams();
  const writeReviewParam = searchParams.get("writeReview");
  const reviewTokenParam = searchParams.get("reviewToken");
  const triggeredRef = useRef(false);

  useEffect(() => {
    const shouldOpen =
      writeReviewParam === "true" ||
      writeReviewParam === "1" ||
      Boolean(reviewTokenParam);

    if (shouldOpen && !triggeredRef.current) {
      triggeredRef.current = true;
      onActivate({
        writeReview: true,
        reviewToken: reviewTokenParam ? reviewTokenParam.trim() : null,
      });
    }
  }, [writeReviewParam, reviewTokenParam, onActivate]);

  return null;
}

export default function ProductReviewsSection({
  productId,
  productName,
  initialStats,
  initialReviews,
}: ProductReviewsSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const formContainerRef = useRef<HTMLDivElement | null>(null);

  const [stats] = useState<ReviewStatsSummary>(initialStats);
  const [reviews] = useState<PublicProductReview[]>(initialReviews);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reviewToken, setReviewToken] = useState<string | null>(null);
  const [tokenState, setTokenState] = useState<TokenVerificationState>({
    checked: false,
    loading: false,
    valid: false,
    alreadyReviewed: false,
    verifiedPurchaseEligible: false,
  });

  // Form fields
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState<{
    message: string;
    isVerifiedPurchase: boolean;
  } | null>(null);

  const [starFilter, setStarFilter] = useState<number | null>(null);

  const verifyToken = async (token: string) => {
    setTokenState({
      checked: false,
      loading: true,
      valid: false,
      alreadyReviewed: false,
      verifiedPurchaseEligible: false,
    });
    try {
      const res = await fetch(
        `/api/reviews/verify-token?token=${encodeURIComponent(token)}&productId=${encodeURIComponent(
          productId
        )}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setTokenState({
        checked: true,
        loading: false,
        valid: Boolean(data.valid),
        alreadyReviewed: Boolean(data.alreadyReviewed),
        verifiedPurchaseEligible: Boolean(data.verifiedPurchaseEligible),
        orderRef: data.orderRef,
        reason: data.reason,
      });
    } catch {
      setTokenState({
        checked: true,
        loading: false,
        valid: false,
        alreadyReviewed: false,
        verifiedPurchaseEligible: false,
        reason: "Could not verify review invite link.",
      });
    }
  };

  const handleUrlActivate = React.useCallback(
    ({ writeReview, reviewToken: urlToken }: { writeReview: boolean; reviewToken: string | null }) => {
      if (writeReview) {
        setIsFormOpen(true);
      }
      if (urlToken) {
        setReviewToken(urlToken);
        void verifyToken(urlToken);
      }
      // Smooth scroll to the review form / section after layout settles
      setTimeout(() => {
        const target = formContainerRef.current || sectionRef.current;
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [productId]
  );

  const openAndScrollToForm = () => {
    setIsFormOpen(true);
    setTimeout(() => {
      formContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 60);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (rating < 1 || rating > 5) {
      setSubmitError("Please select a star rating from 1 to 5.");
      return;
    }
    if (comment.trim().length < 5) {
      setSubmitError("Please write at least 5 characters sharing your experience.");
      return;
    }

    setSubmitting(true);
    try {
      const activeToken =
        reviewToken && tokenState.valid && !tokenState.alreadyReviewed ? reviewToken : null;

      const res = await fetch(`/api/products/${encodeURIComponent(productId)}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title: title.trim() || null,
          comment: comment.trim(),
          reviewerName: reviewerName.trim() || null,
          reviewerEmail: reviewerEmail.trim() || null,
          reviewToken: activeToken,
          website: honeypot,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not submit your review. Please try again.");
      }

      setSubmitSuccess({
        message:
          data.message ||
          "Thank you! Your review has been submitted and is awaiting admin moderation.",
        isVerifiedPurchase: Boolean(data.isVerifiedPurchase),
      });

      setRating(0);
      setTitle("");
      setComment("");
      setReviewerName("");
      setReviewerEmail("");
      if (activeToken) {
        setTokenState((prev) => ({
          ...prev,
          valid: false,
          alreadyReviewed: true,
          verifiedPurchaseEligible: false,
        }));
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReviews =
    starFilter !== null ? reviews.filter((r) => r.rating === starFilter) : reviews;

  const activeStarPreview = hoverRating || rating;

  return (
    <section
      id="reviews-section"
      ref={sectionRef}
      className="mt-10 pt-10 border-t border-brand-linen w-full scroll-mt-24"
      aria-labelledby="product-reviews-heading"
    >
      <Suspense fallback={null}>
        <ReviewUrlActivator onActivate={handleUrlActivate} />
      </Suspense>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C734B] font-sans font-bold block mb-1.5">
            Customer Feedback
          </span>
          <h2
            id="product-reviews-heading"
            className="text-2xl md:text-3xl font-bold font-serif text-brand-charcoal"
          >
            Customer Reviews &amp; Ratings
          </h2>
          <p className="text-xs md:text-sm text-brand-charcoal/65 mt-1 font-sans">
            Genuine product feedback for {productName}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isFormOpen) {
              setIsFormOpen(false);
            } else {
              openAndScrollToForm();
            }
          }}
          className="inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-black text-white px-5 py-3 text-xs uppercase tracking-wider font-semibold transition-colors min-h-[44px] w-full sm:w-auto shrink-0 cursor-pointer"
        >
          <MessageSquarePlus className="w-4 h-4 text-amber-400" />
          <span>{isFormOpen ? "Close Review Form" : "Write a Review"}</span>
          {isFormOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Rating Summary + Distribution Grid */}
      <div className="bg-white rounded-2xl border border-brand-linen p-5 md:p-7 shadow-2xs mb-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Average Score */}
          <div className="md:col-span-4 flex flex-col items-start md:items-center md:text-center md:border-r md:border-brand-linen md:pr-6">
            {stats.totalReviews > 0 ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-bold font-serif text-brand-charcoal">
                    {stats.averageRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-stone-500 font-sans">/ 5</span>
                </div>
                <div className="mt-2">
                  <StarRow rating={stats.averageRating} sizeClass="w-5 h-5" />
                </div>
                <p className="text-xs text-stone-600 font-sans mt-2">
                  Based on{" "}
                  <strong className="text-stone-900">
                    {stats.totalReviews} {stats.totalReviews === 1 ? "review" : "reviews"}
                  </strong>
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-stone-400 mb-1.5">
                  <StarRow rating={0} sizeClass="w-5 h-5" />
                </div>
                <p className="font-serif text-lg font-bold text-stone-900">No reviews yet</p>
                <p className="text-xs text-stone-500 font-sans mt-1">
                  Be the first customer to review {productName}.
                </p>
              </>
            )}
          </div>

          {/* 5-star to 1-star Distribution Bars */}
          <div className="md:col-span-8 space-y-2.5">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = stats.distribution[star] || 0;
              const pct =
                stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
              const isSelected = starFilter === star;

              return (
                <button
                  key={star}
                  type="button"
                  disabled={count === 0}
                  onClick={() => setStarFilter(isSelected ? null : star)}
                  className={`w-full flex items-center gap-3 text-xs font-sans group transition-opacity ${
                    count === 0 ? "opacity-60 cursor-default" : "cursor-pointer hover:opacity-100"
                  }`}
                >
                  <span
                    className={`w-14 text-left font-semibold shrink-0 flex items-center gap-1 ${
                      isSelected ? "text-brand-orange" : "text-stone-700"
                    }`}
                  >
                    <span>{star}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  </span>

                  <div className="flex-1 h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200/70">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isSelected ? "bg-brand-orange" : "bg-amber-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <span className="w-16 text-right text-stone-500 tabular-nums shrink-0">
                    {count} ({pct}%)
                  </span>
                </button>
              );
            })}
            {starFilter !== null && (
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStarFilter(null)}
                  className="text-xs font-semibold text-brand-orange hover:underline cursor-pointer"
                >
                  Clear {starFilter}-star filter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Submission Form (Auto-opens on ?writeReview=true) */}
      <div ref={formContainerRef} id="write-review-form" className="scroll-mt-24">
        {isFormOpen && (
          <div className="bg-white rounded-2xl border border-stone-300 p-5 md:p-7 shadow-sm mb-8">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-brand-charcoal">
                  Write a Review for {productName}
                </h3>
                <p className="text-xs text-stone-500 font-sans mt-0.5">
                  Reviews are moderated by our team before publishing to ensure authenticity.
                </p>
              </div>

              {tokenState.loading && (
                <span className="inline-flex items-center gap-1.5 text-xs text-stone-600 bg-stone-100 px-3 py-1.5 rounded-full">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Verifying order link...
                </span>
              )}

              {!tokenState.loading && tokenState.valid && tokenState.verifiedPurchaseEligible && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Verified Purchase Eligible
                  {tokenState.orderRef ? ` (#${tokenState.orderRef})` : ""}
                </span>
              )}
            </div>

            {/* Token status warning if already reviewed or invalid */}
            {reviewToken && tokenState.checked && !tokenState.valid && (
              <div
                className={`mb-5 p-3.5 rounded-xl border text-xs font-sans flex items-start gap-2.5 ${
                  tokenState.alreadyReviewed
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">
                    {tokenState.alreadyReviewed
                      ? "Purchase Already Reviewed"
                      : "Review Invite Link Notice"}
                  </p>
                  <p className="mt-0.5">
                    {tokenState.reason ||
                      "This review link is no longer valid for verified purchase attribution."}
                  </p>
                </div>
              </div>
            )}

            {submitSuccess ? (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Review Submitted Successfully</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed">{submitSuccess.message}</p>
                {submitSuccess.isVerifiedPurchase && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Marked as Verified Purchase
                  </div>
                )}
              </div>
            ) : tokenState.alreadyReviewed ? null : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {submitError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Honeypot anti-spam field */}
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />

                {/* Star Rating Picker (Mobile 44x44px touch targets) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                    Your Rating <span className="text-red-600">*</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = star <= activeStarPreview;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          aria-label={`Rate ${star} out of 5 stars`}
                          aria-pressed={rating === star}
                          className="w-11 h-11 rounded-xl border border-stone-200 bg-stone-50 hover:bg-amber-50 hover:border-amber-300 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              active
                                ? "fill-amber-400 text-amber-500"
                                : "fill-transparent text-stone-400"
                            }`}
                          />
                        </button>
                      );
                    })}
                    {activeStarPreview > 0 && (
                      <span className="ml-2 text-xs font-semibold text-stone-700">
                        {activeStarPreview}/5 &mdash; {RATING_LABELS[activeStarPreview]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Review Title (Optional) */}
                <div>
                  <label
                    htmlFor="review-title"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
                  >
                    Review Title <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="review-title"
                    type="text"
                    maxLength={120}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Consistent purity and clean finish"
                    className="w-full px-3.5 py-2.5 text-base border border-stone-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange"
                  />
                </div>

                {/* Written Review */}
                <div>
                  <label
                    htmlFor="review-comment"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
                  >
                    Your Review <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="review-comment"
                    rows={4}
                    required
                    minLength={5}
                    maxLength={2000}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share how this product performed in your studio, formulation, or batch..."
                    className="w-full px-3.5 py-2.5 text-base border border-stone-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange"
                  />
                  <div className="flex justify-between text-[11px] text-stone-400 mt-1">
                    <span>Minimum 5 characters</span>
                    <span>{comment.length} / 2000</span>
                  </div>
                </div>

                {/* Optional Name & Private Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="reviewer-name"
                      className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
                    >
                      Display Name <span className="text-stone-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      id="reviewer-name"
                      type="text"
                      maxLength={80}
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="Your name or studio name"
                      className="w-full px-3.5 py-2.5 text-base border border-stone-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange"
                    />
                    <p className="text-[11px] text-stone-400 mt-1">
                      Leave blank to display anonymously.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="reviewer-email"
                      className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
                    >
                      Email <span className="text-stone-400 font-normal">(Optional, Private)</span>
                    </label>
                    <input
                      id="reviewer-email"
                      type="email"
                      maxLength={254}
                      value={reviewerEmail}
                      onChange={(e) => setReviewerEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 text-base border border-stone-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange"
                    />
                    <p className="text-[11px] text-stone-400 mt-1">
                      Never published. Admin moderation reference only.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-[11px] text-stone-500">
                    Verified Purchase badges are automatically verified against Ekora Bazaar orders.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto min-h-[46px] px-6 py-3 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-wider font-bold rounded-xl disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{submitting ? "Submitting..." : "Submit Review"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Individual Reviews List (Crawlable SSR HTML) */}
      {reviews.length === 0 ? (
        <div className="bg-stone-50/70 rounded-2xl border border-brand-linen p-6 md:p-8 text-center">
          <p className="font-serif text-base font-bold text-stone-800">
            No customer reviews published yet
          </p>
          <p className="text-xs sm:text-sm text-stone-500 font-sans mt-1 mb-4">
            We only publish genuine feedback from customers. Have you used {productName}?
          </p>
          {!isFormOpen && (
            <button
              type="button"
              onClick={openAndScrollToForm}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-stone-300 hover:border-stone-900 text-xs font-bold uppercase tracking-wider text-stone-900 transition-colors min-h-[44px] cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4 text-brand-orange" />
              <span>Be the First to Review</span>
            </button>
          )}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-linen p-6 text-center text-sm text-stone-600">
          No {starFilter}-star reviews yet.{" "}
          <button
            type="button"
            onClick={() => setStarFilter(null)}
            className="text-brand-orange font-semibold hover:underline cursor-pointer"
          >
            Show all {reviews.length} reviews
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <article
              key={review.id}
              className="bg-white rounded-2xl border border-brand-linen p-5 md:p-6 shadow-2xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <StarRow rating={review.rating} sizeClass="w-4 h-4" />
                  <span className="text-xs font-bold text-stone-900 font-sans">
                    {review.reviewerName}
                  </span>
                  {review.isVerifiedPurchase && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Verified Purchase
                    </span>
                  )}
                </div>

                <time
                  dateTime={review.createdAt}
                  className="text-xs text-stone-400 font-sans"
                >
                  {new Date(review.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              </div>

              {review.title && (
                <h3 className="font-sans font-bold text-sm md:text-base text-brand-charcoal mb-1.5">
                  {review.title}
                </h3>
              )}

              <p className="text-sm text-stone-700 font-sans leading-relaxed whitespace-pre-line">
                {review.comment}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
