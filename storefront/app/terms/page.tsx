import { Metadata } from 'next';
import Breadcrumbs from '@/components/common/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Chính Sách Thu Đổi & Bảo Hành',
  description: 'Chính sách bảo hành 12 tháng, đổi trả 30 ngày và dịch vụ làm mới đánh bóng kim hoàn miễn phí tại Daniel Wellington.',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-12 py-10 space-y-8">
      <Breadcrumbs items={[{ label: 'Chính sách thu đổi & bảo hành' }]} />

      <div>
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-mute">
          Quy Định & Quyền Lợi
        </span>
        <h1 className="text-3xl font-bold uppercase tracking-tight text-ink mt-1">
          CHÍNH SÁCH THU ĐỔI & BẢO HÀNH
        </h1>
        <p className="text-mute text-xs mt-1">Cập nhật lần cuối: Tháng 09/2026</p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed">
        <section className="p-5 bg-soft-cloud rounded-lg border border-hairline-soft space-y-2">
          <h2 className="font-bold text-ink text-base">1. Chính Sách Đổi Trả Trong 30 Ngày</h2>
          <p className="text-mute">
            Daniel Wellington hỗ trợ đổi sản phẩm mới trong vòng 30 ngày kể từ ngày nhận hàng với điều kiện sản phẩm còn nguyên vẹn, chưa qua sử dụng và chưa áp dụng khắc chữ cá nhân hóa.
          </p>
        </section>

        <section className="p-5 bg-soft-cloud rounded-lg border border-hairline-soft space-y-2">
          <h2 className="font-bold text-ink text-base">2. Bảo Hành Chính Hãng 12 Tháng</h2>
          <p className="text-mute">
            Tất cả chế tác trang sức đều được bảo hành 12 tháng điện tử: bao gồm làm sạch siêu âm, đánh bóng hoàn thiện bề mặt, chỉnh size nhẫn miễn phí 2 lần và kiểm tra ổ chấu đá quý trọn đời.
          </p>
        </section>

        <section className="p-5 bg-soft-cloud rounded-lg border border-hairline-soft space-y-2">
          <h2 className="font-bold text-ink text-base">3. Sản Phẩm Khắc Laser Cá Nhân Hóa</h2>
          <p className="text-mute">
            Các chế tác đã khắc chữ, thông điệp cá nhân hóa độc quyền không áp dụng đổi trả theo sở thích cá nhân, trừ trường hợp lỗi phát sinh từ khâu sản xuất hoặc kỹ thuật khắc.
          </p>
        </section>

        <section className="p-5 bg-soft-cloud rounded-lg border border-hairline-soft space-y-2">
          <h2 className="font-bold text-ink text-base">4. Quy Trình Tiếp Nhận Bảo Hành</h2>
          <p className="text-mute">
            Quý khách chỉ cần cung cấp Số điện thoại đặt hàng hoặc Mã phiếu bảo hành tại bất kỳ Showroom Daniel Wellington nào để được kiểm định và bảo dưỡng ngay.
          </p>
        </section>
      </div>
    </div>
  );
}
