"use client";
import { getAccessToken } from '@/lib/api';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, ShoppingBag, X, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore(s => s.addItem);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { router.push('/account'); return; }

    fetch('/api/v1/wishlist', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.success) setItems(data.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const removeItem = async (variantId: string) => {
    const token = getAccessToken();
    await fetch(`/api/v1/wishlist/${variantId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems(prev => prev.filter(i => i.variant_id !== variantId));
  };

  const handleAddToCart = (item: any) => {
    addItem({
      variantId: item.variant_id,
      productSlug: item.product_slug,
      productName: item.product_name,
      variantName: item.variant_name || '',
      sku: item.sku || item.variant_id,
      price: parseFloat(item.current_price),
      image: item.image || '',
      stock: item.stock_quantity,
      quantity: 1,
      customizationMetadata: null,
      isCustomized: false,
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/account/dashboard" className="text-mute hover:text-ink transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-ink flex items-center gap-2">
          <Heart className="w-6 h-6 text-sale fill-sale" /> Yêu Thích
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-12 h-12 text-mute mx-auto mb-4" />
          <p className="text-mute mb-4">Chưa có sản phẩm yêu thích nào.</p>
          <Link href="/products" className="btn-primary">Khám Phá Sản Phẩm</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => {
            const images = typeof item.images === 'string' ? JSON.parse(item.images || '[]') : item.images || [];
            const imgUrl = images[0]?.url;
            const priceDropped = parseFloat(item.current_price) < parseFloat(item.price_at_add);

            return (
              <div key={item.wishlist_id}
                className="flex gap-4 bg-canvas border border-hairline-soft rounded-lg p-4">
                <Link href={`/products/${item.product_slug}`}>
                  <div className="w-20 h-20 bg-soft-cloud rounded-lg overflow-hidden shrink-0">
                    {imgUrl && <img src={imgUrl} alt={item.product_name} className="w-full h-full object-cover" />}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product_slug}`}>
                    <p className="font-semibold text-ink text-sm hover:underline">{item.product_name}</p>
                    <p className="text-mute text-xs">{item.variant_name}</p>
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-ink">
                      {parseInt(item.current_price).toLocaleString('vi-VN')}đ
                    </span>
                    {priceDropped && (
                      <span className="text-xs text-success font-medium">
                        ↓ Giảm từ {parseInt(item.price_at_add).toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </div>
                  {item.stock_quantity === 0 && (
                    <span className="text-xs text-sale">Hết hàng</span>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={item.stock_quantity === 0}
                    className="btn-primary text-xs px-3 py-2 disabled:opacity-40"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                    Thêm giỏ
                  </button>
                  <button
                    onClick={() => removeItem(item.variant_id)}
                    className="flex items-center justify-center gap-1 text-xs text-mute hover:text-sale transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
