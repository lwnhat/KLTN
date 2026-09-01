import ProductCard from '@/components/product/ProductCard';
import Link from 'next/link';

// Server-side fetch: dùng INTERNAL_API_URL (Docker internal) hoặc 127.0.0.1 khi dev
const INTERNAL_API_URL = process.env.INTERNAL_API_URL || 'http://127.0.0.1:5000';


async function getProducts(category?: string, sort?: string) {
  try {
    let url = `${INTERNAL_API_URL}/api/v1/products?limit=24`;
    if (category) url += `&category=${category}`;
    if (sort) url += `&sort=${sort}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}


export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; sort?: string };
}) {
  const products = await getProducts(searchParams.category, searchParams.sort);

  return (
    <div className="max-w-[1440px] mx-auto px-6 sm:px-12 py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-hairline pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-ink">DANH MỤC TRANG SỨC</h1>
          <p className="text-sm text-mute mt-1">Khám phá các tuyệt tác nhẫn kim cương, dây chuyền & bông tai</p>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 flex-wrap text-xs">
          {[
            { label: 'Tất cả', slug: '' },
            { label: 'Nhẫn', slug: 'nhan' },
            { label: 'Dây Chuyền', slug: 'day-chuyen' },
            { label: 'Bông Tai', slug: 'bong-tai' },
            { label: 'Vòng Tay', slug: 'vong-tay' },
          ].map((chip) => (
            <Link
              key={chip.slug}
              href={chip.slug ? `/products?category=${chip.slug}` : '/products'}
              className={`px-4 py-2 rounded-full font-semibold transition-all ${
                (searchParams.category || '') === chip.slug
                  ? 'bg-ink text-canvas'
                  : 'bg-soft-cloud text-ink hover:bg-hairline-soft'
              }`}
            >
              {chip.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
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
        <div className="py-20 text-center border border-hairline bg-soft-cloud/40 rounded-xl space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-soft-cloud flex items-center justify-center mx-auto text-2xl">
            💎
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-ink uppercase">Chưa có sản phẩm phù hợp</h3>
            <p className="text-xs text-mute leading-relaxed">
              Hiện tại danh mục này chưa có sản phẩm hoặc các sản phẩm đang được cập nhật lại.
            </p>
          </div>
          <Link href="/products" className="btn-primary inline-flex text-xs px-6 py-3">
            Xem Tất Cả Sản Phẩm →
          </Link>
        </div>
      )}
    </div>
  );
}

