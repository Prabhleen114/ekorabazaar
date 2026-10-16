import { NextRequest, NextResponse } from "next/server";
import catalogProducts from "@/lib/data/products.json";
import prisma from "@/lib/db";
import { ProductStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const ALLOWED_DOC_TYPES: Record<string, string> = {
  coa: "Certificate of Analysis (COA)",
  tds: "Technical Data Sheet (TDS)",
  msds: "Material Safety Data Sheet (MSDS / SDS)",
  ifra: "IFRA 51st Amendment Conformity Certificate",
};

interface RouteParams {
  params: Promise<{
    slug: string;
    type: string;
  }>;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getTrustedDocUrl(rawUrl: unknown, reqUrl: string): URL | null {
  if (typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith("//") || trimmed.includes("\\")) return null;

  // Safe same-origin relative path (e.g. "/documents/...")
  if (trimmed.startsWith("/")) {
    try {
      return new URL(trimmed, reqUrl);
    } catch {
      return null;
    }
  }

  // Absolute URL: must strictly match approved trusted origins
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return null;

    const trustedOrigins = new Set<string>([
      "https://www.ekorabazaar.in",
      "https://ekorabazaar.in",
    ]);

    if (process.env.NEXT_PUBLIC_APP_URL) {
      try {
        trustedOrigins.add(new URL(process.env.NEXT_PUBLIC_APP_URL).origin);
      } catch {}
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        trustedOrigins.add(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin);
      } catch {}
    }

    if (trustedOrigins.has(parsed.origin)) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

function buildHtmlResponse(
  docTitle: string,
  docType: string,
  productName: string,
  productId: string,
  productCategory: string
): NextResponse {
  const safeDocTitle = escapeHtml(docTitle);
  const safeDocType = escapeHtml(docType.toUpperCase());
  const safeProductName = escapeHtml(productName);
  const safeProductId = escapeHtml(productId);
  const safeProductCategory = escapeHtml(productCategory);

  const safeProductHref = /^[a-zA-Z0-9_\-]+$/.test(productId)
    ? `/products/${encodeURIComponent(productId)}`
    : "/shop";

  const waQuery = encodeURIComponent(
    `Hi, I would like to request batch technical documentation for ${productName} (SKU: ${productId})`
  );
  const mailSubject = encodeURIComponent(`Batch Document Request - ${productName}`);
  const mailBody = encodeURIComponent(
    `Product ID: ${productId}\nDocument Type: ${docType.toUpperCase()}\nBusiness Name:\nOrder ID (if placed):`
  );

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeDocTitle} Status - ${safeProductName} | Ekora Bazaar</title>
  <meta name="robots" content="noindex, nofollow">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1f2937; line-height: 1.6; padding: 40px 20px; background: #faf8f5; margin: 0; }
    .container { max-width: 640px; margin: 40px auto; background: #ffffff; border: 1px solid #e7e3dc; border-radius: 16px; padding: 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 8px; }
    .meta-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 18px; margin: 20px 0; font-size: 13px; }
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .meta-row:last-child { margin-bottom: 0; }
    .meta-label { color: #6b7280; font-weight: 500; }
    .meta-val { color: #111827; font-weight: 600; }
    p { font-size: 14px; color: #4b5563; margin: 16px 0; }
    .notice { background: #fdfbf7; border-left: 3px solid #d9531e; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #4b5563; margin: 20px 0; }
    .actions { display: flex; gap: 12px; margin-top: 24px; flex-wrap: wrap; }
    .btn-primary { background: #d9531e; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; display: inline-block; }
    .btn-secondary { background: #f3f4f6; color: #1f2937; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; display: inline-block; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">Document Verification</span>
    <h1>${safeDocTitle}</h1>

    <div class="meta-box">
      <div class="meta-row">
        <span class="meta-label">Product / Material:</span>
        <span class="meta-val">${safeProductName}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">SKU / ID:</span>
        <span class="meta-val">${safeProductId}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Category:</span>
        <span class="meta-val">${safeProductCategory}</span>
      </div>
    </div>

    <div class="notice">
      <strong>Verification Policy:</strong> To ensure complete chemical and regulatory integrity, Ekora Bazaar provides verified, batch-specific documentation (including COA, Technical Data Sheets, and MSDS) directly with wholesale dispatch or upon commercial order verification. We do not generate synthetic or generic test data online.
    </div>

    <p>
      If you require lot-specific testing records, IFRA conformity thresholds, or technical formulation specifications for an active commercial order or bulk evaluation, please submit your inquiry directly to our verification desk:
    </p>

    <div class="actions">
      <a href="https://wa.me/919041500605?text=${waQuery}" class="btn-primary" target="_blank" rel="noopener noreferrer">Request via WhatsApp</a>
      <a href="mailto:ekorabazaar@gmail.com?subject=${mailSubject}&amp;body=${mailBody}" class="btn-secondary">Email Support</a>
      <a href="${safeProductHref}" class="btn-secondary">Back to Product</a>
    </div>

    <div class="footer">
      Ekora Bazaar B2B Sourcing Desk &bull; www.ekorabazaar.in
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { slug, type } = await params;

  // 1. Validate docType against strict allowlist before any document lookup
  const rawType = (type || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(ALLOWED_DOC_TYPES, rawType)) {
    return buildHtmlResponse(
      "Technical Compliance Document",
      "DOC",
      "Document Not Found",
      "N/A",
      "Wholesale Raw Materials"
    );
  }

  const docType = rawType;
  const docTitle = ALLOWED_DOC_TYPES[docType];

  // 2. Validate and sanitize slug
  const rawSlug = (slug || "").replace(/\.pdf$/i, "").trim();
  const isValidSlug = Boolean(
    rawSlug &&
    rawSlug.length <= 120 &&
    !/[<>'"\\;`]/i.test(rawSlug)
  );

  if (!isValidSlug) {
    return buildHtmlResponse(
      docTitle,
      docType,
      "Product Not Found",
      "Invalid Request",
      "Wholesale Raw Materials"
    );
  }

  const cleanSlug = rawSlug;

  // 3. Look up product in DB first, fallback to static catalog
  let product: { id: string; name: string; category?: string; documentUrls?: any } | null = null;

  try {
    const dbProduct = await prisma.product.findUnique({
      where: { id: cleanSlug },
      select: { id: true, title: true, category: true, status: true },
    });
    if (dbProduct && dbProduct.status === ProductStatus.PUBLISHED) {
      product = {
        id: dbProduct.id,
        name: dbProduct.title,
        category: dbProduct.category || "Wholesale Raw Materials",
        documentUrls: (dbProduct as any).documentUrls || null,
      };
    }
  } catch {
    // DB fallback
  }

  if (!product) {
    const staticItem = (catalogProducts as any[]).find(
      (p) =>
        String(p.id) === cleanSlug ||
        p.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") === cleanSlug
    );
    if (staticItem) {
      product = {
        id: String(staticItem.id),
        name: staticItem.name || staticItem.title || "Raw Material",
        category: staticItem.category || "Wholesale Raw Materials",
        documentUrls: staticItem.documentUrls || staticItem.documents || null,
      };
    }
  }

  // 4. If authentic document exists, validate trusted origin before redirecting
  if (
    product &&
    product.documentUrls &&
    typeof product.documentUrls === "object" &&
    Object.prototype.hasOwnProperty.call(product.documentUrls, docType)
  ) {
    const candidateUrl = product.documentUrls[docType];
    const trustedUrl = getTrustedDocUrl(candidateUrl, req.url);

    if (trustedUrl) {
      return NextResponse.redirect(trustedUrl);
    }
    // If candidateUrl is untrusted or unconfigured, fail closed to honest 404
  }

  // 5. If no authentic document exists or product is missing, return honest 404 response
  const productName = product ? product.name : cleanSlug.replace(/-/g, " ");
  const productId = product ? product.id : cleanSlug;
  const productCategory = product?.category || "Craft & Cosmetic Raw Materials";

  return buildHtmlResponse(docTitle, docType, productName, productId, productCategory);
}
