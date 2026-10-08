import { Metadata } from "next";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import Link from "next/link";
import serialize from "serialize-javascript";

export const metadata: Metadata = {
  title: "About Us | Ekora Bazaar",
  description: "Learn about Ekora Bazaar, India's premier creator commerce marketplace and wholesale raw materials platform built for independent artisans.",
  alternates: {
    canonical: "https://www.ekorabazaar.in/about",
  },
  openGraph: {
    title: "About Us | Ekora Bazaar",
    description: "Learn about Ekora Bazaar, India's premier creator commerce marketplace and wholesale raw materials platform built for independent artisans.",
    url: "https://www.ekorabazaar.in/about",
    type: "website",
  },
};

export default function AboutPage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "mainEntity": {
      "@type": "Organization",
      "name": "Ekora Bazaar",
      "foundingDate": "2026",
      
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Near Shyam Mandir Marg, Sutapatti",
        "addressLocality": "Muzaffarpur",
        "addressRegion": "Bihar",
        "postalCode": "842001",
        "addressCountry": "IN"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+91 9041500605",
        "email": "ekorabazaar@gmail.com",
        "contactType": "customer support"
      }
    }
  };

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize(aboutSchema, { isJSON: true }) }}
      />
      <BuyerNavbar />

      <div className="flex-1 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-brand-charcoal mb-6">About Ekora Bazaar</h1>
            <p className="text-lg md:text-xl text-brand-charcoal/70 leading-relaxed max-w-2xl mx-auto">
              India's premier creator commerce marketplace and wholesale raw materials platform built for independent artisans, craftspeople, and creative entrepreneurs.
            </p>
          </div>

          <div className="space-y-12">
            <section className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-brand-linen">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-charcoal mb-4">Our Mission</h2>
              <p className="text-brand-charcoal/80 leading-relaxed mb-6">
                Ekora Bazaar connects verified handmade creators directly with buyers across India while empowering sellers with instant storefronts, zero DM-based checkout friction, automated Instagram catalog synchronization, and transparent pricing. 
              </p>
              <p className="text-brand-charcoal/80 leading-relaxed">
                We help creative small businesses, women entrepreneurs, and home-based artisans scale their brands without excessive marketplace commissions.
              </p>
            </section>

            <section className="grid md:grid-cols-2 gap-8">
              <div className="bg-brand-linen/30 rounded-3xl p-8 md:p-10">
                <h3 className="text-xl font-bold text-brand-charcoal mb-4">The Creator Marketplace</h3>
                <p className="text-brand-charcoal/70 leading-relaxed mb-6">
                  A curated selection of handmade products from verified Indian creators. We showcase the best in independent design and craftsmanship.
                </p>
                <ul className="space-y-2 text-brand-charcoal/80 font-medium">
                  <li>• Resin Art &amp; Jewelry</li>
                  <li>• Hand-poured Soy Candles</li>
                  <li>• Crochet Wearables &amp; Toys</li>
                  <li>• Ceramic Pottery</li>
                  <li>• Custom Home Decor</li>
                </ul>
              </div>
              
              <div className="bg-brand-orange/5 rounded-3xl p-8 md:p-10 border border-brand-orange/10">
                <h3 className="text-xl font-bold text-brand-charcoal mb-4">Wholesale Raw Materials</h3>
                <p className="text-brand-charcoal/70 leading-relaxed mb-6">
                  Direct wholesale pricing on high-quality raw craft supplies. Lab-tested, batch-matched, and COA certified for small businesses.
                </p>
                <ul className="space-y-2 text-brand-charcoal/80 font-medium">
                  <li>• Wholesale Fragrance Oils</li>
                  <li>• Candle Wax (Soy, Beeswax, Paraffin)</li>
                  <li>• Premium Silicone Moulds</li>
                  <li>• Packaging Materials</li>
                  <li>• Essential Oils</li>
                </ul>
                <div className="mt-6">
                  <Link href="/shop" className="text-brand-orange font-bold hover:underline">
                    Shop Raw Materials →
                  </Link>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-brand-linen">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-charcoal mb-6">Company Information</h2>
              <div className="grid sm:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm uppercase tracking-wider font-bold text-brand-charcoal/50 mb-2">Legal Identity</h3>
                  <p className="text-brand-charcoal/80 mb-4">
                    <strong>Ekora Bazaar Pvt Ltd</strong><br />
                    Near Shyam Mandir Marg, Sutapatti<br />
                    Muzaffarpur, Bihar - 842001<br />
                    India
                  </p>
                  <div className="text-sm text-brand-charcoal/70 p-3 bg-brand-bg rounded-lg border border-brand-linen/50">
                    <p><strong>MSME Registered Enterprise</strong></p>
                    <p className="mt-1 font-semibold text-brand-orange">B2B GST invoice provided on every order.</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm uppercase tracking-wider font-bold text-brand-charcoal/50 mb-2">Contact &amp; Support</h3>
                  <p className="text-brand-charcoal/80 mb-1">Email: <a href="mailto:ekorabazaar@gmail.com" className="hover:text-brand-orange">ekorabazaar@gmail.com</a></p>
                  <p className="text-brand-charcoal/80 mb-4">WhatsApp: <a href="https://wa.me/919041500605" className="hover:text-brand-orange">+91 9041500605</a></p>
                  
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <BuyerFooter />
    </main>
  );
}
