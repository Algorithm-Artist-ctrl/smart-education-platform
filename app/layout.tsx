// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { I18nProvider } from '@/lib/i18n/context';
import { AuthProvider } from '@/lib/auth/context';
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
    <html lang="en" className="h-full dark">
      <body className="antialiased min-h-screen bg-[#060913] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
        <I18nProvider>
          <AuthProvider>
            <OfflineSyncBanner />
            {children}
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

