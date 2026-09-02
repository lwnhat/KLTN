import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LocalSchema from '@/components/common/LocalSchema';
import GoogleAnalytics from '@/components/common/GoogleAnalytics';
import { ToastProvider } from '@/contexts/ToastContext';

export const metadata: Metadata = {
  metadataBase: new URL('https://kltn-ashy.vercel.app'),
  title: {
    default: 'Daniel Wellington — Trang Sức & Đồng Hồ Cao Cấp',
    template: '%s | Daniel Wellington',
  },
  description: 'Thương hiệu Daniel Wellington chính hãng. Thiết kế thanh lịch chuẩn phong cách Bắc Âu, miễn phí khắc chữ laser, giao hàng tận nơi toàn quốc.',
  keywords: [
    'Daniel Wellington',
    'Trang sức Daniel Wellington',
    'Nhẫn kim cương',
    'Vòng tay classic',
    'Dây chuyền elan',
    'Khắc laser trang sức',
  ],
  authors: [{ name: 'Daniel Wellington' }],
  creator: 'Daniel Wellington',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://kltn-ashy.vercel.app',
    siteName: 'Daniel Wellington Vietnam',
    title: 'Daniel Wellington — Trang Sức & Đồng Hồ Cao Cấp',
    description: 'Thương hiệu Daniel Wellington chính hãng. Thiết kế thanh lịch chuẩn phong cách Bắc Âu, miễn phí khắc chữ laser, giao hàng tận nơi toàn quốc.',
    images: [
      {
        url: 'https://res.cloudinary.com/akmq0b0f/image/upload/v1788237149/mn-jewelry/products/mo67cculr0ltpiyl0w4c.png',
        width: 1200,
        height: 630,
        alt: 'Daniel Wellington Luxury Fine Jewelry',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daniel Wellington — Trang Sức & Đồng Hồ Cao Cấp',
    description: 'Thương hiệu Daniel Wellington chính hãng. Thiết kế thanh lịch chuẩn phong cách Bắc Âu.',
    images: ['https://res.cloudinary.com/akmq0b0f/image/upload/v1788237149/mn-jewelry/products/mo67cculr0ltpiyl0w4c.png'],
  },
};

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
        <GoogleAnalytics />
      </head>
      <body className="min-h-screen flex flex-col bg-canvas text-ink antialiased">
        <LocalSchema />
        <ToastProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}

