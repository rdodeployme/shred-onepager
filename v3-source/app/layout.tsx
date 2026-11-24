import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/archivo/standard.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './globals.css';
import { BP } from '@/lib';

export const metadata: Metadata = {
  title: 'SHRED — Industrial Shredding & Material Processing | A Recycle Group brand',
  description: 'SHRED takes on the material other operators decline. Customised commercial shredding, destruction and material processing — assessed, trialled and documented. A Recycle Group brand.',
  icons: { icon: `${BP}/favicon.svg` },
  openGraph: {
    title: 'SHRED — Industrial Shredding & Material Processing',
    description: 'Some material has no pathway. We build one. A Recycle Group brand.',
    images: [`${BP}/img/og.jpg`],
    type: 'website',
    locale: 'en_AU',
  },
};
export const viewport: Viewport = { themeColor: '#050505', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <head><noscript><style>{'.rv{opacity:1!important;transform:none!important}'}</style></noscript></head>
      <body>{children}</body>
    </html>
  );
}
