import { Award, Eye, Headphones, Rocket, Users, TrendingUp } from "lucide-react";

export default function WhyJoinEarly() {
  const benefits = [
    {
      icon: Award,
      title: "Founding Creator Badge",
      description: "Permanent recognition as one of Ekora's first 100 creators. Exclusive badge on your store.",
    },
    {
      icon: Eye,
      title: "Priority Visibility",
      description: "Your products will be featured prominently when the marketplace launches. Early creators get maximum exposure.",
    },
    {
      icon: Headphones,
      title: "Dedicated Support",
      description: "Personal onboarding, store setup assistance, and a direct line to the founding team.",
    },
    {
      icon: Rocket,
      title: "Early Feature Access",
      description: "Be the first to try new features. Help shape the platform with your direct feedback.",
    },
    {
      icon: Users,
      title: "Community Access",
      description: "Join an exclusive WhatsApp community of founding creators. Network, collaborate, grow together.",
    },
    {
      icon: TrendingUp,
      title: "Growth Tools",
      description: "Analytics dashboard, order management, and marketing tools built specifically for Instagram creators.",
    },
  ];

  return (
    <section className="bg-zinc-50 border-t border-zinc-200 py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-2 block">
            Why Join Early
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-4">
            Founding Creator Benefits.
          </h2>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            We are building this platform for you. Join the first cohort of 100 creators and get lifetime perks that will never be offered again.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white border border-zinc-200 rounded-2xl p-8 hover:-translate-y-0.5 transition-transform duration-200">
              <div className="w-12 h-12 rounded-xl bg-brand-linen flex items-center justify-center mb-6">
                <benefit.icon className="w-6 h-6 text-brand-charcoal/70" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">{benefit.title}</h3>
              <p className="text-zinc-500 leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
