export default function Loading() {
  return (
    <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-8 animate-pulse">
      {/* Sidebar skeleton */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="bg-white rounded-2xl p-6 border border-brand-linen h-96" />
      </aside>

      {/* Products skeleton */}
      <div className="flex-1">
        {/* Topbar skeleton */}
        <div className="bg-white p-4 rounded-xl border border-brand-linen mb-6 h-14" />
        {/* Grid skeleton - matches exact product card structure */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-2xl overflow-hidden border border-brand-linen flex flex-col">
              {/* Image area */}
              <div className="aspect-square bg-brand-linen/60" />
              {/* Text area */}
              <div className="p-5 flex-1 flex flex-col gap-2">
                <div className="h-3 bg-brand-linen/80 rounded w-1/3" />
                <div className="h-4 bg-brand-linen/80 rounded w-4/5" />
                <div className="h-4 bg-brand-linen/80 rounded w-3/5" />
                <div className="mt-auto pt-4 flex justify-between">
                  <div className="h-5 bg-brand-linen/80 rounded w-1/4" />
                  <div className="h-5 bg-brand-linen/80 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
