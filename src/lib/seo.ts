import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.ekorabazaar.in';
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
  const title = product.title || product.name;
  const description = `Source ${title} in bulk for your business. Tiered wholesale pricing, fast dispatch, and reliable delivery across India.`;

  const imageUrl = product.imageUrl || product.image || DEFAULT_OG_IMAGE;
  const path = `/products/${canonicalId}`;

  return generateStandardMetadata(title, description, path, imageUrl);
}

/**
 * Generate dynamic Category Metadata
 */
export function generateCategoryMetadata(categoryName: string, categorySlug: string): Metadata {
  const title = `${categoryName} Wholesale | Bulk Supplier India`;
  const description = `Source wholesale ${categoryName} for small businesses and creators. Reliable supply, volume tier pricing, and fast delivery on ${SITE_NAME}.`;

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
  const basePrice = (product.customerPrice ?? product.price) / 100;
  const isAvailable = product.stock > 0 || product.inStock !== false;

  const returnPolicy = {
    "@type": "MerchantReturnPolicy",
    "applicableCountry": "IN",
    "returnPolicyCategory": "https://schema.org/MerchantReturnNotPermitted",
    "description": "Returns/exchanges are not available for standard wholesale and raw-material orders."
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
  const offers = {
    "@type": "Offer",
    "@id": `${BASE_URL}/products/${canonicalId}#offer`,
    "url": `${BASE_URL}/products/${canonicalId}`,
    "priceCurrency": "INR",
    "price": basePrice,
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
    "description": product.description || `Source ${product.title || product.name} in bulk wholesale on Ekora Bazaar. Tiered pricing and reliable delivery across India.`,
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
      "legalName": "Ekora Bazaar Pvt Ltd",
      "url": BASE_URL,
      "logo": {
        "@type": "ImageObject",
        "@id": `${BASE_URL}/#logo`,
        "url": `${BASE_URL}/images/logo.jpg`,
        "caption": SITE_NAME,
      },
      "image": `${BASE_URL}/og-image.jpg`,
      "description": "India's premier creator commerce platform and wholesale raw materials sourcing hub for independent artisans and makers.",
      "foundingDate": "2026",
      "founders": [
        { "@type": "Person", "name": "Kumar Aryan" },
        { "@type": "Person", "name": "Prabhleen Kaur" },
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
