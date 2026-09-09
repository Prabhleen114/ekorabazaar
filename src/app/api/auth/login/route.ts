import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import bcrypt from 'bcrypt'
import { createSession } from '@/lib/session'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limitResult = rateLimit(`login:${ip}`, { limit: 10, windowMs: 60000 });
    if (!limitResult.success) {
      return NextResponse.json(
        { error: `Too many login attempts. Please try again in ${limitResult.reset} seconds.` },
        { 
          status: 429,
          headers: { 'Retry-After': String(limitResult.reset) }
        }
      );
    }

    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { seller: true }
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify bcrypt hash
    const isValid = await bcrypt.compare(password, user.passwordHash)
    
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create session
    await createSession({
      userId: user.id,
      role: user.role,
      sellerId: user.seller?.id || null,
    })

    // Return routing destination based on role
    let redirectUrl = '/'
    if (user.role === 'ADMIN') redirectUrl = '/admin'
    else if (user.role === 'SELLER') redirectUrl = '/seller/dashboard'

    return NextResponse.json({ success: true, redirectUrl })
  } catch (error) {
    console.error("Login Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
