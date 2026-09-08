"use client";

import { useEffect } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import { usePathname, useSearchParams } from "next/navigation";

export default function GA4Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    // The GA script inherently tracks page_view on history change, but we can explicitly log route changes if needed, 
    // or log custom internal routing events.
    sendGAEvent('event', 'page_view', {
      page_path: url,
    });
  }, [pathname, searchParams]);

  return null;
}

export function TrackViewItem({ item }: { item: any }) {
  useEffect(() => {
    if (item) {
      sendGAEvent('event', 'view_item', {
        currency: 'INR',
        value: item.price,
        items: [
          {
            item_id: item.id,
            item_name: item.name || item.title,
            item_category: item.category,
            price: item.price,
          }
        ]
      });
      // also track product_view for custom reports
      sendGAEvent('event', 'product_view', {
        item_id: item.id,
        item_name: item.name || item.title,
        item_category: item.category,
      });
    }
  }, [item]);
  
  return null;
}
