import { Metadata } from 'next';
import { normalizeProductBasePriceToINR } from '@/lib/pricing';

export const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ekorabazaar.in';
const SITE_NAME = 'Ekora Bazaar';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`;

/**
 * Generate standard metadata for static and common pages
 */
export function generateStandardMetadata(
  title: string,
  description: string,
  path: string = '',
  imageUrl: string = DEFAULT_OG_IMAGE,
  type: 'website' | 'article' = 'website'
): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}${path}`,
    },
    openGraph: {
      type,
      url: `${BASE_URL}${path}`,
      title,
      description,
      siteName: SITE_NAME,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

import { getCanonicalProductId } from '@/lib/product-redirects';

/**
 * Generate dynamic Product Metadata targeting B2B & Wholesale commercial intent
 */
export function generateProductMetadata(product: any): Metadata {
  const canonicalId = getCanonicalProductId(String(product.id));
  const rawTitle = String(product.title || product.name || 'Wholesale Supply').trim();
  const title = rawTitle.length > 72 ? `${rawTitle.slice(0, 69).trimEnd()}...` : rawTitle;
  const basePrice = normalizeProductBasePriceToINR(product);
  const category = product.category ? String(product.category).trim() : '';

  const cleanDesc = String(product.description || '')
    .replace(/\s+/g, ' ')
    .trim();
  const priceSnippet = basePrice > 0 ? `From ₹${basePrice % 1 === 0 ? basePrice : basePrice.toFixed(2)}. ` : '';
  const catSnippet = category ? `${category} — ` : '';

  const isWrongMoldCopy = /fragrance|essential|hydrosol/i.test(`${rawTitle} ${category}`) && /silicone mold/i.test(cleanDesc);
  let description: string;
  if (cleanDesc && cleanDesc.length >= 40 && !isWrongMoldCopy) {
    const budget = Math.max(90, 158 - priceSnippet.length - catSnippet.length);
    const body = cleanDesc.length > budget ? `${cleanDesc.slice(0, budget - 3).trimEnd()}...` : cleanDesc;
    description = `${catSnippet}${priceSnippet}${body}`;
  } else {
    description = `${catSnippet}Buy ${rawTitle} online in India. ${priceSnippet}Trial sizes & wholesale bulk supply with GST invoicing on Ekora Bazaar.`;
  }

  const rawImg = product.imageUrl || product.image || DEFAULT_OG_IMAGE;
  const imageUrl = rawImg.startsWith('http') ? rawImg : `${BASE_URL}${rawImg.startsWith('/') ? rawImg : `/${rawImg}`}`;
  const path = `/products/${canonicalId}`;

  return generateStandardMetadata(title, description, path, imageUrl);
}

/**
 * Generate dynamic Category Metadata
 */
export function generateCategoryMetadata(
  categoryName: string,
  categorySlug: string,
  customTitle?: string,
  customDescription?: string
): Metadata {
  const title = customTitle || `${categoryName} Wholesale | Bulk Supplier India`;
  const description =
    customDescription ||
    `Source wholesale ${categoryName} for small businesses and creators. Reliable supply, volume tier pricing, and fast delivery on ${SITE_NAME}.`;

  const path = `/wholesale/${categorySlug}`;
  return generateStandardMetadata(title, description, path);
}

/**
 * Generate dynamic Guide Metadata
 */
export function generateGuideMetadata(guideTitle: string, guideSlug: string): Metadata {
  const title = `${guideTitle} Buying Guide`;
  const description = `Read our comprehensive buying guide on ${guideTitle}. Learn how to source the best materials for your business on ${SITE_NAME}.`;

  const path = `/guides/${guideSlug}`;
  return generateStandardMetadata(title, description, path, DEFAULT_OG_IMAGE, 'article');
}

/**
 * Generate Product Structured Data (Schema.org) with B2B wholesale tier pricing
 */
export function generateProductSchema(product: any, sellerName?: string) {
    const defaultDesc = product.description || `Buy ${product.title || product.name} wholesale online at Ekora Bazaar. Perfect for professional creators and brands.`;
    // For official products, use "Ekora Bazaar" instead of "Ekora Official Development"
    let computedSeller = sellerName || (product.seller && product.seller.businessName) || "Ekora Bazaar";
    if (computedSeller === "Ekora Official Development" || computedSeller === "Ekora Official Supplier") {
      computedSeller = "Ekora Bazaar";
    }
    const finalSeller = computedSeller;
  const basePrice = normalizeProductBasePriceToINR(product);
  const isAvailable = (product.stock > 0 || product.inStock !== false) && basePrice > 0;

  const returnPolicy = {
    "@type": "MerchantReturnPolicy",
    "applicableCountry": "IN",
    "returnPolicyCategory": "https://schema.org/MerchantReturnNotPermitted",
    "merchantReturnDays": 0,
    "description": "Returns/exchanges are not available for standard wholesale and raw-material orders once dispatched to maintain batch purity. Transit damage claims must be reported within 48 hours with continuous unboxing video."
  };

  const shippingDetails = {
    "@type": "OfferShippingDetails",
    "shippingRate": {
      "@type": "MonetaryAmount",
      "value": 90,
      "currency": "INR"
    },
    "shippingDestination": {
      "@type": "DefinedRegion",
      "addressCountry": "IN"
    },
    "deliveryTime": {
      "@type": "ShippingDeliveryTime",
      "handlingTime": {
        "@type": "QuantitativeValue",
        "minValue": 1,
        "maxValue": 2,
        "unitCode": "DAY"
      },
      "transitTime": {
        "@type": "QuantitativeValue",
        "minValue": 2,
        "maxValue": 5,
        "unitCode": "DAY"
      }
    }
  };

  // We output ONE single offer at the 1-unit price.
  // This is because Google Merchant Center and standard SERP snippets expect the primary offer to match the 1-unit baseline price.
  // While AggregateOffer supports lowPrice/highPrice, it is semantically intended for multiple distinct sellers offering the same product, rather than tiered volume pricing from a single seller.

  const canonicalId = getCanonicalProductId(String(product.id));
  const offers: any = {
    "@type": "Offer",
    "@id": `${BASE_URL}/products/${canonicalId}#offer`,
    "url": `${BASE_URL}/products/${canonicalId}`,
    "priceCurrency": "INR",
    "priceValidUntil": "2027-12-31",
    "itemCondition": "https://schema.org/NewCondition",
    "availability": isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    "hasMerchantReturnPolicy": returnPolicy,
    "shippingDetails": shippingDetails,
    "seller": {
        "@type": "Organization",
        "name": finalSeller
    }
  };

  if (basePrice > 0) {
    offers.price = basePrice;
  }

  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${BASE_URL}/products/${canonicalId}#product`,
    "name": product.title || product.name,
    "image": [
      (product.imageUrl || product.image || "").startsWith("http")
        ? (product.imageUrl || product.image)
        : `${BASE_URL}${product.imageUrl || product.image || "/og-image.jpg"}`
    ],
    "description": product.description || `Buy ${product.title || product.name} in India on Ekora Bazaar. Available in trial and wholesale pack quantities with pan-India delivery and GST invoicing.`,
    "sku": canonicalId,
    ...(product.category ? { "category": product.category } : {}),
    "brand": {
        "@type": "Brand",
        "name": "Ekora Bazaar",
        "url": BASE_URL
      },
    "offers": offers
  };

  return schema;
}

