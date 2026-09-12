"use client";

import { useState } from "react";
import { FileText, Download, ShieldCheck, CheckCircle2, ExternalLink, X, Printer, Eye } from "lucide-react";

interface Props {
  productId: string;
  productName: string;
  category: string;
}

export default function TechnicalDocsSection({ productId, productName, category }: Props) {
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);

  // Generate clean, SEO-friendly file slugs
  const slug = productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const isFragranceOrOil =
    category.toLowerCase().includes("fragrance") ||
    category.toLowerCase().includes("essential") ||
    category.toLowerCase().includes("oil") ||
    category.toLowerCase().includes("attar");

  const docs = [
    {
      type: "coa",
      title: "Certificate of Analysis (COA)",
      filename: `${slug}-coa-batch-report-2026.pdf`,
      description: "Gas chromatography purity assay, organoleptic metrics & batch parameters",
      href: `/api/docs/${productId}/coa`,
      badge: "Batch Verified",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
    },
    {
      type: "tds",
      title: "Technical Data Sheet (TDS)",
      filename: `${slug}-technical-data-sheet-tds.pdf`,
      description: "Processing temperatures, solubility, melting point & formulation thresholds",
      href: `/api/docs/${productId}/tds`,
      badge: "Formulation Specs",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
    },
    {
      type: "msds",
      title: "Material Safety Data Sheet (MSDS / SDS)",
      filename: `${slug}-msds-safety-data-sheet.pdf`,
      description: "Hazard classification, storage requirements, handling & flash point data",
      href: `/api/docs/${productId}/msds`,
      badge: "Safety Standard",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200"
    },
    ...(isFragranceOrOil
      ? [
          {
            type: "ifra",
            title: "IFRA 51st Amendment Certificate",
            filename: `${slug}-ifra-conformity-certificate.pdf`,
            description: "Skin safety limits for candles, leave-on cosmetics, and rinse-off soaps",
            href: `/api/docs/${productId}/ifra`,
            badge: "IFRA Certified",
            badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
          }
        ]
      : [])
  ];

  return (
    <div className="mt-8 bg-white p-5 md:p-6 rounded-2xl border border-brand-linen shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-brand-linen">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Lab-Tested &amp; Certified
            </span>
          </div>
          <h3 className="font-serif font-bold text-lg text-brand-charcoal">
            Certified Batch Reports &amp; Technical Documentation
          </h3>
          <p className="text-xs text-brand-charcoal/60 mt-0.5">
            Publicly accessible quality compliance files. Zero login wall required.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-brand-charcoal/60 bg-brand-bg px-3 py-1.5 rounded-lg border border-brand-linen shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-medium">Batch Authenticated</span>
        </div>
      </div>

      {/* Docs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {docs.map((doc) => (
          <div
            key={doc.type}
            className="p-4 rounded-xl border border-brand-linen bg-stone-50/40 hover:bg-white hover:border-brand-orange/40 hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white border border-brand-linen flex items-center justify-center text-brand-orange shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-brand-charcoal leading-snug">
                    {doc.title}
                  </h4>
                </div>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${doc.badgeColor}`}>
                  {doc.badge}
                </span>
              </div>
              <p className="text-[11px] text-brand-charcoal/60 line-clamp-2 pl-9 mb-3">
                {doc.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-brand-linen/60 pl-1 text-[11px]">
              <span className="font-mono text-[10px] text-brand-charcoal/40 truncate max-w-[160px]">
                {doc.filename}
              </span>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDoc({ url: doc.href, title: doc.title })}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-charcoal hover:text-brand-orange transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </button>

                <a
                  href={doc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={doc.filename}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange hover:text-brand-orange/80 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-[11px] text-brand-charcoal/50 bg-brand-bg px-3 py-2 rounded-xl">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>All reports are verified against manufacturer lot numbers and conform to Indian &amp; international cosmetic standards.</span>
      </div>

      {/* Inline Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-brand-linen animate-in fade-in zoom-in duration-200">
            <div className="p-4 px-6 border-b border-brand-linen flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-orange" />
                <h4 className="font-bold text-sm text-brand-charcoal">
                  {previewDoc.title}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-charcoal hover:bg-black text-white text-xs font-bold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Fullscreen</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-stone-200 flex items-center justify-center text-brand-charcoal transition-colors border border-brand-linen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 w-full bg-stone-100 overflow-hidden relative min-h-[500px]">
              <iframe
                src={previewDoc.url}
                className="w-full h-full border-none"
                title={previewDoc.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
