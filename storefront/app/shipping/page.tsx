export default function ShippingPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-12 py-16 space-y-8">
      <h1 className="text-3xl font-bold uppercase tracking-tight text-ink">Giao Hàng & Kiểm Định Tận Nơi</h1>
      <div className="space-y-6 text-sm leading-relaxed">
        <section className="bg-soft-cloud p-6 rounded-lg border border-hairline-soft">
          <h2 className="font-bold text-ink text-lg mb-2">🚚 Miễn Phí Vận Chuyển</h2>
          <p className="text-mute">Tất cả đơn hàng từ <strong>5,000,000 VND</strong> trở lên được giao hàng miễn phí toàn quốc, kèm bảo hiểm hàng giá trị cao.</p>
        </section>
        <section>
          <h2 className="font-bold text-ink text-lg mb-2">Thời Gian Giao Hàng</h2>
          <div className="space-y-2 text-mute">
            <p>🏙️ Nội thành TP.HCM & Hà Nội: <strong className="text-ink">24 giờ</strong></p>
            <p>🗺️ Các tỉnh thành khác: <strong className="text-ink">2-3 ngày làm việc</strong></p>
            <p>🏔️ Vùng sâu vùng xa: <strong className="text-ink">4-7 ngày làm việc</strong></p>
          </div>
        </section>
        <section>
          <h2 className="font-bold text-ink text-lg mb-2">💎 Dịch Vụ Kiểm Định & Giao Tận Nơi</h2>
          <p className="text-mute">KLTN Jewelry cung cấp dịch vụ kiểm định và giao sản phẩm tận nhà cho các đơn hàng nhẫn kim cương từ 20 triệu đồng tại TP.HCM và Hà Nội. Chuyên viên của chúng tôi sẽ mang theo thiết bị kiểm định chuyên nghiệp để xác minh chất lượng ngay tại nhà bạn.</p>
        </section>
      </div>
    </div>
  );
}
