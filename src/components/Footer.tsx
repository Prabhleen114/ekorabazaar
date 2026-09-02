import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-brand-bg border-t border-brand-linen py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/sell" className="inline-block mb-4">
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
              India&apos;s First Creator Commerce Platform. We build the infrastructure for independent creators to thrive.
            </p>
            <div className="flex items-center gap-4 text-sm font-medium text-brand-charcoal/50">
              <a href="https://instagram.com/ekorabazaar" target="_blank" rel="noopener noreferrer" className="hover:text-brand-charcoal transition-colors">Instagram</a>
              <a href="https://twitter.com/ekorabazaar" target="_blank" rel="noopener noreferrer" className="hover:text-brand-charcoal transition-colors">Twitter</a>
              <a href="https://linkedin.com/company/ekora" target="_blank" rel="noopener noreferrer" className="hover:text-brand-charcoal transition-colors">LinkedIn</a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-brand-charcoal font-semibold mb-6 font-serif">Platform</h4>
            <ul className="space-y-4 text-sm text-brand-charcoal/60 font-medium">
              <li><Link href="/sell/platform" className="hover:text-brand-charcoal transition-colors">Product Preview</Link></li>
              <li><Link href="/sell/categories" className="hover:text-brand-charcoal transition-colors">Categories</Link></li>
              <li><Link href="/sell/how-it-works" className="hover:text-brand-charcoal transition-colors">How it Works</Link></li>
              <li><Link href="/sell/start-selling" className="hover:text-brand-charcoal transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-brand-charcoal font-semibold mb-6 font-serif">Company</h4>
            <ul className="space-y-4 text-sm text-brand-charcoal/60 font-medium">
              <li><Link href="/sell/why-ekora" className="hover:text-brand-charcoal transition-colors">Our Story</Link></li>
              <li><Link href="/sell/faq" className="hover:text-brand-charcoal transition-colors">FAQ</Link></li>
              <li><span className="text-brand-charcoal/30 cursor-not-allowed">Careers — Coming Soon</span></li>
              <li><span className="text-brand-charcoal/30 cursor-not-allowed">Press — Coming Soon</span></li>
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
                <a href="tel:+919041500605" className="hover:text-brand-charcoal transition-colors">+91 9041500605</a>
              </p>
              <p>
                <a href="mailto:techekora@gmail.com" className="hover:text-brand-charcoal transition-colors">techekora@gmail.com</a>
              </p>
              <div className="pt-2">
                <a 
                  href="https://wa.me/919041500605?text=Hi%20Ekora!%20I'm%20interested%20in%20becoming%20a%20Founding%20Creator."
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

          {/* Legal */}
          <div>
            <h4 className="text-brand-charcoal font-semibold mb-6 font-serif">Legal</h4>
            <ul className="space-y-4 text-sm text-brand-charcoal/60 font-medium">
              <li><Link href="/terms" className="hover:text-brand-charcoal transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-brand-charcoal transition-colors">Privacy Policy</Link></li>
              <li><Link href="/refund-policy" className="hover:text-brand-charcoal transition-colors">Refund Policy</Link></li>
              <li><Link href="/creator-guidelines" className="hover:text-brand-charcoal transition-colors">Creator Guidelines</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-brand-linen flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-medium text-brand-charcoal/40">
          <p>© 2025 Ekora. All rights reserved.</p>
          <p>Made in India</p>
        </div>
      </div>
    </footer>
  );
}
