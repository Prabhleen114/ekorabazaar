import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { validateBody, AdminProductUpdateSchema } from '@/lib/validation';
import { ALL_CATEGORIES, normalizeCategoryName } from '@/lib/categories';
import catalogProducts from '@/lib/data/products.json';
import {
  normalizeProductBasePriceToINR,
  normalizeProductMrpToINR,
  convertINRToProductStorageUnit,
  syncWholesaleTiersWithSellingPrice,
} from '@/lib/pricing';
import { invalidateCatalogCache } from '@/lib/catalog';
import { logAudit } from '@/lib/audit';
import { supabaseServer, isSupabaseConfigured } from '@/lib/supabase';
import { ProductStatus, Prisma } from '@prisma/client';
import { RouteContext, handleAuthError } from '../types';

function slugifyCategory(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildAdminProductDto(p: Record<string, unknown>, inDb: boolean) {
  const sellingPriceINR = normalizeProductBasePriceToINR(p);
  const mrpINR = normalizeProductMrpToINR(p);
  const rawImages = Array.isArray(p.images) ? (p.images as unknown[]).filter((x): x is string => typeof x === 'string' && Boolean(x)) : [];
  const primaryImg = (p.imageUrl as string) || (p.image as string) || rawImages[0] || '/og-image.jpg';
  const galleryImages = Array.from(
    new Set([primaryImg, ...rawImages].filter((x) => typeof x === 'string' && x.trim().length > 0))
  );

  const sellerObj = p.seller as { brandName?: string } | null | undefined;
  const sourceStr = typeof p.source === 'string' ? p.source : (inDb ? 'ADMIN' : 'EKORA_OFFICIAL');

  return {
    id: String(p.id),
    title: (p.title as string) || (p.name as string) || 'Untitled Product',
    description: (p.description as string) || '',
    category: normalizeCategoryName(p.category as string) || (p.category as string) || 'General Silicone Moulds',
    source: sourceStr,
    status: inDb ? (p.status as string) : ProductStatus.PUBLISHED,
    isActive: inDb ? p.isActive !== false : true,
    isLiveOnStorefront: inDb
      ? p.status === ProductStatus.PUBLISHED && p.isActive !== false && Number(p.stock) > 0
      : p.inStock !== false && !p.isQuoteOnly,
    stock: typeof p.stock === 'number' ? p.stock : p.inStock === false ? 0 : 500,
    moq: (p.moq as number) || 1,
    sellingPriceINR,
    mrpINR,
    imageUrl: primaryImg,
    images: galleryImages,
    sellerId: (p.sellerId as string) || null,
    sellerName:
      sellerObj?.brandName ||
      (sourceStr === 'CATALOG' || sourceStr === 'EKORA_OFFICIAL' || !inDb
        ? 'Ekora Official'
        : sourceStr || 'Admin'),
    inDb,
    updatedAt: p.updatedAt ? new Date(p.updatedAt as string | Date).toISOString() : null,
  };
}

// ---------------------------------------------------------------------------
// GET /api/admin/product-management/categories
// ---------------------------------------------------------------------------
export async function handleGetAdminProductCategories() {
  try {
    await requireAdmin();

    const [dbCategories, dbProductGroups, dbIdsRows] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
      prisma.product.groupBy({
        by: ['category'],
        _count: { _all: true },
      }),
      prisma.product.findMany({
        select: { id: true },
      }),
    ]);

    const dbIdSet = new Set(dbIdsRows.map((r) => String(r.id)));
    const countsByName = new Map<string, number>();

    for (const grp of dbProductGroups) {
      const catName = normalizeCategoryName(grp.category) || grp.category || 'Uncategorized';
      countsByName.set(catName, (countsByName.get(catName) || 0) + grp._count._all);
    }

    for (const item of catalogProducts as Array<Record<string, unknown>>) {
      if (dbIdSet.has(String(item.id))) continue;
      const itemCat = typeof item.category === 'string' ? item.category : '';
      const catName = normalizeCategoryName(itemCat) || itemCat || 'General Silicone Moulds';
      countsByName.set(catName, (countsByName.get(catName) || 0) + 1);
    }

    const categorySet = new Set<string>();
    for (const c of dbCategories) categorySet.add(c.name);
    for (const c of ALL_CATEGORIES) categorySet.add(c.id);
    for (const key of countsByName.keys()) categorySet.add(key);

    const categories = Array.from(categorySet)
      .map((name) => ({
        name,
        slug: slugifyCategory(name),
        count: countsByName.get(name) || 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const totalProducts = Array.from(countsByName.values()).reduce((sum, n) => sum + n, 0);

    return NextResponse.json({ categories, totalProducts });
  } catch (error: unknown) {
    console.error('Admin product categories fetch error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/product-management/products
// ---------------------------------------------------------------------------
export async function handleGetAdminManageProducts(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category')?.trim() || '';
    const q = searchParams.get('q')?.trim().toLowerCase() || '';
    const statusFilter = searchParams.get('status')?.trim().toUpperCase() || 'ALL';
    const sourceFilter = searchParams.get('source')?.trim().toUpperCase() || 'ALL';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '24', 10)));

    const where: Prisma.ProductWhereInput = {};
    if (category && category !== 'ALL') {
      where.category = { equals: category, mode: 'insensitive' };
    }
    if (sourceFilter !== 'ALL') {
      where.source = sourceFilter;
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { id: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (statusFilter === 'ACTIVE') {
      where.status = ProductStatus.PUBLISHED;
      where.isActive = true;
    } else if (statusFilter === 'INACTIVE') {
      where.AND = [
        {
          OR: [{ isActive: false }, { status: ProductStatus.DRAFT }],
        },
      ];
    } else if (statusFilter === 'PENDING_APPROVAL') {
      where.status = ProductStatus.PENDING_APPROVAL;
    } else if (statusFilter === 'REJECTED') {
      where.status = ProductStatus.REJECTED;
    } else if (statusFilter === 'OUT_OF_STOCK') {
      where.stock = { lte: 0 };
    }

    const dbRows = await prisma.product.findMany({
      where,
      include: {
        seller: { select: { id: true, brandName: true } },
      },
      orderBy: [{ adminManaged: 'desc' }, { updatedAt: 'desc' }],
      take: 2500,
    });

    const dbDtos = dbRows.map((p) => buildAdminProductDto(p as unknown as Record<string, unknown>, true));

    // Include catalog JSON items not yet persisted in DB when applicable
    const jsonDtos: ReturnType<typeof buildAdminProductDto>[] = [];
    const shouldIncludeJson =
      (statusFilter === 'ALL' || statusFilter === 'ACTIVE') &&
      (sourceFilter === 'ALL' || sourceFilter === 'EKORA_OFFICIAL');

    if (shouldIncludeJson) {
      const existingDbIds = new Set(
        (await prisma.product.findMany({ select: { id: true } })).map((r) => String(r.id))
      );

      for (const item of catalogProducts as Array<Record<string, unknown>>) {
        const idStr = String(item.id);
        if (existingDbIds.has(idStr)) continue;

        const rawCat = typeof item.category === 'string' ? item.category : '';
        const normCat = normalizeCategoryName(rawCat) || rawCat || 'General Silicone Moulds';
        if (
          category &&
          category !== 'ALL' &&
          normCat.toLowerCase() !== category.toLowerCase() &&
          rawCat.toLowerCase() !== category.toLowerCase()
        ) {
          continue;
        }

        const title = (item.name as string) || (item.title as string) || '';
        if (q) {
          const hay = `${idStr} ${title} ${(item.description as string) || ''}`.toLowerCase();
          if (!hay.includes(q)) continue;
        }

        jsonDtos.push(buildAdminProductDto(item, false));
      }
    }

    const combined = [...dbDtos, ...jsonDtos];
    const total = combined.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const products = combined.slice(offset, offset + limit);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: unknown) {
    console.error('Admin manage products fetch error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/product-management/products/:id
// ---------------------------------------------------------------------------
export async function handleGetAdminManageProductById(_req: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;

    const dbProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, brandName: true } },
        categoryRef: true,
      },
    });

    if (dbProduct) {
      return NextResponse.json({ product: buildAdminProductDto(dbProduct as unknown as Record<string, unknown>, true) });
    }

    const jsonItem = (catalogProducts as Array<Record<string, unknown>>).find((p) => String(p.id) === String(id));
    if (jsonItem) {
      return NextResponse.json({ product: buildAdminProductDto(jsonItem, false) });
    }

    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  } catch (error: unknown) {
    console.error('Admin manage product detail error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Failed to load product' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/product-management/products/:id
// ---------------------------------------------------------------------------
export async function handlePatchAdminManageProduct(req: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const rawBody = await req.json().catch(() => ({}));
    const validation = validateBody(AdminProductUpdateSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const data = validation.data;

    let product = await prisma.product.findUnique({
      where: { id },
      include: { seller: { select: { id: true, brandName: true } } },
    });

    // If product currently only exists in static catalog JSON, materialize it into DB safely
    if (!product) {
      const catalogItem = (catalogProducts as Array<Record<string, unknown>>).find((p) => String(p.id) === String(id));
      if (!catalogItem) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
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
          : parseFloat(String(catalogItem.price || '0'))) * 100
      );
      const itemCat = typeof catalogItem.category === 'string' ? catalogItem.category : '';
      const itemImages = Array.isArray(catalogItem.images) ? (catalogItem.images as string[]) : [];
      const itemTiers = Array.isArray(catalogItem.tiers) ? (catalogItem.tiers as Array<Record<string, unknown>>) : [];

      product = await prisma.product.create({
        data: {
          id: String(catalogItem.id),
          title: (catalogItem.name as string) || 'Untitled Product',
          description: (catalogItem.description as string) || null,
          price: rawPricePaise,
          customerPrice: rawPricePaise,
          stock: catalogItem.inStock === false ? 0 : 500,
          status: ProductStatus.PUBLISHED,
          isActive: true,
          sellerId: officialSeller.id,
          source: 'EKORA_OFFICIAL',
          category: normalizeCategoryName(itemCat) || itemCat || 'General Silicone Moulds',
          imageUrl: (catalogItem.image as string) || '/og-image.jpg',
          images: itemImages.length > 0 ? itemImages : catalogItem.image ? [String(catalogItem.image)] : [],
          wholesaleTiers: itemTiers.map((t) => ({
            ...t,
            price: Math.round((Number(t.price) || 0) * 100),
          })),
        },
        include: { seller: { select: { id: true, brandName: true } } },
      });
    }

    const oldSellingPriceINR = normalizeProductBasePriceToINR(product);
    const storedSellingPrice = convertINRToProductStorageUnit(data.sellingPrice, product.source);
    const storedMrp =
      data.mrp !== undefined && data.mrp !== null
        ? convertINRToProductStorageUnit(data.mrp, product.source)
        : null;

    const updatedTiers = syncWholesaleTiersWithSellingPrice(
      product.wholesaleTiers,
      oldSellingPriceINR,
      data.sellingPrice,
      product.source
    );

    const normalizedCategory = normalizeCategoryName(data.category) || data.category.trim();
    const matchedCat = await prisma.category.findFirst({
      where: { name: { equals: normalizedCategory, mode: 'insensitive' } },
      select: { id: true, name: true },
    });

    let nextImages = product.images || [];
    let nextImageUrl = product.imageUrl;

    if (data.images !== undefined) {
      nextImages = Array.from(new Set(data.images.map((u) => u.trim()).filter(Boolean)));
      nextImageUrl = nextImages[0] || data.imageUrl || null;
    } else if (data.imageUrl !== undefined) {
      nextImageUrl = data.imageUrl ? data.imageUrl.trim() : null;
      nextImages = nextImageUrl
        ? Array.from(new Set([nextImageUrl, ...(product.images || []).filter((u) => u !== product.imageUrl)]))
        : [];
    }

    const nextIsActive =
      data.isActive !== undefined
        ? data.isActive
        : data.status !== undefined
        ? data.status === ProductStatus.PUBLISHED
        : product.isActive;

    const nextStatus =
      data.status !== undefined
        ? (data.status as ProductStatus)
        : nextIsActive
        ? ProductStatus.PUBLISHED
        : ProductStatus.DRAFT;

    const nextStock = data.stock !== undefined ? data.stock : product.stock;

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        title: data.title,
        description: data.description !== undefined ? (data.description?.trim() || null) : product.description,
        category: matchedCat?.name || normalizedCategory,
        categoryId: matchedCat?.id || product.categoryId,
        price: storedSellingPrice,
        customerPrice: storedSellingPrice,
        mrp: storedMrp,
        wholesaleTiers: updatedTiers,
        stock: nextStock,
        isActive: nextIsActive,
        status: nextStatus,
        supplierAvailable: nextIsActive && nextStock > 0,
        imageUrl: nextImageUrl,
        images: nextImages,
        adminManaged: true,
        lockedFields: Array.from(
          new Set([...(product.lockedFields || []), 'title', 'price', 'customerPrice', 'mrp', 'category', 'imageUrl'])
        ),
      },
      include: { seller: { select: { id: true, brandName: true } } },
    });

    await logAudit(admin.userId!, 'ADMIN_UPDATE_PRODUCT', product.id, {
      oldTitle: product.title,
      newTitle: updated.title,
      oldSellingPriceINR,
      newSellingPriceINR: data.sellingPrice,
      newMrpINR: data.mrp ?? null,
      category: updated.category,
      isActive: updated.isActive,
      status: updated.status,
    });

    invalidateCatalogCache();
    try {
      revalidatePath('/shop');
      revalidatePath(`/products/${product.id}`);
      if (updated.category) {
        revalidatePath(`/wholesale/${slugifyCategory(updated.category)}`);
      }
    } catch {}

    return NextResponse.json({
      success: true,
      product: buildAdminProductDto(updated as unknown as Record<string, unknown>, true),
    });
  } catch (error: unknown) {
    console.error('Admin update product error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/upload-image
// ---------------------------------------------------------------------------
export async function handlePostAdminUploadImage(req: NextRequest) {
  try {
    await requireAdmin();

    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { error: 'Image storage (Supabase) is not configured on this server.' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
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

    const safeFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '') || 'product.jpg';
    const timestamp = Date.now();
    const random = crypto.randomUUID().slice(0, 8);
    const filePath = `admin/${timestamp}-${random}-${safeFilename}`;

    const { error: uploadError } = await supabaseServer.storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image to storage' }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabaseServer.storage.from('product-images').getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error: unknown) {
    console.error('Admin upload product image error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
