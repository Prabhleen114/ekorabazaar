import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
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

    // 2. Load candidate products from Database
    const dbCandidates = await prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        supplierAvailable: true,
        stock: { gt: 0 },
        id: cartProductIds.length > 0 ? { notIn: cartProductIds } : undefined,
      },
      take: 40,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        price: true,
        customerPrice: true,
        imageUrl: true,
        category: true,
        wholesaleTiers: true,
        source: true,
      },
    });

    const candidateProducts: any[] = [];
    for (const p of dbCandidates) {
      const pId = String(p.id);
      const priceINR = calculateItemPrice(p, 1);
      if (priceINR <= 0) continue;

      let score = 1.0;
      const ruleMatch = recConsequents.find(r => r.productId === pId);
      if (ruleMatch) {
        score += ruleMatch.score * 2.0;
      }

      let closesGap = false;
      if (gap > 0 && priceINR >= gap && priceINR <= gap + 500) {
        score *= 2.5;
        closesGap = true;
      } else if (gap > 0 && priceINR >= gap) {
        score *= 1.5;
        closesGap = true;
      }

      const originalPrice = p.customerPrice
        ? Math.round(p.customerPrice / 100)
        : Math.round(priceINR * 1.3);

      candidateProducts.push({
        id: pId,
        title: p.title || 'Product',
        price: priceINR,
        originalPrice,
        image: p.imageUrl || '/og-image.jpg',
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
  } catch (error: any) {
    console.error('Error generating checkout recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load recommendations', recommendations: [] },
      { status: 500 }
    );
  }
}
