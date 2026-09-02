import { Metadata } from 'next';
import Breadcrumbs from '@/components/common/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Câu Hỏi Thường Gặp (FAQ)',
  description: 'Giải đáp các thắc mắc thường gặp về kiểm định kim cương GIA, dịch vụ khắc chữ laser, đổi size nhẫn và chính sách bảo hành Daniel Wellington.',
};

export default function FaqPage() {
  const faqs = [
    {
      q: 'Sản phẩm có giấy chứng nhận kiểm định chính hãng không?',
      a: 'Có. 100% sản phẩm trang sức và đồng hồ tại Daniel Wellington đều đi kèm thẻ bảo hành điện tử chính hãng và giấy kiểm định quốc tế (GIA / DOJI). Quý khách có thể quét mã QR tra cứu trực tiếp.',
    },
    {
      q: 'Dịch vụ khắc chữ laser mất bao lâu?',
      a: 'Dịch vụ khắc chữ laser thường hoàn thành trong vòng 24 - 48 giờ. Sau khi khắc hoàn tất, chế tác sẽ được kiểm định chất lượng quang học và đóng gói trong hộp quà Daniel Wellington sang trọng.',
    },
    {
      q: 'Sản phẩm đã khắc chữ có được đổi trả không?',
      a: 'Sản phẩm đã khắc chữ cá nhân hóa theo yêu cầu không áp dụng đổi trả theo sở thích, ngoại trừ trường hợp có lỗi kỹ thuật từ nhà sản xuất.',
    },
    {
      q: 'Làm sao để tra cứu phiếu bảo hành điện tử?',
      a: 'Quý khách có thể tra cứu nhanh bằng Mã phiếu bảo hành (VD: WR-XXXXXXXX-XXXX) hoặc Số điện thoại mua hàng tại trang Tra cứu bảo hành trên website.',
    },
    {
      q: 'Daniel Wellington hỗ trợ những phương thức thanh toán nào?',
      a: 'Chúng tôi hỗ trợ chuyển khoản tức thì VietQR (mọi ngân hàng), cổng VNPay (ATM / Visa / Master / JCB), ví điện tử MoMo, và thanh toán tiền mặt khi nhận hàng (COD).',
    },
    {
      q: 'Tôi có thể chỉnh size nhẫn sau khi mua không?',
      a: 'Có. Daniel Wellington hỗ trợ chỉnh size nhẫn miễn phí 2 lần trong vòng 12 tháng kể từ ngày mua hàng. Quý khách có thể mang đến bất kỳ Showroom nào trong hệ thống.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-12 py-10 space-y-8">
      <Breadcrumbs items={[{ label: 'Câu hỏi thường gặp' }]} />

      <div>
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-mute">
          Trung Tâm Hỗ Trợ
        </span>
        <h1 className="text-3xl font-bold uppercase tracking-tight text-ink mt-1">
          CÂU HỎI THƯỜNG GẶP (FAQ)
        </h1>
        <p className="text-sm text-mute mt-1">
          Những giải đáp nhanh về chế tác, giao nhận và dịch vụ hậu mãi Daniel Wellington.
        </p>
      </div>

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