/**
 * Generate ProductGroup Structured Data when a product has multiple pack-size variants.
 */
export interface ProductGroupVariantInput {
  size?: string;
  price?: number | string;
  image?: string | null;
}

export function generateProductGroupSchema(
  product: { id: string | number; title?: string; name?: string; imageUrl?: string | null; image?: string | null; description?: string | null; stock?: number; inStock?: boolean; seller?: { businessName?: string } | null },
  variants: ProductGroupVariantInput[],
  sellerName?: string
) {
  if (!Array.isArray(variants) || variants.length <= 1) return null;
  const canonicalId = getCanonicalProductId(String(product.id));
  const baseName = product.title || product.name;
  const rawImg = product.imageUrl || product.image || "/og-image.jpg";
  const absImage = rawImg.startsWith("http") ? rawImg : `${BASE_URL}${rawImg}`;
  const isAvailable = (product.stock ?? 0) > 0 || product.inStock !== false;
  let computedSeller = sellerName || (product.seller && product.seller.businessName) || "Ekora Bazaar";
  if (computedSeller === "Ekora Official Development" || computedSeller === "Ekora Official Supplier") {
    computedSeller = "Ekora Bazaar";
  }

  const hasVariant = variants
    .map((v) => {
      const rawPrice = Number(v?.price || 0);
      const size = String(v?.size || "").trim();
      if (!size || rawPrice <= 0) return null;
      const variantSlug = size.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      return {
        "@type": "Product",
        "name": `${baseName} (${size})`,
        "sku": `${canonicalId}-${variantSlug}`,
        "size": size,
        "image": v.image ? (String(v.image).startsWith("http") ? v.image : `${BASE_URL}${v.image}`) : absImage,
        "offers": {
          "@type": "Offer",
          "url": `${BASE_URL}/products/${canonicalId}`,
          "priceCurrency": "INR",
          "price": rawPrice,
          "priceValidUntil": "2027-12-31",
          "itemCondition": "https://schema.org/NewCondition",
          "availability": isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "seller": { "@type": "Organization", "name": computedSeller }
        }
      };
    })
    .filter(Boolean);

  if (hasVariant.length <= 1) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    "@id": `${BASE_URL}/products/${canonicalId}#productgroup`,
    "name": baseName,
    "description": product.description || `${baseName} available in multiple pack sizes on Ekora Bazaar.`,
    "url": `${BASE_URL}/products/${canonicalId}`,
    "productGroupID": canonicalId,
    "variesBy": ["https://schema.org/size"],
    "brand": { "@type": "Brand", "name": "Ekora Bazaar", "url": BASE_URL },
    "hasVariant": hasVariant,
  };
}

