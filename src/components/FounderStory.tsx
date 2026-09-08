export default function FounderStory() {
  return (
    <section className="bg-white border-t border-zinc-200 py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 md:mb-20">
          <span className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-2 block">
            Our Story
          </span>
          <h2 className="text-4xl md:text-5xl font-bold font-serif tracking-tight text-zinc-900">
            Why We Built Ekora.
          </h2>
        </div>

        <div className="grid md:grid-cols-[1.2fr_1fr] lg:grid-cols-[1.5fr_1fr] gap-12 md:gap-20 items-start">
          {/* LEFT SIDE — ORGANIZED STORY */}
          <div className="space-y-8">
            
            {/* SECTION 1 */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-zinc-900">We Saw the Struggle.</h3>
              <div className="text-lg text-zinc-600 leading-relaxed space-y-4">
                <p>We watched talented creators pour their hearts into what they make.</p>
                <p>They create beautiful products, build communities, and spend months earning the trust of their audience. But when it comes time to sell, they are pushed into a system that was never really built for them.</p>
              </div>
            </div>

            {/* SECTION 2 */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-zinc-900">Everything Happens in a DM.</h3>
              <div className="text-lg text-zinc-600 leading-relaxed space-y-4">
                <p>A customer discovers a product on Instagram.</p>
                <p>Then comes the endless back and forth.</p>
                
                <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-5 my-4 italic text-zinc-600 space-y-2">
                  <p>&quot;Is this available?&quot;</p>
                  <p>&quot;What&apos;s the price?&quot;</p>
                  <p>&quot;Where should I send the money?&quot;</p>
                  <p>&quot;Please share your address.&quot;</p>
                  <p>&quot;Your order is confirmed.&quot;</p>
                </div>

                <div className="space-y-2 text-zinc-700 font-medium">
                  <p>No proper storefront.<br/>
                  No simple checkout.<br/>
                  No order tracking.<br/>
                  No structure.</p>
                </div>

                <p>For the creator, every sale becomes manual work.<br/>
                For the customer, every purchase becomes a leap of trust.</p>
              </div>
            </div>

            {/* SECTION 3 */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-zinc-900">The Creator Deserves Better.</h3>
              <div className="text-lg text-zinc-600 leading-relaxed space-y-4">
                <p>A creator&apos;s brand should not disappear into hundreds of scattered conversations.</p>
                <p>The business they worked so hard to build deserves a real home — a place where customers can discover products, shop with confidence, and come back again.</p>
                <p>Creators should be spending more time creating, not managing spreadsheets, payment screenshots, addresses, and order updates.</p>
              </div>
            </div>

            {/* SECTION 4 */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-brand-orange">So We Built Ekora.</h3>
              <div className="text-lg text-zinc-600 leading-relaxed space-y-4">
                <p>Ekora is our answer to that broken experience.</p>
                <p>We are building the commerce infrastructure creators deserve — professional storefronts, product discovery, secure checkout, order tracking, and the tools needed to turn an audience into a real, sustainable business.</p>
                <p>Because creators should be able to focus on what they do best:</p>
                <p className="font-bold text-zinc-900 text-xl">Creating.</p>
              </div>
            </div>

          </div>

          {/* RIGHT SIDE — FOUNDERS */}
          <div className="flex flex-col gap-6">
            
            {/* FOUNDER 1 */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 lg:p-8 flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-brand-orange/10 border-2 border-brand-orange/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-brand-orange">PK</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Prabhleen Kaur</h3>
                  <p className="text-sm font-medium text-zinc-500">Co-Founder</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-zinc-600 leading-relaxed">Passionate about empowering creators with the tools and confidence they need to build something sustainable.</p>
                <blockquote className="text-sm font-medium text-zinc-800 italic border-l-2 border-brand-orange/30 pl-3 py-1">
                  &quot;Creators don&apos;t need more motivation. They need the right infrastructure.&quot;
                </blockquote>
              </div>
            </div>

            {/* FOUNDER 2 */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 lg:p-8 flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-brand-sage/10 border-2 border-brand-sage/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-brand-sage">KA</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Kumar Aryan</h3>
                  <p className="text-sm font-medium text-zinc-500">Co-Founder</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-zinc-600 leading-relaxed">Building the technology and commerce infrastructure that bridges the gap between social media and real business.</p>
                <blockquote className="text-sm font-medium text-zinc-800 italic border-l-2 border-brand-sage/30 pl-3 py-1">
                  &quot;Technology should remove friction, not create more.&quot;
                </blockquote>
              </div>
            </div>

          </div>
        </div>

        {/* OPTIONAL ENDING */}
        <div className="mt-16 md:mt-20 text-center max-w-3xl mx-auto border-t border-zinc-100 pt-12 md:pt-16">
          <p className="text-xl md:text-2xl font-serif text-zinc-800 leading-relaxed">
            &quot;Ekora isn&apos;t just a platform we&apos;re building. <br className="hidden md:block" />
            <span className="text-zinc-500 text-lg md:text-xl mt-2 block">It&apos;s the beginning of a better way for creators to turn what they love into something lasting.&quot;</span>
          </p>
        </div>

      </div>
    </section>
  );
}
