import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { Role } from '@prisma/client'

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    return new TextEncoder().encode(
      process.env.NODE_ENV === 'production'
        ? 'ekorabazaar_production_build_placeholder_key_change_me'
        : 'ekorabazaar_dev_secret_key_change_in_production'
    )
  }
  return new TextEncoder().encode(secret)
}

export interface SessionPayload {
  userId: string
  role: Role
  sellerId: string | null
  // Do NOT include passwords or payment secrets here.
}

export async function encrypt(payload: SessionPayload) {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.error('CRITICAL SECURITY ALERT: JWT_SECRET environment variable is not set in production!')
  }
  const key = getSecretKey()
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // 24 hour expiration
    .sign(key)
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const key = getSecretKey()
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(payload: SessionPayload) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const session = await encrypt(payload)

  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.set('session', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return null
  return await decrypt(session)
}
