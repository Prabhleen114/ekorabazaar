"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function BuyerNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: "Categories", href: "/shop" },
    { name: "Free Formulations", href: "/formulations" },
    { name: "Sample Kits", href: "/classes" },
    { name: "A to Z Classes", href: "/classes" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          isScrolled || mobileMenuOpen ? "bg-brand-bg border-b border-brand-linen" : "bg-brand-bg/80 backdrop-blur-md"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand */}
          <div className="flex-1 flex justify-start">
            <Link
              href="/"
              className="flex items-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Image 
                src="/images/logo.jpg" 
                alt="Ekora Bazaar" 
                width={120}
                height={40}
                priority
                className="object-contain mix-blend-multiply"
                style={{ height: "40px", width: "auto" }}
              />
            </Link>
          </div>

          {/* Center: Desktop Nav */}
          <nav className="hidden md:flex justify-center items-center gap-8">
            <div className="relative">
              <button
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                  isCategoriesOpen ? "text-brand-orange" : "text-brand-charcoal/60 hover:text-brand-charcoal"
                }`}
              >
                Categories
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCategoriesOpen ? "rotate-180 text-brand-orange" : ""}`} />
              </button>

              <AnimatePresence>
                {isCategoriesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-1/2 -translate-x-[40%] mt-6 w-[960px] bg-white shadow-2xl rounded-2xl border border-brand-linen flex overflow-hidden z-50 text-left"
                  >
                    {/* Left Sidebar */}
                    <div className="w-64 bg-brand-bg p-8 shrink-0 border-r border-brand-linen">
                      <h3 className="font-serif font-bold text-lg text-brand-charcoal mb-6 uppercase tracking-wider">Quick Navigation</h3>
                      <ul className="space-y-4">
                        <li>
                          <Link href="/shop" className="flex items-center gap-2 text-sm font-bold text-brand-charcoal/70 hover:text-brand-orange uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span> All Products
                          </Link>
                        </li>
                        <li>
                          <Link href="/formulations" className="flex items-center gap-2 text-sm font-bold text-brand-charcoal/70 hover:text-brand-orange uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span> Free Formulations
                          </Link>
                        </li>
                        <li>
                          <Link href="/classes" className="flex items-center gap-2 text-sm font-bold text-brand-charcoal/70 hover:text-brand-orange uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span> Classes &amp; Training
                          </Link>
                        </li>
                        <li>
                          <Link href="/sell" className="flex items-center gap-2 text-sm font-bold text-brand-charcoal/70 hover:text-brand-orange uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span> Become a Seller
                          </Link>
                        </li>
                        <li>
                          <a href="https://wa.me/917783053603?text=Hi%20Ekora!%20I'd%20like%20to%20get%20in%20touch." target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold text-brand-charcoal/70 hover:text-brand-orange uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span> Contact Us
                          </a>
                        </li>
                      </ul>
                    </div>

                    {/* Columns */}
                    <div className="flex-1 p-8 grid grid-cols-3 gap-8">
                      {/* Column 1 */}
                      <div className="space-y-8">
                        <div>
                          <h4 className="font-bold text-brand-charcoal/60 uppercase tracking-wider text-sm mb-4">Soap Making Material</h4>
                          <ul className="space-y-3">
                            {['Melt & Pour Soap Base', 'Essential Oils', 'Cosmetic Liquid & Mica Colors', 'Fragrance Oils', 'Silicon Moulds'].map(item => (
                              <li key={item}>
                                <Link href={`/shop?category=${encodeURIComponent(item)}`} className="text-sm font-semibold text-brand-charcoal/80 hover:text-brand-orange flex items-center gap-1 uppercase">
                                  <ChevronRight className="w-3 h-3 opacity-50" /> {item}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-bold text-brand-charcoal/60 uppercase tracking-wider text-sm mb-4">Candle Making Material</h4>
                          <ul className="space-y-3">
                            {['Waxes and Butters', 'Candle Mould'].map(item => (
                              <li key={item}>
                                <Link href={`/shop?category=${encodeURIComponent(item)}`} className="text-sm font-semibold text-brand-charcoal/80 hover:text-brand-orange flex items-center gap-1 uppercase">
                                  <ChevronRight className="w-3 h-3 opacity-50" /> {item}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Column 2 */}
                      <div className="space-y-8">
                        <div>
                          <h4 className="font-bold text-brand-charcoal/60 uppercase tracking-wider text-sm mb-4">All Silicon Molds</h4>
                          <ul className="space-y-3">
                            {['Candle Mould', 'Chocolate Mould', 'Fondant Molds', 'Soap Mould', 'Tube & Loaf Mould', 'Resin Mold'].map(item => (
                              <li key={item}>
                                <Link href={`/shop?category=${encodeURIComponent(item)}`} className="text-sm font-semibold text-brand-charcoal/80 hover:text-brand-orange flex items-center gap-1 uppercase">
                                  <ChevronRight className="w-3 h-3 opacity-50" /> {item}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-bold text-brand-charcoal/60 uppercase tracking-wider text-sm mb-4">Popular Categories</h4>
                          <ul className="space-y-3">
                            {['Home Decor', 'Natural Extracts'].map(item => (
                              <li key={item}>
                                <Link href={`/shop?category=${encodeURIComponent(item)}`} className="text-sm font-semibold text-brand-charcoal/80 hover:text-brand-orange flex items-center gap-1 uppercase">
                                  <ChevronRight className="w-3 h-3 opacity-50" /> {item}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Column 3 */}
                      <div>
                        <h4 className="font-bold text-brand-charcoal/60 uppercase tracking-wider text-sm mb-4">All Other Categories</h4>
                        <ul className="space-y-3">
                          {['Liquid and Cream Base', 'Dry Flowers', 'Preservative & Bulk Chemical', 'Fruit Flavour', 'Steam Distilled Hydrosols', 'Cold Processed Soaps', 'Office Product', 'DIY Tools', 'Other Item', 'Chocolate'].map(item => (
                            <li key={item}>
                              <Link href={`/shop?category=${encodeURIComponent(item)}`} className="text-sm font-semibold text-brand-charcoal/80 hover:text-brand-orange flex items-center gap-1 uppercase">
                                <ChevronRight className="w-3 h-3 opacity-50" /> {item}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {navLinks.filter(l => l.name !== "Categories").map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-brand-charcoal/60 hover:text-brand-charcoal transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right: CTA & Mobile Toggle */}
          <div className="flex-1 flex justify-end items-center gap-4">
            <Link
              href="/sell"
              className="hidden md:inline-flex items-center justify-center bg-brand-charcoal hover:bg-brand-charcoal/80 text-white rounded-full px-5 py-2.5 text-sm font-semibold transition-all shadow-md"
            >
              Become a Seller
            </Link>

            <button
              className="md:hidden p-2 -mr-2 text-brand-charcoal focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-40 bg-brand-bg pt-24 px-6 md:hidden flex flex-col"
          >
            <div className="flex flex-col gap-6 flex-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-3xl font-bold font-sans tracking-tight text-brand-charcoal hover:text-brand-charcoal/70 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            
            <div className="pb-12 mt-auto">
              <Link
                href="/sell"
                className="flex items-center justify-center bg-brand-charcoal text-white rounded-xl px-6 py-4 text-lg font-semibold w-full hover:bg-brand-charcoal/90 transition-all shadow-lg text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Become a Seller
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
