import { NextRequest, NextResponse } from "next/server";
import {
  filterAndSortCatalogProducts,
  ProductFilterParams
} from "@/lib/product-filters";
import {
  sanitizeSearchQuery,
  expandQueryTokens
} from "@/lib/search";
import { getUnifiedCatalog } from "@/lib/catalog";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const filterParams: ProductFilterParams = {
    q: searchParams.get("q"),
    category: searchParams.get("category"),
    department: searchParams.get("department"),
    discipline: searchParams.get("discipline"),
    priceOption: searchParams.get("priceOption"),
    minPrice: searchParams.get("minPrice"),
    maxPrice: searchParams.get("maxPrice"),
    inStockOnly: searchParams.get("inStockOnly"),
    sort: searchParams.get("sort") || searchParams.get("sortBy") || searchParams.get("order"),
    page: searchParams.get("page") || "1",
    limit: searchParams.get("limit") || "48",
  };

  // Authoritative curated catalog merged with active 3rd-party marketplace seller products
  const { catalog: allProducts, facets: baseFacets } = await getUnifiedCatalog();

  // Filter & sort using unified pure engine
  const result = filterAndSortCatalogProducts(allProducts, filterParams);
  const normalizedQ = sanitizeSearchQuery(filterParams.q);
  const searchTokens = normalizedQ ? expandQueryTokens(normalizedQ) : [];
  const hasSearch = Boolean(normalizedQ);
  const hasMore = result.page * result.limit < result.total;

  return NextResponse.json({
    items: result.items,
    products: result.items,
    total: result.total,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      hasMore,
      hasNextPage: hasMore
    },
    facets: baseFacets,
    searchMeta: hasSearch ? {
      query: normalizedQ,
      tokens: searchTokens,
      expanded: searchTokens.length > (normalizedQ ? normalizedQ.split(' ').length : 0)
    } : null
  }, {
    headers: {
      "Cache-Control": hasSearch
        ? "public, s-maxage=60, stale-while-revalidate=300"
        : "public, s-maxage=300, stale-while-revalidate=86400",
    }
  });
}
