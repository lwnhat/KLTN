const express = require('express');
const router = express.Router();
const vietqrService = require('../../shared/services/vietqr.service');
const db = require('../../config/database');
const { success } = require('../../shared/utils/apiResponse');
const ApiError = require('../../shared/utils/ApiError');
const { getIO } = require('../../config/socket');
const { notifyOrderStatusChange } = require('../notifications/notifications.service');
const emailService = require('../../shared/services/email.service');

// POST /api/v1/payments/vietqr/generate — Tạo mã VietQR thanh toán chuẩn EMVCo & QuickLink

router.post('/vietqr/generate', async (req, res, next) => {
  try {
    const { orderNumber, amount, bankCode, accountNo, accountName, template } = req.body;

    if (!orderNumber) {
      throw ApiError.badRequest('MISSING_ORDER', 'Vui lòng cung cấp mã đơn hàng.');
    }

    let finalAmount = amount;
    // Nếu không truyền amount, lấy trực tiếp từ database
    if (!finalAmount) {
      const order = await db('orders').where({ order_number: orderNumber }).first();
      if (!order) throw ApiError.notFound('ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.');
      finalAmount = order.total_amount;
    }

    const qrResult = await vietqrService.generateVietQR({
      orderNumber,
      amount: parseFloat(finalAmount),
      bankCode,
      accountNo,
      accountName,
      template,
    });

    success(res, qrResult, 'Tạo mã VietQR thanh toán thành công.');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/payments/banks — Danh sách ngân hàng hỗ trợ VietQR
router.get('/banks', async (req, res, next) => {
  try {
    const banks = await vietqrService.getSupportedBanks();
    success(res, banks, 'Lấy danh sách ngân hàng thành công.');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/payments/status/:orderNumber — Kiểm tra trạng thái thanh toán
router.get('/status/:orderNumber', async (req, res, next) => {
  try {
    const order = await db('orders')
      .where('order_number', req.params.orderNumber)
      .select('id', 'order_number', 'status', 'payment_status', 'payment_method', 'total_amount', 'created_at', 'user_id')
      .first();

    if (!order) throw ApiError.notFound('ORDER_NOT_FOUND', 'Đơn hàng không tồn tại.');
    success(res, order);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/payments/vietqr/simulate-paid — Mô phỏng chuyển khoản thành công (Demo Bank IPN Webhook)
router.post('/vietqr/simulate-paid', async (req, res, next) => {
  try {
    const { orderNumber } = req.body;
    if (!orderNumber) throw ApiError.badRequest('MISSING_ORDER', 'Mã đơn hàng không được để trống.');

    const order = await db('orders').where({ order_number: orderNumber }).first();
    if (!order) throw ApiError.notFound('ORDER_NOT_FOUND', 'Đơn hàng không tồn tại.');

    if (order.payment_status === 'paid') {
      return success(res, order, 'Đơn hàng đã được thanh toán trước đó.');
    }

    // Cập nhật trạng thái thanh toán sang 'paid' và đơn hàng sang 'confirmed'
    const [updatedOrder] = await db('orders')
      .where({ id: order.id })
      .update({
        payment_status: 'paid',
        status: order.status === 'pending' ? 'confirmed' : order.status,
        updated_at: new Date(),
      })
      .returning('*');

    // Ghi lịch sử trạng thái
    await db('order_status_history').insert({
      order_id: order.id,
      from_status: order.status,
      to_status: updatedOrder.status,
      note: 'Thanh toán chuyển khoản VietQR thành công (Xác nhận tự động)',
    });

    // Bắn thông báo Socket.io realtime cho khách hàng đang mở trang thanh toán
    try {
      const io = getIO();
      if (io) {
        // Emit tới room của đơn hàng và room của user
        io.to(`order_${orderNumber}`).emit('payment_success', {
          orderNumber,
          paymentStatus: 'paid',
          status: updatedOrder.status,
          paidAt: new Date().toISOString(),
        });

        if (order.user_id) {
          io.to(`user_${order.user_id}`).emit('payment_success', {
            orderNumber,
            paymentStatus: 'paid',
            status: updatedOrder.status,
            paidAt: new Date().toISOString(),
          });
        }
      }
    } catch (socketErr) {
      console.error('[Socket.io] Error emitting payment success:', socketErr.message);
    }

    // Gửi email xác nhận thanh toán thành công (TikTok Shop style) về Gmail của khách hàng
    emailService.sendPaymentSuccessEmail(updatedOrder.id).catch((err) => {
      console.error('[Email] Failed to send payment success email:', err.message);
    });

    // Gửi thông báo hệ thống
    notifyOrderStatusChange(updatedOrder, updatedOrder.status).catch(() => {});

    success(res, updatedOrder, 'Xác nhận thanh toán VietQR thành công!');
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/payments/send-payment-email — Gửi thử nghiệm hoặc kích hoạt gửi email thanh toán về Gmail
router.post('/send-payment-email', async (req, res, next) => {
  try {
    const { orderNumber, email } = req.body;
    if (!orderNumber) throw ApiError.badRequest('MISSING_ORDER', 'Vui lòng cung cấp mã đơn hàng.');

    const info = await emailService.sendPaymentSuccessEmail(orderNumber, email);
    success(res, { messageId: info?.messageId }, 'Đã gửi email thông tin thanh toán thành công!');
  } catch (err) {
    next(err);
  }
});

module.exports = router;

