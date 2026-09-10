import { NextRequest, NextResponse } from "next/server";
import catalogProducts from "@/lib/data/products.json";
import { getDepartmentForCategory, DEPARTMENTS } from "@/lib/taxonomy";
import { sanitizeSearchQuery, expandQueryTokens } from "@/lib/search";

import prisma from "@/lib/db";
export const dynamic = 'force-dynamic';

// ── Pre-built suggestion index (singleton) ──────────────────────────────────
// Built once per serverless warm instance from the static JSON catalog.

interface SuggestionEntry {
  type: 'product' | 'category';
  label: string;
  href: string;
  score: number; // for tie-breaking
}

let suggestionIndex: SuggestionEntry[] | null = null;

function buildSuggestionIndex(): SuggestionEntry[] {
  if (suggestionIndex) return suggestionIndex;

  const entries: SuggestionEntry[] = [];

  // 1. Categories from taxonomy
  for (const dept of DEPARTMENTS) {
    for (const sub of dept.subcategories) {
      entries.push({
        type: 'category',
        label: sub,
        href: '/shop?category=' + encodeURIComponent(sub),
        score: 10
      });
    }
  }

  // 2. Unique product names from catalog (sample — top 800 to keep index small)
  const seen = new Set<string>();
  let count = 0;
  for (const p of catalogProducts as any[]) {
    if (count >= 800) break;
    const name = (p.name || p.title || '').trim();
    const id = String(p.id);
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    entries.push({
      type: 'product',
      label: name,
      href: '/products/' + id,
      score: 5
    });
    count++;
  }

  suggestionIndex = entries;
  return suggestionIndex;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQ = searchParams.get("q");

    // Require at least 2 characters
    const normalized = sanitizeSearchQuery(rawQ);
    if (!normalized || normalized.length < 2) {
      return NextResponse.json({ suggestions: [] }, {
        headers: { "Cache-Control": "public, s-maxage=60" }
      });
    }

    // Limit to 200 chars
    const query = normalized.substring(0, 200);
    const tokens = expandQueryTokens(query);

    const index = buildSuggestionIndex();

    // Score and filter
    const scored: Array<{ entry: SuggestionEntry; score: number }> = [];

    for (const entry of index) {
      const label = entry.label.toLowerCase();
      let score = 0;

      // Exact match at start
      if (label.startsWith(query)) score += 100;
      else if (label.includes(query)) score += 60;

      // Token matches
      for (const token of tokens) {
        if (token.length < 2) continue;
        if (label.startsWith(token)) score += 20;
        else if (label.includes(token)) score += 8;
      }

      // Prefer categories slightly for discovery
      if (entry.type === 'category' && score > 0) score += 5;

      if (score > 0) {
        scored.push({ entry, score: score + entry.score });
      }
    }

    // Sort in-memory suggestions
    scored.sort((a, b) => b.score - a.score);
    let topSuggestions = scored.slice(0, 6).map(s => s.entry);

    // Also fetch top 3 matching products from PostgreSQL directly
    try {
      // Use parameterized Prisma query to prevent SQL injection
      const likePattern = `%${query}%`;
      const dbMatches = await prisma.$queryRaw<any[]>`
        SELECT id, title
        FROM "Product"
        WHERE status = 'PUBLISHED'
          AND (title ILIKE ${likePattern} OR similarity(title, ${query}) > 0.3)
        ORDER BY similarity(title, ${query}) DESC
        LIMIT 4
      `;

      for (const row of dbMatches) {
        if (!topSuggestions.some(s => s.href === '/products/' + row.id)) {
          topSuggestions.push({
            type: 'product',
            label: row.title,
            href: '/products/' + row.id,
            score: 0
          });
        }
      }
    } catch (e) {
      console.error("DB suggestion error:", e);
    }

    // Slice to final 8 items
    topSuggestions = topSuggestions.slice(0, 8);

    // Deduplicate by href
    const seen = new Set<string>();
    const suggestions: Array<{ type: string; label: string; href: string }> = [];
    for (const entry of topSuggestions) {
      if (!seen.has(entry.href)) {
        seen.add(entry.href);
        suggestions.push({ type: entry.type, label: entry.label, href: entry.href });
      }
    }

    return NextResponse.json(
      { suggestions, query: normalized },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("Search suggestions error:", error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
