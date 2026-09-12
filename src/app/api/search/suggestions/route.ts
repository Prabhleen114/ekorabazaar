import { NextRequest, NextResponse } from "next/server";
import catalogProducts from "@/lib/data/products.json";
import { DEPARTMENTS } from "@/lib/taxonomy";
import { sanitizeSearchQuery, expandQueryTokens } from "@/lib/search";
import prisma from "@/lib/db";
import { ProductStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export interface SuggestionItem {
  type: "product" | "category" | "trending";
  label: string;
  href: string;
  category?: string;
  price?: number;
  image?: string;
  badge?: string;
  score?: number;
}

const TRENDING_B2B_SEARCHES: SuggestionItem[] = [
  { type: "trending", label: "Soy Wax 464 Wholesale", href: "/shop?q=Soy+Wax+464", badge: "High Demand" },
  { type: "trending", label: "Silicone Candle Moulds Wholesale", href: "/shop?q=Silicone+Candle+Moulds", badge: "Top Category" },
  { type: "trending", label: "IFRA Certified Fragrance Oils", href: "/shop?category=Fragrance+%26+Flavour+Oils", badge: "Lab-Tested" },
  { type: "trending", label: "Amber Glass Jars with Metal Lids", href: "/shop?q=Amber+Glass+Jars", badge: "Packaging" },
  { type: "trending", label: "Melt & Pour Soap Base (SLS-Free)", href: "/shop?q=Melt+and+Pour+Soap+Base", badge: "Raw Material" },
  { type: "trending", label: "Cosmetic Mica Powder Pigments", href: "/shop?category=Colourants+%26+Pigments", badge: "Bulk Supplier" }
];

let suggestionIndex: SuggestionItem[] | null = null;

function buildSuggestionIndex(): SuggestionItem[] {
  if (suggestionIndex) return suggestionIndex;

  const entries: SuggestionItem[] = [];

  // 1. Categories from taxonomy
  for (const dept of DEPARTMENTS) {
    for (const sub of dept.subcategories) {
      entries.push({
        type: "category",
        label: sub,
        href: "/shop?category=" + encodeURIComponent(sub),
        category: dept.name,
        score: 12
      });
    }
  }

  // 2. Full product catalog indexing with rich metadata (thumbnails, category, wholesale pricing)
  const seen = new Set<string>();
  for (const p of catalogProducts as any[]) {
    const name = (p.name || p.title || "").trim();
    const id = String(p.id);
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());

    entries.push({
      type: "product",
      label: name,
      href: "/products/" + id,
      category: p.category || undefined,
      price: typeof p.price === "number" ? p.price : undefined,
      image: p.image || undefined,
      score: 5
    });
  }

  suggestionIndex = entries;
  return suggestionIndex;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQ = searchParams.get("q");

    const normalized = sanitizeSearchQuery(rawQ);

    // If query is absent or < 2 characters, return trending B2B keywords instantly
    if (!normalized || normalized.length < 2) {
      return NextResponse.json(
        { suggestions: [], trending: TRENDING_B2B_SEARCHES },
        { headers: { "Cache-Control": "public, s-maxage=300" } }
      );
    }

    const query = normalized.substring(0, 150).toLowerCase();
    const tokens = expandQueryTokens(query);

    const index = buildSuggestionIndex();

    // Score and filter matches
    const scored: Array<{ entry: SuggestionItem; score: number }> = [];

    for (const entry of index) {
      const label = entry.label.toLowerCase();
      const cat = (entry.category || "").toLowerCase();
      let score = 0;

      // Exact phrase match
      if (label.startsWith(query)) score += 120;
      else if (label.includes(query)) score += 70;

      // Category matching
      if (cat.includes(query)) score += 30;

      // Token-level matching
      for (const token of tokens) {
        if (token.length < 2) continue;
        if (label.startsWith(token)) score += 25;
        else if (label.includes(token)) score += 10;
        if (cat.includes(token)) score += 8;
      }

      // Bonus for categories
      if (entry.type === "category" && score > 0) score += 10;

      if (score > 0) {
        scored.push({ entry, score: score + (entry.score || 0) });
      }
    }

    // Sort scored entries
    scored.sort((a, b) => b.score - a.score);
    let topSuggestions = scored.slice(0, 8).map(s => s.entry);

    // Database lookup for recently published seller products
    try {
      const dbMatches = await prisma.product.findMany({
        where: {
          status: ProductStatus.PUBLISHED,
          title: { contains: normalized, mode: "insensitive" }
        },
        select: {
          id: true,
          title: true,
          category: true,
          price: true,
          customerPrice: true,
          imageUrl: true
        },
        take: 4
      });

      for (const row of dbMatches) {
        const productHref = "/products/" + row.id;
        if (!topSuggestions.some(s => s.href === productHref)) {
          topSuggestions.push({
            type: "product",
            label: row.title,
            href: productHref,
            category: row.category || undefined,
            price: Math.round((row.customerPrice ?? row.price) / 100),
            image: row.imageUrl || undefined,
            score: 0
          });
        }
      }
    } catch (e) {
      console.error("DB suggestion query error:", e);
    }

    // Slice and deduplicate by href
    const seen = new Set<string>();
    const suggestions: SuggestionItem[] = [];
    for (const entry of topSuggestions.slice(0, 8)) {
      if (!seen.has(entry.href)) {
        seen.add(entry.href);
        suggestions.push({
          type: entry.type,
          label: entry.label,
          href: entry.href,
          category: entry.category,
          price: entry.price,
          image: entry.image,
          badge: entry.badge
        });
      }
    }

    return NextResponse.json(
      { suggestions, trending: TRENDING_B2B_SEARCHES, query: normalized },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("Search suggestions error:", error);
    return NextResponse.json({ suggestions: [], trending: TRENDING_B2B_SEARCHES }, { status: 500 });
  }
}
