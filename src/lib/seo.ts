import { Metadata } from 'next';
import { Product } from '@prisma/client'; // Assuming Prisma schema has Product

const BASE_URL = 'https://www.ekorabazaar.in';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`;
const SITE_NAME = 'Ekora Bazaar';

/**
 * Generate standard metadata for a page
 */
export function generateStandardMetadata(
  title: string, 
  description: string, 
  path: string, 
  imageUrl = DEFAULT_OG_IMAGE,
  type: 'website' | 'article' = 'website'
): Metadata {
  const url = `${BASE_URL}${path}`;
  
  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'en_IN',
      type,
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

/**
 * Generate dynamic Product Metadata targeting B2B & Wholesale commercial intent
 */
export function generateProductMetadata(product: any): Metadata {
  const categoryStr = product.category ? `Bulk ${product.category} Supplier` : 'Wholesale Raw Materials';
  const title = `${product.title} Wholesale India | ${categoryStr} | ${SITE_NAME}`;
  
  const description = `Buy ${product.title} in bulk at wholesale tier pricing in India. Lab-tested & COA certified batch reports, tiered volume discounts, GST invoices, low MOQ & fast 24hr dispatch for small businesses and creators.`;
  
  const imageUrl = product.imageUrl || DEFAULT_OG_IMAGE;
  const path = `/products/${product.id}`;

  return generateStandardMetadata(title, description, path, imageUrl);
}

/**
 * Generate dynamic Category Metadata
 */
export function generateCategoryMetadata(categoryName: string, categorySlug: string): Metadata {
  const title = `${categoryName} Wholesale India | Bulk Supplier | ${SITE_NAME}`;
  const description = `Discover lab-tested wholesale ${categoryName} for small businesses and creators. Low MOQ, batch-tested COA certified materials, and volume tier pricing on ${SITE_NAME}.`;
  
  const path = `/wholesale/${categorySlug}`;
  return generateStandardMetadata(title, description, path);
}

/**
 * Generate dynamic Guide Metadata
 */
export function generateGuideMetadata(guideTitle: string, guideSlug: string): Metadata {
  const title = `${guideTitle} Buying Guide | ${SITE_NAME}`;
  const description = `Read our comprehensive buying guide on ${guideTitle}. Learn how to source the best materials for your business on ${SITE_NAME}.`;
  
  const path = `/guides/${guideSlug}`;
  return generateStandardMetadata(title, description, path, DEFAULT_OG_IMAGE, 'article');
}

/**
 * Generate Product Structured Data (Schema.org) with B2B wholesale tier pricing
 */
export function generateProductSchema(product: any, sellerName?: string) {
  const basePrice = (product.customerPrice ?? product.price) / 100;
  const isAvailable = product.stock > 0 || product.inStock !== false;
  
  const returnPolicy = {
    "@type": "MerchantReturnPolicy",
    "applicableCountry": "IN",
    "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
    "merchantReturnDays": 7,
    "returnMethod": "https://schema.org/ReturnByMail",
    "returnFees": "https://schema.org/FreeReturn"
  };

  const shippingDetails = {
    "@type": "OfferShippingDetails",
    "shippingRate": {
      "@type": "MonetaryAmount",
      "value": 0,
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
        "minValue": 0,
        "maxValue": 1,
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

  const rawTiers: any[] = Array.isArray(product.wholesaleTiers) && product.wholesaleTiers.length > 0
    ? product.wholesaleTiers
    : (Array.isArray(product.tiers) && product.tiers.length > 0 ? product.tiers : []);

  let offers: any;

  if (rawTiers.length > 1) {
    // Generate tiered B2B wholesale offers
    offers = rawTiers.map((tier: any, idx: number) => {
      const tierPrice = typeof tier.price === 'number' 
        ? (tier.price > 1000 ? Math.round(tier.price / 100) : tier.price)
        : basePrice;
      const minQ = tier.minQty || (idx === 0 ? 1 : 12);
      const maxQ = tier.maxQty || null;

      const offerObj: any = {
        "@type": "Offer",
        "name": `Tier ${idx + 1} Wholesale (${minQ}${maxQ ? `-${maxQ}` : '+'} units)`,
        "url": `${BASE_URL}/products/${product.id}`,
        "priceCurrency": "INR",
        "price": tierPrice,
        "itemCondition": "https://schema.org/NewCondition",
        "availability": isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "eligibleQuantity": {
          "@type": "QuantitativeValue",
          "minValue": minQ,
          ...(maxQ ? { "maxValue": maxQ } : {}),
          "unitCode": "C62"
        },
        "priceSpecification": {
          "@type": "UnitPriceSpecification",
          "price": tierPrice,
          "priceCurrency": "INR",
          "referenceQuantity": {
            "@type": "QuantitativeValue",
            "value": 1,
            "unitCode": "C62"
          }
        },
        "hasMerchantReturnPolicy": returnPolicy,
        "shippingDetails": shippingDetails
      };

      if (sellerName) {
        offerObj.seller = {
          "@type": "Organization",
          "name": sellerName
        };
      }

      return offerObj;
    });
  } else {
    offers = {
      "@type": "Offer",
      "url": `${BASE_URL}/products/${product.id}`,
      "priceCurrency": "INR",
      "price": basePrice,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "hasMerchantReturnPolicy": returnPolicy,
      "shippingDetails": shippingDetails
    };

    if (sellerName) {
      offers.seller = {
        "@type": "Organization",
        "name": sellerName
      };
    }
  }

  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${product.title} Wholesale India`,
    "image": product.imageUrl ? [product.imageUrl] : [DEFAULT_OG_IMAGE],
    "description": product.description || `Lab-tested ${product.title} available in bulk wholesale for small businesses in India.`,
    "sku": String(product.id),
    "brand": {
      "@type": "Brand",
      "name": sellerName || "Ekora Bazaar"
    },
    "offers": offers
  };

  return schema;
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
