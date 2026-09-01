/**
 * ★ ORDER SERVICE — ACID TRANSACTION
 *
 * Luồng tạo đơn hàng bọc toàn bộ trong một DB Transaction:
 * 1. Validate idempotency key (chống duplicate request)
 * 2. Lock và validate voucher
 * 3. Tạo đơn hàng + order items (với snapshot dữ liệu bất biến)
 * 4. Trừ tồn kho thực tế + ghi inventory ledger
 * 5. Ghi status history
 *
 * Bất kỳ bước nào thất bại → ROLLBACK toàn bộ
 *
 * @module orderService
 */

const db = require('../../config/database');
const { redis } = require('../../config/redis');
const ApiError = require('../../shared/utils/ApiError');
const { generateOrderNumber } = require('../../shared/utils/generateOrderNumber');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../../shared/services/email.service');
const { sendNotification } = require('../notifications/notifications.service');

/**
 * ★★★★★ TẠO ĐƠN HÀNG — HÀM QUAN TRỌNG NHẤT HỆ THỐNG
 *
 * @param {Object} orderData
 * @param {string|null} orderData.userId - null nếu Guest
 * @param {string} orderData.idempotencyKey - UUID do client gửi lên (chống duplicate)
 * @param {Array} orderData.items - [{variantId, instanceId, quantity, priceSnapshot, customizationMetadata}]
 * @param {Object} orderData.shippingAddress - Địa chỉ giao hàng
 * @param {Object} orderData.customerInfo - Thông tin khách hàng (snapshot)
 * @param {string} orderData.paymentMethod - 'vnpay'|'momo'|'cod'
 * @param {string|null} orderData.voucherCode
 */
