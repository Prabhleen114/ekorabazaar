"use client";

import { useState } from "react";
import { Check, Shield, ArrowRight } from "lucide-react";

const benefits = [
  "Professional storefront with your brand",
  "Secure payments — no more DM transactions",
  "Analytics dashboard to track your growth",
  "Direct support from the founding team",
];

const categoryOptions = [
  "Art & Craft",
  "Resin Art",
  "Crochet",
  "Candles",
  "Pottery",
  "Jewelry",
  "Home Decor",
  "DIY Kits",
  "Paintings",
  "Fashion Accessories",
  "Customized Gifts",
  "Small Businesses",
];

export default function StartSellingContent() {
  const [formData, setFormData] = useState({
    fullName: "",
    instagram: "",
    category: "",
    description: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send data to an API
    setSubmitted(true);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-zinc-900 mb-6">
            Become a Founding Creator
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            Join the first 100 creators on Ekora. Shape the platform, get
            exclusive benefits, and be ready to sell from day one.
          </p>
        </div>
      </section>

      {/* Two-column layout */}
      <section className="py-24 bg-white px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left — Benefits */}
            <div className="flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-zinc-900 mb-8">
                What you get as a founding creator
              </h2>
              <ul className="space-y-5 mb-10">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <span className="text-zinc-600">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-8">
                <h3 className="text-lg font-bold text-zinc-900 mb-2">
                  Early Access Pricing
                </h3>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-3xl font-bold text-zinc-900">₹199</span>
                  <span className="text-lg text-zinc-400 line-through">
                    ₹299
                  </span>
                  <span className="text-xs font-medium text-green-500 bg-green-50 px-2 py-1 rounded-full">
                    Pre-launch price
                  </span>
                </div>
                <p className="text-sm text-zinc-500">
                  One-time onboarding fee. No recurring subscriptions, no hidden
                  charges.
                </p>
              </div>
            </div>

            {/* Right — Form */}
            <div>
              {submitted ? (
                <div className="border border-zinc-200 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-3">
                    Application Received
                  </h3>
                  <p className="text-zinc-500 max-w-sm mx-auto">
                    Thank you for applying! We&apos;ll review your profile and
                    get back to you within 48 hours via Instagram DM or email.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="border border-zinc-200 rounded-2xl p-8"
                >
                  <h3 className="text-xl font-bold text-zinc-900 mb-6">
                    Apply for Early Access
                  </h3>

                  <div className="space-y-5">
                    {/* Full Name */}
                    <div>
                      <label
                        htmlFor="fullName"
                        className="block text-sm font-medium text-zinc-700 mb-2"
                      >
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        placeholder="Your full name"
                        className="w-full border border-zinc-200 rounded-xl py-3 px-4 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-transparent transition-shadow duration-200"
                      />
                    </div>

                    {/* Instagram Handle */}
                    <div>
                      <label
                        htmlFor="instagram"
                        className="block text-sm font-medium text-zinc-700 mb-2"
                      >
                        Instagram Handle
                      </label>
                      <input
                        type="text"
                        id="instagram"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleChange}
                        required
                        placeholder="@yourhandle"
                        className="w-full border border-zinc-200 rounded-xl py-3 px-4 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-transparent transition-shadow duration-200"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label
                        htmlFor="category"
                        className="block text-sm font-medium text-zinc-700 mb-2"
                      >
                        Category
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="w-full border border-zinc-200 rounded-xl py-3 px-4 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-transparent transition-shadow duration-200 bg-white"
                      >
                        <option value="" disabled>
                          Select your category
                        </option>
                        {categoryOptions.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-zinc-700 mb-2"
                      >
                        Tell us about your products
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        placeholder="What do you make? What makes your products unique?"
                        className="w-full border border-zinc-200 rounded-xl py-3 px-4 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-transparent transition-shadow duration-200 resize-none"
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white font-medium py-4 rounded-xl hover:bg-zinc-800 transition-colors duration-200"
                    >
                      Apply for Early Access
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Security note */}
                  <div className="flex items-center gap-2 mt-5 text-xs text-zinc-400">
                    <Shield className="w-4 h-4 flex-shrink-0" />
                    <span>
                      Your information is secure and will only be used for
                      onboarding purposes.
                    </span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
