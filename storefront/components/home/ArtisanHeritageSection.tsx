import Image from 'next/image';
import Link from 'next/link';

export default function ArtisanHeritageSection() {
  return (
    <section className="max-w-[1440px] mx-auto px-6 sm:px-12 py-8 sm:py-16">
      {/* Craftsmanship & Brand Heritage Story */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="relative aspect-[4/3] rounded-sm overflow-hidden bg-ink shadow-lg">
          <Image
            src="https://images.unsplash.com/photo-1531995811006-35cb42e1a022?w=1200&auto=format&fit=crop&q=80"
            alt="Xưởng chế tác kim hoàn thủ công Daniel Wellington"
            fill
            className="object-cover object-center opacity-90 hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6 sm:p-8">
            <span className="text-canvas text-xs uppercase tracking-[0.2em] font-semibold border-l-2 border-white pl-3">
              Atelier Chế Tác Thủ Công — Chuẩn Mực Bắc Âu
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold tracking-[0.25em] uppercase text-mute">
              DI SẢN & NGHỆ THUẬT CHẾ TÁC
            </span>
            <h2 className="text-2xl sm:text-4xl font-display-campaign font-bold tracking-tight text-ink uppercase leading-tight">
              TỪ BẢN VẼ TỐI GIẢN ĐẾN TUYỆT TÁC TRANG SỨC
            </h2>
          </div>

          <p className="text-sm sm:text-base text-mute leading-relaxed">
            Mỗi chế tác trang sức Daniel Wellington là sự giao thoa hoàn mỹ giữa triết lý thẩm mỹ tối giản Thụy Điển và kỹ nghệ kim hoàn đỉnh cao. Từng đường vát cạnh, ổ chấu đính đá và bề mặt mạ vàng 18K đều trải qua hơn 40 công đoạn hoàn thiện thủ công nghiêm ngặt.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="border-l-2 border-ink pl-4 space-y-1">
              <span className="text-xl sm:text-2xl font-bold text-ink font-mono">100%</span>
              <p className="text-xs text-mute">Thép không gỉ 316L & Mạ Vàng 18K chân không PVD bền màu vĩnh cửu.</p>
            </div>
            <div className="border-l-2 border-ink pl-4 space-y-1">
              <span className="text-xl sm:text-2xl font-bold text-ink font-mono">0.01mm</span>
              <p className="text-xs text-mute">Độ chính xác khắc laser độc quyền theo yêu cầu cá nhân hóa.</p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/guide/engraving"
              className="btn-secondary inline-flex text-xs font-semibold uppercase tracking-wider py-3 px-6"
            >
              Tìm Hiểu Kỹ Thuật Khắc Laser →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
