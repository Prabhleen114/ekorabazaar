import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireCustomer } from '@/lib/auth'

export async function GET() {
  try {
    const session = await requireCustomer()
    const addresses = await prisma.address.findMany({
      where: { userId: session.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    })
    return NextResponse.json({ addresses })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error.message.startsWith('FORBIDDEN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('GET Addresses Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireCustomer()
    const body = await req.json()
    const { name, phone, line1, line2, city, state, pincode, country = 'India', setDefault } = body

    if (!name || !phone || !line1 || !city || !state || !pincode) {
      return NextResponse.json({ error: 'Name, phone, line1, city, state and pincode are required' }, { status: 400 })
    }

    const existingCount = await prisma.address.count({ where: { userId: session.userId } })
    const isDefault = setDefault === true || existingCount === 0

    if (isDefault) {
      await prisma.address.updateMany({ where: { userId: session.userId }, data: { isDefault: false } })
    }

    const address = await prisma.address.create({
      data: { userId: session.userId, name, phone, line1, line2, city, state, pincode, country, isDefault }
    })
    return NextResponse.json({ address }, { status: 201 })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error.message.startsWith('FORBIDDEN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('POST Address Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
