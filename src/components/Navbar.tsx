"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: "Platform", href: "/sell/platform" },
    { name: "Categories", href: "/sell/categories" },
    { name: "How It Works", href: "/sell/how-it-works" },
    { name: "Why Ekora", href: "/sell/why-ekora" },
    { name: "FAQ", href: "/sell/faq" },
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
              href="/sell"
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
            {navLinks.map((link) => (
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
              href="/login"
              className="hidden md:inline-flex items-center justify-center text-brand-charcoal hover:text-brand-orange font-semibold text-sm transition-colors"
            >
              Creator Login
            </Link>
            <Link
              href="/sell/start-selling"
              className="hidden md:inline-flex items-center justify-center bg-brand-orange hover:bg-brand-terracotta text-white rounded-full px-5 py-2.5 text-sm font-semibold transition-all shadow-md shadow-brand-orange/10 hover:scale-[1.02]"
            >
              Start Selling
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
            
            <div className="pb-12 mt-auto flex flex-col gap-3">
              <Link
                href="/login"
                className="flex items-center justify-center bg-white text-brand-charcoal border border-brand-linen rounded-xl px-6 py-4 text-lg font-semibold w-full hover:bg-brand-linen/30 transition-all text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Creator Login
              </Link>
              <Link
                href="/sell/start-selling"
                className="flex items-center justify-center bg-brand-orange text-white rounded-xl px-6 py-4 text-lg font-semibold w-full hover:bg-brand-terracotta transition-all shadow-lg shadow-brand-orange/15 text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Start Selling Today
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
