import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireCustomer } from '@/lib/auth';
import { calculateItemPrice } from '@/lib/pricing';
import { ProductStatus, SellerAccountStatus } from '@prisma/client';
import catalogProducts from '@/lib/data/products.json';
import { RouteContext } from '../types';

export async function handleGetCart(_req: NextRequest) {
  try {
    const session = await requireCustomer();
    const cart = await prisma.cart.findUnique({
      where: { userId: session.userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                price: true,
                customerPrice: true,
                mrp: true,
                stock: true,
                status: true,
                isActive: true,
                source: true,
                wholesaleTiers: true,
                seller: { select: { accountStatus: true } },
              },
            },
          },
        },
      },
    });
    if (!cart) return NextResponse.json({ items: [], totalAmount: 0 });

    let totalAmount = 0;
    const items = cart.items.map((item) => {
      const effectivePrice = calculateItemPrice(item.product, item.quantity);
      const isAvailable =
        item.product.status === ProductStatus.PUBLISHED &&
        item.product.isActive !== false &&
        item.product.stock >= item.quantity &&
        effectivePrice > 0 &&
        (!item.product.seller || item.product.seller.accountStatus === SellerAccountStatus.ACTIVE);
      if (isAvailable) totalAmount += effectivePrice * item.quantity;
      return { ...item, effectivePrice, isAvailable };
    });
    return NextResponse.json({ items, totalAmount });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message.startsWith('FORBIDDEN'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error('GET Cart Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handlePostCart(req: NextRequest) {
  try {
    const session = await requireCustomer();
    const body = await req.json();
    const { productId, quantity = 1, update = false } = body;

    if (!productId || typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity)) {
      return NextResponse.json({ error: 'Invalid product or quantity' }, { status: 400 });
    }

    let product = await prisma.product.findUnique({ where: { id: productId } });

    if (
      product &&
      (product.price <= 0 || (product.customerPrice !== null && product.customerPrice <= 0))
    ) {
      return NextResponse.json(
        { error: 'This product is available on quotation only. Please request a quote.' },
        { status: 400 }
      );
    }

    if (!product) {
      const catalogItem = (catalogProducts as any[]).find((p) => String(p.id) === String(productId));
      if (catalogItem) {
        if (catalogItem.isQuoteOnly || catalogItem.price <= 0 || catalogItem.inStock === false) {
          return NextResponse.json(
            { error: 'This product is available on quotation only. Please request a quote.' },
            { status: 400 }
          );
        }

        const officialUser = await prisma.user.upsert({
          where: { email: 'official@ekorabazaar.in' },
          update: {},
          create: { email: 'official@ekorabazaar.in', role: 'SELLER' },
        });
        const officialSeller = await prisma.seller.upsert({
          where: { id: 'EKO-OFFICIAL-01' },
          update: {},
          create: {
            id: 'EKO-OFFICIAL-01',
            userId: officialUser.id,
            brandName: 'Ekora Official Supplier',
            accountStatus: 'ACTIVE',
            applicationStatus: 'APPROVED',
          },
        });

        const rawPricePaise = Math.round(
          (typeof catalogItem.price === 'number'
            ? catalogItem.price
            : parseFloat(catalogItem.price || '0')) * 100
        );
        product = await prisma.product.upsert({
          where: { id: String(catalogItem.id) },
          update: {},
          create: {
            id: String(catalogItem.id),
            title: catalogItem.name || 'Untitled Product',
            price: rawPricePaise,
            customerPrice: rawPricePaise,
            stock: 500,
            status: ProductStatus.PUBLISHED,
            sellerId: officialSeller.id,
            source: 'EKORA_OFFICIAL',
            category: catalogItem.category || 'General Silicone Moulds',
            imageUrl: catalogItem.image || '/og-image.jpg',
            wholesaleTiers: (catalogItem.tiers || [])
              .filter((t: any) => t && Number(t.price) > 0)
              .map((t: any) => ({
                ...t,
                price: Math.round((Number(t.price) || 0) * 100),
              })),
          },
        });
      }
    }

    if (!product || product.status !== ProductStatus.PUBLISHED || product.isActive === false) {
      return NextResponse.json({ error: 'Product not available' }, { status: 400 });
    }
    if (product.price <= 0 || (product.customerPrice !== null && product.customerPrice <= 0)) {
      return NextResponse.json(
        { error: 'This product is available on quotation only. Please request a quote.' },
        { status: 400 }
      );
    }
    if (product.stock < quantity) {
      return NextResponse.json({ error: `Only ${product.stock} units available` }, { status: 400 });
    }

    const cart = await prisma.cart.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId },
      update: {},
    });

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: update ? { quantity } : { quantity: { increment: quantity } },
      create: { cartId: cart.id, productId, quantity },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message.startsWith('FORBIDDEN'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error('POST Cart Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handleDeleteCart(req: NextRequest) {
  try {
    const session = await requireCustomer();
    const url = new URL(req.url);
    const queryProductId = url.searchParams.get('productId');
    const queryItemId = url.searchParams.get('itemId');
    const queryClearAll = url.searchParams.get('clearAll') === 'true';

    const body = await req.json().catch(() => ({}));
    const itemId = body.itemId || queryItemId;
    const productId = body.productId || queryProductId;
    const clearAll = body.clearAll === true || queryClearAll;

    const cart = await prisma.cart.findUnique({ where: { userId: session.userId } });
    if (!cart) return NextResponse.json({ success: true });

    if (itemId) {
      await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
    } else if (productId) {
      await prisma.cartItem.deleteMany({ where: { productId, cartId: cart.id } });
    } else if (clearAll) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    } else {
      return NextResponse.json({ error: 'Missing itemId or productId to delete' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message.startsWith('FORBIDDEN'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error('DELETE Cart Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handleGuestCart(req: NextRequest) {
  try {
    const body = await req.json();
    const { items = [] } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json({ items: [], totalAmount: 0 });
    }

    const productIds = items.map((i: any) => String(i.productId)).filter(Boolean);
    if (productIds.length === 0) {
      return NextResponse.json({ items: [], totalAmount: 0 });
    }

    let products: any[] = [];
    try {
      products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          title: true,
          imageUrl: true,
          price: true,
          customerPrice: true,
          mrp: true,
          stock: true,
          status: true,
          isActive: true,
          source: true,
          wholesaleTiers: true,
          seller: { select: { accountStatus: true } },
        },
      });
    } catch (dbErr) {
      console.warn('Prisma findMany fallback in guest cart:', dbErr);
    }

    let totalAmount = 0;
    const populatedItems = items
      .map((reqItem: any) => {
        let product = products.find((p) => String(p.id) === String(reqItem.productId));

        if (!product) {
          const catalogItem = (catalogProducts as any[]).find(
            (p) => String(p.id) === String(reqItem.productId)
          );
          if (
            catalogItem &&
            !catalogItem.isQuoteOnly &&
            catalogItem.price > 0 &&
            catalogItem.inStock !== false
          ) {
            const rawPricePaise = Math.round(
              (typeof catalogItem.price === 'number'
                ? catalogItem.price
                : parseFloat(catalogItem.price || '0')) * 100
            );
            product = {
              id: String(catalogItem.id),
              title: catalogItem.name || 'Untitled Product',
              price: rawPricePaise,
              customerPrice: rawPricePaise,
              stock: 500,
              status: ProductStatus.PUBLISHED,
              source: 'EKORA_OFFICIAL',
              imageUrl: catalogItem.image || '/placeholder-product.svg',
              wholesaleTiers: (catalogItem.tiers || [])
                .filter((t: any) => t && Number(t.price) > 0)
                .map((t: any) => ({
                  ...t,
                  price: Math.round(Number(t.price) * 100),
                })),
              seller: { accountStatus: SellerAccountStatus.ACTIVE },
            };
          }
        }

        if (!product) return null;

        const quantity = Math.max(1, parseInt(String(reqItem.quantity), 10) || 1);
        const effectivePrice = calculateItemPrice(product, quantity);
        const isQuoteOnly =
          product.price <= 0 ||
          (product.customerPrice !== null && product.customerPrice <= 0) ||
          effectivePrice <= 0;

        const isAvailable =
          product.status === ProductStatus.PUBLISHED &&
          product.isActive !== false &&
          product.stock >= quantity &&
          !isQuoteOnly &&
          effectivePrice > 0 &&
          (!product.seller || product.seller.accountStatus === SellerAccountStatus.ACTIVE);

        if (isAvailable) totalAmount += effectivePrice * quantity;

        return {
          id: `guest-${product.id}`,
          productId: product.id,
          quantity,
          effectivePrice,
          isAvailable,
          product,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ items: populatedItems, totalAmount });
  } catch (error: any) {
    console.error('POST Guest Cart Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handleSyncCart(req: NextRequest) {
  try {
    const session = await requireCustomer();
    const body = await req.json();
    const { items = [] } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: true });
    }

    const productIds = items.map((i: any) => i.productId).filter(Boolean);

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        status: ProductStatus.PUBLISHED,
      },
      include: {
        seller: { select: { accountStatus: true } },
      },
    });

    const validProducts = new Map(products.map((p) => [p.id, p]));

    const cart = await prisma.cart.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId },
      update: {},
    });

    for (const reqItem of items) {
      let product = validProducts.get(reqItem.productId);

      if (!product) {
        const catalogItem = (catalogProducts as any[]).find(
          (p) => String(p.id) === String(reqItem.productId)
        );
        if (catalogItem) {
          if (catalogItem.isQuoteOnly || catalogItem.price <= 0 || catalogItem.inStock === false) {
            continue;
          }

          const officialUser = await prisma.user.upsert({
            where: { email: 'official@ekorabazaar.in' },
            update: {},
            create: { email: 'official@ekorabazaar.in', role: 'SELLER' },
          });
          const officialSeller = await prisma.seller.upsert({
            where: { id: 'EKO-OFFICIAL-01' },
            update: {},
            create: {
              id: 'EKO-OFFICIAL-01',
              userId: officialUser.id,
              brandName: 'Ekora Official Supplier',
              accountStatus: 'ACTIVE',
              applicationStatus: 'APPROVED',
            },
          });

          const rawPricePaise = Math.round(
            (typeof catalogItem.price === 'number'
              ? catalogItem.price
              : parseFloat(catalogItem.price || '0')) * 100
          );
          product = await prisma.product.upsert({
            where: { id: String(catalogItem.id) },
            update: {},
            create: {
              id: String(catalogItem.id),
              title: catalogItem.name || 'Untitled Product',
              price: rawPricePaise,
              customerPrice: rawPricePaise,
              stock: 500,
              status: ProductStatus.PUBLISHED,
              sellerId: officialSeller.id,
              source: 'EKORA_OFFICIAL',
              category: catalogItem.category || 'General Silicone Moulds',
              imageUrl: catalogItem.image || '/og-image.jpg',
              wholesaleTiers: (catalogItem.tiers || [])
                .filter((t: any) => t && Number(t.price) > 0)
                .map((t: any) => ({
                  ...t,
                  price: Math.round((Number(t.price) || 0) * 100),
                })),
            },
            include: {
              seller: { select: { accountStatus: true } },
            },
          });

          validProducts.set(product.id, product);
        }
      }

      if (!product) continue;
      if (product.seller && (product.seller as any).accountStatus !== SellerAccountStatus.ACTIVE)
        continue;
      if (product.price <= 0 || (product.customerPrice !== null && product.customerPrice <= 0))
        continue;

      const requestedQty = Math.max(1, parseInt(String(reqItem.quantity), 10) || 1);

      const existingItem = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId: product.id } },
      });

      const newQty = existingItem ? existingItem.quantity + requestedQty : requestedQty;
      const finalQty = Math.min(newQty, product.stock);

      if (finalQty > 0) {
        await prisma.cartItem.upsert({
          where: { cartId_productId: { cartId: cart.id, productId: product.id } },
          update: { quantity: finalQty },
          create: { cartId: cart.id, productId: product.id, quantity: finalQty },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message.startsWith('FORBIDDEN'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error('POST Sync Cart Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handlePatchCartItem(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireCustomer();
    const { itemId } = await params;
    const body = await req.json();
    const { quantity } = body;

    if (typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity)) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    if (quantity > 1000) {
      return NextResponse.json({ error: 'Maximum allowed quantity is 1,000 units' }, { status: 400 });
    }

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true, product: true },
    });
    if (!item || item.cart.userId !== session.userId) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (item.product && item.product.stock < quantity) {
      return NextResponse.json(
        { error: `Only ${item.product.stock} units available in stock` },
        { status: 400 }
      );
    }

    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message.startsWith('FORBIDDEN'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error('PATCH CartItem Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handleDeleteCartItem(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireCustomer();
    const { itemId } = await params;

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });
    if (!item || item.cart.userId !== session.userId) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    await prisma.cartItem.delete({ where: { id: itemId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message.startsWith('FORBIDDEN'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error('DELETE CartItem Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
