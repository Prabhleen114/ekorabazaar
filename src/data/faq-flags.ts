export interface FAQFlag {
  question: string;
  answer: string;
}

export type FAQItem = FAQFlag;

export const flags: FAQFlag[] = [
  {
    question: "What is Ekora?",
    answer:
      "Ekora is India's first creator commerce platform. We provide independent Instagram creators with professional storefronts, secure checkout, and built-in order tracking, all within a unified marketplace.",
  },
  {
    question: "Who can join the Early Access program?",
    answer:
      "Any independent creator based in India who sells handmade, custom, or unique products primarily through social media. We are especially looking for creators in Art, Decor, Candles, Pottery, Jewelry, and Fashion.",
  },
  {
    question: "What does the ₹199 onboarding fee cover?",
    answer:
      "This is a one-time fee exclusively for our first 100 founding creators. It covers your lifetime store setup, dedicated onboarding support, and guarantees your priority visibility when the platform officially launches.",
  },
  {
    question: "Is the platform live yet?",
    answer:
      "Not yet. We are currently in our pre-launch phase, onboarding our first cohort of 100 founding creators. Once this initial cohort is set up, we will launch the marketplace to buyers.",
  },
  {
    question: "What categories are supported?",
    answer:
      "We support a wide range of creative categories including Art & Craft, Candles, Pottery, Jewelry, Home Decor, DIY Kits, Paintings, Fashion Accessories, and Customized Gifts.",
  },
  {
    question: "How does payment work?",
    answer:
      "Customers pay securely through our unified checkout system (supporting UPI, cards, and net banking). Payments are then settled directly to your connected bank account according to our standard payout schedule.",
  },
  {
    question: "Can I sell on other platforms too?",
    answer:
      "Absolutely. Ekora does not require exclusivity. We simply aim to be the most efficient and professional channel for your business.",
  },
  {
    question: "How do I get support?",
    answer:
      "Founding creators receive direct access to our core team via an exclusive WhatsApp group, in addition to dedicated email support for store setup and technical issues.",
  },
];

export const faqs = flags;
export default flags;
