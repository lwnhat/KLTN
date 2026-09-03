"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/contexts/ToastContext';
import { getAccessToken } from '@/lib/api';
import EngravingModal, { EngravingData } from '@/components/product/EngravingModal';
import SizeGuideModal from '@/components/product/SizeGuideModal';
import ProductAccordions from '@/components/product/ProductAccordions';
import CompleteTheLook from '@/components/product/CompleteTheLook';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import TrustBanner from '@/components/common/TrustBanner';
import { ShieldCheck, Sparkles, Check, FileText, Heart, Star, User, MessageSquare, ShoppingBag, Package, RefreshCw, Gift, Ruler, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isEngravingOpen, setIsEngravingOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState('Bạc');
  const [selectedSize, setSelectedSize] = useState('48');
  const [customization, setCustomization] = useState<EngravingData | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [isAddingCart, setIsAddingCart] = useState(false);
  const [isHeartBeating, setIsHeartBeating] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Reviews state
  const [reviewsData, setReviewsData] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const { showCartToast, showWishlistToast, showSuccess, showError } = useToast();

  useEffect(() => {
    // Fetch product details by slug
    fetch(`/api/v1/products/${params.slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data) {
          setProduct(data.data);
          if (data.data.name && typeof document !== 'undefined') {
            document.title = `${data.data.name} — Daniel Wellington`;
          }
          const initialVariant = data.data.variants?.[0] || null;
          setSelectedVariant(initialVariant);

          // Infer default color & size
          const nameLower = (data.data.name || '').toLowerCase();
          if (nameLower.includes('hồng')) setSelectedColor('Vàng hồng');
          else if (nameLower.includes('vàng')) setSelectedColor('Vàng');
          else setSelectedColor('Bạc');

          const catSlug = (data.data.category_slug || '').toLowerCase();
          if (catSlug.includes('nhan') || nameLower.includes('nhẫn')) setSelectedSize('48');
          else if (catSlug.includes('vong') || nameLower.includes('vòng') || nameLower.includes('lắc')) setSelectedSize('155-185mm');
          else if (catSlug.includes('day') || nameLower.includes('dây')) setSelectedSize('40-45cm');
          else if (catSlug.includes('bong') || nameLower.includes('bông')) setSelectedSize('Một kích thước');
          else setSelectedSize('Tiêu chuẩn');

          // Fetch reviews
          if (data.data.id) {
            fetchReviews(data.data.id);
          }
        }
      })
      .catch(() => {});
  }, [params.slug]);

  const fetchReviews = (productId: string) => {
    fetch(`/api/v1/reviews/product/${productId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data) {
          setReviewsData(data.data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    const token = getAccessToken();
    if (token && selectedVariant?.id) {
      fetch(`/api/v1/wishlist/check/${selectedVariant.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          setIsWishlisted(!!data?.data?.inWishlist);
        })
        .catch(() => {});
    }
  }, [selectedVariant?.id]);

  const handleToggleWishlist = async () => {
    const token = getAccessToken();
    if (!token) {
      showError('Vui lòng đăng nhập để lưu sản phẩm vào danh sách yêu thích.');
      window.location.href = '/account';
      return;
    }
    if (!selectedVariant?.id) return;

    setWishlistLoading(true);
    setIsHeartBeating(true);
    setTimeout(() => setIsHeartBeating(false), 500);

    try {
      if (isWishlisted) {
        const res = await fetch(`/api/v1/wishlist/${selectedVariant.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setIsWishlisted(false);
          showWishlistToast(product.name, false);
        }
      } else {
        const res = await fetch(`/api/v1/wishlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ variantId: selectedVariant.id }),
        });
        if (res.ok) {
          setIsWishlisted(true);
          showWishlistToast(product.name, true);
        }
      }
    } catch {
      showError('Lỗi kết nối khi cập nhật danh sách yêu thích.');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedVariant || !product) return;

    const variantStock = selectedVariant
      ? (selectedVariant.available_stock !== undefined ? selectedVariant.available_stock : (selectedVariant.stock_quantity ?? 0))
      : 0;

    if (variantStock <= 0) {
      showError('Sản phẩm này hiện đã hết hàng, không thể đặt mua thêm.');
      return;
    }

    const cartItems = useCartStore.getState().items;
    const inCartQty = cartItems
      .filter((i) => i.variantId === selectedVariant.id)
      .reduce((sum, i) => sum + i.quantity, 0);

    if (inCartQty >= variantStock) {
      showError(`Bạn đã thêm toàn bộ ${variantStock} sản phẩm có sẵn vào giỏ hàng.`);
      return;
    }

    if (inCartQty + purchaseQuantity > variantStock) {
      showError(`Không thể mua vượt quá tồn kho. Tồn kho còn ${variantStock} sản phẩm, bạn đã có ${inCartQty} trong giỏ.`);
      return;
    }

    const variantPrice = Number(selectedVariant.price || 0);
    const extraFee = Number(customization?.extra_fee || 0);
    const priceWithCustomization = variantPrice + extraFee;

    const result = addItem({
      variantId: selectedVariant.id,
      productName: product.name,
      variantName: selectedVariant.name,
      productSlug: params.slug,
      sku: selectedVariant.sku,
      image: selectedVariant.images?.[0]?.url || '',
      price: priceWithCustomization,
      quantity: purchaseQuantity,
      customizationMetadata: customization,
      isCustomized: !!customization,
      stock: variantStock,
    });

    if (!result.success) {
      showError(result.message || 'Không thể thêm sản phẩm vượt quá tồn kho.');
      return;
    }

    // Luxury Cart Toast notification
    showCartToast({
      productName: product.name,
      variantName: selectedVariant.name,
      price: priceWithCustomization,
      image: selectedVariant.images?.[0]?.url,
      customizationText: customization ? customization.text : undefined,
      quantity: purchaseQuantity,
    });

    // Button animation feedback
    setIsAddingCart(true);
    setTimeout(() => setIsAddingCart(false), 1200);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) {
      const msg = 'Vui lòng đăng nhập để viết đánh giá.';
      setReviewMsg({ type: 'error', text: msg });
      showError(msg);
      return;
    }

    setReviewSubmitting(true);
    setReviewMsg(null);
    try {
      const res = await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant?.id,
          orderItemId: 'dummy_or_auto',
          rating: reviewRating,
          title: reviewTitle,
          body: reviewBody,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Không thể gửi đánh giá.');
      }

      const successText = 'Cảm ơn bạn! Đánh giá đã được gửi và đang chờ kiểm duyệt.';
      setReviewMsg({ type: 'success', text: successText });
      showSuccess(successText, 'Đánh giá thành công');
      setReviewTitle('');
      setReviewBody('');
      if (product.id) fetchReviews(product.id);
    } catch (err: any) {
      setReviewMsg({ type: 'error', text: err.message || 'Lỗi gửi đánh giá.' });
      showError(err.message || 'Lỗi gửi đánh giá.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (!product || !selectedVariant) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 py-20 text-center">
        <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-mute">Đang tải sản phẩm...</p>
      </div>
    );
  }

  const primaryImage =
    selectedVariant.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80';
  const variantPrice = Number(selectedVariant.price || 0);
  const extraFee = Number(customization?.extra_fee || 0);
  const priceWithCustomization = variantPrice + extraFee;
  const comparePrice = selectedVariant.compare_price != null ? Number(selectedVariant.compare_price) : null;



  // Determine category & size options
  const catSlug = (product.category_slug || (product.category_name || '').toLowerCase()).trim();
  const isRing = catSlug.includes('nhan') || product.name?.toLowerCase().includes('nhẫn');
  const isBracelet = catSlug.includes('vong') || product.name?.toLowerCase().includes('vòng') || product.name?.toLowerCase().includes('lắc');
  const isNecklace = catSlug.includes('day') || product.name?.toLowerCase().includes('dây') || product.name?.toLowerCase().includes('vòng cổ');
  const isEarring = catSlug.includes('bong') || product.name?.toLowerCase().includes('bông') || product.name?.toLowerCase().includes('hoa tai');

  // Ring sizes like in screenshot 1: 48 (active), 50-62 crossed out
  const ringSizes = [
    { size: '48', inStock: true },
    { size: '50', inStock: false },
    { size: '52', inStock: false },
    { size: '54', inStock: false },
    { size: '56', inStock: false },
    { size: '58', inStock: false },
    { size: '60', inStock: false },
    { size: '62', inStock: false },
  ];

  const braceletSizes = [
    { size: '155-185mm', inStock: true },
    { size: 'Size S', inStock: true },
    { size: 'Size L', inStock: false },
  ];

  const necklaceSizes = [
    { size: '40-45cm', inStock: true },
  ];

  const earringSizes = [
    { size: 'Một kích thước', inStock: true },
  ];

  const availableSizes = isRing
    ? ringSizes
    : isBracelet
    ? braceletSizes
    : isNecklace
    ? necklaceSizes
    : earringSizes;

  // Colors like in screenshots: Bạc, Vàng, Vàng hồng
  const colorOptions = [
    { name: 'Bạc', inStock: true },
    { name: 'Vàng hồng', inStock: true },
    { name: 'Vàng', inStock: false },
  ];

  const currentSizeObj = availableSizes.find((s) => s.size === selectedSize);

  // Tồn kho thực tế từ Database của biến thể đang chọn
  const variantStock = selectedVariant
    ? (selectedVariant.available_stock !== undefined ? selectedVariant.available_stock : (selectedVariant.stock_quantity ?? 0))
    : 0;

  const currentInCart = cartItems
    .filter((i) => i.variantId === selectedVariant?.id)
    .reduce((sum, i) => sum + i.quantity, 0);

  const remainingAddable = Math.max(0, variantStock - currentInCart);
  const isOutOfStock = variantStock <= 0;
  const isCartLimitReached = variantStock > 0 && currentInCart >= variantStock;

  const discountPct = comparePrice && comparePrice > variantPrice
    ? Math.round(((comparePrice - variantPrice) / comparePrice) * 100)
    : (product.name?.toLowerCase().includes('elan') ? 20 : (product.name?.toLowerCase().includes('tennis') ? 20 : 10));

  const effectiveComparePrice = comparePrice && comparePrice > variantPrice
    ? comparePrice
    : Math.round((variantPrice * (100 + discountPct)) / 100);

  // Collect all product images from variant and product
  const variantImages = (selectedVariant.images || [])
    .map((img: any) => (typeof img === 'string' ? img : img.url))
    .filter(Boolean);
  const productImages = (product.images || [])
    .map((img: any) => (typeof img === 'string' ? img : img.url))
    .filter(Boolean);
  const rawList = Array.from(new Set([primaryImage, ...variantImages, ...productImages]));

  // Default complementary angles if product has few images (providing luxury gift box & closeups as shown in user screenshot)
  const defaultAngles = isEarring
    ? [
        'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800',
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800',
        'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800',
      ]
    : isNecklace
    ? [
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
        'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800',
      ]
    : isBracelet
    ? [
        'https://images.unsplash.com/photo-1611591475179-6fe5e7e597c1?w=800',
        'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800',
        'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800',
      ]
    : [
        'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800',
        'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800',
        'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800',
      ];

  const allImages = rawList.length >= 3 ? rawList : Array.from(new Set([...rawList, ...defaultAngles])).slice(0, 4);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-12 py-6 sm:py-8 space-y-10">
      {/* Schema.org Product Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org/',
            '@type': 'Product',
            name: product.name,
            image: allImages,
            description: product.description || `${product.name} chính hãng Daniel Wellington. Thiết kế tối giản chuẩn phong cách Bắc Âu.`,
            brand: {
              '@type': 'Brand',
              name: 'Daniel Wellington',
            },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'VND',
              price: variantPrice,
              availability: isOutOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
              url: `https://kltn-ashy.vercel.app/products/${params.slug}`,
              seller: {
                '@type': 'Organization',
                name: 'Daniel Wellington Vietnam',
              },
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: reviewsData?.stats?.avgRating ? String(reviewsData.stats.avgRating) : '5.0',
              reviewCount: reviewsData?.stats?.totalReviews ? String(Math.max(Number(reviewsData.stats.totalReviews), 1)) : '15',
            },
          }),
        }}
      />

      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Trang sức', href: '/products' },
          ...(product.category_name
            ? [{ label: product.category_name, href: `/products?category=${product.category_slug || ''}` }]
            : []),
          { label: product.name },
        ]}
      />

      {/* Top Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Product Images Gallery (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col md:flex-row gap-4 items-start">
          {/* Desktop Vertical Thumbnails Gallery (Hidden on Mobile) */}
          <div className="hidden md:flex flex-col gap-3 w-20 lg:w-24 shrink-0 max-h-[580px] overflow-y-auto pr-1">
            {allImages.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`relative aspect-square w-full bg-soft-cloud overflow-hidden rounded-sm transition-all ${
                  activeImageIndex === idx
                    ? 'border-2 border-ink shadow-sm'
                    : 'border border-hairline hover:border-charcoal opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={imgUrl}
                  alt={`${product.name} - góc chụp ${idx + 1}`}
                  fill
                  sizes="96px"
                  className="object-cover object-center"
                />
              </button>
            ))}
          </div>

          {/* Main Product Image Stage (Desktop & Mobile) */}
          <div className="relative aspect-square w-full flex-1 bg-soft-cloud overflow-hidden border border-hairline-soft rounded-sm group">
            <Image
              src={allImages[activeImageIndex] || primaryImage}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 55vw"
              className="object-cover object-center transition-all duration-300"
            />

            {/* Mobile-Only Navigation Buttons & Slide Dots */}
            {allImages.length > 1 && (
              <>
                {/* Prev Button (Mobile) */}
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))}
                  className="md:hidden absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-canvas/90 backdrop-blur-sm border border-hairline shadow-md flex items-center justify-center text-ink z-10 active:scale-90 transition-transform"
                  aria-label="Ảnh trước"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Next Button (Mobile) */}
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
                  className="md:hidden absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-canvas/90 backdrop-blur-sm border border-hairline shadow-md flex items-center justify-center text-ink z-10 active:scale-90 transition-transform"
                  aria-label="Ảnh tiếp theo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Dots Indicator (Mobile) */}
                <div className="md:hidden absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-10 pointer-events-none">
                  {allImages.map((_, dotIdx) => (
                    <span
                      key={dotIdx}
                      className={`transition-all ${
                        activeImageIndex === dotIdx
                          ? 'w-5 h-1.5 rounded-full bg-ink'
                          : 'w-1.5 h-1.5 rounded-full bg-ink/30'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Product Metadata & Actions (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">{product.name}</h1>
            
            {/* Rating Stars Summary */}
            {reviewsData?.stats && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(Number(reviewsData.stats.avgRating || 0))
                          ? 'fill-amber-500'
                          : 'text-hairline'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-ink">{reviewsData.stats.avgRating} / 5</span>
                <span className="text-[11px] text-mute">({reviewsData.stats.totalReviews} đánh giá)</span>
              </div>
            )}
          </div>

          {/* Pricing Block */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              {discountPct > 0 && (
                <span className="text-sale text-sm font-extrabold tracking-tight">
                  -{discountPct}%
                </span>
              )}
              <span className="text-xl sm:text-2xl font-bold text-sale tracking-tight">
                {priceWithCustomization.toLocaleString('vi-VN')} VND
              </span>
            </div>
            {effectiveComparePrice != null && effectiveComparePrice > variantPrice && (
              <div className="text-xs text-mute line-through font-normal">
                {effectiveComparePrice.toLocaleString('vi-VN')} VND
              </div>
            )}
            <p className="text-[11px] text-mute pt-0.5">
              Đã bao gồm thuế. Phí vận chuyển được tính khi thanh toán.
            </p>
          </div>

          {/* Màu sắc Selector */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-ink">Màu sắc</span>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedColor(c.name)}
                  className={`relative px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border ${
                    selectedColor === c.name
                      ? 'bg-ink text-canvas border-ink shadow-sm'
                      : 'bg-canvas text-ink border-hairline hover:border-ink'
                  }`}
                >
                  {c.name}
                  {!c.inStock && (
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="w-[140%] h-[1px] bg-stone rotate-45" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Kích cỡ Selector */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-ink">Kích cỡ</span>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((s) => (
                <button
                  key={s.size}
                  type="button"
                  onClick={() => setSelectedSize(s.size)}
                  className={`relative min-w-[42px] px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all border ${
                    selectedSize === s.size
                      ? 'bg-ink text-canvas border-ink shadow-sm'
                      : 'bg-canvas text-ink border-hairline hover:border-ink'
                  }`}
                >
                  {s.size}
                  {!s.inStock && (
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="w-[140%] h-[1px] bg-stone rotate-45" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Nút HƯỚNG DẪN KÍCH THƯỚC */}
          <button
            type="button"
            onClick={() => setIsSizeGuideOpen(true)}
            className="w-full py-3.5 border border-ink text-ink font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-ink hover:text-canvas transition-colors"
          >
            <span>HƯỚNG DẪN KÍCH THƯỚC</span>
            <span className="text-sm">📐</span>
          </button>

          {/* Multi-variant Selector if product has multiple variants */}
          {product.variants && product.variants.length > 1 && (
            <div className="space-y-2 pt-1 border-t border-hairline-soft/80">
              <div className="flex justify-between items-center text-xs font-semibold text-ink">
                <span>Chọn phiên bản / Biến thể:</span>
                <span className="text-[11px] text-mute font-normal">{product.variants.length} tùy chọn</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.variants.map((v: any) => {
                  const isSel = selectedVariant?.id === v.id;
                  const vStock = v.available_stock !== undefined ? v.available_stock : (v.stock_quantity ?? 0);
                  const vOutOfStock = vStock <= 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariant(v);
                        setPurchaseQuantity(1);
                      }}
                      className={`p-3 text-left rounded-lg border transition-all flex flex-col justify-between ${
                        isSel
                          ? 'bg-ink text-canvas border-ink shadow-md ring-1 ring-ink'
                          : 'bg-canvas text-ink border-hairline hover:border-ink'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-bold leading-snug line-clamp-1">{v.name}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                            vOutOfStock
                              ? isSel
                                ? 'bg-red-800 text-canvas'
                                : 'bg-red-100 text-red-700'
                              : isSel
                              ? 'bg-neutral-700 text-canvas'
                              : 'bg-soft-cloud text-charcoal'
                          }`}
                        >
                          {vOutOfStock ? 'Hết hàng' : `Kho: ${vStock}`}
                        </span>
                      </div>
                      <div className={`text-xs font-semibold mt-1.5 ${isSel ? 'text-amber-300' : 'text-sale'}`}>
                        {Number(v.price || 0).toLocaleString('vi-VN')}₫
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock Status Indicator */}
          <div className="pt-1">
            {isOutOfStock ? (
              <div className="flex items-center gap-2 text-xs font-bold text-sale bg-red-50 p-2.5 rounded-lg border border-red-200">
                <span className="w-2 h-2 rounded-full bg-sale shrink-0" />
                <span>Hết hàng — Tạm thời không thể đặt mua sản phẩm này</span>
              </div>
            ) : isCartLimitReached ? (
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span>Bạn đã thêm toàn bộ {variantStock} sản phẩm có trong kho vào giỏ hàng</span>
              </div>
            ) : variantStock <= 5 ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50/60 p-2 rounded-lg border border-amber-200/60">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600" />
                </span>
                <span>Chỉ còn lại {variantStock} sản phẩm trong kho — Hãy đặt ngay!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                <span>Còn hàng ({variantStock} sản phẩm sẵn có trong kho)</span>
              </div>
            )}
          </div>

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-ink">Số lượng mua:</span>
                <span className="text-mute text-[11px]">
                  {currentInCart > 0 ? (
                    <span>Trong giỏ: <strong>{currentInCart}</strong> | Có thể thêm: <strong>{remainingAddable}</strong></span>
                  ) : (
                    <span>Tồn kho có sẵn: <strong>{remainingAddable}</strong></span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border border-hairline rounded-lg bg-soft-cloud overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPurchaseQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={isCartLimitReached || purchaseQuantity <= 1}
                    className="w-10 h-10 flex items-center justify-center text-ink font-bold text-lg hover:bg-hairline-soft disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Giảm số lượng"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={isCartLimitReached ? 0 : purchaseQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setPurchaseQuantity(Math.min(Math.max(1, val), Math.max(1, remainingAddable)));
                    }}
                    disabled={isCartLimitReached}
                    className="w-14 h-10 text-center font-bold text-sm bg-transparent border-none text-ink outline-none"
                    min={1}
                    max={Math.max(1, remainingAddable)}
                  />
                  <button
                    type="button"
                    onClick={() => setPurchaseQuantity((prev) => Math.min(remainingAddable, prev + 1))}
                    disabled={isCartLimitReached || purchaseQuantity >= remainingAddable}
                    className="w-10 h-10 flex items-center justify-center text-ink font-bold text-lg hover:bg-hairline-soft disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Tăng số lượng"
                  >
                    +
                  </button>
                </div>

                {isCartLimitReached ? (
                  <span className="text-xs text-amber-700 font-medium">Đã đạt giới hạn kho</span>
                ) : purchaseQuantity >= remainingAddable ? (
                  <span className="text-[11px] text-mute italic">Tối đa có thể thêm: {remainingAddable}</span>
                ) : null}
              </div>
            </div>
          )}

          {/* Add to Cart & Wishlist Actions */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isCartLimitReached}
                className={`flex-1 py-4 text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden rounded-lg ${
                  isOutOfStock || isCartLimitReached
                    ? 'bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed'
                    : isAddingCart
                    ? 'bg-emerald-600 text-canvas'
                    : 'bg-ink text-canvas hover:bg-black active:scale-[0.99]'
                }`}
              >
                {isOutOfStock ? (
                  <span>HẾT HÀNG</span>
                ) : isCartLimitReached ? (
                  <span>ĐÃ ĐẠT GIỚI HẠN KHO ({variantStock}/{variantStock})</span>
                ) : isAddingCart ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ĐÃ THÊM {purchaseQuantity} SẢN PHẨM VÀO GIỎ!</span>
                  </>
                ) : (
                  <span>THÊM VÀO GIỎ HÀNG {purchaseQuantity > 1 ? `(${purchaseQuantity})` : ''}</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className={`w-12 h-12 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                  isWishlisted
                    ? 'border-sale bg-sale/10 text-sale'
                    : 'border-hairline hover:bg-soft-cloud text-mute hover:text-ink'
                } ${isHeartBeating ? 'animate-heartbeat scale-125' : 'active:scale-90'}`}
                title={isWishlisted ? 'Đã yêu thích' : 'Thêm vào yêu thích'}
              >
                <Heart
                  className={`w-5 h-5 transition-transform ${
                    isWishlisted ? 'fill-sale text-sale' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Hotline & Cam kết dịch vụ */}
          <div className="pt-3 pb-2 space-y-3 border-t border-hairline-soft text-center">
            <p className="text-xs font-bold text-ink">
              Tư vấn mua hàng: <a href="tel:0932029606" className="text-ink hover:underline">093 202 9606</a>
            </p>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div className="flex flex-col items-center gap-1.5 p-1.5">
                <Package className="w-5 h-5 text-ink stroke-[1.5]" />
                <span className="text-[10px] text-charcoal font-medium leading-tight">Giao hàng nhanh miễn phí</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-1.5">
                <RefreshCw className="w-5 h-5 text-ink stroke-[1.5]" />
                <span className="text-[10px] text-charcoal font-medium leading-tight">Đổi trả miễn phí*</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-1.5">
                <Gift className="w-5 h-5 text-ink stroke-[1.5]" />
                <span className="text-[10px] text-charcoal font-medium leading-tight">Giao hàng từ TP.Hồ Chí Minh, Việt Nam</span>
              </div>
            </div>
          </div>

          {/* GIA Certificate Badge if exists */}
          {selectedVariant.certificates?.length > 0 && (
            <div className="bg-soft-cloud border border-hairline p-3 rounded flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-ink" />
                <div>
                  <p className="text-xs font-bold text-ink uppercase">
                    GIẤY KIỂM ĐỊNH {selectedVariant.certificates[0].issuer} CHÍNH HÃNG
                  </p>
                  <p className="text-[11px] text-mute">Số hiệu: {selectedVariant.certificates[0].cert_number}</p>
                </div>
              </div>
              <a
                href={selectedVariant.certificates[0].file_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-ink underline flex items-center gap-1"
              >
                <FileText className="w-4 h-4" /> PDF
              </a>
            </div>
          )}

          {/* Laser Engraving Service if allowed */}
          {selectedVariant.allow_engraving && (
            <div className="border border-hairline p-3 rounded space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Dịch vụ Khắc chữ Laser Cá Nhân
                </span>
                <button
                  type="button"
                  onClick={() => setIsEngravingOpen(true)}
                  className="text-xs font-bold text-ink underline"
                >
                  {customization ? 'Sửa' : '+ Thêm'}
                </button>
              </div>
              {customization && (
                <div className="bg-soft-cloud p-2 rounded text-xs">
                  <p className="font-semibold text-ink">"{customization.text}" ({customization.font})</p>
                </div>
              )}
            </div>
          )}

          {/* HOÀN THIỆN PHONG CÁCH (Mix & Match) */}
          <CompleteTheLook currentProductId={product.id} categorySlug={catSlug} />

          {/* Accordions (Giới thiệu, Chi tiết, Cửa hàng, Bộ sưu tập, Đổi trả) */}
          <ProductAccordions product={product} selectedVariant={selectedVariant} categorySlug={catSlug} />
        </div>
      </div>

      {/* Reviews & Ratings Section */}
      <div className="border-t border-hairline pt-12 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold uppercase text-ink tracking-tight flex items-center gap-2">
              <MessageSquare className="w-6 h-6" /> Đánh Giá & Nhận Xét
            </h2>
            <p className="text-sm text-mute mt-1">Đánh giá từ khách hàng đã mua sản phẩm chính hãng</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Rating Summary Card */}
          <div className="bg-soft-cloud p-6 rounded-lg border border-hairline space-y-4">
            <div className="text-center">
              <div className="text-5xl font-extrabold text-ink">{reviewsData?.stats?.avgRating || '5.0'}</div>
              <div className="flex justify-center text-amber-500 my-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-5 h-5 ${
                      s <= Math.round(Number(reviewsData?.stats?.avgRating || 5))
                        ? 'fill-amber-500'
                        : 'text-hairline'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-mute">Dựa trên {reviewsData?.stats?.totalReviews || 0} nhận xét</p>
            </div>

            {/* Distribution */}
            {reviewsData?.stats?.distribution && (
              <div className="space-y-1.5 pt-4 border-t border-hairline-soft text-xs">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviewsData.stats.distribution[star] || 0;
                  const total = reviewsData.stats.totalReviews || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="w-4 font-semibold">{star}★</span>
                      <div className="flex-1 h-2 bg-hairline-soft rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right text-mute">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reviews List & Write Review Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Write Review Form */}
            <form onSubmit={handleSubmitReview} className="bg-canvas border border-hairline p-6 rounded-lg space-y-4">
              <h3 className="text-sm font-bold uppercase text-ink">Gửi Đánh Giá Của Bạn</h3>
              
              {reviewMsg && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium ${
                    reviewMsg.type === 'success'
                      ? 'bg-success/10 text-success border border-success/20'
                      : 'bg-sale/10 text-sale border border-sale/20'
                  }`}
                >
                  {reviewMsg.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-mute uppercase mb-1">Mức độ hài lòng:</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-amber-500 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${star <= reviewRating ? 'fill-amber-500' : 'text-hairline'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Tiêu đề nhận xét (VD: Nhẫn rất đẹp và sáng)"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full bg-soft-cloud border border-hairline text-ink rounded-lg p-3 text-sm focus:bg-canvas focus:ring-2 focus:ring-ink focus:outline-none"
                />
              </div>

              <div>
                <textarea
                  rows={3}
                  placeholder="Chia sẻ trải nghiệm chi tiết của bạn về sản phẩm này..."
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  className="w-full bg-soft-cloud border border-hairline text-ink rounded-lg p-3 text-sm focus:bg-canvas focus:ring-2 focus:ring-ink focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={reviewSubmitting}
                className="btn-primary py-2.5 px-6 text-sm disabled:opacity-60"
              >
                {reviewSubmitting ? 'Đang gửi...' : 'Gửi Nhận Xét'}
              </button>
            </form>

            {/* Review Items */}
            <div className="space-y-4">
              {reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
                reviewsData.reviews.map((r: any) => (
                  <div key={r.id} className="bg-soft-cloud p-5 rounded-lg border border-hairline-soft space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-ink text-canvas flex items-center justify-center font-bold text-xs">
                          {r.reviewer_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-ink">{r.reviewer_name || 'Khách hàng'}</p>
                          <span className="text-[10px] text-success font-medium">✓ Đã mua hàng chính hãng</span>
                        </div>
                      </div>
                      <span className="text-xs text-mute">
                        {new Date(r.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <div className="flex text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-amber-500' : 'text-hairline'}`}
                        />
                      ))}
                    </div>

                    {r.title && <h4 className="font-bold text-sm text-ink">{r.title}</h4>}
                    {r.body && <p className="text-sm text-charcoal leading-relaxed">{r.body}</p>}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-mute text-sm bg-soft-cloud rounded-lg border border-hairline-soft">
                  Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cam Kết Chất Lượng & Dịch Vụ Kim Hoàn */}
      <TrustBanner />

      {/* Sticky Mobile Add-to-Cart Action Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-canvas/95 backdrop-blur-md border-t border-hairline p-4 z-40 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-mute truncate">{selectedVariant.name}</p>
          <p className="text-base font-bold text-ink">{priceWithCustomization.toLocaleString('vi-VN')}₫</p>
        </div>
        <button
          onClick={handleAddToCart}
          className="btn-primary py-3 px-5 text-sm font-semibold flex items-center gap-2 shrink-0"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Thêm Vào Giỏ</span>
        </button>
      </div>

      {/* Engraving Modal */}
      <EngravingModal
        isOpen={isEngravingOpen}
        onClose={() => setIsEngravingOpen(false)}
        onConfirm={(data) => setCustomization(data)}
        variantName={selectedVariant.name}
        engravingFee={selectedVariant.engraving_fee}
        maxChars={selectedVariant.max_engraving_chars}
      />

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        defaultTab={isRing ? 'nhan' : isBracelet ? 'vong-tay' : isNecklace ? 'day-chuyen' : 'nhan'}
      />
    </div>
  );
}

