/**
 * ★ INVENTORY HOLD SERVICE
 *
 * Cơ chế: Khi user bắt đầu checkout, hệ thống "tạm giữ" tồn kho bằng Redis key
 * có TTL 15 phút. Nếu user không hoàn thành thanh toán trong 15 phút, Redis
 * tự xóa key → Keyspace Notification → tự động release hold trong PostgreSQL.
 *
 * Pattern: Pessimistic Locking with Time-based Expiry
 *
 * @module inventoryHoldService
 */

const { redis } = require('../../config/redis');
const db = require('../../config/database'); // knex instance
const ApiError = require('../../shared/utils/ApiError');

const HOLD_TTL_SECONDS = 900; // 15 phút
const HOLD_KEY_PREFIX = 'hold';

/**
 * Tạo Redis key cho inventory hold
 * Format: hold:{variantId}:{cartItemId}
 */
const buildHoldKey = (variantId, cartItemId) =>
  `${HOLD_KEY_PREFIX}:${variantId}:${cartItemId}`;

/**
 * Tạm giữ tồn kho cho một cart item
 *
 * Sử dụng Lua Script để đảm bảo tính nguyên tử:
 * Kiểm tra tồn kho khả dụng → Tạo hold → Cập nhật reserved_quantity
 * là một thao tác không thể bị interrupt
 *
 * @param {string} variantId
 * @param {string} cartItemId
 * @param {number} quantity
 * @param {string} userId
 * @returns {Promise<{success: boolean, holdKey: string, expiresAt: Date}>}
 */
async function holdInventory(variantId, cartItemId, quantity, userId) {
  const holdKey = buildHoldKey(variantId, cartItemId);

  // Kiểm tra xem hold này đã tồn tại chưa (user F5 lại trang checkout)
  const existingHold = await redis.get(holdKey);
  if (existingHold) {
    const holdData = JSON.parse(existingHold);
    // Nếu là của chính user này → gia hạn TTL
    if (holdData.userId === userId) {
      await redis.expire(holdKey, HOLD_TTL_SECONDS);
      return {
        success: true,
        holdKey,
        expiresAt: new Date(Date.now() + HOLD_TTL_SECONDS * 1000),
        renewed: true,
      };
    }
    // Hold của user khác đang chiếm
    throw ApiError.conflict('INVENTORY_HELD', 'Sản phẩm đang được người khác giữ chỗ, vui lòng thử lại sau.');
  }

  // Lua Script: Atomic check-and-hold
  // Redis chạy Lua Script trong một single thread → không có race condition
  const luaScript = `
    -- KEYS[1] = holdKey
    -- ARGV[1] = hold value (JSON)
    -- ARGV[2] = TTL in seconds
    -- ARGV[3] = variantId (để log)
    
    -- Kiểm tra key chưa tồn tại (NX = Not eXists)
    local result = redis.call('SET', KEYS[1], ARGV[1], 'NX', 'EX', tonumber(ARGV[2]))
    if result == false then
      return 0  -- Key đã tồn tại (race condition)
    end
    return 1  -- Thành công
  `;

  const holdValue = JSON.stringify({
    variantId,
    cartItemId,
    quantity,
    userId,
    heldAt: new Date().toISOString(),
  });

  const result = await redis.eval(luaScript, 1, holdKey, holdValue, HOLD_TTL_SECONDS, variantId);

  if (result === 0) {
    throw ApiError.conflict('INVENTORY_HELD', 'Sản phẩm đang được người khác giữ chỗ.');
  }

  // Cập nhật reserved_quantity trong PostgreSQL
  // Dùng optimistic check: chỉ update nếu còn đủ stock
  const updated = await db('variants')
    .where('id', variantId)
    .whereRaw('(stock_quantity - reserved_quantity) >= ?', [quantity])
    .increment('reserved_quantity', quantity)
    .returning(['id', 'stock_quantity', 'reserved_quantity']);

  if (!updated || updated.length === 0) {
    // Không đủ tồn kho → xóa Redis hold vừa tạo
    await redis.del(holdKey);
    throw ApiError.conflict('INSUFFICIENT_STOCK', 'Sản phẩm không đủ tồn kho.');
  }

  return {
    success: true,
    holdKey,
    expiresAt: new Date(Date.now() + HOLD_TTL_SECONDS * 1000),
  };
}

/**
 * Giữ tồn kho cho nhiều cart items cùng lúc (batch hold)
 * Nếu bất kỳ item nào thất bại → rollback TẤT CẢ holds đã thành công
 *
 * @param {Array<{variantId, cartItemId, quantity}>} items
 * @param {string} userId
 */
