import Link from 'next/link';

export default function SitemapPage() {
  const sections = [
    {
      title: "Mua Sắm",
      links: [
        { label: "Trang Chủ", href: "/" },
        { label: "Nhẫn", href: "/products?category=nhan" },
        { label: "Dây Chuyền", href: "/products?category=day-chuyen" },
        { label: "Bông Tai", href: "/products?category=bong-tai" },
        { label: "Vòng Tay", href: "/products?category=vong-tay" },
        { label: "Tất Cả Sản Phẩm", href: "/products" },
      ]
    },
    {
      title: "Tài Khoản",
      links: [
        { label: "Đăng Nhập / Đăng Ký", href: "/account" },
        { label: "Giỏ Hàng", href: "/cart" },
        { label: "Thanh Toán", href: "/checkout" },
      ]
    },
    {
      title: "Hỗ Trợ Khách Hàng",
      links: [
        { label: "Tra Cứu Bảo Hành", href: "/warranty" },
        { label: "Câu Hỏi Thường Gặp", href: "/faq" },
        { label: "Giao Hàng & Kiểm Định", href: "/shipping" },
        { label: "Hướng Dẫn Đo Cỡ Nhẫn", href: "/guide/size" },
        { label: "Dịch Vụ Khắc Chữ Laser", href: "/guide/engraving" },
      ]
    },
    {
      title: "Pháp Lý",
      links: [
        { label: "Chính Sách Thu Đổi & Bảo Hành", href: "/terms" },
        { label: "Chính Sách Bảo Mật", href: "/privacy" },
      ]
    }
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-12 py-16 space-y-10">
      <h1 className="text-3xl font-bold uppercase tracking-tight text-ink">Sitemap</h1>
      <div className="grid sm:grid-cols-2 gap-8">
        {sections.map(section => (
          <div key={section.title}>
            <h2 className="font-bold text-ink text-sm uppercase tracking-widest mb-3 border-b border-hairline-soft pb-2">{section.title}</h2>
            <ul className="space-y-2">
              {section.links.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-mute hover:text-ink transition-colors hover:underline">
                    → {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
