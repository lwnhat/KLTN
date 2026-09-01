/**
 * ★ VNPay WEBHOOK CONTROLLER
 *
 * Xử lý callback từ VNPay khi thanh toán hoàn tất.
 *
 * Các vấn đề cần giải quyết:
 * 1. Xác thực chữ ký HMAC-SHA512 (tránh giả mạo webhook)
 * 2. Idempotency (VNPay có thể gửi lại webhook nhiều lần)
 * 3. ACID update: Cập nhật payment + order + inventory trong 1 transaction
 * 4. Rollback tồn kho nếu thanh toán thất bại
 * 5. Gửi email & Socket.io notification sau khi confirm
 *
 * @module webhookController
 */

const crypto = require('crypto');
const db = require('../../config/database');
const { redis } = require('../../config/redis');
const { updateOrderStatus } = require('../orders/orders.service');
const emailService = require('../../shared/services/email.service');
const { getIO } = require('../../config/socket');

const logger = require('../../shared/utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Xác thực chữ ký VNPay
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Xác thực HMAC-SHA512 signature từ VNPay
 *
 * VNPay ký toàn bộ query params theo thứ tự alphabet,
 * trừ trường vnp_SecureHash.
 *
 * @param {Object} vnpParams - Query params từ VNPay webhook
 * @returns {boolean}
 */
function verifyVNPaySignature(vnpParams) {
  const secretKey = process.env.VNPAY_HASH_SECRET;

  // 1. Xóa trường SecureHash ra khỏi object để tính lại
  const { vnp_SecureHash, vnp_SecureHashType, ...paramsToSign } = vnpParams;

  // 2. Sort theo alphabet key
  const sortedKeys = Object.keys(paramsToSign).sort();

  // 3. Build query string
  const signData = sortedKeys
    .filter((key) => paramsToSign[key] !== '' && paramsToSign[key] !== null)
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join('&');

  // 4. Tính HMAC-SHA512
  const computedHash = crypto
    .createHmac('sha512', secretKey)
    .update(signData, 'utf-8')
    .digest('hex');

  // 5. So sánh với SecureHash từ VNPay (case-insensitive)
  return computedHash.toLowerCase() === vnp_SecureHash?.toLowerCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: VNPay Webhook (IPN - Instant Payment Notification)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/webhooks/vnpay
 *
 * VNPay gọi endpoint này khi thanh toán hoàn tất.
 * Response PHẢI là {"RspCode":"00","Message":"Confirm Success"}
 * nếu không VNPay sẽ retry sau 15 phút.
 */
async function handleVNPayWebhook(req, res) {
  const vnpParams = req.query; // VNPay gửi qua query string

  logger.info('VNPay webhook received', {
    txnRef: vnpParams.vnp_TxnRef,
    responseCode: vnpParams.vnp_ResponseCode,
    amount: vnpParams.vnp_Amount,
  });

  // ─── BƯỚC 1: Verify chữ ký ──────────────────────────────────────────────
  if (!verifyVNPaySignature(vnpParams)) {
    logger.warn('VNPay webhook: Invalid signature', { params: vnpParams });
    // PHẢI trả 200 (dù lỗi) để VNPay không retry — nhưng báo lỗi trong body
    return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
  }

  const {
    vnp_TxnRef: orderNumber,     // Mã đơn hàng (order_number)
    vnp_ResponseCode: responseCode,
    vnp_TransactionNo: vnpTransactionId,
    vnp_Amount: vnpAmountRaw,
    vnp_TransactionStatus: transactionStatus,
  } = vnpParams;

  // VNPay gửi amount x 100 (VD: 150000 VND → 15000000)
  const paidAmount = parseInt(vnpAmountRaw) / 100;

  // ─── BƯỚC 2: Tìm đơn hàng ───────────────────────────────────────────────
  const order = await db('orders').where('order_number', orderNumber).first();

  if (!order) {
    logger.error('VNPay webhook: Order not found', { orderNumber });
    return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
  }

  // ─── BƯỚC 3: Kiểm tra Idempotency ───────────────────────────────────────
  // Kiểm tra Redis cache trước (nhanh hơn DB)
  const idempotencyKey = `webhook:vnpay:${orderNumber}`;
  const alreadyProcessed = await redis.get(idempotencyKey);

  if (alreadyProcessed) {
    logger.info('VNPay webhook: Already processed (idempotent)', { orderNumber });
    return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
  }

  // Double-check trong DB
  const existingPayment = await db('payments')
    .where('order_id', order.id)
    .whereIn('status', ['success', 'failed'])
    .first();

  if (existingPayment) {
    // Cache để fast lookup lần sau
    await redis.setex(idempotencyKey, 86400, '1'); // 24h cache
    logger.info('VNPay webhook: Payment already in DB (idempotent)', { orderNumber });
    return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
  }

  // ─── BƯỚC 4: Kiểm tra số tiền khớp ─────────────────────────────────────
  const expectedAmount = parseFloat(order.total_amount);
  if (Math.abs(paidAmount - expectedAmount) > 1) { // Cho phép chênh lệch 1 VND làm tròn
    logger.error('VNPay webhook: Amount mismatch', {
      expected: expectedAmount, received: paidAmount, orderNumber
    });
    return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
  }

  // ─── BƯỚC 5: Xử lý theo kết quả thanh toán ──────────────────────────────
  const isSuccess = responseCode === '00' && transactionStatus === '00';

  try {
    await db.transaction(async (trx) => {
      // Ghi payment record
      await trx('payments').insert({
        order_id: order.id,
        provider: 'vnpay',
        transaction_id: vnpTransactionId,
        provider_order_id: orderNumber,
        amount: paidAmount,
        status: isSuccess ? 'success' : 'failed',
        idempotency_key: orderNumber,
        webhook_payload: JSON.stringify(vnpParams),
        paid_at: isSuccess ? new Date() : null,
      });

      if (isSuccess) {
        // ✅ THANH TOÁN THÀNH CÔNG
        await trx('orders').where('id', order.id).update({
          status: 'confirmed',
          payment_status: 'paid',
          confirmed_at: new Date(),
          updated_at: new Date(),
        });

        await trx('order_status_history').insert({
          order_id: order.id,
          from_status: 'pending',
          to_status: 'confirmed',
          note: `Thanh toán VNPay thành công. Mã GD: ${vnpTransactionId}`,
        });

        // Tạo phiếu bảo hành cho từng order item
        await createWarrantiesForOrder(trx, order);

      } else {
        // ❌ THANH TOÁN THẤT BẠI → ROLLBACK TỒN KHO
        await trx('orders').where('id', order.id).update({
          status: 'cancelled',
          payment_status: 'failed',
          cancelled_at: new Date(),
          cancel_reason: `VNPay thanh toán thất bại. Mã lỗi: ${responseCode}`,
          updated_at: new Date(),
        });

        await trx('order_status_history').insert({
          order_id: order.id,
          from_status: 'pending',
          to_status: 'cancelled',
          note: `Thanh toán VNPay thất bại. Mã lỗi: ${responseCode}`,
        });

        // Hoàn kho: Lấy lại các order items để tăng stock
        const orderItems = await trx('order_items')
          .where('order_id', order.id)
          .select('*');

        for (const item of orderItems) {
          const currentVariant = await trx('variants')
            .where('id', item.variant_id)
            .first();

          await trx('variants')
            .where('id', item.variant_id)
            .increment('stock_quantity', item.quantity);

          await trx('inventory_ledger').insert({
            variant_id: item.variant_id,
            instance_id: item.instance_id || null,
            entry_type: 'return_in',
            quantity_change: item.quantity,
            quantity_before: currentVariant.stock_quantity,
            quantity_after: currentVariant.stock_quantity + item.quantity,
            reference_type: 'order',
            reference_id: order.id,
            note: `Hoàn kho - Thanh toán VNPay thất bại. Đơn ${orderNumber}`,
          });

          // Hoàn trạng thái serialized instance
          if (item.instance_id) {
            await trx('variant_instances')
              .where('id', item.instance_id)
              .update({ status: 'available', sold_at: null });
          }
        }
      }
    }); // ─── END TRANSACTION ───────────────────────────────────────────────

    // ─── POST-TRANSACTION: Notifications & Emails ──────────────────────────

    // Cache idempotency key
    await redis.setex(idempotencyKey, 86400, '1');

    if (isSuccess) {
      // Gửi email xác nhận đơn hàng (async, không chờ)
      emailService.sendOrderConfirmation(order).catch((err) =>
        logger.error('Failed to send order confirmation email:', err)
      );

      // Socket.io: Thông báo realtime cho Admin
      const io = getIO();
      io.to('admin_room').emit('new_order', {
        orderId: order.id,
        orderNumber: order.order_number,
        amount: order.total_amount,
        customerName: JSON.parse(order.customer_snapshot)?.name,
        paymentMethod: 'vnpay',
        createdAt: new Date(),
      });

      logger.info(`✅ Order ${orderNumber} confirmed. Amount: ${paidAmount} VND`);
    } else {
      // Gửi email thông báo thất bại
      emailService.sendPaymentFailed(order).catch((err) =>
        logger.error('Failed to send payment failed email:', err)
      );

      logger.info(`❌ Order ${orderNumber} payment failed. Code: ${responseCode}`);
    }

    // ─── RESPONSE: Phải trả về đúng format VNPay yêu cầu ──────────────────
    return res.status(200).json({
      RspCode: '00',
      Message: 'Confirm Success',
    });

  } catch (error) {
    logger.error('VNPay webhook processing error:', {
      error: error.message,
      orderNumber,
      stack: error.stack,
    });

    // Trả 200 để VNPay không retry liên tục, nhưng log để xử lý thủ công
    return res.status(200).json({
      RspCode: '99',
      Message: 'Unknown error',
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: VNPay Return URL (Redirect sau khi user thanh toán)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/payments/vnpay/return
 *
 * VNPay redirect user về URL này sau khi thanh toán.
 * KHÔNG dùng để xử lý logic — chỉ để redirect user về frontend.
 * Logic thực sự được xử lý ở IPN webhook ở trên.
 */
async function handleVNPayReturn(req, res) {
  const { vnp_TxnRef, vnp_ResponseCode } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  if (!verifyVNPaySignature(req.query)) {
    return res.redirect(`${frontendUrl}/checkout/cancel?reason=invalid_signature`);
  }

  if (vnp_ResponseCode === '00') {
    return res.redirect(`${frontendUrl}/checkout/success?order=${vnp_TxnRef}`);
  } else {
    return res.redirect(`${frontendUrl}/checkout/cancel?order=${vnp_TxnRef}&code=${vnp_ResponseCode}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Tạo phiếu bảo hành sau khi đơn confirmed
// ─────────────────────────────────────────────────────────────────────────────

async function createWarrantiesForOrder(trx, order) {
  const orderItems = await trx('order_items').where('order_id', order.id);
  const customerSnapshot = JSON.parse(order.customer_snapshot);

  for (const item of orderItems) {
    const variant = await trx('variants').where('id', item.variant_id).first();
    if (!variant) continue;

    const purchaseDate = new Date();

    // Thời hạn bảo hành mặc định cho trang sức
    const warrantyTerms = {
      polish: {
        duration_months: 12,
        expires: addMonths(purchaseDate, 12).toISOString().split('T')[0],
      },
      stone_replace: {
        duration_months: 6,
        expires: addMonths(purchaseDate, 6).toISOString().split('T')[0],
      },
      exchange: {
        duration_months: 1,
        expires: addMonths(purchaseDate, 1).toISOString().split('T')[0],
      },
      free_resize: {
        times_remaining: 2,
      },
    };

    const warrantyCode = `WR-${order.order_number.replace('TJ-', '')}-${String(item.id).slice(-4).toUpperCase()}`;

    await trx('warranties').insert({
      warranty_code: warrantyCode,
      order_id: order.id,
      order_item_id: item.id,
      variant_id: item.variant_id,
      instance_id: item.instance_id || null,
      customer_name: customerSnapshot.name,
      customer_phone: customerSnapshot.phone,
      customer_email: customerSnapshot.email || null,
      purchase_date: purchaseDate.toISOString().split('T')[0],
      warranty_terms: JSON.stringify(warrantyTerms),
      status: 'active',
    });
  }
}

function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

module.exports = { handleVNPayWebhook, handleVNPayReturn };
