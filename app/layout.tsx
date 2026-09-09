// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { I18nProvider } from '@/lib/i18n/context';
import OfflineSyncBanner from '@/components/shared/OfflineSyncBanner';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#4f46e5',
};

export const metadata: Metadata = {
  title: 'Smart Education Platform | Adaptive Learning',
  description: 'AI-driven, student-centric adaptive education platform with real-time performance analytics and personalized study plans.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SmartEdu',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
        <I18nProvider>
          <OfflineSyncBanner />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
