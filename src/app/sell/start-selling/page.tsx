"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle2, Shield, Loader2 } from "lucide-react";

export default function StartSellingPage() {
  const [formData, setFormData] = useState({
    name: "",
    handle: "",
    category: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.handle.trim() || !formData.category) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, source: "start-selling-page" }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again or contact support on WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    "Founding Creator Badge",
    "Priority Marketplace Visibility",
    "Dedicated Store Setup Support",
    "Early Access to Future Features",
  ];

  return (
    <main className="min-h-screen bg-brand-bg text-brand-charcoal">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 text-center border-b border-brand-linen bg-brand-bg">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold font-serif tracking-tight text-brand-charcoal mb-6">
            Become a Founding Creator
          </h1>
          <p className="text-xl text-brand-charcoal/60 leading-relaxed">
            Join the exclusive first cohort of 100 independent creators and help shape the future of commerce in India.
          </p>
        </div>
      </section>

      {/* Application Form Section */}
      <section className="py-24 bg-brand-bg">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            
            {/* Left: Benefits & Pricing */}
            <div className="space-y-12">
              <div>
                <h2 className="text-3xl font-bold text-brand-charcoal mb-6 font-serif">What you get</h2>
                <ul className="space-y-4">
                  {benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-3 font-medium text-brand-charcoal/80">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 border border-brand-sage/20 flex items-center justify-center text-brand-sage flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-8 bg-white border border-brand-linen rounded-3xl shadow-xl shadow-brand-charcoal/5">
                <h3 className="text-xl font-bold text-brand-charcoal mb-2 font-serif">One-Time Onboarding Fee</h3>
                <p className="text-sm font-medium text-brand-charcoal/50 mb-6">Limited strictly to the first 100 approved creators.</p>
                <div className="flex items-end gap-3">
                  <div className="text-5xl font-bold text-brand-charcoal">₹199</div>
                  <div className="text-xl font-medium text-brand-charcoal/40 line-through mb-1">₹299</div>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div>
              <div className="bg-white border border-brand-linen rounded-3xl p-8 shadow-xl shadow-brand-charcoal/5">
                {submitted ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-brand-charcoal mb-2 font-serif">Application Submitted!</h3>
                    <p className="text-brand-charcoal/60 leading-relaxed mb-1">
                      We have received your application.
                    </p>
                    <p className="text-sm text-brand-charcoal/40">
                      Our team will reach out to you via email/WhatsApp within 48 hours.
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-brand-charcoal mb-6 font-serif">Apply for Early Access</h3>
                    
                    <form className="space-y-5" onSubmit={handleSubmit}>
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-medium">
                          {error}
                        </div>
                      )}
                      
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-brand-charcoal/70 mb-1.5">Full Name *</label>
                        <input 
                          type="text" 
                          id="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your Name" 
                          className="w-full px-4 py-3 rounded-xl bg-white border border-brand-linen focus:outline-none focus:ring-2 focus:ring-brand-orange/30 text-brand-charcoal placeholder:text-brand-charcoal/30"
                        />
                      </div>

                      <div>
                        <label htmlFor="handle" className="block text-sm font-medium text-brand-charcoal/70 mb-1.5">Instagram Handle *</label>
                        <input 
                          type="text" 
                          id="handle"
                          required
                          value={formData.handle}
                          onChange={handleChange}
                          placeholder="@yourstore" 
                          className="w-full px-4 py-3 rounded-xl bg-white border border-brand-linen focus:outline-none focus:ring-2 focus:ring-brand-orange/30 text-brand-charcoal placeholder:text-brand-charcoal/30"
                        />
                      </div>

                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-brand-charcoal/70 mb-1.5">Primary Category *</label>
                        <select 
                          id="category"
                          required
                          value={formData.category}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-brand-linen focus:outline-none focus:ring-2 focus:ring-brand-orange/30 text-brand-charcoal"
                        >
                          <option value="" disabled>Select a category...</option>
                          <option value="art">Art & Craft</option>
                          <option value="candles">Candles</option>
                          <option value="pottery">Pottery</option>
                          <option value="jewelry">Jewelry</option>
                          <option value="decor">Home Decor</option>
                          <option value="fashion">Fashion & Accessories</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-brand-charcoal/70 mb-1.5">Tell us about your products</label>
                        <textarea 
                          id="description"
                          rows={4}
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Briefly describe what you make and sell..." 
                          className="w-full px-4 py-3 rounded-xl bg-white border border-brand-linen focus:outline-none focus:ring-2 focus:ring-brand-orange/30 text-brand-charcoal placeholder:text-brand-charcoal/30 resize-none"
                        />
                      </div>

                      <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 rounded-xl bg-brand-orange hover:bg-brand-terracotta text-white font-semibold text-lg transition-all duration-200 shadow-lg shadow-brand-orange/20 hover:scale-[1.01] active:scale-[0.99] mt-2 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          "Submit Application →"
                        )}
                      </button>
                    </form>
                  </>
                )}

                <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-brand-charcoal/40">
                  <Shield className="w-4 h-4 text-brand-sage" /> Your information is secure.
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
