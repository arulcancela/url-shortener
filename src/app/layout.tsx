import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/session-provider';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: {
    default: 'URL Shortener — Acortador con analíticas y QR',
    template: '%s · URL Shortener',
  },
  description:
    'Acortador de URLs con analíticas en tiempo real y códigos QR. Construido con Next.js, Prisma y Tailwind.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'URL Shortener',
    description: 'Acortador de URLs con analíticas y códigos QR.',
    type: 'website',
  },
};

// La app depende de la sesión del usuario (header con avatar, dashboard filtrado),
// por lo que se renderiza dinámicamente y no se prerenderiza estáticamente.
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>
          <SiteHeader />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
