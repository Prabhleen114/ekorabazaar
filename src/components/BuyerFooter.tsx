import Link from "next/link";
import Image from "next/image";

export default function BuyerFooter() {
  return (
    <footer className="bg-brand-bg border-t border-brand-linen py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <Image 
                src="/images/logo.jpg" 
                alt="Ekora Bazaar" 
                width={144}
                height={48}
                className="object-contain mix-blend-multiply"
                style={{ height: "48px", width: "auto" }}
              />
            </Link>
            <p className="text-sm text-brand-charcoal/60 mb-6 max-w-xs leading-relaxed">
              India&apos;s Premium Craft Supplies Marketplace. Batch-tested, reliable raw materials for serious creators.
            </p>
            <div className="flex items-center gap-4 text-sm font-medium text-brand-charcoal/50">
              <a href="https://instagram.com/ekorabazaar" target="_blank" rel="noopener noreferrer" className="hover:text-brand-charcoal transition-colors">Instagram</a>
              <a href="https://twitter.com/ekorabazaar" target="_blank" rel="noopener noreferrer" className="hover:text-brand-charcoal transition-colors">Twitter</a>
              <a href="https://linkedin.com/company/ekora" target="_blank" rel="noopener noreferrer" className="hover:text-brand-charcoal transition-colors">LinkedIn</a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-brand-charcoal font-semibold mb-6 font-serif">Shop</h4>
            <ul className="space-y-4 text-sm text-brand-charcoal/60 font-medium">
              <li><Link href="/shop?category=fragrances" className="hover:text-brand-charcoal transition-colors">Fragrances</Link></li>
              <li><Link href="/shop?category=resins" className="hover:text-brand-charcoal transition-colors">Resins & Epoxies</Link></li>
              <li><Link href="/shop?category=waxes" className="hover:text-brand-charcoal transition-colors">Waxes</Link></li>
              <li><Link href="/shop?category=molds" className="hover:text-brand-charcoal transition-colors">Silicone Molds</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-brand-charcoal font-semibold mb-6 font-serif">Company</h4>
            <ul className="space-y-4 text-sm text-brand-charcoal/60 font-medium">
              <li><Link href="/sell/why-ekora" className="hover:text-brand-charcoal transition-colors">About Us</Link></li>
              <li><Link href="/sell/faq" className="hover:text-brand-charcoal transition-colors">Help Center</Link></li>
              <li><span className="text-brand-charcoal/30 cursor-not-allowed">Careers — Coming Soon</span></li>
              <li><span className="text-brand-charcoal/30 cursor-not-allowed">Press — Coming Soon</span></li>
            </ul>
          </div>

          {/* Supplier Relations */}
          <div>
            <h4 className="text-brand-charcoal font-semibold mb-6 font-serif">Supplier Relations</h4>
            <ul className="space-y-4 text-sm text-brand-charcoal/60 font-medium">
              <li><Link href="/sell" className="hover:text-brand-charcoal transition-colors text-brand-orange">Become a Seller</Link></li>
              <li><Link href="/sell/platform" className="hover:text-brand-charcoal transition-colors">Seller Tools</Link></li>
              <li><Link href="/sell/faq" className="hover:text-brand-charcoal transition-colors">Supplier FAQ</Link></li>
              <li><Link href="/sell/why-ekora" className="hover:text-brand-charcoal transition-colors">Why Sell With Us</Link></li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="text-brand-charcoal font-semibold mb-6 font-serif">Contact Us</h4>
            <div className="space-y-3 text-sm text-brand-charcoal/60 font-medium leading-relaxed">
              <p>
                Near Shyam Mandir Marg, Sutapatti,<br />
                Muzaffarpur, Bihar - 842001
              </p>
              <p className="pt-1">
                <a href="tel:+917783053603" className="hover:text-brand-charcoal transition-colors">+91 7783053603</a>
              </p>
              <p>
                <a href="mailto:support@ekorabazaar.com" className="hover:text-brand-charcoal transition-colors">support@ekorabazaar.com</a>
              </p>
              <div className="pt-2">
                <a 
                  href="https://wa.me/917783053603?text=Hi%20Ekora!%20I%20need%20help%20with%20my%20supplies%20order."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/10 transition-all duration-200"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Legal */}
        <div className="pt-8 border-t border-brand-linen flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-medium text-brand-charcoal/40">
          <ul className="flex flex-wrap gap-4 md:gap-6">
            <li><Link href="/terms" className="hover:text-brand-charcoal transition-colors">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-brand-charcoal transition-colors">Privacy Policy</Link></li>
            <li><Link href="/refund-policy" className="hover:text-brand-charcoal transition-colors">Refund Policy</Link></li>
          </ul>
          <div className="flex gap-4">
            <p>© 2025 Ekora. All rights reserved.</p>
            <p>Made in India</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
