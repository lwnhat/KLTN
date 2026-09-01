const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { authenticate, optionalAuthenticate } = require('../../shared/middleware/auth.middleware');
const { success } = require('../../shared/utils/apiResponse');
const ApiError = require('../../shared/utils/ApiError');

// POST /api/v1/vouchers/validate — Kiểm tra voucher từ storefront checkout
router.post('/validate', optionalAuthenticate, async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;
    const userId = req.user?.id || null;

    const voucher = await db('vouchers')
      .where('code', code.toUpperCase())
      .where('is_active', true)
      .whereRaw('starts_at <= NOW() AND expires_at > NOW()')
      .first();

    if (!voucher) {
      throw ApiError.badRequest('INVALID_VOUCHER', 'Mã giảm giá không hợp lệ hoặc đã hết hạn.');
    }

    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
      throw ApiError.badRequest('VOUCHER_EXHAUSTED', 'Mã giảm giá đã hết lượt sử dụng.');
    }

    if (orderAmount < parseFloat(voucher.min_order_amount || 0)) {
      throw ApiError.badRequest(
        'VOUCHER_MIN_ORDER',
        `Đơn hàng tối thiểu ${parseInt(voucher.min_order_amount).toLocaleString('vi-VN')}đ để dùng mã này.`
      );
    }

    // Check per-user limit
    if (userId && voucher.per_user_limit) {
      const userUsage = await db('voucher_usages')
        .where({ voucher_id: voucher.id, user_id: userId })
        .count('id as count').first();
      if (parseInt(userUsage.count) >= voucher.per_user_limit) {
        throw ApiError.badRequest('VOUCHER_USER_LIMIT', 'Bạn đã sử dụng hết lượt dùng mã này.');
      }
    }

    // Tính số tiền được giảm
    let discountAmount = 0;
    if (voucher.type === 'percentage') {
      discountAmount = Math.min(
        (orderAmount * parseFloat(voucher.value)) / 100,
        parseFloat(voucher.max_discount || Infinity)
      );
    } else if (voucher.type === 'fixed_amount') {
      discountAmount = Math.min(parseFloat(voucher.value), orderAmount);
    } else if (voucher.type === 'free_shipping') {
      discountAmount = 30000; // Phí ship cơ bản
    }

    success(res, {
      code: voucher.code,
      name: voucher.name,
      type: voucher.type,
      value: parseFloat(voucher.value),
      discountAmount: Math.round(discountAmount),
      finalAmount: Math.max(0, orderAmount - discountAmount),
    }, `Áp dụng mã "${voucher.code}" thành công!`);
  } catch (err) { next(err); }
});

module.exports = router;
