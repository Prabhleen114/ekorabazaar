import Razorpay from 'razorpay'
import crypto from 'crypto'

export const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null; // Fallback for when credentials are not yet available

/**
 * Verifies a Razorpay signature using the server-side secret.
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay configuration is missing on the server.");
  }

  const payload = `${orderId}|${paymentId}`
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest('hex')

  return expectedSignature === signature
}

/**
 * Verifies a Razorpay webhook signature.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    throw new Error("Razorpay Webhook Secret is not configured.");
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')

  return expectedSignature === signature
}
