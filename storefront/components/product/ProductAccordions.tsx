"use client";

import React, { useState } from 'react';
import { ChevronDown, MapPin, Shield, RefreshCw, Sparkles, Award } from 'lucide-react';

interface ProductAccordionsProps {
  product: any;
  selectedVariant?: any;
  categorySlug?: string;
}

export default function ProductAccordions({ product, selectedVariant, categorySlug }: ProductAccordionsProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    gioiThieu: false,
    chiTiet: false,
    cuaHang: false,
    boSuuTap: false,
    doiTra: false,
  });

  const toggle = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="border-t border-hairline divide-y divide-hairline text-xs">
      {/* 1. Giới thiệu */}
      <div>
        <button
          type="button"
          onClick={() => toggle('gioiThieu')}
          className="w-full py-4 flex items-center justify-between font-semibold text-ink uppercase tracking-wider hover:text-mute transition-colors text-left"
        >
          <span>Giới thiệu</span>
          <ChevronDown
            className={`w-4 h-4 text-mute transition-transform duration-200 ${
              openSections.gioiThieu ? 'rotate-180 text-ink' : ''
            }`}
          />
        </button>
        {openSections.gioiThieu && (
          <div className="pb-4 space-y-3 text-mute leading-relaxed animate-fadeIn">
            <p>
              Được thiết kế tại Stockholm (Thụy Điển), mỗi chế tác trang sức của <strong>Daniel Wellington</strong> là kết tinh của sự tối giản vượt thời gian và sự tinh xảo trong từng đường nét.
            </p>
            <p>
              Dòng trang sức cao cấp mang hơi thở thanh lịch Bắc Âu, dễ dàng kết hợp cùng đồng hồ và các phụ kiện khác để tôn lên vẻ đẹp kiêu sa, cuốn hút của người sở hữu dù trong phong cách thường nhật hay các buổi tiệc dạ hội sang trọng.
            </p>
            <div className="flex items-center gap-2 text-ink font-semibold pt-1">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Chế tác tỉ mỉ bằng công nghệ mạ PVD kép & đánh bóng thủ công.</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Chi tiết */}
      <div>
        <button
          type="button"
          onClick={() => toggle('chiTiet')}
          className="w-full py-4 flex items-center justify-between font-semibold text-ink uppercase tracking-wider hover:text-mute transition-colors text-left"
        >
          <span>Chi tiết</span>
          <ChevronDown
            className={`w-4 h-4 text-mute transition-transform duration-200 ${
              openSections.chiTiet ? 'rotate-180 text-ink' : ''
            }`}
          />
        </button>
        {openSections.chiTiet && (
          <div className="pb-4 space-y-2.5 text-mute leading-relaxed animate-fadeIn">
            <div className="grid grid-cols-2 gap-2 border border-hairline-soft p-3 rounded bg-soft-cloud/50">
              <div>
                <span className="text-[11px] text-mute block uppercase font-bold">Mã SKU:</span>
                <span className="text-ink font-mono font-semibold">{selectedVariant?.sku || product?.id?.slice(0, 10)}</span>
              </div>
              <div>
                <span className="text-[11px] text-mute block uppercase font-bold">Chất liệu:</span>
                <span className="text-ink font-semibold">{product?.material || 'Thép 316L mạ PVD / Vàng 18K'}</span>
              </div>
              <div>
                <span className="text-[11px] text-mute block uppercase font-bold">Màu sắc:</span>
                <span className="text-ink font-semibold">Bạc (Silver) / Vàng hồng (Rose Gold)</span>
              </div>
              <div>
                <span className="text-[11px] text-mute block uppercase font-bold">Bảo hành:</span>
                <span className="text-ink font-semibold">2 Năm Chính Hãng Toàn Cầu</span>
              </div>
            </div>
            <p className="text-[11px] text-mute pt-1">
              * Khuyến nghị bảo quản: Hạn chế tiếp xúc trực tiếp với hóa chất tẩy rửa mạnh, nước hoa hoặc cồn để giữ độ sáng bóng nguyên bản lâu dài.
            </p>
          </div>
        )}
      </div>

      {/* 3. Cửa hàng tại Việt Nam */}
      <div>
        <button
          type="button"
          onClick={() => toggle('cuaHang')}
          className="w-full py-4 flex items-center justify-between font-semibold text-ink uppercase tracking-wider hover:text-mute transition-colors text-left"
        >
          <span>Cửa hàng tại Việt Nam</span>
          <ChevronDown
            className={`w-4 h-4 text-mute transition-transform duration-200 ${
              openSections.cuaHang ? 'rotate-180 text-ink' : ''
            }`}
          />
        </button>
        {openSections.cuaHang && (
          <div className="pb-4 space-y-3 text-mute leading-relaxed animate-fadeIn">
            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-ink shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-ink">Showroom Takashimaya TP.HCM</p>
                  <p className="text-[11px]">Tầng 1, 92-94 Nam Kỳ Khởi Nghĩa, Bến Nghé, Quận 1, TP. Hồ Chí Minh</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-ink shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-ink">Showroom Vincom Center Bà Triệu Hà Nội</p>
                  <p className="text-[11px]">Tầng 1, 191 Bà Triệu, Lê Đại Hành, Hai Bà Trưng, Hà Nội</p>
                </div>
              </div>
            </div>
            <p className="text-[11px] bg-soft-cloud p-2.5 rounded border border-hairline-soft text-charcoal">
              📞 Hotline đặt lịch tư vấn & thử size trực tiếp: <strong className="text-ink">093 202 9606</strong> (8:30 - 21:30)
            </p>
          </div>
        )}
      </div>

      {/* 4. Bộ sưu tập tương tự */}
      <div>
        <button
          type="button"
          onClick={() => toggle('boSuuTap')}
          className="w-full py-4 flex items-center justify-between font-semibold text-ink uppercase tracking-wider hover:text-mute transition-colors text-left"
        >
          <span>Bộ sưu tập tương tự</span>
          <ChevronDown
            className={`w-4 h-4 text-mute transition-transform duration-200 ${
              openSections.boSuuTap ? 'rotate-180 text-ink' : ''
            }`}
          />
        </button>
        {openSections.boSuuTap && (
          <div className="pb-4 space-y-2.5 text-mute leading-relaxed animate-fadeIn">
            <div className="space-y-2">
              <div className="p-2.5 border border-hairline-soft rounded bg-soft-cloud/40">
                <span className="font-bold text-ink block text-xs">✨ Daniel Wellington Classic Collection</span>
                <span className="text-[11px] text-mute">Đường nét thanh thoát, biểu tượng phong cách tối giản thanh lịch không tuổi.</span>
              </div>
              <div className="p-2.5 border border-hairline-soft rounded bg-soft-cloud/40">
                <span className="font-bold text-ink block text-xs">💎 Elan & Emalie Modern Luxury</span>
                <span className="text-[11px] text-mute">Chế tác đa tầng, mặt men gốm sứ trắng tinh khôi kết hợp viền ánh vàng.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Đổi trả sản phẩm */}
      <div>
        <button
          type="button"
          onClick={() => toggle('doiTra')}
          className="w-full py-4 flex items-center justify-between font-semibold text-ink uppercase tracking-wider hover:text-mute transition-colors text-left"
        >
          <span>Đổi trả sản phẩm</span>
          <ChevronDown
            className={`w-4 h-4 text-mute transition-transform duration-200 ${
              openSections.doiTra ? 'rotate-180 text-ink' : ''
            }`}
          />
        </button>
        {openSections.doiTra && (
          <div className="pb-4 space-y-2 text-mute leading-relaxed animate-fadeIn">
            <ul className="space-y-1.5 list-disc list-inside text-mute">
              <li><strong>Đổi hàng miễn phí trong 30 ngày:</strong> Áp dụng cho các sản phẩm chưa qua sử dụng, còn nguyên tem mác và hộp đựng.</li>
              <li><strong>Bảo hành chính hãng 24 tháng:</strong> Miễn phí kiểm tra, làm sáng bóng và khắc phục các vấn đề lớp mạ.</li>
              <li><strong>Giao nhận đổi size tận nhà:</strong> Đội ngũ hỗ trợ mang size mới tới tận nơi và thu hồi sản phẩm cần đổi hoàn toàn tiện lợi.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
