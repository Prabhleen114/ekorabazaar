import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ekora Bazaar — India's First Creator Commerce Platform",
    short_name: 'Ekora',
    description:
      "Discover India's best Instagram creators in one place. Buy unique handmade products directly from verified creators.",
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFBF5',
    theme_color: '#E2725B',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
