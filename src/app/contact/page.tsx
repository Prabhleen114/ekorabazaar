import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Ekora Bazaar for support, bulk queries, or feedback.",
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-bg pt-24 pb-16 px-4 md:px-6">
        <section className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-brand-linen p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-brand-charcoal mb-4">Contact Us</h1>
          <p className="text-brand-charcoal/70 mb-8">
            Have a question? Reach out via email, phone, or WhatsApp and we'll get back to you within 24 hours.
          </p>

          <form className="grid gap-4 mb-10">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-brand-charcoal mb-1">Name</label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-sage"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-charcoal mb-1">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Your email address"
                className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-sage"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-brand-charcoal mb-1">Message</label>
              <textarea
                id="message"
                placeholder="How can we help?"
                rows={5}
                className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-sage"
                required
              />
            </div>
            <button
              type="submit"
              className="mt-2 bg-brand-charcoal text-brand-bg py-3 px-4 md:px-6 rounded-full font-medium hover:bg-brand-sage hover:text-brand-charcoal transition-colors duration-300 w-full md:w-auto md:px-12"
            >
              Send Message
            </button>
          </form>

          <div className="space-y-4 pt-8 border-t border-brand-linen text-sm md:text-base text-brand-charcoal/80">
            <div>
              <span className="font-semibold block text-brand-charcoal">Email:</span>
              <a href="mailto:ekorabazaar@gmail.com" className="hover:text-brand-orange transition-colors">ekorabazaar@gmail.com</a>
            </div>
            <div>
              <span className="font-semibold block text-brand-charcoal">Phone / WhatsApp:</span>
              <a href="https://wa.me/919041500605" className="hover:text-brand-orange transition-colors">+91 9041500605</a>
            </div>
            <div>
              <span className="font-semibold block text-brand-charcoal">Office Address:</span>
              Ekora Bazaar Pvt Ltd<br/>
              Near Shyam Mandir Marg, Sutapatti,<br/>
              Muzaffarpur, Bihar - 842001
            </div>
            <div className="pt-4 mt-4 border-t border-brand-linen text-xs text-brand-charcoal/60 leading-relaxed">
              <p>MSME Registered Enterprise</p>
              <p className="font-semibold mt-1">GST invoice provided on every order.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
