export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-12 py-16 space-y-8">
      <h1 className="text-3xl font-bold uppercase tracking-tight text-ink">Chính Sách Bảo Mật</h1>
      <p className="text-mute text-sm">Cập nhật lần cuối: 14/02/2026</p>
      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-bold text-ink text-lg mb-2">Thu Thập Thông Tin</h2>
          <p className="text-mute">Chúng tôi thu thập họ tên, email, số điện thoại và địa chỉ giao hàng nhằm xử lý đơn hàng và cung cấp dịch vụ bảo hành. Chúng tôi không bao giờ bán thông tin cá nhân cho bên thứ ba.</p>
        </section>
        <section>
          <h2 className="font-bold text-ink text-lg mb-2">Bảo Mật Thanh Toán</h2>
          <p className="text-mute">Toàn bộ giao dịch thanh toán được xử lý qua cổng VNPay được mã hóa SSL. KLTN Jewelry không lưu trữ thông tin thẻ ngân hàng của khách hàng.</p>
        </section>
        <section>
          <h2 className="font-bold text-ink text-lg mb-2">Cookie & Analytics</h2>
          <p className="text-mute">Chúng tôi sử dụng cookie để ghi nhớ phiên đăng nhập và giỏ hàng của bạn. Analytics được thu thập ẩn danh để cải thiện trải nghiệm mua sắm. Bạn có thể xóa cookie bất kỳ lúc nào từ cài đặt trình duyệt.</p>
        </section>
        <section>
          <h2 className="font-bold text-ink text-lg mb-2">Quyền Của Bạn</h2>
          <p className="text-mute">Bạn có quyền yêu cầu xem, sửa đổi hoặc xóa dữ liệu cá nhân của mình. Liên hệ privacy@kltn-jewelry.vn để biết thêm chi tiết.</p>
        </section>
      </div>
    </div>
  );
}
