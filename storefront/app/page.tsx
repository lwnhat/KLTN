import Image from 'next/image';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';

// Server-side fetch: dùng INTERNAL_API_URL (Docker internal) hoặc 127.0.0.1 khi dev
const INTERNAL_API_URL = process.env.INTERNAL_API_URL || 'http://127.0.0.1:5000';


async function getFeaturedProducts() {
  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/v1/products?isFeatured=true&limit=6`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const products = await getFeaturedProducts();

  return (
    <div className="space-y-section pb-16">
      {/* Editorial Campaign Hero */}
      <section className="relative w-full max-w-[1440px] mx-auto px-6 sm:px-12 pt-4">
        <div className="relative w-full h-[640px] rounded-none overflow-hidden bg-ink">
          <Image
            src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1600&auto=format&fit=crop&q=80"
            alt="MN Fine Jewelry Editorial Hero"
            fill
            priority
            className="object-cover object-center opacity-85"
          />

          {/* Editorial Display Header Burned into Photography */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent flex flex-col justify-end p-8 sm:p-16">
            <h1 className="font-display-campaign text-canvas text-6xl sm:text-8xl md:text-9xl tracking-tight max-w-4xl">
              CRAFTED FOR ETERNITY
            </h1>
            <p className="text-canvas/90 text-lg sm:text-xl font-normal max-w-xl mt-2 mb-8">
              Tuyệt tác trang sức kim cương & đá quý cao cấp. Mỗi chế tác mang biểu tượng của sự hoàn mỹ.
            </p>
            <div>
              <Link href="/products" className="btn-outline-image font-semibold">
                Khám Phá Bộ Sưu Tập →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Catalog Section */}
      <section className="max-w-[1440px] mx-auto px-6 sm:px-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink uppercase">
              BỘ SƯU TẬP NỔI BẬT
            </h2>
            <p className="text-mute text-sm mt-1">Các chế tác kim cương & vàng được ưa chuộng nhất</p>
          </div>
          {products.length > 0 && (
            <Link href="/products" className="text-sm font-semibold text-ink hover:underline">
              Xem Tất Cả ({products.length})
            </Link>
          )}
        </div>

        {/* 3-up Product Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
            {products.map((product: any) => (
              <ProductCard
                key={product.id}
                id={product.id}
                variantId={product.primary_variant_id}
                name={product.name}
                slug={product.slug}
                categoryName={product.category_name}
                price={product.price != null ? product.price : product.base_price}
                comparePrice={product.compare_price}
                image={product.primary_image}
                allowEngraving={product.allow_engraving}
              />
            ))}

          </div>
        ) : (
          <div className="py-16 text-center border border-hairline bg-soft-cloud/50 rounded-lg space-y-3">
            <p className="text-base text-ink font-medium">Bộ sưu tập nổi bật đang được cập nhật.</p>
            <p className="text-xs text-mute">Quý khách có thể khám phá toàn bộ sản phẩm tại danh mục chính.</p>
            <Link href="/products" className="btn-primary inline-flex mt-2 text-xs">
              Xem Toàn Bộ Sản Phẩm →
            </Link>
          </div>
        )}
      </section>


      {/* Category Swatch Grid */}
      <section className="max-w-[1440px] mx-auto px-6 sm:px-12">
        <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink uppercase mb-8">
          DANH MỤC TRANG SỨC
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            {
              title: 'NHẮN CẦU HÔN & CƯỚI',
              image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80',
              link: '/products?category=nhan',
            },
            {
              title: 'DÂY CHUYỀN KIM CƯƠNG',
              image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
              link: '/products?category=day-chuyen',
            },
            {
              title: 'BÔNG TAI CAO CẤP',
              image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=80',
              link: '/products?category=bong-tai',
            },
            {
              title: 'VÒNG TAY & LẮC VÀNG',
              image: 'https://images.unsplash.com/photo-1611591475179-6fe5e7e597c1?w=800&auto=format&fit=crop&q=80',
              link: '/products?category=vong-tay',
            },
          ].map((cat, index) => (
            <div key={index} className="relative aspect-[4/5] bg-soft-cloud group overflow-hidden">
              <Image
                src={cat.image}
                alt={cat.title}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-ink/30 p-6 flex flex-col justify-between">
                <span className="text-canvas text-xs font-semibold uppercase tracking-wider">0{index + 1}</span>
                <div>
                  <h3 className="text-canvas font-semibold text-xl mb-3 leading-snug">{cat.title}</h3>
                  <Link href={cat.link} className="btn-outline-image text-sm py-2 px-5 font-semibold">
                    Xem sản phẩm
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
