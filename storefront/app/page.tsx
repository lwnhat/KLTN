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
    <div className="space-y-8 sm:space-y-16 pb-16">
      {/* Editorial Campaign Hero */}
      <section className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-12 pt-2 sm:pt-4">
        <div className="relative w-full h-[460px] sm:h-[580px] md:h-[640px] rounded-none overflow-hidden bg-ink">
          <Image
            src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1600&auto=format&fit=crop&q=80"
            alt="MN Fine Jewelry Editorial Hero"
            fill
            priority
            className="object-cover object-center opacity-85"
          />

          {/* Editorial Display Header Burned into Photography */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent flex flex-col justify-end p-5 sm:p-12 md:p-16 pb-8 sm:pb-14">
            <h1 className="font-display-campaign text-canvas text-4xl sm:text-7xl md:text-9xl tracking-tight max-w-4xl leading-tight">
              CRAFTED FOR ETERNITY
            </h1>
            <p className="text-canvas/90 text-xs sm:text-base md:text-lg font-normal max-w-xl mt-2 mb-5 sm:mb-8">
              Tuyệt tác trang sức kim cương & đá quý cao cấp. Mỗi chế tác mang biểu tượng của sự hoàn mỹ.
            </p>
            <div>
              <Link href="/products" className="btn-outline-image inline-block text-xs sm:text-sm font-semibold py-2.5 px-5 sm:px-6">
                Khám Phá Bộ Sưu Tập →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Catalog Section */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-12">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2 sm:gap-4 mb-5 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-3xl font-medium tracking-tight text-ink uppercase">
              BỘ SƯU TẬP NỔI BẬT
            </h2>
            <p className="text-mute text-xs sm:text-sm mt-0.5">Các chế tác kim cương & vàng được ưa chuộng nhất</p>
          </div>
          {products.length > 0 && (
            <Link href="/products" className="text-xs sm:text-sm font-semibold text-ink hover:underline self-start sm:self-auto">
              Xem Tất Cả ({products.length}) →
            </Link>
          )}
        </div>

        {/* 2-col on mobile, 3-col on desktop */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 gap-y-6 sm:gap-y-10">
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
      <section className="max-w-[1440px] mx-auto px-4 sm:px-12">
        <h2 className="text-xl sm:text-3xl font-medium tracking-tight text-ink uppercase mb-5 sm:mb-8">
          DANH MỤC TRANG SỨC
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {[
            {
              title: 'DÂY CHUYỀN ELAN',
              image: 'https://res.cloudinary.com/akmq0b0f/image/upload/v1788240781/mn-jewelry/products/cwqs6ovoy0e1sxft1tgd.png',
              link: '/products?category=day-chuyen',
            },
            {
              title: 'VÒNG TAY CLASSIC VÀNG',
              image: 'https://res.cloudinary.com/akmq0b0f/image/upload/v1788237149/mn-jewelry/products/mo67cculr0ltpiyl0w4c.png',
              link: '/products?category=vong-tay',
            },
            {
              title: 'VÒNG TAY LUMINE BẠC',
              image: 'https://res.cloudinary.com/akmq0b0f/image/upload/v1788110991/mn-jewelry/products/e6zdowf2ix08i214ek0v.png',
              link: '/products?category=vong-tay',
            },
            {
              title: 'VÒNG TAY VÀNG HỒNG',
              image: 'https://res.cloudinary.com/akmq0b0f/image/upload/v1788240924/mn-jewelry/products/bo2eep6wcgnwzdpmyjyn.png',
              link: '/products?category=vong-tay',
            },
          ].map((cat, index) => (
            <div key={index} className="relative aspect-[3/4] sm:aspect-[4/5] bg-soft-cloud group overflow-hidden rounded-sm">
              <Image
                src={cat.image}
                alt={cat.title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent p-3 sm:p-6 flex flex-col justify-between">
                <span className="text-canvas text-[10px] sm:text-xs font-semibold uppercase tracking-wider">0{index + 1}</span>
                <div>
                  <h3 className="text-canvas font-semibold text-xs sm:text-xl mb-2 sm:mb-3 leading-snug line-clamp-2">{cat.title}</h3>
                  <Link href={cat.link} className="btn-outline-image text-[11px] sm:text-sm py-1.5 px-3 sm:py-2 sm:px-5 font-semibold inline-block">
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

