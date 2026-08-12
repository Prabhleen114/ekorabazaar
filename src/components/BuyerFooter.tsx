import Link from "next/link";
import Image from "next/image";

export default function BuyerFooter() {
  return (
    <footer className="bg-brand-bg border-t border-brand-linen py-10 md:py-16">
      <div className="max-w-6xl mx-auto px-5 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-6 gap-8 md:gap-12 mb-10 md:mb-16">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
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
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-brand-charcoal font-semibold mb-4 md:mb-6 font-serif">Contact Us</h4>
            <div className="space-y-3 text-sm text-brand-charcoal/60 font-medium leading-relaxed">
              <p>
                Near Shyam Mandir Marg, Sutapatti,<br />
                Muzaffarpur, Bihar - 842001
              </p>
              <p className="pt-1">
                <a href="tel:+919465533394" className="hover:text-brand-charcoal transition-colors">+91 9465533394</a>
              </p>
              <p>
                <a href="mailto:support@ekorabazaar.com" className="hover:text-brand-charcoal transition-colors">support@ekorabazaar.com</a>
              </p>
              <div className="pt-2">
                <a 
                  href="https://wa.me/919465533394?text=Hi%20Ekora!%20I%20need%20help%20with%20my%20supplies%20order."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block transition-transform hover:scale-105"
                  title="WhatsApp click to chat"
                >
                  <Image 
                    src="/images/whatsapp-button.png" 
                    alt="WhatsApp click to chat" 
                    width={180} 
                    height={52} 
                    className="h-9 w-auto object-contain" 
                  />
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