/**
 * Generate FAQPage Structured Data (Schema.org) for Pre-Purchase Q&As
 */
export function generateFaqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

/**
 * Generate ItemList (Category/Collection) Structured Data
 */
export function generateItemListSchema(items: any[], listName: string, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": listName,
    "url": url,
    "numberOfItems": items.length,
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `${BASE_URL}/products/${item.id}`
    }))
  };
}

/**
 * Generate BreadcrumbList Structured Data
 */
export function generateBreadcrumbSchema(crumbs: { name: string, url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url.startsWith('http') ? crumb.url : `${BASE_URL}${crumb.url}`
    }))
  };
}
export function generateOrganizationSchema() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      "name": SITE_NAME,
      "legalName": "Ekora Technologies",
      "url": BASE_URL,
      "logo": {
        "@type": "ImageObject",
        "@id": `${BASE_URL}/#logo`,
        "url": `${BASE_URL}/images/rectangle%20logo%20ekora%20bazaar.jpeg`,
        "caption": SITE_NAME,
      },
      "image": `${BASE_URL}/og-image.jpg`,
      "description": "India's premier creator commerce platform and wholesale raw materials sourcing hub for independent artisans and makers.",
      "foundingDate": "2026",
      "founders": [
        { "@type": "Person", "name": "Prabhleen Kaur" },
        { "@type": "Person", "name": "Kumar Aryan" },
      ],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Near Shyam Mandir Marg, Sutapatti",
        "addressLocality": "Muzaffarpur",
        "addressRegion": "Bihar",
        "postalCode": "842001",
        "addressCountry": "IN",
      },
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": "+91-9041500605",
          "contactType": "customer service",
          "email": "ekorabazaar@gmail.com",
          "areaServed": "IN",
          "availableLanguage": ["en", "hi"],
        },
      ],
      "sameAs": [
        "https://www.instagram.com/ekorabazaar",
        "https://www.facebook.com/ekorabazaar",
        "https://www.linkedin.com/company/ekorabazaar",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      "name": SITE_NAME,
      "url": BASE_URL,
      "description": "B2B raw materials, creator storefronts, and craft supplies wholesale marketplace in India.",
      "publisher": {
        "@id": `${BASE_URL}/#organization`,
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${BASE_URL}/shop?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];
}
