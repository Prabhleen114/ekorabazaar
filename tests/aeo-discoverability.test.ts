import { describe, it, expect } from 'vitest';
import {
  HOMEPAGE_FAQS,
  getCategoryFaqs,
  getWholesaleCategoryFaqs,
  getToolFaqs,
  getFormulationFaqs
} from '@/lib/faqs';
import { generateFaqSchema } from '@/lib/seo';
import fs from 'fs';

describe('AEO (Answer Engine Optimization) & Direct Answer Verification', () => {
  it('provides 8 comprehensive verified direct answers in HOMEPAGE_FAQS', () => {
    expect(HOMEPAGE_FAQS).toHaveLength(8);

    const shippingFaq = HOMEPAGE_FAQS.find(f => f.question.toLowerCase().includes('delivery'));
    expect(shippingFaq).toBeDefined();
    expect(shippingFaq!.answer).toContain('₹90');

    const gstFaq = HOMEPAGE_FAQS.find(f => f.question.toLowerCase().includes('gst'));
    expect(gstFaq).toBeDefined();
    expect(gstFaq!.answer).toContain('Input Tax Credit');

    const packagingFaq = HOMEPAGE_FAQS.find(f => f.question.toLowerCase().includes('packed'));
    expect(packagingFaq).toBeDefined();
    expect(packagingFaq!.answer).toContain('induction-sealed');

    const dispatchFaq = HOMEPAGE_FAQS.find(f => f.question.toLowerCase().includes('dispatch'));
    expect(dispatchFaq).toBeDefined();
    expect(dispatchFaq!.answer).toContain('Muzaffarpur');
  });

  it('generates valid Schema.org FAQPage structured data matching answers', () => {
    const schema: any = generateFaqSchema(HOMEPAGE_FAQS);
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity).toHaveLength(8);

    schema.mainEntity.forEach((item: any, idx: number) => {
      expect(item['@type']).toBe('Question');
      expect(item.name).toBe(HOMEPAGE_FAQS[idx].question);
      expect(item.acceptedAnswer['@type']).toBe('Answer');
      expect(item.acceptedAnswer.text).toBe(HOMEPAGE_FAQS[idx].answer);
    });
  });

  it('generates category-tailored FAQs for wholesale pages', () => {
    const waxFaqs = getWholesaleCategoryFaqs('Candle Waxes & Additives');
    expect(waxFaqs.length).toBeGreaterThanOrEqual(4);
    expect(waxFaqs.some(f => f.question.includes('container') && f.question.includes('pillar'))).toBe(true);

    const soapFaqs = getWholesaleCategoryFaqs('Artisan Soap Bases');
    expect(soapFaqs.length).toBeGreaterThanOrEqual(4);
    expect(soapFaqs.some(f => f.answer.includes('SLS-free'))).toBe(true);

    const fragranceFaqs = getWholesaleCategoryFaqs('Fragrance Oils');
    expect(fragranceFaqs.length).toBeGreaterThanOrEqual(4);
    expect(fragranceFaqs.some(f => f.question.includes('IFRA'))).toBe(true);
  });

  it('provides verified formula and ratios in Tool FAQs for Fragrance Calculator', () => {
    const toolFaqs = getToolFaqs();
    expect(toolFaqs.length).toBeGreaterThanOrEqual(4);

    const formulaFaq = toolFaqs.find(f => f.question.toLowerCase().includes('formula'));
    expect(formulaFaq).toBeDefined();
    expect(formulaFaq!.answer).toContain('Fragrance Oil Weight (grams) = Wax Weight (grams)');

    const soyLoadFaq = toolFaqs.find(f => f.question.toLowerCase().includes('soy wax'));
    expect(soyLoadFaq).toBeDefined();
    expect(soyLoadFaq!.answer).toContain('6% and 10%');
  });

  it('provides formulation technical Q&As for cosmetic recipes', () => {
    const formFaqs = getFormulationFaqs('Niacinamide Brightening Toner', 'Lightweight hydrating toner');
    expect(formFaqs.length).toBeGreaterThanOrEqual(4);
    expect(formFaqs.some(f => f.question.includes('pH target'))).toBe(true);
    expect(formFaqs.some(f => f.question.includes('preservative'))).toBe(true);
  });

  it('renders crawlable semantic HTML answers in ProductFaqSection without requiring JS', () => {
    const productFaqContent = fs.readFileSync('src/components/ProductFaqSection.tsx', 'utf8');
    expect(productFaqContent).toContain('<details');
    expect(productFaqContent).toContain('<summary');
    expect(productFaqContent).toContain('faq.answer');
    expect(productFaqContent).not.toContain('isOpen &&');
  });

  it('renders crawlable semantic HTML answers in HomepageFaqAccordion', () => {
    const homeFaqContent = fs.readFileSync('src/components/HomepageFaqAccordion.tsx', 'utf8');
    expect(homeFaqContent).toContain('<details');
    expect(homeFaqContent).toContain('<summary');
    expect(homeFaqContent).toContain('faq.answer');
    expect(homeFaqContent).not.toContain('isOpen &&');
  });

  it('renders Direct Answer summary boxes in Buying Guides and Blog Articles', () => {
    const guideContent = fs.readFileSync('src/app/guides/[slug]/page.tsx', 'utf8');
    expect(guideContent).toContain('Direct Answer &bull; Sourcing Summary');

    const blogContent = fs.readFileSync('src/app/blog/[slug]/page.tsx', 'utf8');
    expect(blogContent).toContain('Direct Answer &bull; Key Takeaway');
  });
});
