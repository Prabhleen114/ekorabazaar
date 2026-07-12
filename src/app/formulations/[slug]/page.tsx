import BuyerNavbar from "@/components/BuyerNavbar";
import Footer from "@/components/Footer";
import Link from "next/link";
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

      <main className="pt-32 pb-24 px-6 max-w-3xl mx-auto">
        <Link 
          href="/formulations"
          className="inline-flex items-center gap-2 text-brand-charcoal/60 hover:text-brand-orange transition-colors font-medium text-sm mb-12"
        >
          <ArrowLeft className="w-4 h-4" /> Back to all formulations
        </Link>

        <article className="w-full">
          <header className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-brand-charcoal mb-6 leading-snug">
              {formulation.title}
            </h1>
            <div className="w-16 h-1 bg-brand-orange mx-auto rounded-full mb-8"></div>
          </header>

          {formulation.imageUrl && (
            <div className="w-full mb-12">
              <img 
                src={formulation.imageUrl}
                alt={formulation.title}
                className="w-full h-auto rounded-2xl shadow-md object-cover max-h-[500px]"
              />
            </div>
          )}

          {/* Render the scraped HTML content directly */}
          <div 
            className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-brand-charcoal prose-p:text-brand-charcoal/80 prose-p:leading-relaxed prose-a:text-brand-orange hover:prose-a:text-brand-orange/80 prose-li:text-brand-charcoal/80 prose-img:rounded-xl prose-img:shadow-sm"
            dangerouslySetInnerHTML={{ __html: formulation.content }}
          />
        </article>
      </main>

      <Footer />
    </div>
  );
}
