'use client'

import { useState } from 'react'
import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react'

export interface OrderItemReviewShareProps {
  orderId: string
  orderItemId: string
  productId: string
  productName: string
  existingReview?: {
    id: string
    status: string
    rating: number
  } | null
  existingToken?: {
    id: string
    token: string
    usedAt?: string | null
  } | null
}

interface GeneratedShareData {
  orderId: string
  orderItemId: string
  productId: string
  productName: string
  reviewUrl: string
  whatsappMessage: string
  whatsappUrl: string
  alreadyReviewed: boolean
  existingReviewStatus: string | null
}

export default function OrderItemReviewShare({
  orderId,
  orderItemId,
  productName,
  existingReview,
}: OrderItemReviewShareProps) {
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [shareData, setShareData] = useState<GeneratedShareData | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState(false)

  const handleGenerateOrOpen = async () => {
    if (isOpen && shareData) {
      setIsOpen(false)
      return
    }

    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/review-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderItemId }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate review link')
      }
      setShareData(data)
      setIsOpen(true)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not generate review link')
      setIsOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!shareData?.reviewUrl) return
    try {
      await navigator.clipboard.writeText(shareData.reviewUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {}
  }

  const handleCopyMessage = async () => {
    if (!shareData?.whatsappMessage) return
    try {
      await navigator.clipboard.writeText(shareData.whatsappMessage)
      setCopiedMessage(true)
      setTimeout(() => setCopiedMessage(false), 2000)
    } catch {}
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleGenerateOrOpen}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Share2 className="w-3.5 h-3.5" />
          )}
          <span>{isOpen && shareData ? 'Hide Review Link' : 'Share Review Link'}</span>
        </button>

        {existingReview && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
              existingReview.status === 'APPROVED'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : existingReview.status === 'REJECTED'
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-yellow-50 text-yellow-800 border-yellow-200'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            Reviewed ({existingReview.rating}★ &bull; {existingReview.status})
          </span>
        )}
      </div>

      {isOpen && (
        <div className="mt-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-3 text-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900">
                Review Link for {shareData?.productName || productName}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Opens the product page, auto-scrolls to the review form, and verifies purchase eligibility.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
              aria-label="Close share panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {errorMsg ? (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          ) : shareData ? (
            <>
              {shareData.alreadyReviewed && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                  Customer has already submitted a review for this ordered item
                  {shareData.existingReviewStatus ? ` (${shareData.existingReviewStatus})` : ''}.
                </div>
              )}

              {/* Direct Review URL + Copy Link */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Direct Review URL
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareData.reviewUrl}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white font-mono text-[11px] text-gray-800"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white font-semibold shrink-0 cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* WhatsApp Message Preview + Share Actions */}
              <div className="space-y-2 pt-1 border-t border-gray-200">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  WhatsApp Share Message
                </label>
                <p className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-700 leading-relaxed select-all">
                  {shareData.whatsappMessage}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={shareData.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Share on WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold cursor-pointer"
                  >
                    {copiedMessage ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Message Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Message</span>
                      </>
                    )}
                  </button>

                  <a
                    href={shareData.reviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Preview Link</span>
                  </a>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}
