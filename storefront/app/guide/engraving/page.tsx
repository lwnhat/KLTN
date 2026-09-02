import { Metadata } from 'next';
import Breadcrumbs from '@/components/common/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Dịch Vụ Khắc Chữ Laser Cá Nhân Hóa Độc Quyền',
  description: 'Công nghệ khắc laser Fiber quang học chính xác 0.01mm trên trang sức và đồng hồ Daniel Wellington. Hướng dẫn chọn font chữ và nội dung ý nghĩa.',
};

export default function EngravingGuidePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 sm:px-12 py-10 space-y-8">
      <Breadcrumbs items={[{ label: 'Dịch vụ khắc chữ laser' }]} />

      <div>
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-mute">
          Dấu Ấn Cá Nhân
        </span>
        <h1 className="text-3xl font-bold uppercase tracking-tight text-ink mt-1">
          DỊCH VỤ KHẮC CHỮ LASER
        </h1>
        <p className="text-mute text-sm mt-1">
          Lưu giữ khoảnh khắc và kỷ niệm vĩnh cửu trên từng chế tác Daniel Wellington.
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed">
        <section className="bg-soft-cloud p-6 rounded-lg border border-hairline-soft space-y-2">
          <h2 className="font-bold text-ink text-base">⚡ Công Nghệ Laser Fiber Quang Học</h2>
          <p className="text-mute">
            Daniel Wellington sử dụng máy khắc laser Fiber thế hệ mới nhất, cho phép khắc nét siêu mảnh với độ chính xác 0.01mm trên thép không gỉ 316L và vàng 18K mà không làm ảnh hưởng đến cấu trúc kim loại hay lớp mạ.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-bold text-ink text-base">🖋️ 4 Kiểu Font Chữ Tiêu Chuẩn</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Script (Chữ Thảo)', desc: 'Lãng mạn, mềm mại cho cặp đôi', icon: '💍' },
              { name: 'Classic (Cổ Điển)', desc: 'Thanh lịch, chuẩn mực châu Âu', icon: '🏛️' },
              { name: 'Modern (Hiện Đại)', desc: 'In hoa, tối giản, thanh thoát', icon: '⬛' },
              { name: 'Bold (Nét Đậm)', desc: 'Mạnh mẽ, cá tính, nổi bật', icon: '✨' },
            ].map((f) => (
              <div key={f.name} className="p-4 border border-hairline-soft rounded-lg bg-canvas">
                <div className="text-2xl mb-2">{f.icon}</div>
                <p className="font-semibold text-ink text-xs">{f.name}</p>
                <p className="text-mute text-xs mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2 p-5 border border-hairline rounded-lg">
          <h2 className="font-bold text-ink text-base">📝 Quy Định Về Nội Dung Khắc</h2>
          <ul className="space-y-1.5 text-mute text-xs sm:text-sm">
            <li>• Tối đa 30 ký tự (bao gồm cả khoảng trắng và số).</li>
            <li>• Hỗ trợ tiếng Việt có dấu, tiếng Anh, ký tự đặc biệt (♡, ∞, ✿).</li>
            <li>• Phù hợp khắc ngày kỷ niệm (VD: 20.10.2024), tên lồng, tọa độ hoặc thông điệp ngắn.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
