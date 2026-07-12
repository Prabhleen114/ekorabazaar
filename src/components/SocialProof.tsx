export default function SocialProof() {
  const quotes = [
    {
      quote: "Finally, a platform that understands how we actually sell. No more DM chaos.",
      name: "Riya M.",
      role: "Candle Maker, Pune",
      initials: "RM",
      color: "bg-brand-orange/10 text-brand-orange",
    },
    {
      quote: "I applied in 2 minutes. The team set up my store for me. I just had to add products.",
      name: "Sana K.",
      role: "Jewelry Creator, Jaipur",
      initials: "SK",
      color: "bg-brand-sage/10 text-brand-sage",
    },
    {
      quote: "My buyers actually trust buying from me now. Orders doubled in the first week.",
      name: "Anjali S.",
      role: "Resin Artist, Mumbai",
      initials: "AS",
      color: "bg-brand-terracotta/10 text-brand-terracotta",
    },
  ];

  return (
    <section className="bg-brand-bg border-t border-brand-linen py-16">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-brand-charcoal/40 mb-10">
          What founding creators say
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {quotes.map((q, i) => (
            <div key={i} className="bg-white border border-brand-linen rounded-2xl p-6 shadow-sm">
              <p className="text-brand-charcoal/80 leading-relaxed mb-6 text-sm">&ldquo;{q.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${q.color}`}>
                  {q.initials}
                </div>
                <div>
                  <div className="font-semibold text-brand-charcoal text-sm">{q.name}</div>
                  <div className="text-xs text-brand-charcoal/50">{q.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
