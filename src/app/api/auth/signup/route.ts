import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import bcrypt from 'bcrypt'
import { createSession } from '@/lib/session'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limitResult = rateLimit(`signup:${ip}`, { limit: 5, windowMs: 60000 });
    if (!limitResult.success) {
      return NextResponse.json(
        { error: `Too many accounts created from this IP. Please try again in ${limitResult.reset} seconds.` },
        { 
          status: 429,
          headers: { 'Retry-After': String(limitResult.reset) }
        }
      );
    }

    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, passwordHash, role: 'CUSTOMER' }
    })

    await createSession({ userId: user.id, role: user.role, sellerId: null })
    return NextResponse.json({ success: true, redirectUrl: '/' }, { status: 201 })
  } catch (error: any) {
    console.error('Signup Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
