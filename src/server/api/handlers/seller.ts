import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { requireAuth, requireSeller, requireSellerOwnership } from '@/lib/auth';
import { getSession } from '@/lib/session';
import { razorpay, verifyRazorpaySignature } from '@/lib/razorpay';
import {
  PaymentType,
  PaymentStatus,
  SellerApplicationStatus,
  SellerAccountStatus,
  ProductStatus,
} from '@prisma/client';
import { supabaseServer, isSupabaseConfigured } from '@/lib/supabase';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { roundPrice, roundTiersWithDiscountPriority } from '@/lib/pricing-rounding';
import { normalizeProductBasePriceToINR } from '@/lib/pricing';
import { RouteContext, handleAuthError } from '../types';

const SELLER_ONBOARDING_FEE = parseInt(process.env.SELLER_ONBOARDING_FEE || '49900', 10);

export async function handleSellerPaymentCreateOrder(_req: NextRequest) {
  try {
    const session = await requireAuth();

    const seller = await prisma.seller.findUnique({
      where: { userId: session.userId! },
    });

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller application not found. Complete application first.' },
        { status: 400 }
      );
    }

    if (
      seller.applicationStatus !== SellerApplicationStatus.DRAFT &&
      seller.applicationStatus !== SellerApplicationStatus.REJECTED
    ) {
      return NextResponse.json({ error: 'Invalid application status for payment.' }, { status: 400 });
    }

    if (!razorpay) {
      throw new Error('Payment gateway is not configured.');
    }

    const options = {
      amount: SELLER_ONBOARDING_FEE,
      currency: 'INR',
      receipt: `seller_reg_${seller.id.substring(0, 10)}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    const rzpOrderId = order.id;

    const payment = await prisma.payment.create({
      data: {
        userId: session.userId!,
        sellerId: seller.id,
        amount: SELLER_ONBOARDING_FEE,
        currency: 'INR',
        type: PaymentType.SELLER_ONBOARDING,
        status: PaymentStatus.PENDING,
        razorpayOrderId: rzpOrderId,
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      razorpayOrderId: rzpOrderId,
      amount: SELLER_ONBOARDING_FEE,
    });
  } catch (error: any) {
    console.error('Create Seller Payment Order Error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handleSellerPaymentConfirmPayment(req: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await req.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Missing Razorpay payment parameters.' }, { status: 400 });
    }

    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature.' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { razorpayOrderId },
      });

      if (!payment) {
        throw new Error('Payment record not found.');
      }

      if (payment.userId !== session.userId) {
        throw new Error('Unauthorized payment manipulation.');
      }

      if (payment.status === PaymentStatus.CAPTURED) {
        return { alreadyVerified: true, payment };
      }

      const updatedPaymentResult = await tx.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.CAPTURED,
          razorpayPaymentId,
        },
      });

      if (updatedPaymentResult.count === 0) {
        return { alreadyVerified: true, payment };
      }

      if (payment.sellerId) {
        await tx.seller.update({
          where: { id: payment.sellerId },
          data: {
            applicationStatus: SellerApplicationStatus.UNDER_REVIEW,
          },
        });
      }

      return { alreadyVerified: false, payment };
    });

    return NextResponse.json({ success: true, message: 'Payment verified successfully.', result });
  } catch (error: any) {
    console.error('Verify Seller Payment Error:', error);
    if (
      error.message === 'UNAUTHORIZED' ||
      error.message === 'Unauthorized payment manipulation.'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function handlePostSellerProduct(req: NextRequest) {
  try {
    const session = await requireSeller();
    const body = await req.json().catch(() => ({}));
    const { title, description, category, price, stock, moq, imageUrl, wholesaleTiers } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (price === undefined || isNaN(parseInt(price, 10)) || parseInt(price, 10) <= 0) {
      return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
    }

    const seller = await prisma.seller.findUnique({ where: { id: session.sellerId! } });
    if (!seller || seller.accountStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Your account must be active to create products.' },
        { status: 403 }
      );
    }

    // Parse incoming price and enforce integer Rupees in the database.
    // Handles both integer Rupees (e.g. 358) and legacy paise payloads (e.g. 35800).
    const rawPriceNum = typeof price === 'number' ? price : parseFloat(String(price));
    let priceRupees: number;
    if (body.isPaise || (rawPriceNum >= 1000 && Array.isArray(wholesaleTiers) && Number(wholesaleTiers[0]?.price) >= 1000)) {
      priceRupees = rawPriceNum / 100;
    } else if (rawPriceNum >= 10000) {
      priceRupees = rawPriceNum / 100;
    } else {
      priceRupees = rawPriceNum;
    }

    const roundedPriceRupees = Math.round(roundPrice(priceRupees));
    const finalPriceRupees = Math.max(1, roundedPriceRupees);

    let finalTiers = wholesaleTiers || null;
    if (Array.isArray(wholesaleTiers) && wholesaleTiers.length > 0) {
      const tiersInRupees = wholesaleTiers.map((t: any) => {
        const tPrice = typeof t.price === 'number' ? t.price : parseFloat(String(t.price || 0));
        const normalizedTierRupees = tPrice >= 1000 && rawPriceNum >= 1000 ? tPrice / 100 : tPrice;
        return {
          ...t,
          price: normalizedTierRupees,
        };
      });
      const roundedTiersResult = roundTiersWithDiscountPriority(
        finalPriceRupees,
        priceRupees,
        tiersInRupees
      );
      finalTiers = roundedTiersResult.tiers.map((t: any) => ({
        ...t,
        price: typeof t.price === 'number' ? Math.round(t.price) : t.price,
      }));
    }

    const product = await prisma.product.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        category: category?.trim() || null,
        price: finalPriceRupees,
        stock: stock !== undefined ? parseInt(stock, 10) : 0,
        moq: moq !== undefined ? parseInt(moq, 10) : 1,
        imageUrl: imageUrl || null,
        wholesaleTiers: finalTiers,
        sellerId: session.sellerId!,
        source: 'SELLER',
        status: ProductStatus.DRAFT,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Create Seller Product Error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handlePatchSellerProductById(req: NextRequest, { params }: RouteContext) {
  try {
    const { productId } = await params;
    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { title, description, category, price, stock, moq, imageUrl, wholesaleTiers } = body;

    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await requireSellerOwnership(product.sellerId!);

    const seller = await prisma.seller.findUnique({ where: { id: product.sellerId! } });
    if (!seller || seller.accountStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Your account must be active to edit products.' },
        { status: 403 }
      );
    }

    if (stock !== undefined && (isNaN(parseInt(stock, 10)) || parseInt(stock, 10) < 0)) {
      return NextResponse.json(
        { error: 'Stock must be a valid non-negative number.' },
        { status: 400 }
      );
    }
    if (moq !== undefined && (isNaN(parseInt(moq, 10)) || parseInt(moq, 10) <= 0)) {
      return NextResponse.json({ error: 'MOQ must be a valid positive number.' }, { status: 400 });
    }
    if (price !== undefined && (isNaN(parseInt(price, 10)) || parseInt(price, 10) <= 0)) {
      return NextResponse.json(
        { error: 'Price must be a valid positive number.' },
        { status: 400 }
      );
    }
    if (wholesaleTiers !== undefined && Array.isArray(wholesaleTiers)) {
      for (const tier of wholesaleTiers) {
        if (!tier.minQty || tier.minQty < 1 || typeof tier.price !== 'number' || tier.price <= 0) {
          return NextResponse.json(
            { error: 'Each wholesale tier must have a valid minQty and positive price.' },
            { status: 400 }
          );
        }
        if (product.status === ProductStatus.PUBLISHED && tier.minQty < 2) {
          return NextResponse.json(
            {
              error:
                'Wholesale tiers for published products must require a minimum quantity of 2 or more.',
            },
            { status: 400 }
          );
        }
      }
    }

    const updateData: any = {
      ...(title && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(category !== undefined && { category: category?.trim() || null }),
      ...(stock !== undefined && { stock: parseInt(stock, 10) }),
      ...(moq !== undefined && { moq: parseInt(moq, 10) }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      ...(wholesaleTiers !== undefined && { wholesaleTiers: wholesaleTiers || null }),
    };

    if (product.status === ProductStatus.REJECTED) {
      updateData.status = ProductStatus.DRAFT;
      updateData.rejectionReason = null;
    }

    let roundedNewPriceRupees = undefined;
    if (price !== undefined) {
      const rawPriceNum = typeof price === 'number' ? price : parseFloat(String(price));
      let priceRupees: number;
      if (body.isPaise || (rawPriceNum >= 1000 && Array.isArray(wholesaleTiers) && Number(wholesaleTiers[0]?.price) >= 1000)) {
        priceRupees = rawPriceNum / 100;
      } else if (rawPriceNum >= 10000) {
        priceRupees = rawPriceNum / 100;
      } else {
        priceRupees = rawPriceNum;
      }
      roundedNewPriceRupees = Math.max(1, Math.round(roundPrice(priceRupees)));
    }

    if (wholesaleTiers !== undefined && Array.isArray(wholesaleTiers)) {
      const currentPriceRupees = roundedNewPriceRupees ?? normalizeProductBasePriceToINR(product);
      const tiersInRupees = wholesaleTiers.map((t: any) => {
        const tPrice = typeof t.price === 'number' ? t.price : parseFloat(String(t.price || 0));
        const normalizedTierRupees = tPrice >= 1000 && (price !== undefined ? parseFloat(String(price)) >= 1000 : product.price >= 1000)
          ? tPrice / 100
          : tPrice;
        return {
          ...t,
          price: normalizedTierRupees,
        };
      });
      const roundedTiersResult = roundTiersWithDiscountPriority(
        currentPriceRupees,
        currentPriceRupees,
        tiersInRupees
      );
      updateData.wholesaleTiers = roundedTiersResult.tiers.map((t: any) => ({
        ...t,
        price: typeof t.price === 'number' ? Math.round(t.price) : t.price,
      }));
    }

    if (roundedNewPriceRupees !== undefined && roundedNewPriceRupees !== product.price) {
      const newPrice = roundedNewPriceRupees;

      if (product.status === ProductStatus.DRAFT || product.status === ProductStatus.REJECTED) {
        updateData.price = newPrice;
      } else {
        await prisma.priceChangeRequest.updateMany({
          where: { productId: product.id, status: 'PENDING' },
          data: { status: 'REJECTED', adminComment: 'Superseded by new request' },
        });

        await prisma.priceChangeRequest.create({
          data: {
            productId: product.id,
            sellerId: product.sellerId!,
            oldPrice: product.price,
            requestedPrice: newPrice,
          },
        });
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error: any) {
    console.error('Edit Seller Product Error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handlePostSellerProductSubmit(_req: NextRequest, { params }: RouteContext) {
  try {
    const { productId } = await params;
    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await requireSellerOwnership(product.sellerId!);

    const seller = await prisma.seller.findUnique({ where: { id: product.sellerId! } });
    if (!seller || seller.accountStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Your account must be active to submit products.' },
        { status: 403 }
      );
    }

    if (product.status !== ProductStatus.DRAFT) {
      return NextResponse.json(
        { error: 'Only DRAFT products can be submitted for approval.' },
        { status: 400 }
      );
    }

    if (!product.title || product.price <= 0) {
      return NextResponse.json(
        { error: 'Product is incomplete and cannot be submitted.' },
        { status: 400 }
      );
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        status: ProductStatus.PENDING_APPROVAL,
      },
    });

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error: any) {
    console.error('Submit Seller Product Error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handlePostSellerUploadImage(req: NextRequest) {
  try {
    const session = await requireSeller();

    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { error: 'Image upload is not configured yet. Please contact the administrator.' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be less than 5MB' }, { status: 400 });
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPG, JPEG, PNG, and WEBP files are allowed.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const magicBytes = buffer.slice(0, 12);
    const isJpeg = magicBytes[0] === 0xff && magicBytes[1] === 0xd8 && magicBytes[2] === 0xff;
    const isPng =
      magicBytes[0] === 0x89 &&
      magicBytes[1] === 0x50 &&
      magicBytes[2] === 0x4e &&
      magicBytes[3] === 0x47;
    const isWebp =
      magicBytes[0] === 0x52 &&
      magicBytes[1] === 0x49 &&
      magicBytes[2] === 0x46 &&
      magicBytes[3] === 0x46 &&
      magicBytes[8] === 0x57 &&
      magicBytes[9] === 0x45 &&
      magicBytes[10] === 0x42 &&
      magicBytes[11] === 0x50;
    if (!isJpeg && !isPng && !isWebp) {
      return NextResponse.json(
        { error: 'File content does not match a valid image format.' },
        { status: 400 }
      );
    }

    const safeFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const timestamp = Date.now();
    const random = crypto.randomUUID().slice(0, 8);
    const filePath = `${session.sellerId}/${timestamp}-${random}-${safeFilename}`;

    const { error: uploadError } = await supabaseServer.storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabaseServer.storage.from('product-images').getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error: any) {
    console.error('Upload product image error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handlePostSellerApplication(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json();
    const { brandName, legalName, address, gstNumber, panNumber, email, password } = body;

    let currentUserId = session?.userId;

    if (!currentUserId) {
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Authentication required or missing account creation fields.' },
          { status: 400 }
        );
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please log in.' },
          { status: 409 }
        );
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: 'SELLER',
        },
      });

      currentUserId = newUser.id;
    }

    const seller = await prisma.seller.upsert({
      where: { userId: currentUserId },
      update: {
        brandName,
        applicationStatus: SellerApplicationStatus.DRAFT,
      },
      create: {
        id: `EKO-SELL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        userId: currentUserId,
        brandName,
        applicationStatus: SellerApplicationStatus.DRAFT,
        accountStatus: SellerAccountStatus.DISABLED,
      },
    });

    await prisma.sellerBusiness.upsert({
      where: { sellerId: seller.id },
      update: {
        legalName,
        address,
        gstin: gstNumber || panNumber || '',
      },
      create: {
        sellerId: seller.id,
        legalName,
        businessType: 'INDIVIDUAL',
        address,
        gstin: gstNumber || panNumber || '',
      },
    });

    return NextResponse.json({
      success: true,
      sellerId: seller.id,
      status: seller.applicationStatus,
    });
  } catch (error: any) {
    console.error('Seller Application API Error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handleGetSellerApplication(_req: NextRequest) {
  try {
    const session = await requireAuth();

    const seller = await prisma.seller.findUnique({
      where: { userId: session.userId! },
      include: { businessDetails: true },
    });

    if (!seller) {
      return NextResponse.json({ error: 'Seller application not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, application: seller });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// 9. GET /api/seller/overview
// ---------------------------------------------------------------------------
export async function handleGetSellerOverview(_req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session.sellerId) {
      return NextResponse.json({ error: 'Forbidden: Seller account required' }, { status: 403 });
    }

    const seller = await prisma.seller.findUnique({
      where: { id: session.sellerId },
      include: {
        businessDetails: true,
        _count: { select: { products: true, payments: true } }
      }
    });

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    const publishedProductsCount = await prisma.product.count({
      where: {
        sellerId: session.sellerId,
        status: 'PUBLISHED'
      }
    });

    return NextResponse.json({
      seller,
      publishedProductsCount,
    });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// 10. GET /api/seller/orders
// ---------------------------------------------------------------------------
export async function handleGetSellerOrders(_req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session.sellerId) {
      return NextResponse.json({ error: 'Forbidden: Seller account required' }, { status: 403 });
    }

    const seller = await prisma.seller.findUnique({
      where: { id: session.sellerId }
    });

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    if (seller.accountStatus !== 'ACTIVE') {
      return NextResponse.json({
        locked: true,
        accountStatus: seller.accountStatus,
        orders: []
      });
    }

    const orderItems = await prisma.orderItem.findMany({
      where: { sellerId: session.sellerId },
      include: { order: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ locked: false, orders: orderItems });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// 11. GET /api/seller/products
// ---------------------------------------------------------------------------
export async function handleGetSellerProducts(_req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session.sellerId) {
      return NextResponse.json({ error: 'Forbidden: Seller account required' }, { status: 403 });
    }

    const seller = await prisma.seller.findUnique({
      where: { id: session.sellerId },
      include: { products: { orderBy: { createdAt: 'desc' } } }
    });

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    if (seller.accountStatus !== 'ACTIVE') {
      return NextResponse.json({
        locked: true,
        accountStatus: seller.accountStatus,
        products: []
      });
    }

    return NextResponse.json({ locked: false, products: seller.products });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// 12. GET /api/seller/products/:productId
// ---------------------------------------------------------------------------
export async function handleGetSellerProductById(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireAuth();
    if (!session.sellerId) {
      return NextResponse.json({ error: 'Forbidden: Seller account required' }, { status: 403 });
    }
    const { productId } = await params;

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.sellerId !== session.sellerId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this resource' }, { status: 403 });
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// 13. DELETE /api/seller/products/:productId
// ---------------------------------------------------------------------------
export async function handleDeleteSellerProductById(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireAuth();
    if (!session.sellerId) {
      return NextResponse.json({ error: 'Forbidden: Seller account required' }, { status: 403 });
    }
    const { productId } = await params;

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.sellerId !== session.sellerId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this resource' }, { status: 403 });
    }

    await prisma.product.delete({ where: { id: productId } });

    try {
      revalidatePath(`/products/${productId}`);
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// 14. GET /api/seller/profile
// ---------------------------------------------------------------------------
export async function handleGetSellerProfile(_req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session.sellerId) {
      return NextResponse.json({ error: 'Forbidden: Seller account required' }, { status: 403 });
    }

    const seller = await prisma.seller.findUnique({
      where: { id: session.sellerId },
      include: { businessDetails: true, user: true }
    });

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    return NextResponse.json({ seller });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

