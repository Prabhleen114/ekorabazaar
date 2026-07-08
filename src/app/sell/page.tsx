import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import SocialProof from "@/components/SocialProof";
import Transformation from "@/components/Transformation";
import PlatformPreview from "@/components/PlatformPreview";
import CategoriesPreview from "@/components/CategoriesPreview";
import WhyJoinEarly from "@/components/WhyJoinEarly";
import FounderStory from "@/components/FounderStory";
import MysteryCohort from "@/components/MysteryCohort";
import EarlyAccess from "@/components/EarlyAccess";
import Footer from "@/components/Footer";
import { getCreatorCount } from "@/lib/leads";

export const revalidate = 0; // force dynamic rendering so fs count is live

export default function Home() {
  const creatorCount = getCreatorCount();

  return (
    <main className="min-h-screen bg-brand-bg">
      <Navbar />
      <Hero count={creatorCount} />
      <SocialProof />
      <Transformation />
      <PlatformPreview />
      <CategoriesPreview />
      <WhyJoinEarly />
      <FounderStory />
      <MysteryCohort count={creatorCount} />
      <EarlyAccess />
      <Footer />
    </main>
  );
}
