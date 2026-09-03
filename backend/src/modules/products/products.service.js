const db = require('../../config/database');
const ApiError = require('../../shared/utils/ApiError');
const { v4: uuidv4 } = require('uuid');

/**
 * Lấy danh sách sản phẩm (Filter, Search, Pagination)
 */
async function getProducts({ page = 1, limit = 12, categorySlug, search, material, minPrice, maxPrice, isFeatured, status = 'active', sort = 'newest' }) {
  const offset = (page - 1) * limit;

  let query = db('products as p')
    .leftJoin('categories as c', 'p.category_id', 'c.id')
    .whereNull('p.deleted_at');

  if (status && status !== 'all') {
    query = query.where('p.status', status);
  }


  if (categorySlug) {
    query = query.where('c.slug', categorySlug);
  }

  if (search) {
    query = query.where((builder) => {
      builder.where('p.name', 'ilike', `%${search}%`)
        .orWhere('p.description', 'ilike', `%${search}%`)
        .orWhere('p.brand', 'ilike', `%${search}%`);
    });
  }

  if (material) {
    query = query.where('p.material', material);
  }

  if (isFeatured !== undefined) {
    query = query.where('p.is_featured', isFeatured === 'true' || isFeatured === true);
  }

  if (minPrice) {
    query = query.where('p.base_price', '>=', parseFloat(minPrice));
  }

  if (maxPrice) {
    query = query.where('p.base_price', '<=', parseFloat(maxPrice));
  }

  // Count total matching
  const countQuery = query.clone().countDistinct('p.id as total').first();

  // Sorting
  switch (sort) {
    case 'price_asc':
      query = query.orderBy('p.base_price', 'asc');
      break;
    case 'price_desc':
      query = query.orderBy('p.base_price', 'desc');
      break;
    case 'name_asc':
      query = query.orderBy('p.name', 'asc');
      break;
    case 'newest':
    default:
      query = query.orderBy('p.created_at', 'desc');
      break;
  }

  const products = await query
    .clone()
    .select(
      'p.id', 'p.name', 'p.slug', 'p.short_description', 'p.brand',
      'p.material', 'p.base_price', 'p.status', 'p.is_featured', 'p.tags',
      'c.name as category_name', 'c.slug as category_slug'
    )
    .limit(limit)
    .offset(offset);

  const totalResult = await countQuery;
  const total = parseInt(totalResult.total || 0);

  // Lấy 1 variant đại diện cho mỗi product
  const productIds = products.map((p) => p.id);
  const variants = productIds.length > 0
    ? await db('variants').whereIn('product_id', productIds).where('is_active', true)
    : [];

  const enrichedProducts = products.map((product) => {
    const pVariants = variants.filter((v) => v.product_id === product.id);
    const primaryVariant = pVariants[0] || null;
    let images = [];
    if (primaryVariant?.images) {
      images = typeof primaryVariant.images === 'string' ? JSON.parse(primaryVariant.images) : (primaryVariant.images || []);
    }

    const price = primaryVariant && primaryVariant.price != null
      ? parseFloat(primaryVariant.price)
      : parseFloat(product.base_price);
    const comparePrice = primaryVariant?.compare_price != null
      ? parseFloat(primaryVariant.compare_price)
      : null;

    const totalStock = pVariants.reduce(
      (sum, v) => sum + Math.max(0, (v.stock_quantity || 0) - (v.reserved_quantity || 0)),
      0
    );
    const primaryStock = primaryVariant
      ? Math.max(0, (primaryVariant.stock_quantity || 0) - (primaryVariant.reserved_quantity || 0))
      : 0;

    return {
      ...product,
      base_price: parseFloat(product.base_price),
      price,
      compare_price: comparePrice,
      primary_variant_id: primaryVariant?.id || null,
      variant_count: pVariants.length,
      primary_image: images[0]?.url || null,
      images,
      allow_engraving: pVariants.some((v) => v.allow_engraving),
      total_stock: totalStock,
      primary_stock: primaryStock,
      is_out_of_stock: totalStock <= 0,
    };
  });


  return { products: enrichedProducts, total };
}

/**
 * Lấy chi tiết sản phẩm theo slug
 */
