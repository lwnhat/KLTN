"use client";

import { useState, useEffect } from 'react';
import { Search, ShieldCheck, CheckCircle2, AlertCircle, Clock, Calendar, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Breadcrumbs from '@/components/common/Breadcrumbs';

export default function WarrantyPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [warranties, setWarranties] = useState<any[] | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Tra Cứu Bảo Hành Điện Tử — Daniel Wellington';
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/v1/warranties/lookup?query=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setWarranties(data.data || []);
      } else {
        setWarranties([]);
      }
    } catch {
      alert('Không thể kết nối đến hệ thống tra cứu. Vui lòng thử lại sau.');
      setWarranties([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 sm:px-12 py-10 space-y-10">
      <Breadcrumbs items={[{ label: 'Tra cứu bảo hành' }]} />

      <div className="text-center space-y-3">
        <ShieldCheck className="w-16 h-16 text-ink mx-auto stroke-1" />
        <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight text-ink">
          TRA CỨU BẢO HÀNH TRANG SỨC
        </h1>
        <p className="text-mute text-sm max-w-md mx-auto">
          Nhập mã số phiếu bảo hành (VD: WR-...) hoặc Số điện thoại mua hàng để kiểm tra thời hạn và quyền lợi chăm sóc trang sức.
        </p>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập Mã bảo hành hoặc Số điện thoại..."
          className="flex-1 bg-soft-cloud border border-hairline text-ink rounded-lg px-5 py-3.5 text-base focus:bg-canvas focus:ring-2 focus:ring-ink focus:outline-none"
        />
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Đang tra cứu...' : 'Tra Cứu'}
        </button>
      </form>

      {/* Lookup Results */}
      {searched && (
        <div className="space-y-6">
          {warranties && warranties.length > 0 ? (
            <div className="space-y-6">
              <p className="text-sm font-semibold text-ink">
                Tìm thấy <b>{warranties.length}</b> phiếu bảo hành điện tử cho từ khóa "{query}":
              </p>
              {warranties.map((w) => {
                const terms = typeof w.warranty_terms === 'string' ? JSON.parse(w.warranty_terms || '{}') : w.warranty_terms || {};
                const covers = Array.isArray(terms.covers) ? terms.covers : ['Đánh bóng & làm mới', 'Gắn đá phụ', 'Chỉnh size nhẫn'];

                return (
                  <div key={w.id} className="bg-soft-cloud border border-hairline p-8 rounded-lg space-y-6 animate-fade-in">
                    <div className="flex justify-between items-start border-b border-hairline-soft pb-4">
                      <div>
                        <span className="text-xs font-bold text-mute uppercase">PHIẾU BẢO HÀNH DI ĐỘNG</span>
                        <h2 className="text-2xl font-bold text-ink font-mono mt-0.5">{w.warranty_code}</h2>
                        <p className="text-sm text-ink mt-1">
                          Khách hàng: <b>{w.customer_name}</b> ({w.customer_phone})
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 ${
                          w.status === 'active'
                            ? 'bg-success text-canvas'
                            : 'bg-stone/20 text-stone'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />{' '}
                        {w.status === 'active' ? 'ĐANG HIỆU LỰC' : 'HẾT HIỆU LỰC'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-semibold text-ink text-base">Sản Phẩm Được Bảo Hành:</h3>
                      <p className="text-sm text-mute font-medium">
                        {w.product_name || 'Trang sức cao cấp KLTN'} {w.variant_name ? `• ${w.variant_name}` : ''}
                      </p>
                      <p className="text-xs text-mute flex items-center gap-1.5 pt-1">
                        <Calendar className="w-3.5 h-3.5" /> Ngày mua:{' '}
                        {new Date(w.purchase_date || w.created_at).toLocaleDateString('vi-VN')} • Thời hạn:{' '}
                        {terms.period_months || 12} tháng
                      </p>
                    </div>

                    <div className="border-t border-hairline-soft pt-4 space-y-3">
                      <h3 className="font-semibold text-ink text-sm flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" /> Quyền Lợi Chăm Sóc Đính Kèm:
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {covers.map((c: string, idx: number) => (
                          <div key={idx} className="bg-canvas p-3 border border-hairline-soft rounded-lg text-xs space-y-1">
                            <p className="font-semibold text-ink">✓ {c}</p>
                            <p className="text-[11px] text-mute">Miễn phí trọn đời gói</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-soft-cloud border border-hairline rounded-lg space-y-3">
              <AlertCircle className="w-12 h-12 text-mute mx-auto stroke-1" />
              <p className="text-base font-semibold text-ink">Không tìm thấy thông tin bảo hành</p>
              <p className="text-xs text-mute max-w-sm mx-auto">
                Vui lòng kiểm tra lại Số điện thoại mua hàng hoặc liên hệ hotline để được hỗ trợ kích hoạt.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
