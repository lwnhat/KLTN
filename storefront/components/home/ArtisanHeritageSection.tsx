import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Award, Shield, Compass } from 'lucide-react';

export default function ArtisanHeritageSection() {
  const artisans = [
    {
      name: 'Nguyễn Văn Minh',
      role: 'Nghệ Nhân Kim Hoàn Trưởng (18 năm kinh nghiệm)',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
      bio: 'Chuyên gia xử lý phôi vàng & đính kết đá quý chuẩn giác cắt Thụy Sĩ.',
    },
    {
      name: 'Erik Lindqvist',
      role: 'Giám Đốc Thiết Kế Tối Giản Bắc Âu',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
      bio: 'Định hình ngôn ngữ thiết kế thanh lịch vượt thời gian của Daniel Wellington.',
    },
    {
      name: 'Trần Thị Mỹ Linh',
      role: 'Chuyên Viên Kiểm Định Đá Quý & Kim Cương',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
      bio: 'Thẩm định tiêu chuẩn giác cắt 3X Excellent và độ tinh khiết từng chế tác.',
    },
  ];

  return (
    <section className="max-w-[1440px] mx-auto px-6 sm:px-12 py-8 sm:py-16 space-y-16">
      {/* 1. Craftsmanship & Case Studies Story */}
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

      {/* 2. Team & Artisans Section */}
      <div className="space-y-8 pt-6 border-t border-hairline-soft">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-mute">
            ĐỘI NGŨ CHUYÊN GIA
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-ink">
            NGHỆ NHÂN & NHÀ THIẾT KẾ
          </h3>
          <p className="text-xs sm:text-sm text-mute">
            Những đôi bàn tay tài hoa đứng sau từng đường nét tinh xảo của bộ sưu tập.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {artisans.map((artisan, idx) => (
            <div
              key={idx}
              className="border border-hairline rounded-sm overflow-hidden bg-canvas hover:shadow-md transition-shadow group flex flex-col"
            >
              <div className="relative aspect-[3/4] bg-soft-cloud overflow-hidden">
                <Image
                  src={artisan.image}
                  alt={artisan.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5 space-y-1.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-base text-ink uppercase tracking-wide">
                    {artisan.name}
                  </h4>
                  <p className="text-xs font-medium text-amber-700 mt-0.5">
                    {artisan.role}
                  </p>
                  <p className="text-xs text-mute mt-2 leading-relaxed">
                    {artisan.bio}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
