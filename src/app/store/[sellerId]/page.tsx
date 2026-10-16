import prisma from "@/lib/db";
import { ProductStatus, SellerAccountStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { Metadata } from "next";
import serialize from "serialize-javascript";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.ekorabazaar.in";

export const revalidate = 3600;

type Props = {
  params: Promise<{ sellerId: string }>;
};

async function getSellerWithProducts(sellerId: string) {
  try {
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: {
        user: { select: { businessName: true, name: true } },
        businessDetails: { select: { legalName: true, businessType: true, address: true, gstStatus: true } },
        products: {
          where: { status: ProductStatus.PUBLISHED },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    return seller;
  } catch (err) {
    console.warn("Failed to fetch seller:", err);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sellerId } = await params;
  const seller = await getSellerWithProducts(sellerId);

  if (!seller || seller.accountStatus !== SellerAccountStatus.ACTIVE) {
    return { title: "Store Not Found" };
  }

  const brandName = seller.brandName || seller.user?.businessName || "Verified Supplier";
  const publishedCount = seller.products.length;
  const isIndexable = publishedCount >= 3;

  const title = `${brandName} Wholesale Storefront`;
  const description = `Shop verified wholesale craft raw materials directly from ${brandName} on Ekora Bazaar. Tiered B2B pricing, fast dispatch across India.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/store/${sellerId}`,
    },
    robots: {
      index: isIndexable,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/store/${sellerId}`,
      type: "website",
    },
  };
}

export default async function SellerStorePage({ params }: Props) {
  const { sellerId } = await params;
  const seller = await getSellerWithProducts(sellerId);

  if (!seller || seller.accountStatus !== SellerAccountStatus.ACTIVE) {
    notFound();
  }

  const brandName = seller.brandName || seller.user?.businessName || "Verified Supplier";
  const publishedProducts = seller.products;
  const isGstVerified = seller.businessDetails?.gstStatus === "VERIFIED";

  const storeSchema = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: brandName,
    url: `${BASE_URL}/store/${sellerId}`,
    description: `Official verified raw material supplier store on Ekora Bazaar India.`,
    ...(seller.businessDetails?.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: seller.businessDetails.address,
            addressCountry: "IN",
          },
        }
      : {}),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Suppliers", item: `${BASE_URL}/shop` },
      { "@type": "ListItem", position: 3, name: brandName, item: `${BASE_URL}/store/${sellerId}` },
    ],
  };

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <BuyerNavbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize([storeSchema, breadcrumbSchema], { isJSON: true }) }}
      />

      <div className="pt-24 pb-16 px-4 md:px-6 max-w-7xl mx-auto w-full flex-1">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-brand-charcoal/60">
          <ol className="flex items-center gap-2 flex-wrap">
            <li>
              <Link href="/" className="hover:text-brand-orange transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li>
              <Link href="/shop" className="hover:text-brand-orange transition-colors">
                Marketplace
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li className="text-brand-charcoal font-medium">{brandName}</li>
          </ol>
        </nav>

        {/* Storefront Hero Banner */}
        <div className="mb-10 bg-white p-8 md:p-12 rounded-3xl border border-brand-linen shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-xs font-mono uppercase tracking-wider text-brand-orange font-bold">
                Verified Manufacturer / Supplier
              </span>
              {isGstVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  GST Verified
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-serif text-brand-charcoal mb-3">
              {brandName}
            </h1>
            <p className="text-brand-charcoal/70 text-base max-w-2xl leading-relaxed">
              Wholesale raw materials, bulk craft supplies, and production bases directly from {brandName}.
              All orders dispatched with standard B2B documentation and batch COA support.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/shop"
              className="px-5 py-3 rounded-xl bg-brand-bg text-brand-charcoal border border-brand-linen text-sm font-semibold hover:bg-stone-100 transition-colors"
            >
              All Marketplace Products
            </Link>
          </div>
        </div>

        {/* Products Grid */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold font-serif text-brand-charcoal">
            Products by {brandName} ({publishedProducts.length})
          </h2>
        </div>

        {publishedProducts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-brand-linen">
            <p className="text-lg text-brand-charcoal/70">
              No products are currently published in this storefront.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {publishedProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  title: product.title,
                  category: product.category,
                  price: product.customerPrice ?? product.price,
                  imageUrl: product.imageUrl,
                  wholesaleTiers: product.wholesaleTiers,
                }}
                index={index}
                priority={index < 4}
              />
            ))}
          </div>
        )}
      </div>

      <BuyerFooter />
    </main>
  );
}
