"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Check, ChevronDown } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/contexts/ToastContext';

interface CompleteTheLookProps {
  currentProductId?: string;
  categorySlug?: string;
}

export default function CompleteTheLook({ currentProductId, categorySlug }: CompleteTheLookProps) {
  const [matchingProducts, setMatchingProducts] = useState<any[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>({});
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const addItem = useCartStore((state) => state.addItem);
  const { showCartToast } = useToast();

  useEffect(() => {
    // Fetch products to recommend
    fetch('/api/v1/products?limit=12')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data) {
          const list = (data.data || []).filter((p: any) => p.id !== currentProductId);
          setMatchingProducts(list);

          // Default selected variant for each product
          const defaults: Record<string, any> = {};
          list.forEach((p: any) => {
            if (p.variants && p.variants.length > 0) {
              defaults[p.id] = p.variants[0];
            } else {
              defaults[p.id] = {
                id: p.primary_variant_id || p.id,
                name: 'Tiêu chuẩn',
                price: p.price != null ? p.price : p.base_price,
              };
            }
          });
          setSelectedVariants(defaults);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentProductId]);

  const handleQuickAdd = (product: any) => {
    const variant = selectedVariants[product.id] || {
      id: product.primary_variant_id || product.id,
      name: 'Tiêu chuẩn',
      price: product.price != null ? product.price : product.base_price,
    };

    const price = Number(variant.price || product.base_price || 0);

    addItem({
      variantId: variant.id,
      productName: product.name,
      variantName: variant.name,
      productSlug: product.slug,
      sku: variant.sku || product.slug,
      image: product.primary_image || '',
      price: price,
      quantity: 1,
      customizationMetadata: null,
      isCustomized: false,
    });

    showCartToast({
      productName: product.name,
      variantName: variant.name,
      price: price,
      image: product.primary_image,
      quantity: 1,
    });

    setAddedItemIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  // Filter based on Jewellery Type dropdown
  const filteredList = matchingProducts.filter((p) => {
    if (filterType === 'all') return true;
    return p.category_slug === filterType;
  }).slice(0, 3);

  if (loading || matchingProducts.length === 0) return null;

  return (
    <div className="space-y-4 pt-4 border-t border-hairline-soft">
      {/* Title & Subtitle */}
      <div className="text-center space-y-1">
        <h3 className="text-sm font-bold uppercase tracking-widest text-ink">
          HOÀN THIỆN PHONG CÁCH
        </h3>
        <p className="text-xs text-mute">Gợi ý những thiết kế có thể kết hợp cùng nhau</p>
      </div>

      {/* Filter Dropdown */}
      <div className="relative">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full appearance-none border border-ink py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-ink bg-canvas cursor-pointer outline-none transition-colors hover:bg-soft-cloud"
        >
          <option value="all">JEWELLERY TYPE — TẤT CẢ</option>
          <option value="vong-tay">VÒNG TAY (BRACELETS)</option>
          <option value="nhan">NHẪN (RINGS)</option>
          <option value="day-chuyen">DÂY CHUYỀN (NECKLACES)</option>
          <option value="bong-tai">BÔNG TAI (EARRINGS)</option>
        </select>
        <ChevronDown className="w-4 h-4 text-ink absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Suggested Items List */}
      <div className="space-y-3 pt-1">
        {filteredList.map((item) => {
          const currentVariant = selectedVariants[item.id] || {};
          const currentPrice = currentVariant.price != null ? currentVariant.price : (item.price != null ? item.price : item.base_price);
          const isAdded = !!addedItemIds[item.id];

          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 p-2.5 border border-hairline-soft bg-canvas hover:border-hairline transition-all rounded-sm"
            >
              {/* Product Thumbnail */}
              <div className="relative w-14 h-14 bg-soft-cloud shrink-0 overflow-hidden rounded-sm border border-hairline-soft">
                {item.primary_image ? (
                  <Image
                    src={item.primary_image}
                    alt={item.name}
                    fill
                    className="object-cover object-center"
                    sizes="56px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-mute">💎</div>
                )}
              </div>

              {/* Product Details & Variant Select */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-xs font-bold text-ink truncate leading-tight">{item.name}</p>
                
                {/* Size & Price Dropdown */}
                <div className="relative">
                  <select
                    value={currentVariant.id || ''}
                    onChange={(e) => {
                      const v = (item.variants || []).find((varItem: any) => varItem.id === e.target.value);
                      if (v) {
                        setSelectedVariants((prev) => ({ ...prev, [item.id]: v }));
                      }
                    }}
                    className="w-full text-[11px] font-medium text-charcoal border border-hairline-soft bg-soft-cloud/60 py-1.5 px-2 pr-6 rounded-sm appearance-none outline-none cursor-pointer"
                  >
                    {item.variants && item.variants.length > 0 ? (
                      item.variants.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          {v.name} – {Number(v.price).toLocaleString('vi-VN')} VND
                        </option>
                      ))
                    ) : (
                      <option value={item.id}>
                        Tiêu chuẩn – {Number(currentPrice).toLocaleString('vi-VN')} VND
                      </option>
                    )}
                  </select>
                  <ChevronDown className="w-3 h-3 text-mute absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Quick Add Button */}
              <button
                type="button"
                onClick={() => handleQuickAdd(item)}
                className={`w-10 h-10 shrink-0 flex items-center justify-center transition-all ${
                  isAdded
                    ? 'bg-emerald-600 text-canvas'
                    : 'bg-ink text-canvas hover:bg-black active:scale-95'
                }`}
                title="Thêm món này vào giỏ hàng"
              >
                {isAdded ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
