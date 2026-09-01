"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { getAccessToken } from '@/lib/api';

interface ProductCardProps {
  id?: string;
  name: string;
  slug: string;
  categoryName?: string;
  price: number;
  comparePrice?: number | null;
  image?: string | null;
  allowEngraving?: boolean;
  isFeatured?: boolean;
  variantId?: string;
}

export default function ProductCard({
  id,
  name,
  slug,
  categoryName = 'Trang sức cao cấp',
  price,
  comparePrice,
  image,
  allowEngraving = false,
  variantId,
}: ProductCardProps) {
  const imageUrl = image || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80';
  const numPrice = typeof price === 'number' ? price : parseFloat(String(price || 0));
  const numComparePrice = comparePrice != null ? (typeof comparePrice === 'number' ? comparePrice : parseFloat(String(comparePrice))) : null;
  const hasDiscount = numComparePrice != null && numComparePrice > numPrice;
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isHeartBeating, setIsHeartBeating] = useState(false);


  const { showWishlistToast, showCartToast, showError } = useToast();
  const addItem = useCartStore((state) => state.addItem);

  const targetVariantId = variantId || id;
  // ★ Instant in-memory check (0 HTTP requests per card!)
  const isWishlisted = useWishlistStore((state) => state.isInWishlist(targetVariantId));
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = getAccessToken();
    if (!token) {
      showError('Vui lòng đăng nhập để lưu sản phẩm vào danh sách yêu thích.');
      window.location.href = '/account';
      return;
    }

    if (!targetVariantId) return;

    setWishlistLoading(true);
    setIsHeartBeating(true);
    setTimeout(() => setIsHeartBeating(false), 500);

    try {
      const result = await toggleWishlist(targetVariantId, token);
      showWishlistToast(name, result.added);
    } catch {
      showError('Lỗi cập nhật danh sách yêu thích.');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      variantId: targetVariantId || 'default-variant',
      productName: name,
      variantName: 'Tiêu chuẩn (18K)',
      productSlug: slug,
      sku: `SKU-${slug.toUpperCase()}`,
      image: imageUrl,
      price: numPrice,
      quantity: 1,
      customizationMetadata: null,
      isCustomized: false,
    });

    showCartToast({
      productName: name,
      variantName: 'Tiêu chuẩn (18K)',
      price: numPrice,
      image: imageUrl,
    });
  };

  return (
    <div className="group relative flex flex-col justify-between bg-canvas rounded-none overflow-hidden transition-all duration-300">
      {/* Product Image Container */}
      <div className="relative w-full aspect-square bg-soft-cloud overflow-hidden border border-hairline-soft/80 group-hover:border-ink/30 transition-all">
        <Link href={`/products/${slug}`} className="block w-full h-full">
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        </Link>

        {/* Action Pills */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          <button
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm ${
              isWishlisted
                ? 'bg-ink text-canvas hover:bg-ink/90'
                : 'bg-canvas/90 text-ink hover:bg-canvas backdrop-blur-sm'
            }`}
            title={isWishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
          >
            <Heart
              className={`w-4 h-4 transition-transform duration-300 ${
                isWishlisted ? 'fill-current text-sale' : 'text-ink'
              } ${isHeartBeating ? 'scale-125' : 'scale-100'}`}
            />
          </button>
        </div>

        {/* Laser Engraving Available Pill */}
        {allowEngraving && (
          <div className="absolute bottom-3 left-3 bg-canvas/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-ink shadow-sm pointer-events-none">
            ✨ Khắc chữ Laser
          </div>
        )}

        {/* Quick Add Overlay */}
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-ink/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center">
          <button
            onClick={handleQuickAdd}
            className="btn-primary text-xs py-2 px-4 shadow-lg w-full flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Thêm Nhanh
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="pt-4 pb-2 space-y-1.5 flex flex-col">
        <p className="text-[11px] text-mute uppercase tracking-widest">{categoryName}</p>
        <Link href={`/products/${slug}`} className="block group-hover:underline">
          <h3 className="text-sm font-medium text-ink line-clamp-1 leading-snug">{name}</h3>
        </Link>

        {/* Pricing */}
        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="text-sm font-bold text-ink">
            {numPrice.toLocaleString('vi-VN')}₫
          </span>
          {hasDiscount && (
            <span className="text-xs text-mute line-through">
              {numComparePrice?.toLocaleString('vi-VN')}₫
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
