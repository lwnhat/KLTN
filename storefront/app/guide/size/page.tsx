import { Metadata } from 'next';
import Breadcrumbs from '@/components/common/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Hướng Dẫn Đo Cỡ Nhẫn & Vòng Tay Chuẩn Quốc Tế',
  description: 'Bảng quy đổi chu vi ngón tay, size nhẫn Việt Nam (VN), Mỹ (US) và hướng dẫn tự đo size nhẫn chính xác tại nhà từ Daniel Wellington.',
};

export default function RingSizeGuidePage() {
  const sizes = [
    [44, 44, '3 - 3.5'],
    [46, 46, '3.5 - 4'],
    [48, 48, '4.5'],
    [50, 50, '5 - 5.5'],
    [52, 52, '6 - 6.5'],
    [54, 54, '7'],
    [56, 56, '7.5 - 8'],
    [58, 58, '8.5'],
    [60, 60, '9 - 9.5'],
    [62, 62, '10'],
  ];

  return (
    <div className="max-w-2xl mx-auto px-6 sm:px-12 py-10 space-y-8">
      <Breadcrumbs items={[{ label: 'Hướng dẫn đo size' }]} />

      <div>
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-mute">
          Cẩm Nang Kim Hoàn
        </span>
        <h1 className="text-3xl font-bold uppercase tracking-tight text-ink mt-1">
          HƯỚNG DẪN ĐO CỠ NHẪN
        </h1>
        <p className="text-sm text-mute mt-1">
          Đo chính xác chu vi ngón tay để chọn size nhẫn hoàn hảo, vừa vặn và êm ái nhất.
        </p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed">
        <section className="bg-soft-cloud p-6 rounded-lg border border-hairline-soft">
          <h2 className="font-bold text-ink text-base mb-3">📏 Cách Đo Đơn Giản Bằng Dải Giấy</h2>
          <ol className="space-y-2 text-mute list-decimal list-inside text-xs sm:text-sm">
            <li>Cắt một dải giấy mỏng dài khoảng 10cm, rộng 0.5cm.</li>
            <li>Quấn vừa vặn quanh đốt ngón tay cần đeo nhẫn (không quá chặt).</li>
            <li>Dùng bút đánh dấu chính xác điểm giao nhau của 2 mép giấy.</li>
            <li>Trải thẳng dải giấy và dùng thước kẻ đo chiều dài tính theo milimet (mm).</li>
            <li>Đối chiếu số đo chu vi với bảng size tiêu chuẩn bên dưới.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-bold text-ink text-base mb-3">📋 Bảng Quy Đổi Size Nhẫn Tiêu Chuẩn</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-hairline-soft rounded-lg overflow-hidden">
              <thead className="bg-ink text-canvas">
                <tr>
                  <th className="p-3 text-left font-semibold">Chu vi ngón (mm)</th>
                  <th className="p-3 text-left font-semibold">Size DW / Châu Âu</th>
                  <th className="p-3 text-left font-semibold">Size Quốc Tế (US)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {sizes.map(([circ, dw, us]) => (
                  <tr key={dw} className="hover:bg-soft-cloud transition-colors">
                    <td className="p-3 text-mute font-mono">{circ} mm</td>
                    <td className="p-3 font-semibold text-ink">Size {dw}</td>
                    <td className="p-3 text-mute">US {us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-mute mt-3 italic">
            * Daniel Wellington hỗ trợ chỉnh size miễn phí 2 lần trong 12 tháng nếu bạn đeo chưa vừa.
          </p>
        </section>
      </div>
    </div>
  );
}
