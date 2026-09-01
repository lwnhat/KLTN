export default function RingSizeGuidePage() {
  const sizes = [
    [44, 5, 3], [46, 6, 3.5], [48, 7, 4.5], [50, 8, 5.5], [52, 9, 6.5],
    [54, 10, 7], [56, 11, 7.5], [58, 12, 8.5], [60, 13, 9.5], [62, 14, 10],
  ];

  return (
    <div className="max-w-2xl mx-auto px-6 sm:px-12 py-16 space-y-8">
      <h1 className="text-3xl font-bold uppercase tracking-tight text-ink">Hướng Dẫn Đo Cỡ Nhẫn</h1>
      <div className="space-y-8 text-sm leading-relaxed">
        <section className="bg-soft-cloud p-6 rounded-lg border border-hairline-soft">
          <h2 className="font-bold text-ink text-base mb-3">📏 Cách 1: Đo bằng giấy</h2>
          <ol className="space-y-2 text-mute list-decimal list-inside">
            <li>Cắt một dải giấy mỏng dài khoảng 10cm, rộng 0.5cm</li>
            <li>Quấn chặt quanh ngón tay cần đeo nhẫn</li>
            <li>Đánh dấu điểm giao nhau bằng bút</li>
            <li>Trải giấy ra và đo chiều dài từ đầu đến điểm đánh dấu</li>
            <li>So sánh với bảng quy đổi bên dưới</li>
          </ol>
        </section>

        <section>
          <h2 className="font-bold text-ink text-base mb-3">📋 Bảng Quy Đổi Cỡ Nhẫn</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-hairline-soft rounded-lg overflow-hidden">
              <thead className="bg-ink text-canvas">
                <tr>
                  <th className="p-3 text-left font-semibold">Chu vi (mm)</th>
                  <th className="p-3 text-left font-semibold">Cỡ VN</th>
                  <th className="p-3 text-left font-semibold">Cỡ US</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {sizes.map(([circ, vn, us]) => (
                  <tr key={vn} className="hover:bg-soft-cloud transition-colors">
                    <td className="p-3 text-mute">{circ} mm</td>
                    <td className="p-3 font-semibold text-ink">Size {vn}</td>
                    <td className="p-3 text-mute">US {us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-bold text-ink text-base mb-2">💡 Lưu Ý</h2>
          <p className="text-mute">Nên đo vào buổi chiều hoặc tối khi ngón tay hơi phồng hơn. Nếu size nằm giữa hai cỡ, hãy chọn cỡ lớn hơn. Liên hệ chúng tôi nếu bạn cần hỗ trợ chọn size.</p>
        </section>
      </div>
    </div>
  );
}
