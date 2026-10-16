import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the Ekora Bazaar Terms of Service outlining commercial platform rules, B2B wholesale transactions, GST compliance, and dispute resolution.",
  alternates: {
    canonical: "https://www.ekorabazaar.in/terms",
  },
  openGraph: {
    title: "Terms of Service",
    description: "Read the Ekora Bazaar Terms of Service outlining commercial platform rules, B2B wholesale transactions, GST compliance, and dispute resolution.",
    url: "https://www.ekorabazaar.in/terms",
    type: "website",
  },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <BuyerNavbar />
      <div className="pt-32 pb-16 px-4 md:px-6 max-w-4xl mx-auto flex-1">
        <h1 className="text-4xl md:text-5xl font-bold font-serif text-brand-charcoal mb-4">Terms of Service</h1>
        <p className="text-sm font-mono text-brand-charcoal/60 mb-8">Last updated: October 16, 2026</p>

        <div className="prose prose-brand max-w-none text-brand-charcoal/80 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-3">1. Acceptance of Terms &amp; Corporate Identity</h2>
            <p>
              These Terms of Service constitute a legally binding agreement between you (&ldquo;User&rdquo;, &ldquo;Buyer&rdquo;, or &ldquo;Seller&rdquo;) and <strong>Ekora Bazaar Pvt Ltd</strong> (&ldquo;Ekora Bazaar&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), having its registered operations at Near Shyam Mandir Marg, Sutapatti, Muzaffarpur, Bihar &ndash; 842001, India.
            </p>
            <p>
              By accessing, browsing, registering on, or transacting through <code>https://www.ekorabazaar.in</code>, you agree to be bound by these Terms, our Privacy Policy, Shipping Policy, and Refund Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-3">2. Description of Commercial Services</h2>
            <p>
              Ekora Bazaar operates an integrated ecommerce marketplace connecting independent Indian craft artisans and makers with retail buyers, alongside a specialized B2B wholesale raw materials sourcing catalog offering candle waxes, fragrance oils, silicone moulds, plant butters, and packaging supplies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-3">3. User Accounts &amp; Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials, passwords, and one-time authentication codes. Any activity conducted under your registered email address or phone number is your sole commercial responsibility. You agree to notify us immediately of any unauthorized account access.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-3">4. Pricing, Wholesale Tiers &amp; GST Invoicing</h2>
            <p>
              All listed product prices on Ekora Bazaar are denominated in Indian Rupees (&inr;). Wholesale volume discount tiers are automatically calculated and displayed based on order quantities. All commercial transactions comply with Indian Goods and Services Tax (GST) regulations. Tax invoices containing applicable CGST, SGST, or IGST breakdowns are generated upon order completion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-3">5. Shipping &amp; Logistics Policy</h2>
            <p>
              Standard orders are subject to our authoritative flat delivery charge of <strong>&inr;90 pan-India</strong>, regardless of product count or weight. Orders are processed with verified national logistics partners and dispatched typically within 24&ndash;48 business hours with end-to-end consignment tracking.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-3">6. Returns, Transit Damage &amp; Unboxing Verification</h2>
            <p>
              Given the sensitive, consumable nature of wholesale craft ingredients (such as waxes, butters, and concentrated aromatics), standard orders are non-returnable once dispatched. For items damaged in transit (such as glassware or broken containers), buyers must file a damage claim within <strong>48 hours of delivery</strong> accompanied by a continuous unboxing video clearly displaying the courier shipping label and package condition.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-3">7. Product Quality &amp; Technical Information</h2>
            <p>
              Raw materials provided through Ekora Official Supplier channels are formulation/cosmetic grade suitable for professional studio craft. Technical Data Sheets (TDS) and authentic Certificates of Analysis (COA) are provided on commercial request for verified business orders. Users must conduct their own bench testing prior to commercial production runs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-3">8. Governing Law &amp; Dispute Resolution</h2>
            <p>
              These Terms and any dispute or claim arising out of or in connection with them shall be governed by and construed in accordance with the laws of India. Any legal proceedings or dispute resolution shall be subject to the exclusive jurisdiction of the competent courts in <strong>Muzaffarpur, Bihar</strong> or <strong>New Delhi, India</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-3">9. Grievance Redressal &amp; Contact</h2>
            <p>
              In accordance with the Information Technology Act 2000 and Consumer Protection (E-Commerce) Rules 2020, the contact details for grievance redressal are:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Company:</strong> Ekora Bazaar Pvt Ltd</li>
              <li><strong>Email:</strong> <code>ekorabazaar@gmail.com</code></li>
              <li><strong>Phone / WhatsApp:</strong> +91-9041500605</li>
              <li><strong>Address:</strong> Near Shyam Mandir Marg, Sutapatti, Muzaffarpur, Bihar &ndash; 842001, India</li>
            </ul>
          </section>
        </div>
      </div>
      <BuyerFooter />
    </main>
  );
}
