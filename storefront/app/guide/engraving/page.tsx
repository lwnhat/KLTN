export default function EngravingGuidePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 sm:px-12 py-16 space-y-8">
      <h1 className="text-3xl font-bold uppercase tracking-tight text-ink">Dịch Vụ Khắc Chữ Laser</h1>
      <p className="text-mute text-sm">Lưu giữ kỷ niệm vĩnh cửu trên từng trang sức</p>
      <div className="space-y-6 text-sm leading-relaxed">
        <section className="bg-soft-cloud p-6 rounded-lg border border-hairline-soft">
          <h2 className="font-bold text-ink text-base mb-2">⚡ Công Nghệ Laser Fiber</h2>
          <p className="text-mute">KLTN Jewelry sử dụng máy khắc laser Fiber thế hệ mới nhất, cho phép khắc chính xác đến 0.01mm trên kim loại vàng 18K, bạch kim và palladium mà không ảnh hưởng đến độ bền sản phẩm.</p>
        </section>

        <section>
          <h2 className="font-bold text-ink text-base mb-3">🖋️ Các Font Chữ Hỗ Trợ</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "Script (Chữ Thảo)", desc: "Lãng mạn, phù hợp nhẫn cưới", icon: "💍" },
              { name: "Classic (Cổ Điển)", desc: "Thanh lịch, đẳng cấp trường tồn", icon: "🏛️" },
              { name: "Modern (Hiện Đại)", desc: "In hoa, tối giản, minimalist", icon: "⬛" },
              { name: "Bold (Nét Đậm)", desc: "Mạnh mẽ, cá tính, nổi bật", icon: "💪" },
            ].map(f => (
              <div key={f.name} className="p-4 border border-hairline-soft rounded-lg">
                <div className="text-2xl mb-2">{f.icon}</div>
                <p className="font-semibold text-ink text-xs">{f.name}</p>
                <p className="text-mute text-xs mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-bold text-ink text-base mb-2">📝 Quy Định Nội Dung</h2>
          <ul className="space-y-1 text-mute">
            <li>• Tối đa 30 ký tự (bao gồm cả khoảng trắng)</li>
            <li>• Hỗ trợ tiếng Việt có dấu, tiếng Anh, số</li>
            <li>• Có thể khắc ngày tháng, tên, lời nhắn ngắn</li>
            <li>• Không khắc nội dung thô tục, vi phạm pháp luật</li>
          </ul>
        </section>

        <section className="border border-sale/20 bg-sale/5 p-4 rounded-lg">
          <h2 className="font-bold text-sale text-base mb-2">⚠️ Lưu Ý Quan Trọng</h2>
          <p className="text-mute">Sản phẩm đã được khắc chữ <strong className="text-ink">không hỗ trợ hoàn trả</strong>. Vui lòng kiểm tra kỹ nội dung, font chữ và vị trí trước khi xác nhận đặt hàng. KLTN Jewelry sẽ gửi bản xem trước qua email trước khi tiến hành khắc.</p>
        </section>
      </div>
    </div>
  );
}
