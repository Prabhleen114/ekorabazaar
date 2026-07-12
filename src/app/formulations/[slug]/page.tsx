import BuyerNavbar from "@/components/BuyerNavbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import dataRaw from "@/lib/data/formulations.json";

type Formulation = {
  title: string;
  url: string;
  imageUrl: string;
  excerpt: string;
  content: string;
};

// Generate static params for build time
export async function generateStaticParams() {
  const data: Formulation[] = dataRaw as Formulation[];
  
  return data.map((item) => ({
    slug: item.url.split("/").pop() || "",
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data: Formulation[] = dataRaw as Formulation[];
  const formulation = data.find(f => (f.url.split("/").pop() || "") === slug);

  if (!formulation) return { title: "Not Found" };
  
  return {
    title: `${formulation.title} | Ekora Formulations`,
    description: formulation.excerpt,
  };
}

export default async function FormulationSinglePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data: Formulation[] = dataRaw as Formulation[];
  
  const formulation = data.find(f => decodeURIComponent(f.url.split("/").pop() || "") === decodeURIComponent(slug));

  if (!formulation) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-charcoal selection:bg-brand-orange/20">
      <BuyerNavbar />

      <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
        <Link 
          href="/formulations"
          className="inline-flex items-center gap-2 text-brand-charcoal/60 hover:text-brand-orange transition-colors font-medium text-sm mb-10"
        >
          <ArrowLeft className="w-4 h-4" /> Back to all formulations
        </Link>

        <article className="bg-white rounded-3xl p-8 md:p-16 border border-brand-linen shadow-xl">
          <header className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-charcoal mb-6 leading-tight">
              {formulation.title}
            </h1>
            <div className="w-24 h-1 bg-brand-orange mx-auto rounded-full mb-8"></div>
          </header>

          {formulation.imageUrl && (
            <div className="relative aspect-video rounded-2xl overflow-hidden mb-12 shadow-md">
              <Image 
                src={formulation.imageUrl}
                alt={formulation.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Render the scraped HTML content directly */}
          <div 
            className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-brand-charcoal prose-p:text-brand-charcoal/80 prose-a:text-brand-orange hover:prose-a:text-brand-orange/80 prose-li:text-brand-charcoal/80 prose-img:rounded-xl prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: formulation.content }}
          />
        </article>
      </main>

      <Footer />
    </div>
  );
}
