import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  FRAGRANCE_PRIORITY_SLUGS,
  getAllWholesaleDefinitions,
  resolveWholesaleCategoryBySlug,
  resolveCategoryBreadcrumbSlug,
} from "@/lib/fragrance-collections";
import {
  generateProductMetadata,
  generateCategoryMetadata,
  generateProductSchema,
  generateProductGroupSchema,
} from "@/lib/seo";
import { markdownToHtml } from "@/lib/blog";
import { metadata as checkoutSuccessMeta } from "@/app/checkout/success/layout";

describe("Fragrance SEO & AI Discoverability Enhancements", () => {
  it("resolves all 11 priority fragrance & oil collection slugs cleanly", () => {
    for (const slug of FRAGRANCE_PRIORITY_SLUGS) {
      const def = resolveWholesaleCategoryBySlug(slug);
      expect(def, `Missing definition for /wholesale/${slug}`).toBeDefined();
      expect(def!.isFragranceRelated).toBe(true);
    }
  });

  it("provides unique SEO titles & meta descriptions across all fragrance intent categories", () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();

    for (const slug of FRAGRANCE_PRIORITY_SLUGS) {
      const def = resolveWholesaleCategoryBySlug(slug)!;
      const meta = generateCategoryMetadata(def.label, slug, def.seoTitle, def.seoDescription);
      const t = String(meta.title || "");
      const d = String(meta.description || "");
      expect(t.length).toBeGreaterThan(20);
      expect(d.length).toBeGreaterThan(60);
      expect(titles.has(t), `Duplicate title: ${t}`).toBe(false);
      expect(descriptions.has(d), `Duplicate description: ${d}`).toBe(false);
      titles.add(t);
      descriptions.add(d);
    }
  });

  it("resolves extended DB taxonomy categories so product breadcrumbs never 404", () => {
    const extendedLabels = [
      "Festive & Holiday Molds",
      "Candle & Soap Making",
      "Resin & Concrete Craft",
      "Storage & Trays",
      "Silicone & Baking Molds",
      "Packaging & Containers",
      "Cake & Chocolate Decorating",
    ];
    for (const label of extendedLabels) {
      const slug = resolveCategoryBreadcrumbSlug(label);
      expect(slug).toBeTruthy();
      expect(resolveWholesaleCategoryBySlug(slug!)).toBeDefined();
    }
  });

  it("generates accurate product metadata and Product + ProductGroup INR schemas without fabricated ratings", () => {
    const sampleProduct = {
      id: "8001",
      source: "CATALOG",
      title: "Amber Driftwood Fragrance Oil (Skin & Candle Safe)",
      category: "Skin Safe Fragrances",
      description:
        "Warm amber and coastal driftwood aroma oil suited for soy candles, soaps, and fine fragrance blends.",
      price: 10900,
      customerPrice: 10900,
      stock: 100,
      imageUrl: "/images/base-bottle.webp",
    };

    const meta = generateProductMetadata(sampleProduct);
    expect(meta.title).toContain("Amber Driftwood Fragrance Oil");
    expect(meta.description).toContain("₹109");
    expect(meta.description).toContain("Skin Safe Fragrances");
    expect(meta.alternates?.canonical).toBe("https://ekorabazaar.in/products/8001");

    const schema = generateProductSchema(sampleProduct) as {
      "@type": string;
      offers: { priceCurrency: string; price?: number; availability: string };
      aggregateRating?: unknown;
      review?: unknown;
    };
    expect(schema["@type"]).toBe("Product");
    expect(schema.offers.priceCurrency).toBe("INR");
    expect(schema.offers.price).toBe(109);
    expect(schema.offers.availability).toBe("https://schema.org/InStock");
    expect(schema.aggregateRating).toBeUndefined();
    expect(schema.review).toBeUndefined();

    const groupSchema = generateProductGroupSchema(sampleProduct, [
      { size: "15 ml", price: 109 },
      { size: "100 ml", price: 460 },
      { size: "1 Litre", price: 4160 },
    ]) as {
      "@type": string;
      hasVariant: Array<{ offers: { price: number; priceCurrency: string } }>;
    };
    expect(groupSchema["@type"]).toBe("ProductGroup");
    expect(groupSchema.hasVariant).toHaveLength(3);
    expect(groupSchema.hasVariant[0].offers.price).toBe(109);
    expect(groupSchema.hasVariant[2].offers.price).toBe(4160);
    expect(groupSchema.hasVariant[2].offers.priceCurrency).toBe("INR");
  });

  it("permits search and AI crawlers on public content in robots.txt while blocking private routes", () => {
    const robots = fs.readFileSync("public/robots.txt", "utf8");
    expect(robots).toContain("User-agent: Googlebot");
    expect(robots).toContain("User-agent: OAI-SearchBot");
    expect(robots).toContain("User-agent: GPTBot");
    expect(robots).toContain("User-agent: Google-Extended");
    expect(robots).toContain("User-agent: PerplexityBot");
    expect(robots).toContain("Disallow: /admin/");
    expect(robots).toContain("Disallow: /checkout/");
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Sitemap: https://ekorabazaar.in/sitemap_index.xml");
  });

  it("keeps llms.txt accurate and lists all priority fragrance hubs and Google Merchant XML feed", () => {
    const llms = fs.readFileSync("public/llms.txt", "utf8");
    expect(llms).toContain("/wholesale/perfume-fragrance-oils");
    expect(llms).toContain("/wholesale/candle-fragrance-oils");
    expect(llms).toContain("/wholesale/soap-making-fragrance-oils");
    expect(llms).toContain("/wholesale/aromatherapy-oils");
    expect(llms).toContain("/feeds/products.xml");
    expect(llms).not.toContain("IFRA-certified fragrance oils");
  });

  it("sets noindex/nofollow on checkout success route", () => {
    expect(checkoutSuccessMeta.robots).toEqual({ index: false, follow: false });
  });

  it("renders markdown tables cleanly and avoids duplicate H1 elements in blog articles", () => {
    const html = markdownToHtml(
      "# Article Title\n\nIntro paragraph.\n\n| Col A | Col B |\n| :--- | :--- |\n| Soy | 8% |\n\n## Section"
    );
    expect(html).not.toContain("<h1>");
    expect(html).toContain("<table>");
    expect(html).toContain("<th>Col A</th>");
    expect(html).toContain("<td>Soy</td>");
    expect(html).toContain('<h2 id="section">Section</h2>');
  });

  it("has zero broken /wholesale/, /guides/, or /blog/ internal links across content/blog markdown", () => {
    const validWholesale = new Set(getAllWholesaleDefinitions().map((d) => d.slug));
    const blogFiles = fs.readdirSync("content/blog").filter((f) => f.endsWith(".md"));
    const validBlogs = new Set(blogFiles.map((f) => f.replace(/\.md$/, "")));

    for (const file of blogFiles) {
      const content = fs.readFileSync(path.join("content/blog", file), "utf8");
      for (const m of content.matchAll(/\]\((\/[^)#?\s]+)/g)) {
        const url = m[1];
        if (url.startsWith("/wholesale/")) {
          const slug = url.slice("/wholesale/".length);
          expect(validWholesale.has(slug), `Broken wholesale link ${url} in ${file}`).toBe(true);
        } else if (url.startsWith("/guides/")) {
          const slug = url.slice("/guides/".length);
          expect(validWholesale.has(slug), `Broken guide link ${url} in ${file}`).toBe(true);
        } else if (url.startsWith("/blog/")) {
          const slug = url.slice("/blog/".length);
          expect(validBlogs.has(slug), `Broken blog link ${url} in ${file}`).toBe(true);
        }
      }
    }
  });
});