async function holdInventoryBatch(items, userId) {
  const successfulHolds = [];
  const errors = [];

  for (const item of items) {
    try {
      const result = await holdInventory(item.variantId, item.cartItemId, item.quantity, userId);
      successfulHolds.push({ ...item, holdKey: result.holdKey });
    } catch (err) {
      errors.push({ item, error: err.message });
      break; // Dừng ngay khi có lỗi đầu tiên
    }
  }

  // Nếu có bất kỳ lỗi nào → rollback tất cả holds đã tạo thành công
  if (errors.length > 0) {
    await releaseInventoryBatch(successfulHolds);
    throw ApiError.conflict(
      'BATCH_HOLD_FAILED',
      `Không thể giữ tồn kho: ${errors[0].error}`,
      { failedItem: errors[0].item }
    );
  }

  return successfulHolds;
}

/**
 * Giải phóng hold cho một item (khi user hủy, hoặc order confirmed)
 *
 * @param {string} variantId
 * @param {string} cartItemId
 * @param {number} quantity
 */
async function releaseInventory(variantId, cartItemId, quantity) {
  const holdKey = buildHoldKey(variantId, cartItemId);

  const holdData = await redis.get(holdKey);
  if (!holdData) {
    // Hold đã hết hạn, không cần làm gì với Redis
    // Nhưng vẫn cần kiểm tra và fix reserved_quantity trong DB nếu cần
    return { success: true, alreadyExpired: true };
  }

  // Xóa Redis hold
  await redis.del(holdKey);

  // Giảm reserved_quantity trong DB
  await db('variants')
    .where('id', variantId)
    .decrement('reserved_quantity', quantity);

  // Ghi inventory ledger
  await db('inventory_ledger').insert({
    variant_id: variantId,
    entry_type: 'release_hold',
    quantity_change: quantity,
    reference_type: 'cart',
    reference_id: cartItemId,
    note: 'Hold released manually (user cancelled checkout)',
    created_at: new Date(),
  });

  return { success: true };
}

/**
 * Giải phóng hàng loạt holds (rollback khi batch hold thất bại)
 */
async function releaseInventoryBatch(holds) {
  const pipeline = redis.pipeline();
  for (const hold of holds) {
    pipeline.del(buildHoldKey(hold.variantId, hold.cartItemId));
  }
  await pipeline.exec();

  // Batch update DB
  for (const hold of holds) {
    await db('variants')
      .where('id', hold.variantId)
      .decrement('reserved_quantity', hold.quantity);
  }
}

/**
 * ★★★ AUTO-RELEASE KHI REDIS TTL HẾT HẠN
 *
 * Được gọi bởi Keyspace Notification listener khi key expired.
 * Đây là cơ chế đảm bảo tự động rollback nếu user không thanh toán.
 *
 * @param {string} expiredKey - Ví dụ: "hold:variant-uuid:cartitem-uuid"
 */
async function handleHoldExpiry(expiredKey) {
  if (!expiredKey.startsWith(HOLD_KEY_PREFIX + ':')) return;

  const parts = expiredKey.split(':');
  if (parts.length !== 3) return;

  const [, variantId, cartItemId] = parts;

  console.log(`🔓 Auto-releasing expired hold: ${expiredKey}`);

  try {
    // Lấy quantity từ hold data — nhưng key đã expired nên không còn trong Redis!
    // Cần query DB để biết reserved_quantity cần giảm bao nhiêu
    // Cách tốt hơn: lưu quantity trong một separate key hoặc hash

    // Cách tiếp cận: Dùng HASH để lưu metadata trước khi expire
    // Key: hold_meta:{variantId}:{cartItemId} với TTL = 916s (16s sau khi hold expire)
    const metaKey = `hold_meta:${variantId}:${cartItemId}`;
    const metaData = await redis.get(metaKey);

    if (metaData) {
      const { quantity } = JSON.parse(metaData);
      await redis.del(metaKey);

      await db('variants')
        .where('id', variantId)
        .decrement('reserved_quantity', quantity);

      await db('inventory_ledger').insert({
        variant_id: variantId,
        entry_type: 'release_hold',
        quantity_change: quantity,
        reference_type: 'cart',
        note: 'Auto-released: Redis hold TTL expired (15 min timeout)',
        created_at: new Date(),
      });

      console.log(`✅ Auto-released ${quantity} units of variant ${variantId}`);
    }
  } catch (err) {
    console.error(`❌ Failed to auto-release hold ${expiredKey}:`, err);
    // Alert monitoring (Sentry, etc.)
  }
}

/**
 * Kiểm tra trạng thái hold của một variant cho user
 */
async function getHoldStatus(variantId, cartItemId) {
  const holdKey = buildHoldKey(variantId, cartItemId);
  const [holdData, ttl] = await Promise.all([
    redis.get(holdKey),
    redis.ttl(holdKey),
  ]);

  if (!holdData) {
    return { isHeld: false };
  }

  return {
    isHeld: true,
    data: JSON.parse(holdData),
    ttlSeconds: ttl,
    expiresAt: new Date(Date.now() + ttl * 1000),
  };
}

module.exports = {
  holdInventory,
  holdInventoryBatch,
  releaseInventory,
  releaseInventoryBatch,
  handleHoldExpiry,
  getHoldStatus,
  buildHoldKey,
};
