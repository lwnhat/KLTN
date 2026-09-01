const db = require('../../config/database');
const ApiError = require('../../shared/utils/ApiError');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getWishlist(userId) {
  return db('wishlists as w')
    .join('variants as v', 'w.variant_id', 'v.id')
    .join('products as p', 'v.product_id', 'p.id')
    .where('w.user_id', userId)
    .whereNull('p.deleted_at')
    .where('v.is_active', true)
    .select(
      'w.id',
      'w.variant_id',
      'w.price_at_add',
      'w.added_at as created_at',
      'w.added_at',
      'v.name as variant_name',
      'v.price as current_price',
      'v.stock_quantity',
      'v.images',
      'p.name as product_name',
      'p.slug as product_slug',
      'p.id as product_id'
    );
}


async function addToWishlist(userId, { variantId, notifyOnDrop = true }) {
  if (!variantId || !UUID_REGEX.test(variantId)) {
    throw ApiError.badRequest('INVALID_VARIANT', 'Mã sản phẩm không hợp lệ.');
  }

  const variant = await db('variants').where('id', variantId).first();
  if (!variant) throw ApiError.notFound('VARIANT_NOT_FOUND', 'Sản phẩm không tồn tại.');

  const existing = await db('wishlists').where({ user_id: userId, variant_id: variantId }).first();
  if (existing) throw ApiError.conflict('ALREADY_IN_WISHLIST', 'Sản phẩm đã có trong danh sách yêu thích.');

  const [item] = await db('wishlists').insert({
    user_id: userId,
    variant_id: variantId,
    price_at_add: variant.price,
    notify_on_drop: notifyOnDrop,
  }).returning('*');

  return item;
}

async function removeFromWishlist(userId, variantId) {
  if (!variantId || !UUID_REGEX.test(variantId)) {
    return { success: true };
  }
  const deleted = await db('wishlists').where({ user_id: userId, variant_id: variantId }).delete();
  if (!deleted) throw ApiError.notFound('NOT_IN_WISHLIST', 'Sản phẩm không có trong danh sách yêu thích.');
  return { success: true };
}

async function checkInWishlist(userId, variantId) {
  if (!variantId || !UUID_REGEX.test(variantId)) {
    return { inWishlist: false };
  }
  const item = await db('wishlists').where({ user_id: userId, variant_id: variantId }).first();
  return { inWishlist: !!item };
}

module.exports = { getWishlist, addToWishlist, removeFromWishlist, checkInWishlist };
