import { Metadata } from 'next';
import Breadcrumbs from '@/components/common/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Chính Sách Bảo Mật Thông Tin Khách Hàng',
  description: 'Cam kết bảo mật dữ liệu cá nhân, mã hóa giao dịch thanh toán và quyền riêng tư của khách hàng tại Daniel Wellington.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-12 py-10 space-y-8">
      <Breadcrumbs items={[{ label: 'Chính sách bảo mật' }]} />

      <div>
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-mute">
          Bảo Vệ Dữ Liệu
        </span>
        <h1 className="text-3xl font-bold uppercase tracking-tight text-ink mt-1">
          CHÍNH SÁCH BẢO MẬT
        </h1>
        <p className="text-mute text-xs mt-1">Cập nhật lần cuối: Tháng 09/2026</p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed">
        <section className="p-5 bg-soft-cloud rounded-lg border border-hairline-soft space-y-2">
          <h2 className="font-bold text-ink text-base">Thu Thập &amp; Sử Dụng Thông Tin</h2>
          <p className="text-mute">
            Chúng tôi thu thập họ tên, email, số điện thoại và địa chỉ giao hàng nhằm phục vụ mục đích xử lý đơn hàng, xuất hóa đơn và kích hoạt bảo hành điện tử. Daniel Wellington cam kết không bao giờ mua bán dữ liệu khách hàng cho bên thứ ba.
          </p>
        </section>

        <section className="p-5 bg-soft-cloud rounded-lg border border-hairline-soft space-y-2">
          <h2 className="font-bold text-ink text-base">Mã Hóa &amp; An Toàn Thanh Toán</h2>
          <p className="text-mute">
            Mọi giao dịch thanh toán trực tuyến qua VietQR, VNPay và MoMo đều được mã hóa bằng giao thức SSL/TLS chuẩn ngân hàng quốc tế. Hệ thống không lưu trữ thông tin số thẻ hay mã PIN bảo mật của khách hàng.
          </p>
        </section>

        <section className="p-5 bg-soft-cloud rounded-lg border border-hairline-soft space-y-2">
          <h2 className="font-bold text-ink text-base">Quyền Riêng Tư Của Bạn</h2>
          <p className="text-mute">
            Quý khách có toàn quyền yêu cầu trích xuất, cập nhật hoặc xóa thông tin cá nhân khỏi hệ thống bảo hành bất kỳ lúc nào bằng cách liên hệ với bộ phận Chăm sóc khách hàng Daniel Wellington.
          </p>
        </section>
      </div>
    </div>
  );
}
