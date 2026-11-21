import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import catalogProducts from '@/lib/data/products.json';
import { calculateItemPrice } from '@/lib/pricing';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cartIdsRaw = searchParams.get('cartProductIds') || '';
    const gap = parseFloat(searchParams.get('gap') || '0');
    const cartProductIds = cartIdsRaw ? cartIdsRaw.split(',').filter(Boolean) : [];

    // 1. Fetch active recommendation rules from DB if present
    let recConsequents: Array<{ productId: string; score: number }> = [];
    try {
      const activeState = await (prisma as any).recModelState.findUnique({
        where: { id: 1 },
      });

      if (activeState && cartProductIds.length > 0) {
        const rules = await (prisma as any).recRule.findMany({
          where: {
            modelVersion: activeState.activeVersion,
            antecedent: { hasSome: cartProductIds },
            NOT: { consequent: { in: cartProductIds } },
          },
          take: 20,
        });

        for (const rule of rules) {
          recConsequents.push({
            productId: rule.consequent,
            score: Number(rule.lift) * Number(rule.confidence),
          });
        }
      }
    } catch (e) {
      // Graceful fallback to catalog bestsellers
    }

    // 2. Load candidate products from catalog
    const candidateProducts: any[] = [];
    const seenIds = new Set<string>(cartProductIds);

    // Filter catalog items
    for (const p of catalogProducts as any[]) {
      const pId = String(p.id);
      if (seenIds.has(pId)) continue;
      if (p.inStock === false) continue;
      if (p.isQuoteOnly) continue;

      const priceINR = calculateItemPrice(p, 1);
      if (priceINR <= 0) continue;

      // Base score
      let score = 1.0;
      const ruleMatch = recConsequents.find(r => r.productId === pId);
      if (ruleMatch) {
        score += ruleMatch.score * 2.0;
      }

      // Gap-fit boost: +1.5x if a single purchase of this item clears the gap!
      let closesGap = false;
      if (gap > 0 && priceINR >= gap && priceINR <= gap + 500) {
        score *= 2.5;
        closesGap = true;
      } else if (gap > 0 && priceINR >= gap) {
        score *= 1.5;
        closesGap = true;
      }

      candidateProducts.push({
        id: pId,
        title: p.name || p.title || 'Product',
        price: priceINR,
        originalPrice: p.mrp || Math.round(priceINR * 1.3),
        image: p.image || '/placeholder-product.svg',
        category: p.category || 'Supplies',
        score,
        closesGap,
        newGapAfter: Math.max(0, gap - priceINR),
      });
    }

    // Sort by score descending and take top 6
    candidateProducts.sort((a, b) => b.score - a.score);
    const topRecs = candidateProducts.slice(0, 6);

    return NextResponse.json({
      success: true,
      recommendations: topRecs,
    });
  } catch (err: any) {
    console.error('Error in recommendations route:', err);
    return NextResponse.json({ error: 'Failed to load recommendations' }, { status: 500 });
  }
}
