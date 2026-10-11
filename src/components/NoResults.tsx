
import Link from 'next/link';

export default function NoResults() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <h2 className="text-2xl font-semibold mb-2">No Products Found</h2>
      <p className="text-stone-500 max-w-md mb-6">We couldn't find any products matching your current filters. Try adjusting your search or explore our popular categories.</p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link href="/wholesale/candle-waxes-additives" className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-full text-sm font-medium transition-colors">Candle Waxes</Link>
        <Link href="/wholesale/artisan-soap-bases" className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-full text-sm font-medium transition-colors">Soap Bases</Link>
        <Link href="/shop" className="px-4 py-2 bg-stone-800 text-white rounded-full text-sm font-medium transition-colors">Clear All Filters</Link>
      </div>
    </div>
  );
}
