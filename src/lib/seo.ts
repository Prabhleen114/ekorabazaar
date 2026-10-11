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

/**
 * Generate dynamic Product Metadata targeting B2B & Wholesale commercial intent
 */
export function generateProductMetadata(product: any): Metadata {
  const title = product.title;
  const description = `Source ${product.title} in bulk for your business. Tiered wholesale pricing, fast dispatch, and reliable delivery across India.`;
  
  const imageUrl = product.imageUrl || DEFAULT_OG_IMAGE;
  const path = `/products/${product.id}`;

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
  
  const offers = {
    "@type": "Offer",
    "url": `${BASE_URL}/products/${product.id}`,
    "priceCurrency": "INR",
    "price": basePrice,
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
    "name": product.title || product.name,
    "image": [
      (product.imageUrl || product.image || "").startsWith("http") 
        ? (product.imageUrl || product.image) 
        : `${BASE_URL}${product.imageUrl || product.image || "/og-image.jpg"}`
    ],
    "description": product.description || `Lab-tested ${product.title || product.name} available in bulk wholesale for small businesses in India.`,
    "sku": String(product.id),
    "brand": {
        "@type": "Brand",
        "name": "Ekora Bazaar"
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
      "name": SITE_NAME,
      "url": BASE_URL,
      "logo": `${BASE_URL}/logo.png`,
      "description": "Ekora Bazaar is a B2B marketplace for wholesale products and raw materials. Connect with verified suppliers for bulk buying."
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": SITE_NAME,
      "url": BASE_URL
    }
  ];
}
