import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireCustomer } from '@/lib/auth';
import { RouteContext } from '../types';

export async function handleGetAccountOrders(_req: NextRequest) {
  try {
    const session = await requireCustomer();
    const orders = await prisma.order.findMany({
      where: {
        customerId: session.userId,
        status: { not: 'PAYMENT_PENDING' },
      },
      include: {
        items: true,
        payments: { select: { status: true, type: true, amount: true } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ orders });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message.startsWith('FORBIDDEN'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error('GET Orders Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handleGetAddresses(_req: NextRequest) {
  try {
    const session = await requireCustomer();
    const addresses = await prisma.address.findMany({
      where: { userId: session.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json({ addresses });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message.startsWith('FORBIDDEN'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error('GET Addresses Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handlePostAddress(req: NextRequest) {
  try {
    const session = await requireCustomer();
    const body = await req.json();
    const { name, phone, line1, line2, city, state, pincode, country = 'India', setDefault } = body;

    if (!name || !phone || !line1 || !city || !state || !pincode) {
      return NextResponse.json(
        { error: 'Name, phone, line1, city, state and pincode are required' },
        { status: 400 }
      );
    }

    const existingCount = await prisma.address.count({ where: { userId: session.userId } });
    const isDefault = setDefault === true || existingCount === 0;

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: session.userId,
        name,
        phone,
        line1,
        line2,
        city,
        state,
        pincode,
        country,
        isDefault,
      },
    });
    return NextResponse.json({ address }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message.startsWith('FORBIDDEN'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error('POST Address Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handlePatchAddress(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireCustomer();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.userId) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    if (body.isDefault === true) {
      await prisma.address.updateMany({
        where: { userId: session.userId },
        data: { isDefault: false },
      });
    }

    const { name, phone, line1, line2, city, state, pincode, country, isDefault } = body;
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
        ...(isDefault !== undefined && { isDefault }),
      },
    });
    return NextResponse.json({ address });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message.startsWith('FORBIDDEN'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error('PATCH Address Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handleDeleteAddress(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireCustomer();
    const { id } = await params;

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.userId) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    await prisma.address.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message.startsWith('FORBIDDEN'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error('DELETE Address Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
