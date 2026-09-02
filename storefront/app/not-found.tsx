import Link from 'next/link';
import { ArrowLeft, Compass, ShoppingBag, ShieldCheck, Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-6 py-20 bg-canvas">
      <div className="max-w-xl w-full text-center space-y-8">
        {/* Monogram Badge */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-soft-cloud border border-hairline mx-auto">
          <Compass className="w-8 h-8 text-ink stroke-1 animate-spin-slow" />
        </div>

        {/* 404 Headline */}
        <div className="space-y-3">
          <span className="text-xs font-bold tracking-[0.3em] uppercase text-mute">
            Lỗi 404 — Trang Không Tồn Tại
          </span>
          <h1 className="font-display-campaign text-4xl sm:text-6xl text-ink tracking-tight font-bold">
            PAGE NOT FOUND
          </h1>
          <p className="text-mute text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Tuyệt tác trang sức hoặc trang bạn đang tìm kiếm có thể đã được chuyển dời, đổi tên hoặc không còn trong bộ sưu tập.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="btn-primary w-full sm:w-auto py-3 px-8 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Trang Chủ</span>
          </Link>
          <Link
            href="/products"
            className="btn-secondary w-full sm:w-auto py-3 px-8 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Khám Phá Trang Sức</span>
          </Link>
        </div>

        {/* Popular Quick Links */}
        <div className="pt-8 border-t border-hairline-soft">
          <p className="text-xs font-semibold uppercase tracking-wider text-mute mb-4">
            Các danh mục được tìm kiếm nhiều nhất
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: 'Nhẫn Kim Cương', href: '/products?category=nhan' },
              { label: 'Vòng Tay Classic', href: '/products?category=vong-tay' },
              { label: 'Dây Chuyền Elan', href: '/products?category=day-chuyen' },
              { label: 'Tra Cứu Bảo Hành', href: '/warranty' },
              { label: 'Câu Hỏi Thường Gặp (FAQ)', href: '/faq' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-medium text-ink bg-soft-cloud hover:bg-black hover:text-white px-3.5 py-1.5 rounded-full transition-all border border-hairline"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
