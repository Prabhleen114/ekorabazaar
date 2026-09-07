import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireCustomer } from '@/lib/auth'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireCustomer()
    const { id } = await params
    const body = await req.json()

    const existing = await prisma.address.findUnique({ where: { id } })
    if (!existing || existing.userId !== session.userId) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    if (body.isDefault === true) {
      await prisma.address.updateMany({ where: { userId: session.userId }, data: { isDefault: false } })
    }

    const { name, phone, line1, line2, city, state, pincode, country, isDefault } = body
    const address = await prisma.address.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(line1 !== undefined && { line1 }),
        ...(line2 !== undefined && { line2 }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(pincode !== undefined && { pincode }),
        ...(country !== undefined && { country }),
        ...(isDefault !== undefined && { isDefault })
      }
    })
    return NextResponse.json({ address })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error.message.startsWith('FORBIDDEN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('PATCH Address Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireCustomer()
    const { id } = await params

    const existing = await prisma.address.findUnique({ where: { id } })
    if (!existing || existing.userId !== session.userId) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    await prisma.address.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error.message.startsWith('FORBIDDEN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('DELETE Address Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
