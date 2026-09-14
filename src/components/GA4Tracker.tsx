"use client";

import { useEffect, Suspense } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import { usePathname, useSearchParams } from "next/navigation";

function GA4TrackerContent() {
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

export default function GA4Tracker() {
  return (
    <Suspense fallback={null}>
      <GA4TrackerContent />
    </Suspense>
  );
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

export function TrackViewCart({ items, value }: { items: any[], value: number }) {
  useEffect(() => {
    if (items && items.length > 0) {
      sendGAEvent('event', 'view_cart', {
        currency: 'INR',
        value: value,
        items: items.map(item => ({
          item_id: item.productId || item.id,
          item_name: item.product?.title || item.title,
          price: item.effectivePrice ? item.effectivePrice / 100 : item.price,
          quantity: item.quantity
        }))
      });
    }
  }, [items, value]);
  
  return null;
}

export function TrackBeginCheckout({ items, value }: { items: any[], value: number }) {
  useEffect(() => {
    if (items && items.length > 0) {
      sendGAEvent('event', 'begin_checkout', {
        currency: 'INR',
        value: value,
        items: items.map(item => ({
          item_id: item.productId || item.id,
          item_name: item.product?.title || item.title,
          price: item.effectivePrice ? item.effectivePrice / 100 : item.price,
          quantity: item.quantity
        }))
      });
    }
  }, [items, value]);
  
  return null;
}