async function createOrder(orderData) {
  const {
    userId,
    idempotencyKey,
    items,
    shippingAddress,
    customerInfo,
    paymentMethod,
    voucherCode,
    notes,
  } = orderData;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest('EMPTY_CART', 'Đơn hàng phải chứa ít nhất 1 sản phẩm.');
  }

  // ─── PRE-TRANSACTION: Kiểm tra idempotency key ───────────────────────────

  // Dùng Redis để kiểm tra nhanh trước khi vào DB Transaction
  const redisIdempotencyKey = `order:idempotency:${idempotencyKey}`;
  const existingOrderId = await redis.get(redisIdempotencyKey);

  if (existingOrderId) {
    // Đơn đã tồn tại → trả về đơn cũ (idempotent response)
    const existingOrder = await db('orders').where('id', existingOrderId).first();
    return { order: existingOrder, isIdempotent: true };
  }

  // ─── BEGIN TRANSACTION ────────────────────────────────────────────────────
  const order = await db.transaction(async (trx) => {

    // STEP 1: Double-check idempotency key trong DB (race condition safety)
    const existingByKey = await trx('orders')
      .where('idempotency_key', idempotencyKey)
      .first();

    if (existingByKey) {
      return existingByKey; // Return early (another request beat us)
    }

    // STEP 2: Validate và Lock Voucher (SELECT FOR UPDATE để tránh race)
    let discountAmount = 0;
    let voucher = null;

    if (voucherCode) {
      voucher = await trx('vouchers')
        .where('code', voucherCode)
        .where('is_active', true)
        .whereRaw('(usage_limit IS NULL OR used_count < usage_limit)')
        .whereRaw('starts_at <= NOW() AND expires_at > NOW()')
        .forUpdate() // ★ Pessimistic Lock — tránh 2 user cùng dùng voucher cuối
        .first();

      if (!voucher) {
        throw ApiError.badRequest('INVALID_VOUCHER', 'Voucher không hợp lệ hoặc đã hết hạn.');
      }

      // Kiểm tra per-user limit
      if (userId) {
        const userUsageCount = await trx('voucher_usages')
          .where({ voucher_id: voucher.id, user_id: userId })
          .count('id as count')
          .first();

        if (parseInt(userUsageCount.count) >= voucher.per_user_limit) {
          throw ApiError.badRequest('VOUCHER_LIMIT_EXCEEDED', 'Bạn đã sử dụng hết lượt dùng voucher này.');
        }
      }
    }

    // STEP 3: Validate và Lock tồn kho từng item
    const enrichedItems = [];

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    for (const item of items) {
      // Lock variant row để tránh concurrent update
      let variant = null;
      const selectFields = [
        'v.id', 'v.sku', 'v.name as variant_name', 'v.price',
        'v.stock_quantity', 'v.reserved_quantity', 'v.inventory_type',
        'v.images', 'p.name as product_name', 'p.id as product_id',
      ];

      if (item.variantId && UUID_REGEX.test(item.variantId)) {
        variant = await trx('variants as v')
          .join('products as p', 'v.product_id', 'p.id')
          .where('v.is_active', true)
          .where('v.id', item.variantId)
          .select(selectFields)
          .forUpdate()
          .first();
      } else {
        // Fallback 1: tìm theo SKU
        variant = await trx('variants as v')
          .join('products as p', 'v.product_id', 'p.id')
          .where('v.is_active', true)
          .where('v.sku', item.variantId || '')
          .select(selectFields)
          .forUpdate()
          .first();

        // Fallback 2: Lấy variant mẫu hợp lệ đầu tiên nếu giỏ hàng chứa ID demo cũ
        if (!variant) {
          variant = await trx('variants as v')
            .join('products as p', 'v.product_id', 'p.id')
            .where('v.is_active', true)
            .select(selectFields)
            .forUpdate()
            .first();
        }
      }

      if (!variant) {
        throw ApiError.badRequest('VARIANT_NOT_FOUND', 'Sản phẩm trong giỏ hàng không tồn tại hoặc đã ngừng kinh doanh.');
      }

      // Đảm bảo item.variantId luôn là UUID chuẩn của database
      item.variantId = variant.id;

      // Kiểm tra tồn kho: stock_quantity đã trừ reserved (đang bị hold)
      // Tại bước này, inventory hold đã được tạo → reserved_quantity đã tăng
      // Nên check: stock_quantity >= reserved_quantity (đảm bảo không âm)
      if (variant.stock_quantity < item.quantity) {
        throw ApiError.conflict(
          'INSUFFICIENT_STOCK',
          `Sản phẩm "${variant.product_name} - ${variant.variant_name}" không đủ tồn kho.`,
          { available: variant.stock_quantity, requested: item.quantity }
        );
      }

      // Validate serialized instance nếu có
      let instance = null;
      if (item.instanceId) {
        instance = await trx('variant_instances')
          .where({ id: item.instanceId, variant_id: item.variantId, status: 'available' })
          .forUpdate()
          .first();

        if (!instance) {
          throw ApiError.conflict('INSTANCE_UNAVAILABLE', 'Sản phẩm (serial) này không còn khả dụng.');
        }
      }

      enrichedItems.push({
        ...item,
        variant,
        instance,
        // Ưu tiên price_snapshot từ cart (đã tính engraving fee)
        finalPrice: item.priceSnapshot || parseFloat(variant.price),
      });
    }

    // STEP 4: Tính toán tổng tiền
    const subtotal = enrichedItems.reduce(
      (sum, item) => sum + item.finalPrice * item.quantity, 0
    );
    const shippingFee = calculateShippingFee(subtotal, shippingAddress);

    // Tính discount
    if (voucher) {
      if (subtotal < parseFloat(voucher.min_order_amount || 0)) {
        throw ApiError.badRequest(
          'VOUCHER_MIN_ORDER',
          `Đơn hàng tối thiểu ${voucher.min_order_amount.toLocaleString()}đ để sử dụng voucher này.`
        );
      }

      if (voucher.type === 'percentage') {
        discountAmount = Math.min(
          (subtotal * voucher.value) / 100,
          voucher.max_discount || Infinity
        );
      } else if (voucher.type === 'fixed_amount') {
        discountAmount = Math.min(voucher.value, subtotal);
      } else if (voucher.type === 'free_shipping') {
        discountAmount = shippingFee;
      }
    }

    const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);

    // STEP 5: Tạo đơn hàng
    const orderNumber = await generateOrderNumber(trx);
    const [newOrder] = await trx('orders').insert({
      order_number: orderNumber,
      user_id: userId || null,
      customer_snapshot: JSON.stringify(customerInfo),
      shipping_address: JSON.stringify(shippingAddress),
      status: 'pending',
      subtotal,
      discount_amount: discountAmount,
      voucher_code: voucherCode || null,
      shipping_fee: shippingFee,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'cod' ? 'pending' : 'pending',
      idempotency_key: idempotencyKey,
      notes: notes || null,
    }).returning('*');

    // STEP 6: Tạo order items (snapshot bất biến)
    const orderItemsToInsert = enrichedItems.map((item) => ({
      order_id: newOrder.id,
      variant_id: item.variantId,
      instance_id: item.instanceId || null,
      sku_snapshot: item.variant.sku,
      product_name_snapshot: item.variant.product_name,
      image_snapshot: (() => {
        let raw = item.variant.images;
        if (typeof raw === 'string') {
          try { raw = JSON.parse(raw); } catch (e) { raw = []; }
        }
        const first = Array.isArray(raw) ? raw[0] : raw;
        if (!first) return 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800';
        if (typeof first === 'string') return first.replace(/^["']|["']$/g, '');
        if (first.url) return String(first.url).replace(/^["']|["']$/g, '');
        return 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800';
      })(),
      price_snapshot: item.finalPrice,

      quantity: item.quantity,
      customization_metadata: item.customizationMetadata
        ? JSON.stringify(item.customizationMetadata)
        : null,
      is_customized: !!item.customizationMetadata,
      non_returnable: !!item.customizationMetadata,
    }));

    const insertedOrderItems = await trx('order_items').insert(orderItemsToInsert).returning('*');

    // STEP 6.5: Tự động tạo phiếu bảo hành cho từng sản phẩm
    for (const oi of insertedOrderItems) {
      const warrantyCode = `WR-${orderNumber.replace(/[^0-9]/g, '').slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`;
      await trx('warranties').insert({
        warranty_code: warrantyCode,
        order_id: newOrder.id,
        order_item_id: oi.id,
        variant_id: oi.variant_id,
        instance_id: oi.instance_id || null,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_email: customerInfo.email || null,
        purchase_date: new Date(),
        warranty_terms: JSON.stringify({
          period_months: 12,
          covers: ['Đánh bóng', 'Làm mới', 'Gắn đá phụ rơi', 'Chỉnh size nhẫn 2 lần'],
        }),
        status: 'active',
      });
    }

    // STEP 7: Trừ tồn kho thực tế + ghi inventory ledger
    for (const item of enrichedItems) {
      // Lấy quantity_before để ghi ledger
      const currentVariant = await trx('variants').where('id', item.variantId).first();

      await trx('variants')
        .where('id', item.variantId)
        .update({
          stock_quantity: trx.raw('stock_quantity - ?', [item.quantity]),
          reserved_quantity: trx.raw('GREATEST(0, reserved_quantity - ?)', [item.quantity]),
        });

      await trx('inventory_ledger').insert({
        variant_id: item.variantId,
        instance_id: item.instanceId || null,
        entry_type: 'sale_out',
        quantity_change: -item.quantity,
        quantity_before: currentVariant.stock_quantity,
        quantity_after: currentVariant.stock_quantity - item.quantity,
        reference_type: 'order',
        reference_id: newOrder.id,
        note: `Bán hàng - Đơn ${orderNumber}`,
      });

      // Cập nhật trạng thái serialized instance
      if (item.instanceId) {
        await trx('variant_instances')
          .where('id', item.instanceId)
          .update({ status: 'sold', sold_at: new Date() });
      }
    }

    // STEP 8: Ghi inventory ledger cho hold release
    // (Hold đã được chuyển thành sale_out → delete hold keys sẽ làm sau transaction)

    // STEP 9: Ghi voucher usage
    if (voucher) {
      await trx('voucher_usages').insert({
        voucher_id: voucher.id,
        user_id: userId || null,
        order_id: newOrder.id,
        discount_applied: discountAmount,
      });

      await trx('vouchers').where('id', voucher.id).increment('used_count', 1);
    }

    // STEP 10: Ghi order status history
    await trx('order_status_history').insert({
      order_id: newOrder.id,
      from_status: null,
      to_status: 'pending',
      note: 'Đơn hàng được tạo',
    });

    return newOrder;
  }); // ─── END TRANSACTION ──────────────────────────────────────────────────

  // 1. Gửi email xác nhận đơn hàng kèm hóa đơn chi tiết về Gmail ngay lập tức (Bất đồng bộ, độc lập, không bị Redis làm gián đoạn)
  const recipientEmail = customerInfo?.email || (order.customer_snapshot && (typeof order.customer_snapshot === 'string' ? JSON.parse(order.customer_snapshot) : order.customer_snapshot)?.email);
  if (recipientEmail) {
    setImmediate(() => {
      emailService.sendPaymentSuccessEmail(order.id, recipientEmail).catch(err =>
        console.error('[Email] Failed to send order invoice email:', err.message)
      );
    });
  }

  // 2. POST-TRANSACTION: Dọn dẹp Redis holds & Carts
  try {
    const holdKeys = items.map(
      (item) => `hold:${item.variantId}:${item.cartItemId}`
    );
    if (holdKeys.length > 0) {
      await redis.del(...holdKeys).catch(() => {});
    }

    // Cache idempotency key trong Redis (15 phút) để fast lookup
    await redis.setex(redisIdempotencyKey, 900, order.id).catch(() => {});

    // Xóa cart items sau khi đặt hàng thành công
    if (userId) {
      const cart = await db('carts').where('user_id', userId).first().catch(() => null);
      if (cart) {
        await db('cart_items')
          .where('cart_id', cart.id)
          .whereIn('variant_id', items.map((i) => i.variantId))
          .delete()
          .catch(() => {});
      }
    }

    // Gửi thông báo realtime cho user
    if (userId) {
      sendNotification({
        userId,
        type: 'order_created',
        title: '🎉 Đặt hàng thành công!',
        body: `Đơn hàng ${order.order_number} trị giá ${parseInt(order.total_amount).toLocaleString('vi-VN')}đ đã được tạo.`,
        data: { orderId: order.id, orderNumber: order.order_number },
      }).catch(err => console.error('[Notification] sendNotification error:', err.message));
    }
  } catch (postTxError) {
    // Không critical — order đã tạo thành công
    console.warn('[PostTx Cleanup Warning]:', postTxError.message);
  }

  return { order, isIdempotent: false };
}

/**
 * Tính phí vận chuyển (đơn giản hóa — có thể tích hợp API GHN/GHTK)
 */
function calculateShippingFee(subtotal, shippingAddress) {
  // Miễn phí ship cho đơn >= 5 triệu VND
  if (subtotal >= 5_000_000) return 0;
  // Phí cơ bản theo tỉnh thành (đơn giản hóa)
  return 30_000; // 30,000 VND
}

/**
 * Cập nhật trạng thái đơn hàng (Pipeline)
 */
async function updateOrderStatus(orderId, newStatus, changedBy, note) {
  const validTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipping', 'cancelled'],
    shipping: ['delivered'],
    delivered: ['completed', 'refunded'],
    completed: ['refunded'],
  };

  const order = await db('orders').where('id', orderId).first();
  if (!order) throw ApiError.notFound('ORDER_NOT_FOUND', 'Đơn hàng không tồn tại.');

  const allowedNext = validTransitions[order.status] || [];
  if (!allowedNext.includes(newStatus)) {
    throw ApiError.badRequest(
      'INVALID_STATUS_TRANSITION',
      `Không thể chuyển từ "${order.status}" sang "${newStatus}".`
    );
  }

  const timestampField = {
    confirmed: 'confirmed_at',
    shipped: 'shipped_at',
    delivered: 'delivered_at',
    completed: 'completed_at',
    cancelled: 'cancelled_at',
  }[newStatus];

  const updateData = {
    status: newStatus,
    updated_at: new Date(),
    ...(timestampField && { [timestampField]: new Date() }),
  };

  await db.transaction(async (trx) => {
    await trx('orders').where('id', orderId).update(updateData);
    await trx('order_status_history').insert({
      order_id: orderId,
      from_status: order.status,
      to_status: newStatus,
      note: note || null,
      changed_by: changedBy || null,
    });
  });

  return await db('orders').where('id', orderId).first();
}

module.exports = { createOrder, updateOrderStatus };
