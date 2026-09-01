"use client";

import React, { useState } from 'react';
import { X, Ruler, Sparkles } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'nhan' | 'vong-tay' | 'day-chuyen' | 'bong-tai';
}

export default function SizeGuideModal({ isOpen, onClose, defaultTab = 'nhan' }: SizeGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'nhan' | 'vong-tay' | 'day-chuyen'>(
    defaultTab === 'bong-tai' ? 'nhan' : defaultTab
  );

  if (!isOpen) return null;

  const ringSizes = [
    { circ: '48 mm', vn: 'Size 48', us: 'US 4.5', diam: '15.3 mm' },
    { circ: '50 mm', vn: 'Size 50', us: 'US 5.5', diam: '15.9 mm' },
    { circ: '52 mm', vn: 'Size 52', us: 'US 6.0', diam: '16.5 mm' },
    { circ: '54 mm', vn: 'Size 54', us: 'US 7.0', diam: '17.2 mm' },
    { circ: '56 mm', vn: 'Size 56', us: 'US 7.5', diam: '17.8 mm' },
    { circ: '58 mm', vn: 'Size 58', us: 'US 8.5', diam: '18.5 mm' },
    { circ: '60 mm', vn: 'Size 60', us: 'US 9.5', diam: '19.1 mm' },
    { circ: '62 mm', vn: 'Size 62', us: 'US 10.0', diam: '19.7 mm' },
  ];

  const braceletSizes = [
    { size: 'Size S (Nhỏ)', wrist: '135 - 155 mm', fit: 'Cổ tay thanh mảnh (Nữ)' },
    { size: 'Size M (Vừa)', wrist: '155 - 170 mm', fit: 'Tiêu chuẩn phổ biến (Nữ / Nam cổ tay nhỏ)' },
    { size: 'Size L (Lớn)', wrist: '170 - 185 mm', fit: 'Cổ tay đầy đặn (Nam / Nữ thích đeo rộng)' },
  ];

  const necklaceSizes = [
    { len: '40 cm', desc: 'Ôm sát xương quai xanh (Choker / Cổ áo tròn)', bestFor: 'Mặt dây chuyền nhỏ, thanh lịch' },
    { len: '45 cm', desc: 'Rơi ngay dưới xương quai xanh (Tiêu chuẩn phổ biến nhất)', bestFor: 'Phù hợp mọi phong cách & trang phục' },
    { len: '50 cm', desc: 'Rơi ngang ngực áo trên (Plunge)', bestFor: 'Đeo kết hợp nhiều lớp (Layering)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-xl bg-canvas border border-hairline shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-hairline-soft flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-ink" />
            <h2 className="text-lg font-bold uppercase tracking-wider text-ink">Hướng Dẫn Kích Thước</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-mute hover:text-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-hairline-soft bg-soft-cloud/50">
          <button
            type="button"
            onClick={() => setActiveTab('nhan')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'nhan'
                ? 'border-b-2 border-ink text-ink bg-canvas'
                : 'text-mute hover:text-ink'
            }`}
          >
            💍 Cỡ Nhẫn
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vong-tay')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'vong-tay'
                ? 'border-b-2 border-ink text-ink bg-canvas'
                : 'text-mute hover:text-ink'
            }`}
          >
            💫 Vòng Tay
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('day-chuyen')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'day-chuyen'
                ? 'border-b-2 border-ink text-ink bg-canvas'
                : 'text-mute hover:text-ink'
            }`}
          >
            ✨ Dây Chuyền
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-charcoal">
          {activeTab === 'nhan' && (
            <div className="space-y-5">
              <div className="bg-soft-cloud p-4 rounded border border-hairline-soft">
                <p className="font-bold text-ink mb-2">📏 Cách đo chu vi ngón tay bằng giấy:</p>
                <ol className="list-decimal list-inside space-y-1 text-mute">
                  <li>Cắt dải giấy dài khoảng 10cm, rộng 0.5cm.</li>
                  <li>Quấn vừa vặn quanh ngón tay bạn dự định đeo nhẫn.</li>
                  <li>Dùng bút đánh dấu điểm giao nhau của dải giấy.</li>
                  <li>Dùng thước kẻ đo khoảng cách (mm) và đối chiếu bảng dưới đây.</li>
                </ol>
              </div>

              <div>
                <p className="font-bold text-ink mb-2">📋 Bảng quy đổi cỡ nhẫn tiêu chuẩn:</p>
                <div className="overflow-x-auto border border-hairline-soft rounded">
                  <table className="w-full text-center">
                    <thead className="bg-ink text-canvas">
                      <tr>
                        <th className="p-2.5 text-xs font-semibold">Cỡ Nhẫn</th>
                        <th className="p-2.5 text-xs font-semibold">Chu Vi (mm)</th>
                        <th className="p-2.5 text-xs font-semibold">Đường Kính (mm)</th>
                        <th className="p-2.5 text-xs font-semibold">Cỡ Quốc Tế (US)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline-soft">
                      {ringSizes.map((row) => (
                        <tr key={row.vn} className="hover:bg-soft-cloud">
                          <td className="p-2.5 font-bold text-ink">{row.vn}</td>
                          <td className="p-2.5 text-mute">{row.circ}</td>
                          <td className="p-2.5 text-mute">{row.diam}</td>
                          <td className="p-2.5 text-mute">{row.us}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vong-tay' && (
            <div className="space-y-5">
              <div className="bg-soft-cloud p-4 rounded border border-hairline-soft">
                <p className="font-bold text-ink mb-2">📏 Cách đo chu vi cổ tay:</p>
                <p className="text-mute leading-relaxed">
                  Dùng thước dây mềm quấn nhẹ quanh vị trí cổ tay bạn muốn đeo vòng. 
                  Đối với dòng vòng tay hở (Cuff), bạn có thể nới nhẹ hoặc bóp khép để ôm vừa vặn theo cổ tay.
                </p>
              </div>

              <div>
                <p className="font-bold text-ink mb-2">📋 Bảng cỡ vòng tay Daniel Wellington:</p>
                <div className="overflow-x-auto border border-hairline-soft rounded">
                  <table className="w-full text-left">
                    <thead className="bg-ink text-canvas">
                      <tr>
                        <th className="p-2.5 text-xs font-semibold">Kích Cỡ</th>
                        <th className="p-2.5 text-xs font-semibold">Chu Vi Cổ Tay</th>
                        <th className="p-2.5 text-xs font-semibold">Phù Hợp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline-soft">
                      {braceletSizes.map((row) => (
                        <tr key={row.size} className="hover:bg-soft-cloud">
                          <td className="p-2.5 font-bold text-ink">{row.size}</td>
                          <td className="p-2.5 text-mute">{row.wrist}</td>
                          <td className="p-2.5 text-mute">{row.fit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'day-chuyen' && (
            <div className="space-y-5">
              <div className="bg-soft-cloud p-4 rounded border border-hairline-soft">
                <p className="font-bold text-ink mb-2">✨ Vị trí rơi của mặt dây chuyền:</p>
                <p className="text-mute leading-relaxed">
                  Các mẫu dây chuyền của Daniel Wellington thường đi kèm mắt xích điều chỉnh độ dài (từ 40cm đến 45cm) giúp bạn dễ dàng thay đổi theo cổ áo hoặc phong cách phối đồ.
                </p>
              </div>

              <div>
                <p className="font-bold text-ink mb-2">📋 Chiều dài tiêu chuẩn:</p>
                <div className="space-y-2">
                  {necklaceSizes.map((item) => (
                    <div key={item.len} className="p-3 border border-hairline-soft rounded flex items-center justify-between gap-4">
                      <div>
                        <span className="font-bold text-ink text-sm">{item.len}</span>
                        <p className="text-mute mt-0.5">{item.desc}</p>
                      </div>
                      <span className="text-[11px] font-semibold text-charcoal shrink-0 bg-soft-cloud px-2 py-1 rounded">
                        {item.bestFor}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="bg-amber-50/70 border border-amber-200/60 p-3 rounded text-[11px] text-amber-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              <strong>Chính sách đổi size:</strong> Nếu size nhận được chưa vừa vặn, Daniel Wellington hỗ trợ đổi size miễn phí trong vòng 30 ngày trên toàn quốc.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-hairline-soft bg-soft-cloud/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-ink text-canvas text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
          >
            Đã Hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
