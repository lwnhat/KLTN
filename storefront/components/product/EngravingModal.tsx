"use client";

import { useState } from 'react';
import { X, Check } from 'lucide-react';

export interface EngravingData {
  type: 'engraving';
  text: string;
  font: 'Classic' | 'Script' | 'Modern' | 'Bold';
  position: 'inner_band' | 'outer_band' | 'clasp';
  extra_fee: number;
}

interface EngravingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: EngravingData) => void;
  variantName: string;
  engravingFee?: number;
  maxChars?: number;
}

export default function EngravingModal({
  isOpen,
  onClose,
  onConfirm,
  variantName,
  engravingFee = 150000,
  maxChars = 30,
}: EngravingModalProps) {
  const [text, setText] = useState('');
  const [font, setFont] = useState<EngravingData['font']>('Script');
  const [position, setPosition] = useState<EngravingData['position']>('inner_band');

  if (!isOpen) return null;

  const remaining = maxChars - text.length;

  const handleConfirm = () => {
    if (!text.trim() || remaining < 0) return;
    onConfirm({
      type: 'engraving',
      text: text.trim(),
      font,
      position,
      extra_fee: engravingFee,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-canvas border border-hairline rounded-none w-full max-w-lg overflow-hidden shadow-2xl space-y-6 p-6 sm:p-8">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-hairline-soft pb-4">
          <div>
            <h3 className="text-xl font-bold text-ink uppercase tracking-tight">✏️ DỊCH VỤ KHẮC CHỮ LASER</h3>
            <p className="text-xs text-mute mt-1">{variantName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-soft-cloud rounded-full text-mute hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="bg-soft-cloud border border-hairline-soft p-8 text-center min-h-[110px] flex items-center justify-center">
          {text ? (
            <div>
              <p className={`text-2xl text-ink ${font === 'Script' ? 'font-script italic' : font === 'Bold' ? 'font-bold' : font === 'Modern' ? 'font-sans uppercase tracking-widest' : 'font-serif'}`}>
                "{text}"
              </p>
              <p className="text-[11px] text-mute mt-2">
                Font: {font} • Vị trí: {position === 'inner_band' ? 'Mặt trong nhẫn' : position === 'outer_band' ? 'Mặt ngoài nhẫn' : 'Khóa dây'}
              </p>
            </div>
          ) : (
            <p className="text-stone text-sm italic">Xem trước nội dung khắc chữ tại đây...</p>
          )}
        </div>

        {/* Input Text */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase text-ink">
            NỘI DUNG KHẮC (TỐI ĐA {maxChars} KÝ TỰ)
          </label>
          <div className="relative">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="VD: Anh Yêu Em - 14.02.2024"
              className="w-full bg-canvas border border-hairline text-ink rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-ink focus:outline-none"
            />
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${remaining < 0 ? 'text-sale' : 'text-mute'}`}>
              {text.length}/{maxChars}
            </span>
          </div>
        </div>

        {/* Font Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase text-ink">KIỂU CHỮ (FONT)</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'Script', label: 'Script (Chữ Thảo)', sample: 'Anh Yêu Em' },
              { id: 'Classic', label: 'Classic (Cổ điển)', sample: 'Anh Yêu Em' },
              { id: 'Modern', label: 'Modern (Hiện đại)', sample: 'ANH YÊU EM' },
              { id: 'Bold', label: 'Bold (Nét Đậm)', sample: 'Anh Yêu Em' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFont(f.id as EngravingData['font'])}
                className={`p-3 text-left border rounded-lg transition-all ${
                  font === f.id ? 'border-ink bg-soft-cloud font-semibold' : 'border-hairline hover:border-hairline-soft'
                }`}
              >
                <p className="text-xs text-mute">{f.label}</p>
                <p className="text-base mt-1 text-ink">{f.sample}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Position Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase text-ink">VỊ TRÍ KHẮC</label>
          <div className="flex gap-2">
            {[
              { id: 'inner_band', label: '⭕ Mặt trong nhẫn' },
              { id: 'outer_band', label: '💍 Mặt ngoài nhẫn' },
              { id: 'clasp', label: '🔗 Khóa dây chuyền' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPosition(p.id as EngravingData['position'])}
                className={`flex-1 p-2.5 text-xs text-center border rounded-lg transition-all ${
                  position === p.id ? 'border-ink bg-ink text-canvas font-semibold' : 'border-hairline text-ink hover:bg-soft-cloud'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fee & Non-returnable notice */}
        <div className="bg-soft-cloud border border-hairline-soft p-4 rounded-lg flex justify-between items-center text-xs">
          <div>
            <span className="font-semibold text-ink">Phí dịch vụ khắc laser:</span>
            <p className="text-[11px] text-sale mt-0.5">⚠️ Sản phẩm đã khắc chữ không hỗ trợ hoàn trả</p>
          </div>
          <span className="font-bold text-ink text-sm">+{engravingFee.toLocaleString('vi-VN')}₫</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!text.trim() || remaining < 0}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4 mr-2" /> Xác Nhận Khắc Chữ
          </button>
        </div>
      </div>
    </div>
  );
}
