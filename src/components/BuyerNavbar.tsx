"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, Search, GraduationCap } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORIES } from "@/lib/categories";
import TopUtilityBar from "./TopUtilityBar";

export default function BuyerNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isAcademyOpen, setIsAcademyOpen] = useState(false);

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

  return (
    <>
      <TopUtilityBar />
      <header
        className={`sticky top-0 inset-x-0 z-50 transition-all duration-300 ${
          isScrolled || mobileMenuOpen ? "bg-white border-b border-brand-linen shadow-sm" : "bg-white/90 backdrop-blur-md border-b border-brand-linen/60"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand Logo */}
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

          {/* Center: Desktop Nav Items & Mega Menu Trigger */}
          <nav className="hidden md:flex justify-center items-center gap-8 h-full">
            {/* Top-Level Categories Mega Menu Dropdown */}
            <div 
              className="relative h-full flex items-center"
              onMouseEnter={() => setIsCategoriesOpen(true)}
              onMouseLeave={() => setIsCategoriesOpen(false)}
            >
              <button
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className={`relative flex items-center gap-1.5 text-sm font-medium h-full transition-colors ${
                  isCategoriesOpen ? "text-brand-orange" : "text-brand-charcoal/80 hover:text-brand-charcoal"
                }`}
              >
                <span>Shop</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCategoriesOpen ? "rotate-180 text-brand-orange" : ""}`} />
                {isCategoriesOpen && (
                  <motion.div
                    layoutId="activeUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-orange"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>

              {/* Full-Width Mega Menu Dropdown Container */}
              <AnimatePresence>
                {isCategoriesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="fixed top-24 left-0 right-0 w-full bg-white/98 backdrop-blur-xl border-b border-brand-linen shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-10 text-left">
                      {/* Column 1: Premium Bases & Raw Materials */}
                      <div>
                        <h3 className="font-sans font-bold text-base text-brand-charcoal tracking-tight mb-4">
                          Bases &amp; Waxes
                        </h3>
                        <ul className="space-y-2.5">
                          {CATEGORIES.BASES_AND_WAXES.map((item) => (
                            <li key={item.id}>
                              <Link
                                href={`/shop?category=${encodeURIComponent(item.id)}`}
                                className="font-sans font-normal text-sm text-brand-charcoal/70 hover:text-brand-orange block leading-relaxed transition-colors"
                              >
                                {item.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Column 2: Scents, Colors & Botanicals */}
                      <div>
                        <h3 className="font-sans font-bold text-base text-brand-charcoal tracking-tight mb-4">
                          Scents &amp; Botanicals
                        </h3>
                        <ul className="space-y-2.5">
                          <li>
                            <div className="flex flex-col">
                              <Link
                                href="/shop"
                                className="font-sans font-normal text-sm text-brand-charcoal/70 hover:text-brand-orange leading-relaxed transition-colors flex items-center"
                              >
                                Premium Oils &amp; Flavours
                                <span className="inline-flex items-center justify-center bg-[#e0f2fe] text-[#0369a1] text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 tracking-wide uppercase">
                                  NEW
                                </span>
                              </Link>
                              <ul className="ml-3 mt-1.5 space-y-1 border-l-2 border-brand-linen pl-3">
                                {CATEGORIES.SCENTS_AND_BOTANICALS.slice(0, 3).map((sub) => (
                                  <li key={sub.id}>
                                    <Link
                                      href={`/shop?category=${encodeURIComponent(sub.id)}`}
                                      className="font-sans font-normal text-xs text-brand-charcoal/50 hover:text-brand-orange block py-0.5 leading-normal transition-colors"
                                    >
                                      {sub.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </li>
                          {CATEGORIES.SCENTS_AND_BOTANICALS.slice(3).map((item) => (
                            <li key={item.id}>
                              <Link
                                href={`/shop?category=${encodeURIComponent(item.id)}`}
                                className="font-sans font-normal text-sm text-brand-charcoal/70 hover:text-brand-orange block leading-relaxed transition-colors"
                              >
                                {item.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Column 3: Silicone Moulds */}
                      <div>
                        <h3 className="font-sans font-bold text-base text-brand-charcoal tracking-tight mb-4">
                          Silicone Moulds
                        </h3>
                        <ul className="space-y-2.5">
                          {CATEGORIES.SILICONE_MOULDS.map((item) => (
                            <li key={item.id}>
                              <Link
                                href={`/shop?category=${encodeURIComponent(item.id)}`}
                                className="font-sans font-normal text-sm text-brand-charcoal/70 hover:text-brand-orange block leading-relaxed transition-colors"
                              >
                                {item.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Column 4: Discovery & Packaging */}
                      <div>
                        <h3 className="font-sans font-bold text-base text-brand-charcoal tracking-tight mb-4">
                          Discovery &amp; Packaging
                        </h3>
                        <ul className="space-y-2.5">
                          {[
                            { label: "Containers & Jars", category: "PACKAGING & CONTAINERS" },
                            { label: "Discovery Kits", href: "/classes" },
                            { label: "The Academy (Classes)", href: "/classes" },
                            { label: "Free Formulations", href: "/formulations" },
                          ].map((item) => (
                            <li key={item.label}>
                              <Link
                                href={item.href || `/shop?category=${encodeURIComponent(item.category || '')}`}
                                className="font-sans font-normal text-sm text-brand-charcoal/70 hover:text-brand-orange block leading-relaxed transition-colors"
                              >
                                {item.label}
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

            {/* Discovery Kits */}
            <Link
              href="/classes"
              className="text-sm font-medium text-brand-charcoal/70 hover:text-brand-charcoal transition-colors py-5"
            >
              Discovery Kits
            </Link>

            {/* The Academy Dropdown */}
            <div 
              className="relative h-full flex items-center"
              onMouseEnter={() => setIsAcademyOpen(true)}
              onMouseLeave={() => setIsAcademyOpen(false)}
            >
              <button
                onClick={() => setIsAcademyOpen(!isAcademyOpen)}
                className="flex items-center gap-1 text-sm font-medium text-brand-charcoal/70 hover:text-brand-charcoal transition-colors py-5"
              >
                <span>The Academy</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isAcademyOpen ? "rotate-180 text-brand-orange" : ""}`} />
              </button>

              <AnimatePresence>
                {isAcademyOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-14 left-0 w-56 bg-white rounded-2xl border border-brand-linen shadow-xl p-3 z-50"
                  >
                    <Link
                      href="/formulations"
                      className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-brand-bg text-sm font-medium text-brand-charcoal hover:text-brand-orange transition-colors"
                    >
                      <GraduationCap className="w-4 h-4 text-brand-orange" />
                      <span>Free Formulations</span>
                    </Link>
                    <Link
                      href="/classes"
                      className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-brand-bg text-sm font-medium text-brand-charcoal hover:text-brand-orange transition-colors"
                    >
                      <GraduationCap className="w-4 h-4 text-brand-sage" />
                      <span>A to Z Masterclasses</span>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* About Us */}
            <Link
              href="/sell/platform"
              className="text-sm font-medium text-brand-charcoal/70 hover:text-brand-charcoal transition-colors py-5"
            >
              About Us
            </Link>
          </nav>

          {/* Right: Search Input */}
          <div className="flex-1 flex justify-end items-center gap-4">
            <form action="/shop" method="GET" className="hidden lg:flex items-center relative">
              <input 
                type="text" 
                name="q" 
                placeholder="Search raw materials..." 
                className="bg-brand-bg border border-brand-linen rounded-full pl-4 pr-10 py-1.5 text-sm font-medium focus:outline-none focus:border-brand-orange w-48 transition-all focus:w-64" 
              />
              <button type="submit" className="absolute right-3 text-brand-charcoal/50 hover:text-brand-orange">
                <Search className="w-4 h-4" />
              </button>
            </form>

            <button
              className="md:hidden p-3 -mr-3 text-brand-charcoal focus:outline-none flex items-center justify-center min-w-[44px] min-h-[44px]"
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
            className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden flex flex-col overflow-y-auto"
          >
            <div className="flex flex-col gap-4 flex-1 pb-12">
              <Link
                href="/shop"
                className="text-2xl font-bold font-serif text-brand-charcoal hover:text-brand-orange transition-colors min-h-[44px] flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Explore Shop
              </Link>
              <Link
                href="/classes"
                className="text-2xl font-bold font-serif text-brand-charcoal hover:text-brand-orange transition-colors min-h-[44px] flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Discovery Kits
              </Link>
              <Link
                href="/formulations"
                className="text-2xl font-bold font-serif text-brand-charcoal hover:text-brand-orange transition-colors min-h-[44px] flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                The Academy (Formulations)
              </Link>
              <Link
                href="/sell/platform"
                className="text-2xl font-bold font-serif text-brand-charcoal hover:text-brand-orange transition-colors min-h-[44px] flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                About Us
              </Link>

              <div className="border-t border-brand-linen pt-4 mt-2">
                <Link
                  href="/sell"
                  className="flex items-center justify-center bg-brand-charcoal text-white rounded-xl px-6 py-4 text-base font-semibold w-full min-h-[52px]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Become a Seller
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