async function getProductBySlug(slug) {
  const product = await db('products as p')
    .leftJoin('categories as c', 'p.category_id', 'c.id')
    .where('p.slug', slug)
    .whereNull('p.deleted_at')
    .select('p.*', 'c.name as category_name', 'c.slug as category_slug')
    .first();

  if (!product) {
    throw ApiError.notFound('PRODUCT_NOT_FOUND', 'Sản phẩm không tồn tại.');
  }

  // Fetch variants + options
  const variants = await db('variants')
    .where({ product_id: product.id, is_active: true })
    .orderBy('sort_order', 'asc');

  const variantIds = variants.map((v) => v.id);
  const options = variantIds.length > 0
    ? await db('variant_options').whereIn('variant_id', variantIds)
    : [];

  const certificates = variantIds.length > 0
    ? await db('certificates').whereIn('variant_id', variantIds).where('is_active', true)
    : [];

  const enrichedVariants = variants.map((v) => ({
    ...v,
    price: parseFloat(v.price),
    compare_price: v.compare_price ? parseFloat(v.compare_price) : null,
    images: typeof v.images === 'string' ? JSON.parse(v.images) : v.images,
    options: options.filter((o) => o.variant_id === v.id),
    certificates: certificates.filter((c) => c.variant_id === v.id),
    available_stock: v.stock_quantity - v.reserved_quantity,
  }));

  // Attribute values
  const attributeValues = await db('product_attribute_values as pav')
    .join('attribute_definitions as ad', 'pav.attribute_id', 'ad.id')
    .where('pav.product_id', product.id)
    .select('ad.name', 'ad.code', 'ad.unit', 'pav.value_text', 'pav.value_number');

  return {
    ...product,
    base_price: parseFloat(product.base_price),
    seo_metadata: typeof product.seo_metadata === 'string' ? JSON.parse(product.seo_metadata) : product.seo_metadata,
    variants: enrichedVariants,
    attribute_values: attributeValues,
  };
}

/**
 * Tạo mới Master Product (Admin)
 */
async function createProduct(data, userId) {
  const { name, categoryId, description, shortDescription, brand, material, basePrice, status = 'draft', isFeatured = false, tags = [] } = data;
  const slug = data.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const [product] = await db('products')
    .insert({
      name,
      slug,
      category_id: categoryId || null,
      description,
      short_description: shortDescription,
      brand,
      material,
      base_price: basePrice,
      status,
      is_featured: isFeatured,
      tags,
      created_by: userId,
    })
    .returning('*');

  return product;
}

/**
 * Cập nhật Master Product (Admin)
 */
async function updateProduct(id, data) {
  const { name, categoryId, description, shortDescription, brand, material, basePrice, status, isFeatured, tags } = data;
  const [product] = await db('products')
    .where('id', id)
    .whereNull('deleted_at')
    .update({
      ...(name && { name }),
      ...(categoryId !== undefined && { category_id: categoryId }),
      ...(description !== undefined && { description }),
      ...(shortDescription !== undefined && { short_description: shortDescription }),
      ...(brand !== undefined && { brand }),
      ...(material !== undefined && { material }),
      ...(basePrice !== undefined && { base_price: basePrice }),
      ...(status && { status }),
      ...(isFeatured !== undefined && { is_featured: isFeatured }),
      ...(tags && { tags }),
      updated_at: new Date(),
    })
    .returning('*');

  if (!product) throw ApiError.notFound('PRODUCT_NOT_FOUND', 'Sản phẩm không tồn tại.');
  return product;
}

/**
 * Xóa mềm Master Product (Admin)
 */
async function deleteProduct(id) {
  const existing = await db('products').where('id', id).first();
  if (!existing) {
    throw ApiError.notFound('PRODUCT_NOT_FOUND', 'Sản phẩm không tồn tại.');
  }

  // Soft-delete master product
  await db('products')
    .where('id', id)
    .update({
      deleted_at: new Date(),
      status: 'archived',
      updated_at: new Date(),
    });

  // Deactivate related variants
  await db('variants')
    .where('product_id', id)
    .update({ is_active: false });

  return { success: true };
}


module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
};
