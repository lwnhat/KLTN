import { Zap, Clock, ShieldCheck, Sparkles } from 'lucide-react';

export default function TrustBanner() {
  const promises = [
    {
      icon: Zap,
      title: 'Giao Hỏa Tốc 2H',
      desc: 'Nội thành TP.HCM & Hà Nội. Bảo hiểm 100% giá trị kiện hàng.',
    },
    {
      icon: Clock,
      title: 'Phản Hồi Trong 15 Phút',
      desc: 'Tư vấn viên kim hoàn trực tuyến 24/7 giải đáp mọi thắc mắc.',
    },
    {
      icon: ShieldCheck,
      title: 'Bảo Hành & Đổi Size 12T',
      desc: 'Miễn phí chỉnh size 2 lần & làm mới đánh bóng kim hoàn trọn đời.',
    },
    {
      icon: Sparkles,
      title: 'Khắc Laser Độc Quyền',
      desc: 'Miễn phí khắc tên, ngày kỷ niệm và thông điệp riêng theo yêu cầu.',
    },
  ];

  return (
    <section className="border-y border-hairline bg-soft-cloud/40 py-8 px-6 sm:px-12">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {promises.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-start gap-3.5 group">
                <div className="w-10 h-10 rounded-full bg-canvas border border-hairline flex items-center justify-center shrink-0 shadow-sm group-hover:border-ink transition-colors">
                  <Icon className="w-4 h-4 text-ink stroke-[1.5]" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-ink">
                    {item.title}
                  </h4>
                  <p className="text-xs text-mute leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
