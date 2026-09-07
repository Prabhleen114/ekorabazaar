import { Role } from '@prisma/client'
import { getSession, SessionPayload } from './session'

/**
 * Ensures the user is authenticated and returns the session.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session || !session.userId) {
    throw new Error("UNAUTHORIZED")
  }
  return session
}

/**
 * Ensures the user is a CUSTOMER (not a seller or admin).
 * Used for cart, address, and customer checkout routes.
 */
export async function requireCustomer(): Promise<SessionPayload> {
  const session = await requireAuth()
  if (session.role !== Role.CUSTOMER) {
    throw new Error("FORBIDDEN: Customer access required.")
  }
  return session
}

/**
 * Ensures the user is an ADMIN.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireAuth()
  if (session.role !== Role.ADMIN) {
    throw new Error("FORBIDDEN: Admin access required.")
  }
  return session
}

/**
 * Ensures the user is a SELLER.
 */
export async function requireSeller(): Promise<SessionPayload> {
  const session = await requireAuth()
  if (session.role !== Role.SELLER) {
    throw new Error("FORBIDDEN: Seller access required.")
  }
  return session
}

/**
 * Ensures the seller is acting on their own resources.
 */
export async function requireSellerOwnership(targetSellerId: string): Promise<SessionPayload> {
  const session = await requireSeller()
  if (session.sellerId !== targetSellerId) {
    throw new Error("FORBIDDEN: You do not own this resource.")
  }
  return session
}
