export default function Loading() {
  return (
    <div className="pt-24 md:pt-28 pb-20 px-6 max-w-6xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-12 animate-pulse">
      {/* Image skeleton */}
      <div className="w-full md:w-1/2">
        <div className="aspect-square bg-brand-linen/60 rounded-3xl" />
      </div>
      {/* Product info skeleton */}
      <div className="w-full md:w-1/2 space-y-4 pt-4">
        <div className="h-3 bg-brand-linen/80 rounded w-1/4" />
        <div className="h-8 bg-brand-linen/80 rounded w-4/5" />
        <div className="h-8 bg-brand-linen/80 rounded w-3/5" />
        <div className="h-4 bg-brand-linen/80 rounded w-full mt-4" />
        <div className="h-4 bg-brand-linen/80 rounded w-5/6" />
        <div className="h-4 bg-brand-linen/80 rounded w-4/6" />
        <div className="h-32 bg-brand-linen/60 rounded-2xl mt-6" />
        <div className="h-14 bg-brand-linen/60 rounded-xl" />
      </div>
    </div>
  );
}
