export default function FounderStory() {
  return (
    <section className="bg-white border-t border-zinc-200 py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-2 block">
            Our Story
          </span>
          <h2 className="text-4xl md:text-5xl font-bold font-serif tracking-tight text-zinc-900">
            Why We Built Ekora.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div className="space-y-6 text-lg text-zinc-600 leading-relaxed">
            <p>
              We started Ekora after watching hundreds of talented Instagram creators struggle with the same broken system. A customer discovers a beautiful handmade candle on Instagram, DMs the creator, negotiates the price, transfers money via UPI, shares their address in a chat, and then waits — with no tracking, no receipt, and no recourse if something goes wrong.
            </p>
            <p>
              This fragmented experience hurts everyone. Creators lose sales because the process is too complicated. Buyers hesitate because there&apos;s no trust layer. And the creator&apos;s brand — built through months of content creation — gets reduced to a DM conversation.
            </p>
            <p>
              Ekora exists to fix this. We&apos;re building the commerce infrastructure that Instagram creators deserve — professional storefronts, secure checkout, order tracking, and analytics — so creators can focus on what they do best: creating.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-brand-orange/10 border-2 border-brand-orange/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-brand-orange">PK</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Prabhleen Kaur</h3>
                <p className="text-sm font-medium text-zinc-500 mb-3">Co-Founder</p>
                <p className="text-sm text-zinc-600">Passionate about empowering creators with the tools they need to build sustainable businesses.</p>
              </div>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 flex items-start gap-4">
               <div className="w-20 h-20 rounded-full bg-brand-sage/10 border-2 border-brand-sage/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-brand-sage">KA</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Kumar Aryan</h3>
                <p className="text-sm font-medium text-zinc-500 mb-3">Co-Founder</p>
                <p className="text-sm text-zinc-600">Building the commerce infrastructure that bridges the gap between social media and real business.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
