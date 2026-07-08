"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is Ekora?",
    answer:
      "Ekora is India's first creator commerce platform. We're building a dedicated marketplace where independent creators — people who sell handmade products on Instagram — can set up professional storefronts, accept secure payments, and manage their business in one place.",
  },
  {
    question: "Who can join the Early Access program?",
    answer:
      "Any Instagram creator who sells handmade or creator-made products. Whether you make candles, jewelry, resin art, pottery, crochet, or any handcrafted product — if you have an active Instagram page showcasing your work, you're eligible to apply.",
  },
  {
    question: "What does the ₹199 onboarding fee cover?",
    answer:
      "A one-time fee that covers your store setup, profile verification, onboarding assistance, and founding creator benefits. This is a limited-time pre-launch price — the standard fee will be ₹299 after launch. There are no recurring subscription charges.",
  },
  {
    question: "Is the platform live yet?",
    answer:
      "Not yet. We're currently in pre-launch and building the platform. Early Access applications are open now, and founding creators will be the first to go live when we launch. We're targeting a beta launch in Q3 2025.",
  },
  {
    question: "What categories are supported?",
    answer:
      "Art & Craft, Candles, Pottery, Jewelry, Resin Art, Crochet, Home Decor, DIY Kits, Paintings, Fashion Accessories, Customized Gifts, and Small Businesses. More categories will be added based on creator demand.",
  },
  {
    question: "How does payment work?",
    answer:
      "Customers pay securely through the platform using standard payment methods — UPI, cards, net banking, and wallets. Payments are processed securely and creators receive payouts on a regular schedule. No more manual UPI screenshots or payment follow-ups.",
  },
  {
    question: "Can I sell on other platforms too?",
    answer:
      "Absolutely. Ekora complements your existing sales channels. You can continue selling through Instagram, WhatsApp, or any other platform. Ekora simply gives you a professional storefront and commerce tools to convert more of your audience into customers.",
  },
  {
    question: "How do I get support?",
    answer:
      "Founding creators get direct access to our team via WhatsApp and email. We're a small team right now, which means you'll be talking to the people actually building the platform. Your feedback directly shapes what we build next.",
  },
];

export default function FAQContent() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-zinc-900 mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            Everything you need to know about Ekora and the Early Access
            program.
          </p>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-24 bg-white px-6">
        <div className="max-w-2xl mx-auto">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-zinc-200">
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between py-6 text-left"
              >
                <span className="font-medium text-zinc-900 pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-zinc-400 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ease-out ${
                  openIndex === i ? "max-h-96 pb-6" : "max-h-0"
                }`}
              >
                <p className="text-zinc-600 leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
