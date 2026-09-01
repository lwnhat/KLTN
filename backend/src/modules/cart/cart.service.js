/**
 * ★ CART SERVICE
 *
 * Xử lý giỏ hàng với đầy đủ các tính năng:
 * 1. Customization Metadata (khắc chữ, chiều dài dây chuyền)
 * 2. Guest Cart (LocalStorage sync với Redis)
 * 3. Merge Guest → User sau khi đăng nhập
 * 4. Price snapshot bất biến
 *
 * @module cartService
 */

const db = require('../../config/database');
const { redis } = require('../../config/redis');
const { holdInventoryBatch, releaseInventoryBatch } = require('../inventory/inventoryHold.service');
const ApiError = require('../../shared/utils/ApiError');
const { v4: uuidv4 } = require('uuid');

const GUEST_CART_TTL = 7 * 24 * 60 * 60; // 7 ngày (seconds)
const GUEST_CART_PREFIX = 'cart:guest';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: USER CART (Database-backed)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lấy hoặc tạo mới cart cho user
 */
async function getOrCreateUserCart(userId) {
  let cart = await db('carts').where({ user_id: userId }).whereNull('deleted_at').first();

  if (!cart) {
    [cart] = await db('carts').insert({ user_id: userId }).returning('*');
  }

  return cart;
}

/**
 * Lấy giỏ hàng đầy đủ của user (với thông tin variant, product, customization)
 */
