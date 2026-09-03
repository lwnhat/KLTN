"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/contexts/ToastContext';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCartStore();
  const { showInfo } = useToast();

  const handleRemove = (id: string, name: string) => {
    removeItem(id);
    showInfo(`Đã xóa "${name}" khỏi giỏ hàng.`, 'Cập nhật giỏ hàng');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 sm:px-12 py-12 space-y-8">
      <div className="border-b border-hairline pb-4">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-ink">GIỎ HÀNG CỦA BẠN</h1>
        <p className="text-sm text-mute mt-1">Quản lý các sản phẩm trang sức đã chọn</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-soft-cloud rounded-lg space-y-4">
          <ShoppingBag className="w-16 h-16 text-mute mx-auto stroke-1" />
          <h2 className="text-xl font-medium text-ink">Giỏ hàng của bạn đang trống</h2>
          <p className="text-sm text-mute max-w-sm mx-auto">
            Hãy lựa chọn các chế tác trang sức tinh xảo nhất từ bộ sưu tập của KLTN.
          </p>
          <div className="pt-4">
            <Link href="/products" className="btn-primary">
              Khám Phá Sản Phẩm →
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items List */}
          <div className="lg:col-span-2 divide-y divide-hairline-soft border-b border-hairline-soft">
            {items.map((item) => (
              <div key={item.id} className="py-6 flex gap-6 items-start">
                {/* 1:1 Product stage */}
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-soft-cloud flex-shrink-0">
                  <Image
                    src={item.image || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80'}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-ink">{item.productName}</h3>
                      <p className="text-xs text-mute mt-0.5">{item.variantName}</p>
                    </div>
                    <span className="font-bold text-lg text-ink">
                      {((Number(item.price) || 0) * item.quantity).toLocaleString('vi-VN')}₫
                    </span>
                  </div>

                  {/* Engraving Customization Metadata Display */}
                  {item.customizationMetadata && (
                    <div className="bg-soft-cloud border border-hairline-soft p-3 rounded-lg text-xs space-y-1">
                      <p className="font-semibold text-ink">✏️ Nội dung khắc chữ Laser:</p>
                      <p className="font-semibold text-ink text-sm italic">
                        "{item.customizationMetadata.text}"
                      </p>
                      <p className="text-mute text-[11px]">
                        Font: {item.customizationMetadata.font} • Vị trí:{' '}
                        {item.customizationMetadata.position === 'inner_band'
                          ? 'Mặt trong nhẫn'
                          : 'Mặt ngoài nhẫn'}
                      </p>
                      <p className="text-sale font-medium text-[11px]">⚠️ Sản phẩm không hỗ trợ hoàn trả</p>
                    </div>
                  )}

                  {/* Quantity & Delete Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-hairline rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1 bg-soft-cloud text-ink font-bold hover:bg-hairline-soft transition-colors"
                          aria-label="Giảm"
                        >
                          -
                        </button>
                        <span className="px-4 py-1 text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => {
                            if (item.stock !== undefined && item.quantity >= item.stock) {
                              showInfo(`Đã đạt số lượng tối đa trong kho (${item.stock} sản phẩm).`);
                              return;
                            }
                            updateQuantity(item.id, item.quantity + 1);
                          }}
                          disabled={item.stock !== undefined && item.quantity >= item.stock}
                          className="px-3 py-1 bg-soft-cloud text-ink font-bold hover:bg-hairline-soft disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title={item.stock !== undefined && item.quantity >= item.stock ? `Chỉ còn ${item.stock} sản phẩm trong kho` : undefined}
                          aria-label="Tăng"
                        >
                          +
                        </button>
                      </div>

                      {/* Stock indicator badge */}
                      {item.stock !== undefined && (
                        <div className="text-xs">
                          {item.stock <= 0 ? (
                            <span className="text-sale font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                              Đã hết hàng
                            </span>
                          ) : item.quantity >= item.stock ? (
                            <span className="text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Tối đa kho: {item.stock}
                            </span>
                          ) : (
                            <span className="text-mute text-[11px]">
                              Kho còn: {item.stock}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleRemove(item.id, item.productName)}
                      className="text-mute hover:text-sale flex items-center gap-1 text-xs transition-colors p-1 rounded hover:bg-sale/10 w-fit"
                    >
                      <Trash2 className="w-4 h-4" /> Xóa
                    </button>
                  </div>

                  {/* Red banner if out of stock */}
                  {item.stock !== undefined && item.stock <= 0 && (
                    <div className="text-xs text-sale font-medium bg-red-50 p-2 rounded border border-red-200 mt-2">
                      ⚠️ Sản phẩm này hiện đã hết hàng. Vui lòng xóa khỏi giỏ để tiếp tục thanh toán.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Side Panel */}
          <div className="bg-soft-cloud p-8 rounded-none border border-hairline space-y-6 h-fit">
            <h2 className="text-xl font-bold uppercase tracking-tight text-ink border-b border-hairline pb-4">
              TỔNG ĐƠN HÀNG
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-mute">
                <span>Tạm tính ({items.reduce((s, i) => s + i.quantity, 0)} sản phẩm)</span>
                <span className="font-semibold text-ink">{Number(subtotal || 0).toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between text-mute">
                <span>Phí vận chuyển & Kiểm định</span>
                <span className="text-success font-medium">Miễn phí</span>
              </div>
            </div>

            <div className="border-t border-hairline pt-4 flex justify-between items-end">
              <div>
                <span className="text-xs uppercase text-mute font-semibold">TỔNG THANH TOÁN</span>
                <p className="text-2xl font-bold text-ink">{Number(subtotal || 0).toLocaleString('vi-VN')}₫</p>
              </div>
            </div>

            {/* Check if any item has invalid stock */}
            {items.some((i) => i.stock !== undefined && (i.stock <= 0 || i.quantity > i.stock)) ? (
              <div className="space-y-2">
                <div className="text-xs text-sale font-medium bg-red-50 p-2.5 rounded border border-red-200">
                  ⚠️ Có sản phẩm trong giỏ đã hết hàng hoặc vượt quá số lượng trong kho. Vui lòng điều chỉnh lại giỏ hàng để tiếp tục thanh toán.
                </div>
                <button
                  disabled
                  className="btn-primary w-full text-center py-4 bg-neutral-300 text-neutral-500 border-neutral-300 cursor-not-allowed"
                >
                  Không Thể Thanh Toán
                </button>
              </div>
            ) : (
              <Link href="/checkout" className="btn-primary w-full text-center py-4">
                Tiến Hành Thanh Toán <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            )}

            <p className="text-[11px] text-mute text-center leading-relaxed">
              🔒 Tồn kho sẽ được Redis tạm giữ trong 15 phút ngay khi bắt đầu thanh toán để đảm bảo không ai mua mất sản phẩm của bạn.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
