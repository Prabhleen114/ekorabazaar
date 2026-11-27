import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import catalogProducts from "@/lib/data/products.json";
import { isDeprecatedProductId, getCanonicalProductId } from "@/lib/product-redirects";
import { normalizeProductBasePriceToINR } from "@/lib/pricing";
import fs from "fs";
import path from "path";

export const revalidate = 3600;

const BASE_URL = "https://ekorabazaar.in";

function escapeXml(unsafe: string): string {
  return String(unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripControlChars(str: string): string {
  return String(str || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

function resolveFeedImageUrl(rawImg: string | null | undefined): string {
  const fallback = `${BASE_URL}/images/base-bottle.webp`;
  const img = (rawImg || "").trim();
  if (!img) return `${BASE_URL}/og-image.jpg`;
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  if (img.startsWith("/")) {
    const clean = decodeURIComponent(img.split("?")[0]).replace(/^\/+/, "");
    if (!clean.startsWith("images/")) {
      return `${BASE_URL}${img}`;
    }
    const relImg = clean.slice("images/".length);
    const imagesRoot = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "images");
    const dp = path.join(/*turbopackIgnore: true*/ imagesRoot, relImg);
    const webp = dp.replace(/\.png$/i, ".webp");
    if (fs.existsSync(dp) || fs.existsSync(webp)) {
      return `${BASE_URL}${img}`;
    }
    return fallback;
  }
  return `${BASE_URL}/og-image.jpg`;
}

export async function GET() {
  const seenIds = new Set<string>();
  const feedItems: Array<{
    id: string;
    title: string;
    description: string;
    link: string;
    imageLink: string;
    availability: "in_stock" | "out_of_stock";
    priceInr: number;
    brand: string;
    productType: string;
  }> = [];

  try {
    const dbProducts = await prisma.product.findMany({
      where: {
        status: ProductStatus.PUBLISHED,
        isActive: true,
        price: { gt: 0 },
        OR: [{ sellerId: null }, { seller: { accountStatus: "ACTIVE" } }],
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        price: true,
        customerPrice: true,
        source: true,
        stock: true,
        imageUrl: true,
        seller: { select: { brandName: true } },
      },
      orderBy: [{ stock: "desc" }, { updatedAt: "desc" }],
    });

    for (const p of dbProducts) {
      if (isDeprecatedProductId(p.id)) continue;
      const canonicalId = getCanonicalProductId(p.id);
      if (seenIds.has(canonicalId)) continue;

      const priceInr = normalizeProductBasePriceToINR(p);
      if (priceInr <= 0) continue;

      seenIds.add(canonicalId);
      const rawBrand = p.seller?.brandName;
      const brand =
        rawBrand && rawBrand !== "Ekora Official Development" && rawBrand !== "Ekora Official Supplier"
          ? rawBrand
          : "Ekora Bazaar";
      const desc = stripControlChars(p.description || "") ||
        `${p.title} available on Ekora Bazaar (${p.category || "Wholesale Craft Supplies"}) with pan-India shipping.`;

      feedItems.push({
        id: canonicalId,
        title: stripControlChars(p.title),
        description: desc.slice(0, 4900),
        link: `${BASE_URL}/products/${canonicalId}`,
        imageLink: resolveFeedImageUrl(p.imageUrl),
        availability: p.stock > 0 ? "in_stock" : "out_of_stock",
        priceInr,
        brand,
        productType: p.category || "Wholesale Craft Supplies",
      });
    }
  } catch (err) {
    console.warn("Product feed DB fallback:", err);
  }

  // Append catalogProducts JSON items that were not in DB
  type FeedCatalogItem = {
    id: string | number;
    name?: string;
    title?: string;
    description?: string;
    category?: string;
    price?: number | string;
    isQuoteOnly?: boolean;
    inStock?: boolean;
    image?: string;
    imageUrl?: string;
  };
  for (const item of catalogProducts as FeedCatalogItem[]) {
    const pid = String(item.id);
    if (isDeprecatedProductId(pid)) continue;
    const canonicalId = getCanonicalProductId(pid);
    if (seenIds.has(canonicalId)) continue;

    const rawPrice = typeof item.price === "number" ? item.price : parseFloat(item.price || "0");
    if (isNaN(rawPrice) || rawPrice <= 0 || item.isQuoteOnly === true) continue;

    seenIds.add(canonicalId);
    const title = stripControlChars(item.name || item.title || "");
    if (!title) continue;

    const desc = stripControlChars(item.description || "") ||
      `${title} available on Ekora Bazaar (${item.category || "Wholesale Craft Supplies"}) with pan-India delivery.`;

    feedItems.push({
      id: canonicalId,
      title,
      description: desc.slice(0, 4900),
      link: `${BASE_URL}/products/${canonicalId}`,
      imageLink: resolveFeedImageUrl(item.image || item.imageUrl),
      availability: item.inStock === false ? "out_of_stock" : "in_stock",
      priceInr: rawPrice,
      brand: "Ekora Bazaar",
      productType: item.category || "Wholesale Craft Supplies",
    });
  }

  const itemsXml = feedItems
    .map(
      (it) => `    <item>
      <g:id>${escapeXml(it.id)}</g:id>
      <title>${escapeXml(it.title)}</title>
      <description>${escapeXml(it.description)}</description>
      <link>${escapeXml(it.link)}</link>
      <g:image_link>${escapeXml(it.imageLink)}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${it.availability}</g:availability>
      <g:price>${it.priceInr.toFixed(2)} INR</g:price>
      <g:brand>${escapeXml(it.brand)}</g:brand>
      <g:product_type>${escapeXml(it.productType)}</g:product_type>
      <g:shipping>
        <g:country>IN</g:country>
        <g:service>Standard Pan-India Delivery</g:service>
        <g:price>90.00 INR</g:price>
      </g:shipping>
    </item>`
    )
    .join("\n");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Ekora Bazaar Product Catalog</title>
    <link>${BASE_URL}</link>
    <description>Public B2B wholesale raw materials, fragrance oils, essential oils, candle waxes, soap bases, and silicone moulds catalog on Ekora Bazaar India.</description>
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
