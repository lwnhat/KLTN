"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/contexts/ToastContext';
import { getAccessToken } from '@/lib/api';
import EngravingModal, { EngravingData } from '@/components/product/EngravingModal';
import { ShieldCheck, Sparkles, Check, FileText, Heart, Star, User, MessageSquare, ShoppingBag } from 'lucide-react';

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isEngravingOpen, setIsEngravingOpen] = useState(false);
  const [customization, setCustomization] = useState<EngravingData | null>(null);
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
  const { showCartToast, showWishlistToast, showSuccess, showError } = useToast();

  useEffect(() => {
    // Fetch product details by slug
    fetch(`/api/v1/products/${params.slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data) {
          setProduct(data.data);
          const initialVariant = data.data.variants?.[0] || null;
          setSelectedVariant(initialVariant);

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
    const variantPrice = Number(selectedVariant.price || 0);
    const extraFee = Number(customization?.extra_fee || 0);
    const priceWithCustomization = variantPrice + extraFee;

    addItem({
      variantId: selectedVariant.id,
      productName: product.name,
      variantName: selectedVariant.name,
      productSlug: params.slug,
      sku: selectedVariant.sku,
      image: selectedVariant.images?.[0]?.url || '',
      price: priceWithCustomization,
      quantity: 1,
      customizationMetadata: customization,
      isCustomized: !!customization,
    });


    // Luxury Cart Toast notification
    showCartToast({
      productName: product.name,
      variantName: selectedVariant.name,
      price: priceWithCustomization,
      image: selectedVariant.images?.[0]?.url,
      customizationText: customization ? customization.text : undefined,
      quantity: 1,
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


  return (
    <div className="max-w-[1440px] mx-auto px-6 sm:px-12 py-12 space-y-16">
      {/* Top Product Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Left: 1:1 Product Stage */}
        <div className="relative aspect-square w-full bg-soft-cloud overflow-hidden border border-hairline-soft">
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center"
          />
        </div>

        {/* Right: Product Metadata & Actions */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold text-mute uppercase tracking-widest">{product.category_name}</span>
            <h1 className="text-3xl font-bold text-ink tracking-tight mt-1">{product.name}</h1>
            
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
                <span className="text-sm font-semibold text-ink">{reviewsData.stats.avgRating} / 5</span>
                <span className="text-xs text-mute">({reviewsData.stats.totalReviews} đánh giá)</span>
              </div>
            )}

            <p className="text-2xl font-bold text-ink mt-3">
              {priceWithCustomization.toLocaleString('vi-VN')}₫
              {comparePrice != null && comparePrice > variantPrice && (
                <span className="text-base text-mute line-through font-normal ml-3">
                  {comparePrice.toLocaleString('vi-VN')}₫
                </span>
              )}
            </p>
          </div>


          <p className="text-sm text-mute leading-relaxed">{product.description}</p>

          {/* Variant Selector if multiple */}
          {product.variants && product.variants.length > 1 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-ink uppercase tracking-wider">Chọn phiên bản:</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 border rounded-lg text-xs font-medium transition-all ${
                      selectedVariant.id === v.id
                        ? 'border-ink bg-ink text-canvas font-semibold'
                        : 'border-hairline hover:bg-soft-cloud text-ink'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GIA Certificate Badge */}
          {selectedVariant.certificates?.length > 0 && (
            <div className="bg-soft-cloud border border-hairline p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-ink" />
                <div>
                  <p className="text-xs font-bold text-ink uppercase">
                    GIẤY KIỂM ĐỊNH {selectedVariant.certificates[0].issuer} CHÍNH HÃNG
                  </p>
                  <p className="text-xs text-mute">Số hiệu: {selectedVariant.certificates[0].cert_number}</p>
                </div>
              </div>
              <a
                href={selectedVariant.certificates[0].file_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-ink underline flex items-center gap-1"
              >
                <FileText className="w-4 h-4" /> Xem File PDF
              </a>
            </div>
          )}

          {/* Laser Engraving Customization Option */}
          {selectedVariant.allow_engraving && (
            <div className="border border-hairline p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-ink flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Dịch vụ Khắc chữ Laser Cá Nhân
                </span>
                <button
                  type="button"
                  onClick={() => setIsEngravingOpen(true)}
                  className="text-xs font-bold text-ink underline"
                >
                  {customization ? 'Sửa Nội Dung' : '+ Thêm Khắc Chữ'}
                </button>
              </div>

              {customization ? (
                <div className="bg-soft-cloud p-3 rounded text-xs space-y-1">
                  <p className="font-semibold text-ink">Nội dung: "{customization.text}"</p>
                  <p className="text-mute">
                    Font: {customization.font} • Phí: +{customization.extra_fee.toLocaleString('vi-VN')}₫
                  </p>
                </div>
              ) : (
                <p className="text-xs text-mute">
                  Miễn phí khắc tên, ngày kỷ niệm hoặc ký tự đặc biệt lên mặt trong nhẫn.
                </p>
              )}
            </div>
          )}

          {/* Add to Cart & Wishlist Actions */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddToCart}
                className={`btn-primary flex-1 py-4 text-base font-semibold flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden ${
                  isAddingCart ? 'bg-emerald-600 scale-[0.98] shadow-inner text-white' : 'hover:shadow-lg'
                }`}
              >
                {isAddingCart ? (
                  <>
                    <Check className="w-5 h-5 animate-bounce" />
                    <span>Đã Thêm Vào Giỏ Hàng!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>Thêm Vào Giỏ Hàng — {priceWithCustomization.toLocaleString('vi-VN')}₫</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className={`w-14 h-14 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                  isWishlisted
                    ? 'border-sale bg-sale/10 text-sale'
                    : 'border-hairline hover:bg-soft-cloud text-mute hover:text-ink'
                } ${isHeartBeating ? 'animate-heartbeat scale-125' : 'active:scale-90'}`}
                title={isWishlisted ? 'Đã yêu thích' : 'Thêm vào yêu thích'}
              >
                <Heart
                  className={`w-6 h-6 transition-transform ${
                    isWishlisted ? 'fill-sale text-sale' : ''
                  }`}
                />
              </button>
            </div>
          </div>
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
    </div>
  );
}

