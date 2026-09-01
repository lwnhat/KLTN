import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-canvas border-t border-hairline mt-section">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Col 1 */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-ink uppercase tracking-wide">VỀ DANIEL WELLINGTON</h4>
            <p className="text-sm text-mute leading-relaxed">
              Thương hiệu trang sức & đồng hồ cao cấp Daniel Wellington. Mỗi chế tác mang phong cách tối giản thanh lịch, chất liệu vàng và đá quý tinh tuyển chuẩn quốc tế.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-ink uppercase tracking-wide">HỖ TRỢ KHÁCH HÀNG</h4>
            <ul className="space-y-2.5 text-sm text-mute">
              <li><Link href="/warranty" className="hover:text-ink transition-colors">Tra cứu hạn bảo hành</Link></li>
              <li><Link href="/guide/size" className="hover:text-ink transition-colors">Hướng dẫn đo cỡ nhẫn</Link></li>
              <li><Link href="/guide/engraving" className="hover:text-ink transition-colors">Dịch vụ khắc chữ laser</Link></li>
              <li><Link href="/faq" className="hover:text-ink transition-colors">Câu hỏi thường gặp</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-ink uppercase tracking-wide">CHÍNH SÁCH</h4>
            <ul className="space-y-2.5 text-sm text-mute">
              <li><Link href="/terms" className="hover:text-ink transition-colors">Chính sách thu đổi & bảo hành</Link></li>
              <li><Link href="/shipping" className="hover:text-ink transition-colors">Giao hàng & Kiểm định tận nơi</Link></li>
              <li><Link href="/privacy" className="hover:text-ink transition-colors">Bảo mật thông tin khách hàng</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-ink uppercase tracking-wide">KIỂM ĐỊNH & THANH TOÁN</h4>
            <p className="text-sm text-mute">
              Hỗ trợ thanh toán an toàn qua cổng VNPay, MoMo & Thẻ quốc tế. Kiểm định chính hãng 100%.
            </p>
            <div className="flex gap-2 pt-2">
              <span className="bg-soft-cloud text-ink text-xs font-semibold px-3 py-1.5 rounded-lg border border-hairline-soft">VNPay</span>
              <span className="bg-soft-cloud text-ink text-xs font-semibold px-3 py-1.5 rounded-lg border border-hairline-soft">MoMo</span>
              <span className="bg-soft-cloud text-ink text-xs font-semibold px-3 py-1.5 rounded-lg border border-hairline-soft">Chính Hãng</span>
            </div>
          </div>
        </div>

        {/* Legal Fine Print Row */}
        <div className="border-t border-hairline-soft mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-[11px] text-mute gap-4">
          <p>© 2026 Daniel Wellington Inc. Tất cả quyền được bảo lưu.</p>


          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-ink">Điều khoản sử dụng</Link>
            <Link href="/privacy" className="hover:text-ink">Chính sách bảo mật</Link>
            <Link href="/sitemap" className="hover:text-ink">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
