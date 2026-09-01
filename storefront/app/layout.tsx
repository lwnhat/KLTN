import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'MN Jewelry — Trang Sức Kim Cương & Chế Tác Cao Cấp',
  description: 'Thương hiệu trang sức kim cương chính hãng chuẩn GIA. Thiết kế độc bản, miễn phí khắc chữ laser, giao hàng tận nơi toàn quốc.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0a0a0a',
};



import { ToastProvider } from '@/contexts/ToastContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        {/* Suppress third-party Chrome extension errors (e.g., Urban VPN, adblockers) from popping up Next.js dev overlay */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (
                  (e.filename && e.filename.indexOf('chrome-extension://') !== -1) ||
                  (e.message && (e.message.indexOf('M_ID') !== -1 || e.message.indexOf('chrome-extension') !== -1))
                ) {
                  e.stopImmediatePropagation();
                  e.preventDefault();
                }
              }, true);
              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && e.reason.stack && e.reason.stack.indexOf('chrome-extension://') !== -1) {
                  e.stopImmediatePropagation();
                  e.preventDefault();
                }
              }, true);
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-canvas text-ink antialiased">
        <ToastProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}

