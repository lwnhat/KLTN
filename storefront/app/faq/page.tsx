export default function FaqPage() {
  const faqs = [
    {
      q: "Sản phẩm có giấy kiểm định GIA thật không?",
      a: "Có. 100% sản phẩm kim cương tại KLTN Jewelry đều đi kèm giấy kiểm định GIA (Gemological Institute of America) hoặc DOJI chính hãng. Bạn có thể kiểm tra số hiệu chứng nhận trực tiếp trên website GIA."
    },
    {
      q: "Dịch vụ khắc chữ laser mất bao lâu?",
      a: "Dịch vụ khắc chữ laser thường hoàn thành trong 1-2 ngày làm việc. Sau khi khắc chữ, sản phẩm sẽ được kiểm tra chất lượng và đóng gói cẩn thận trước khi giao hàng."
    },
    {
      q: "Sản phẩm đã khắc chữ có đổi trả được không?",
      a: "Sản phẩm đã khắc chữ cá nhân hóa không hỗ trợ đổi trả, ngoại trừ trường hợp lỗi sản xuất. Vui lòng kiểm tra kỹ thông tin trước khi xác nhận."
    },
    {
      q: "Làm sao để tra cứu bảo hành?",
      a: "Bạn có thể tra cứu bằng Mã phiếu bảo hành (VD: WR-20240214-00001) hoặc Số điện thoại mua hàng tại trang tra cứu bảo hành trên website."
    },
    {
      q: "KLTN Jewelry hỗ trợ những phương thức thanh toán nào?",
      a: "Chúng tôi hỗ trợ: VietQR, VNPay (QR & thẻ nội địa), chuyển khoản ngân hàng, và thanh toán khi nhận hàng (COD) với đơn hàng dưới 10 triệu đồng."
    },
    {
      q: "Có thể chỉnh size nhẫn sau khi mua không?",
      a: "Có, KLTN Jewelry hỗ trợ chỉnh size nhẫn miễn phí tối đa 2 lần trong vòng 12 tháng bảo hành. Liên hệ cửa hàng để được hẹn lịch."
    }
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-12 py-16 space-y-8">
      <h1 className="text-3xl font-bold uppercase tracking-tight text-ink">Câu Hỏi Thường Gặp (FAQ)</h1>
      <div className="divide-y divide-hairline-soft border-t border-hairline-soft">
        {faqs.map((faq, i) => (
          <details key={i} className="py-5 group">
            <summary className="font-semibold text-ink cursor-pointer list-none flex justify-between items-center gap-4">
              <span>{faq.q}</span>
              <span className="text-mute shrink-0 text-xl leading-none group-open:rotate-180 transition-transform">↓</span>
            </summary>
            <p className="mt-3 text-sm text-mute leading-relaxed">{faq.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
