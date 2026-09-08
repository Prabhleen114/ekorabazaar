"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function WhatsAppButton() {
  const pathname = usePathname();
  const isSellPage = pathname === '/sell' || pathname?.startsWith('/sell/');
  
  const text = isSellPage 
    ? "Hi Ekora! I'm interested in becoming a Founding Creator." 
    : "HI! i have a query";
    
  const whatsappUrl = `https://wa.me/919041500605?text=${encodeURIComponent(text)}`;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex items-center justify-end pointer-events-none">
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto block transition-all duration-300 drop-shadow-xl"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5, type: "spring" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="WhatsApp click to chat"
      >
        <Image 
          src="/images/whatsapp-button.png" 
          alt="WhatsApp click to chat" 
          width={220} 
          height={64} 
          priority
          className="h-11 md:h-13 w-auto object-contain" 
        />
      </motion.a>
    </div>
  );
}
