import { Metadata } from 'next';
import Breadcrumbs from '@/components/common/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Chính Sách Vận Chuyển & Giao Hỏa Tốc 2H',
  description: 'Dịch vụ giao hàng hỏa tốc 2H nội thành, miễn phí vận chuyển toàn quốc cho đơn từ 5 triệu đồng và bảo hiểm hàng hóa 100% tại Daniel Wellington.',
};

export default function ShippingPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-12 py-10 space-y-8">
      <Breadcrumbs items={[{ label: 'Giao hàng & Vận chuyển' }]} />

      <div>
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-mute">
          Dịch Vụ Vận Chuyển
        </span>
        <h1 className="text-3xl font-bold uppercase tracking-tight text-ink mt-1">
          GIAO HÀNG &amp; BẢO HIỂM TẬN NƠI
        </h1>
        <p className="text-mute text-xs mt-1">Cam kết đúng hẹn, an toàn và bảo mật tối đa.</p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed">
        <section className="bg-soft-cloud p-6 rounded-lg border border-hairline-soft space-y-2">
          <h2 className="font-bold text-ink text-base">⚡ Miễn Phí Vận Chuyển Toàn Quốc</h2>
          <p className="text-mute">
            Tất cả đơn hàng từ <strong>5.000.000 VND</strong> trở lên được miễn phí vận chuyển hỏa tốc toàn quốc, kèm bảo hiểm giá trị cao 100% và đóng gói hộp quà sang trọng.
          </p>
        </section>

        <section className="p-5 border border-hairline rounded-lg space-y-3">
          <h2 className="font-bold text-ink text-base">Thời Gian Giao Vận Cam Kết</h2>
          <div className="space-y-2 text-mute">
            <p>⚡ <strong>Giao Hỏa Tốc 2H:</strong> Áp dụng cho các quận nội thành TP.HCM &amp; Hà Nội.</p>
            <p>🏙️ <strong>Giao Chuẩn 24H:</strong> Các quận ngoại thành và trung tâm các thành phố lớn.</p>
            <p>🗺️ <strong>Toàn Quốc 2-3 ngày làm việc:</strong> Qua đơn vị vận chuyển Viettel Post / GHN chuyên biệt hàng giá trị cao.</p>
          </div>
        </section>

        <section className="p-5 border border-hairline rounded-lg space-y-2">
          <h2 className="font-bold text-ink text-base">💎 Đồng Kiểm &amp; Thử Kích Cỡ Khi Nhận Hàng</h2>
          <p className="text-mute">
            Khách hàng được quyền mở hộp kiểm tra tính nguyên vẹn của tem niêm phong, kiểm định viên đá và thử vừa kích cỡ nhẫn trước khi thanh toán cho nhân viên giao vận.
          </p>
        </section>
      </div>
    </div>
  );
}
