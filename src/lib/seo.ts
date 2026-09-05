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
 * Generate dynamic Product Metadata
 */
export function generateProductMetadata(product: any): Metadata {
  const title = `Buy ${product.title} Online | ${SITE_NAME}`;
  const description = product.description 
    ? (product.description.length > 155 ? product.description.substring(0, 155) + '...' : product.description)
    : `Buy premium ${product.title} online at wholesale prices on ${SITE_NAME}.`;
  
  const imageUrl = product.imageUrl || DEFAULT_OG_IMAGE;
  const path = `/products/${product.id}`;

  return generateStandardMetadata(title, description, path, imageUrl);
}

/**
 * Generate dynamic Category Metadata
 */
export function generateCategoryMetadata(categoryName: string, categorySlug: string): Metadata {
  const title = `${categoryName} Online | Shop on ${SITE_NAME}`;
  const description = `Discover premium ${categoryName} for creators and small businesses. Buy high-quality raw materials and craft supplies online on ${SITE_NAME}.`;
  
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
 * Generate Product Structured Data (Schema.org)
 */
export function generateProductSchema(product: any, sellerName?: string) {
  const price = (product.customerPrice ?? product.price) / 100;
  
  // Basic strict Google Merchant Center requirements
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "image": product.imageUrl ? [product.imageUrl] : [DEFAULT_OG_IMAGE],
    "description": product.description || `Premium ${product.title}`,
    "sku": product.id,
    "offers": {
      "@type": "Offer",
      "url": `${BASE_URL}/products/${product.id}`,
      "priceCurrency": "INR",
      "price": price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.stock > 0 || !product.stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };

  if (sellerName) {
    schema.brand = {
      "@type": "Brand",
      "name": sellerName
    };
    schema.offers.seller = {
      "@type": "Organization",
      "name": sellerName
    };
  }

  return schema;
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
