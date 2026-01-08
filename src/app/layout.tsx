import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Providers } from '@/providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Progressor - Öğrenme ve Görev Yönetimi',
    template: '%s | Progressor',
  },
  description:
    'Öğrenme, görev yönetimi ve not alma süreçlerinizi tek bir platformda yönetin. Kategoriler oluşturun, görevler ekleyin ve ilerlemenizi takip edin.',
  keywords: [
    'öğrenme',
    'görev yönetimi',
    'not alma',
    'verimlilik',
    'kategori',
    'ilerleme takibi',
  ],
  authors: [{ name: 'Progressor' }],
  creator: 'Progressor',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://progressor.dev',
    title: 'Progressor - Öğrenme ve Görev Yönetimi',
    description:
      'Öğrenme, görev yönetimi ve not alma süreçlerinizi tek bir platformda yönetin.',
    siteName: 'Progressor',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Progressor - Öğrenme ve Görev Yönetimi',
    description:
      'Öğrenme, görev yönetimi ve not alma süreçlerinizi tek bir platformda yönetin.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
