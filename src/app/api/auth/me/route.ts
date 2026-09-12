import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || !session.userId) {
      return NextResponse.json({ user: null })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        seller: {
          select: {
            id: true,
            brandName: true,
            accountStatus: true
          }
        },
        addresses: {
          where: { isDefault: true },
          select: {
            name: true,
            phone: true
          },
          take: 1
        }
      }
    })

    if (!user) {
      return NextResponse.json({ user: null })
    }

    const displayName = user.addresses?.[0]?.name || user.seller?.brandName || user.email.split('@')[0]

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName,
        createdAt: user.createdAt,
        seller: user.seller || null
      }
    })
  } catch (error: any) {
    console.error('GET /api/auth/me error:', error)
    return NextResponse.json({ user: null })
  }
}