async function getUserCart(userId) {
  const cart = await db('carts').where({ user_id: userId }).first();
  if (!cart) return { items: [], subtotal: 0, itemCount: 0 };

  const items = await db('cart_items as ci')
    .join('variants as v', 'ci.variant_id', 'v.id')
    .join('products as p', 'v.product_id', 'p.id')
    .where('ci.cart_id', cart.id)
    .whereNull('p.deleted_at')
    .where('v.is_active', true)
    .select(
      'ci.id',
      'ci.variant_id',
      'ci.instance_id',
      'ci.quantity',
      'ci.price_snapshot',
      'ci.customization_metadata',
      'ci.is_customized',
      'ci.non_returnable',
      'ci.hold_key',
      'ci.hold_expires_at',
      'v.sku',
      'v.name as variant_name',
      'v.price as current_price',  // Giá hiện tại để cảnh báo nếu thay đổi
      'v.images',
      'v.stock_quantity',
      'v.reserved_quantity',
      'v.allow_engraving',
      'v.engraving_fee',
      'v.max_engraving_chars',
      'p.name as product_name',
      'p.slug as product_slug'
    );

  // Tính subtotal, bao gồm cả phí khắc chữ trong price_snapshot
  const subtotal = items.reduce((sum, item) => {
    return sum + parseFloat(item.price_snapshot) * item.quantity;
  }, 0);

  // Flag cảnh báo nếu giá đã thay đổi so với price_snapshot
  const itemsWithPriceAlert = items.map((item) => ({
    ...item,
    images: typeof item.images === 'string' ? JSON.parse(item.images) : item.images,
    customization_metadata: item.customization_metadata,
    price_changed: parseFloat(item.current_price) !== parseFloat(item.price_snapshot),
    available_stock: item.stock_quantity - item.reserved_quantity,
  }));

  return {
    cartId: cart.id,
    items: itemsWithPriceAlert,
    subtotal,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

/**
 * ★★ THÊM SẢN PHẨM VÀO GIỎ HÀNG
 *
 * Logic đặc biệt:
 * - Nếu item KHÔNG có customization → merge với item cùng variant_id
 * - Nếu item CÓ customization (khắc chữ) → KHÔNG merge, tạo row mới
 *   (vì "Anh yêu em" ≠ "Em yêu anh" dù cùng variant)
 *
 * @param {string} userId
 * @param {Object} itemData
 * @param {string} itemData.variantId
 * @param {number} itemData.quantity
 * @param {Object|null} itemData.customizationMetadata - null nếu không có khắc chữ
 */
async function addToCart(userId, itemData) {
  const { variantId, quantity = 1, customizationMetadata = null, instanceId = null } = itemData;

  // Validate variant tồn tại và đang active
  const variant = await db('variants as v')
    .join('products as p', 'v.product_id', 'p.id')
    .where('v.id', variantId)
    .where('v.is_active', true)
    .where('p.status', 'active')
    .select('v.*', 'p.name as product_name')
    .first();

  if (!variant) {
    throw ApiError.notFound('VARIANT_NOT_FOUND', 'Sản phẩm không tồn tại hoặc đã ngừng bán.');
  }

  // Kiểm tra tồn kho khả dụng (chưa bị hold)
  const availableStock = variant.stock_quantity - variant.reserved_quantity;
  if (availableStock < quantity) {
    throw ApiError.conflict('INSUFFICIENT_STOCK', `Chỉ còn ${availableStock} sản phẩm.`);
  }

  // Validate và tính phí khắc chữ
  let engravingFee = 0;
  let isCustomized = false;
  let nonReturnable = false;

  if (customizationMetadata) {
    if (customizationMetadata.type === 'engraving') {
      // Kiểm tra variant có cho phép khắc chữ không
      if (!variant.allow_engraving) {
        throw ApiError.badRequest('ENGRAVING_NOT_ALLOWED', 'Sản phẩm này không hỗ trợ khắc chữ.');
      }

      const engravingText = customizationMetadata.text || '';

      // Kiểm tra độ dài nội dung khắc
      if (engravingText.length > variant.max_engraving_chars) {
        throw ApiError.badRequest(
          'ENGRAVING_TOO_LONG',
          `Nội dung khắc chữ tối đa ${variant.max_engraving_chars} ký tự.`
        );
      }

      engravingFee = parseFloat(variant.engraving_fee || 0);

      // Sanitize metadata — chỉ lưu những field được phép
      customizationMetadata.extra_fee = engravingFee;
    }

    isCustomized = true;
    nonReturnable = true; // Hàng đã tùy chỉnh không hoàn trả
  }

  // Price snapshot = giá variant + phí khắc chữ
  const priceSnapshot = parseFloat(variant.price) + engravingFee;

  // Lấy hoặc tạo cart
  const cart = await getOrCreateUserCart(userId);

  // ★ Logic merge: Chỉ merge khi KHÔNG có customization
  if (!isCustomized) {
    const existingItem = await db('cart_items')
      .where('cart_id', cart.id)
      .where('variant_id', variantId)
      .whereNull('customization_metadata')
      .first();

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      // Kiểm tra lại tồn kho với số lượng mới
      if (availableStock < newQuantity) {
        throw ApiError.conflict('INSUFFICIENT_STOCK', `Chỉ còn ${availableStock} sản phẩm.`);
      }

      const [updated] = await db('cart_items')
        .where('id', existingItem.id)
        .update({ quantity: newQuantity, updated_at: new Date() })
        .returning('*');

      return updated;
    }
  }

  // Tạo cart item mới
  const [newItem] = await db('cart_items')
    .insert({
      cart_id: cart.id,
      variant_id: variantId,
      instance_id: instanceId,
      quantity,
      price_snapshot: priceSnapshot,
      customization_metadata: customizationMetadata
        ? JSON.stringify(customizationMetadata)
        : null,
      is_customized: isCustomized,
      non_returnable: nonReturnable,
    })
    .returning('*');

  return newItem;
}

/**
 * Cập nhật số lượng hoặc customization của cart item
 */
async function updateCartItem(userId, cartItemId, updates) {
  const { quantity, customizationMetadata } = updates;

  // Verify ownership
  const item = await db('cart_items as ci')
    .join('carts as c', 'ci.cart_id', 'c.id')
    .where('ci.id', cartItemId)
    .where('c.user_id', userId)
    .select('ci.*')
    .first();

  if (!item) {
    throw ApiError.notFound('CART_ITEM_NOT_FOUND', 'Sản phẩm không có trong giỏ hàng.');
  }

  // Nếu item đang được hold và đang thay đổi quantity → cần update hold
  if (item.hold_key && quantity && quantity !== item.quantity) {
    // Release hold cũ → sẽ tạo hold mới khi user proceed to checkout
    const { redis: redisClient } = require('../../config/redis');
    await redisClient.del(item.hold_key);
  }

  const updateData = { updated_at: new Date() };
  if (quantity !== undefined) updateData.quantity = quantity;
  if (customizationMetadata !== undefined) {
    updateData.customization_metadata = customizationMetadata
      ? JSON.stringify(customizationMetadata)
      : null;
    updateData.is_customized = !!customizationMetadata;
    updateData.non_returnable = !!customizationMetadata;
  }

  const [updated] = await db('cart_items')
    .where('id', cartItemId)
    .update(updateData)
    .returning('*');

  return updated;
}

/**
 * Xóa item khỏi giỏ hàng
 */
async function removeCartItem(userId, cartItemId) {
  const item = await db('cart_items as ci')
    .join('carts as c', 'ci.cart_id', 'c.id')
    .where('ci.id', cartItemId)
    .where('c.user_id', userId)
    .select('ci.*')
    .first();

  if (!item) {
    throw ApiError.notFound('CART_ITEM_NOT_FOUND', 'Sản phẩm không có trong giỏ hàng.');
  }

  // Release inventory hold nếu đang hold
  if (item.hold_key) {
    const { redis: redisClient } = require('../../config/redis');
    await redisClient.del(item.hold_key);

    await db('variants')
      .where('id', item.variant_id)
      .decrement('reserved_quantity', item.quantity);
  }

  await db('cart_items').where('id', cartItemId).delete();
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: GUEST CART (Redis-backed)
// ─────────────────────────────────────────────────────────────────────────────

const buildGuestCartKey = (sessionId) => `${GUEST_CART_PREFIX}:${sessionId}`;

async function getGuestCart(sessionId) {
  const key = buildGuestCartKey(sessionId);
  const data = await redis.get(key);
  return data ? JSON.parse(data) : { items: [] };
}

async function saveGuestCart(sessionId, cartData) {
  const key = buildGuestCartKey(sessionId);
  await redis.setex(key, GUEST_CART_TTL, JSON.stringify(cartData));
}

async function addToGuestCart(sessionId, itemData) {
  const cart = await getGuestCart(sessionId);
  const { variantId, quantity, customizationMetadata } = itemData;

  // Fetch variant data để lưu snapshot
  const variant = await db('variants as v')
    .join('products as p', 'v.product_id', 'p.id')
    .where('v.id', variantId)
    .select('v.id', 'v.sku', 'v.name as variant_name', 'v.price', 'v.images',
            'v.allow_engraving', 'v.engraving_fee', 'v.max_engraving_chars',
            'p.name as product_name', 'p.slug as product_slug')
    .first();

  if (!variant) throw ApiError.notFound('VARIANT_NOT_FOUND', 'Sản phẩm không tồn tại.');

  const engravingFee = customizationMetadata ? parseFloat(variant.engraving_fee || 0) : 0;
  const priceSnapshot = parseFloat(variant.price) + engravingFee;
  const isCustomized = !!customizationMetadata;

  // Merge logic: Chỉ merge khi không có customization
  if (!isCustomized) {
    const existingIndex = cart.items.findIndex(
      (i) => i.variantId === variantId && !i.customizationMetadata
    );
    if (existingIndex !== -1) {
      cart.items[existingIndex].quantity += quantity;
      await saveGuestCart(sessionId, cart);
      return cart.items[existingIndex];
    }
  }

  const newItem = {
    id: uuidv4(), // Temporary ID cho client
    variantId,
    productName: variant.product_name,
    variantName: variant.variant_name,
    productSlug: variant.product_slug,
    sku: variant.sku,
    images: variant.images,
    quantity,
    priceSnapshot,
    customizationMetadata: customizationMetadata || null,
    isCustomized,
    nonReturnable: isCustomized,
    addedAt: new Date().toISOString(),
  };

  cart.items.push(newItem);
  await saveGuestCart(sessionId, cart);
  return newItem;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: MERGE GUEST CART → USER CART (Sau khi đăng nhập)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ★★★ MERGE GUEST CART VÀO USER CART
 *
 * Chiến lược merge:
 * - Item không customization: Cộng dồn số lượng vào DB cart
 * - Item có customization: Tạo mới trong DB (không thể merge)
 * - Conflict quantity (vượt stock): Lấy max(available_stock)
 *
 * @param {string} userId
 * @param {string} sessionId
 */
async function mergeGuestCartToUserCart(userId, sessionId) {
  const guestCart = await getGuestCart(sessionId);
  if (!guestCart.items || guestCart.items.length === 0) {
    return { merged: 0, skipped: 0 };
  }

  let merged = 0;
  let skipped = 0;

  for (const guestItem of guestCart.items) {
    try {
      await addToCart(userId, {
        variantId: guestItem.variantId,
        quantity: guestItem.quantity,
        customizationMetadata: guestItem.customizationMetadata,
      });
      merged++;
    } catch (err) {
      // Log lỗi nhưng không dừng merge (skip item lỗi)
      console.warn(`Skipped guest cart item ${guestItem.variantId}:`, err.message);
      skipped++;
    }
  }

  // Xóa guest cart sau khi merge
  await redis.del(buildGuestCartKey(sessionId));

  return { merged, skipped };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: CHECKOUT PREPARATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Chuẩn bị checkout: Hold inventory cho tất cả items trong cart
 */
async function prepareCheckout(userId) {
  const cart = await getUserCart(userId);

  if (cart.items.length === 0) {
    throw ApiError.badRequest('EMPTY_CART', 'Giỏ hàng trống.');
  }

  // Hold inventory cho tất cả items
  const holdItems = cart.items.map((item) => ({
    variantId: item.variant_id,
    cartItemId: item.id,
    quantity: item.quantity,
  }));

  const holds = await holdInventoryBatch(holdItems, userId);

  // Cập nhật hold_key và hold_expires_at trong DB cho mỗi item
  const cartId = cart.cartId;
  const expiresAt = new Date(Date.now() + 900 * 1000); // 15 phút

  for (const hold of holds) {
    await db('cart_items')
      .where('id', hold.cartItemId)
      .update({
        hold_key: hold.holdKey,
        hold_expires_at: expiresAt,
      });
  }

  return {
    success: true,
    cartId,
    items: cart.items,
    subtotal: cart.subtotal,
    holdExpiresAt: expiresAt,
    holdExpiresInSeconds: 900,
  };
}

module.exports = {
  getUserCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  getGuestCart,
  addToGuestCart,
  mergeGuestCartToUserCart,
  prepareCheckout,
  getOrCreateUserCart,
};
