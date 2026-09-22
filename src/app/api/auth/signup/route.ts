import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import bcrypt from 'bcrypt'
import { createSession } from '@/lib/session'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { validateBody, SignupSchema } from '@/lib/validation'

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

    const rawBody = await req.json()
    const validation = validateBody(SignupSchema, rawBody)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { email, password, name, phone } = validation.data
    const businessName = typeof rawBody.businessName === 'string' ? rawBody.businessName.trim().slice(0, 150) : null

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 })
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    // Clean and validate phone if provided
    let cleanedPhone: string | null = null
    if (phone && typeof phone === 'string') {
      const rawDigits = phone.replace(/\D/g, '')
      if (rawDigits.length === 10) {
        cleanedPhone = `+91${rawDigits}`
      } else if (rawDigits.length === 12 && rawDigits.startsWith('91')) {
        cleanedPhone = `+${rawDigits}`
      } else if (rawDigits.length >= 7) {
        cleanedPhone = phone.trim()
      }
    }

    // Check existing email
    const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existingEmail) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    // Check existing phone if supplied
    if (cleanedPhone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone: cleanedPhone } })
      if (existingPhone) {
        return NextResponse.json({ error: 'An account with this phone number already exists.' }, { status: 409 })
      }
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name ? String(name).trim() : null,
        phone: cleanedPhone,
        businessName: businessName ? String(businessName).trim() : null,
        role: 'CUSTOMER',
      }
    })

    await createSession({ userId: user.id, role: user.role, sellerId: null })
    return NextResponse.json({ success: true, redirectUrl: '/' }, { status: 201 })
  } catch (error: any) {
    console.error('Signup Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
