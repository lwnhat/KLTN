const { body, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Middleware xử lý kết quả validation từ express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return next(ApiError.badRequest('VALIDATION_ERROR', 'Dữ liệu đầu vào không hợp lệ.', errorDetails));
  }
  next();
};

/**
 * Validation rules cho Đăng ký
 */
const validateRegister = [
  body('email').isEmail().withMessage('Email không đúng định dạng.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải từ 6 ký tự trở lên.'),
  body('fullName').trim().notEmpty().withMessage('Họ tên không được để trống.').escape(),
  body('phone').optional().isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ.'),
  validate,
];

/**
 * Validation rules cho Tạo đơn hàng (Checkout)
 */
const validateCreateOrder = [
  body('items').isArray({ min: 1 }).withMessage('Giỏ hàng không được để trống.'),
  body('customerInfo.name').trim().notEmpty().withMessage('Tên khách hàng không được để trống.').escape(),
  body('customerInfo.phone').isMobilePhone('vi-VN').withMessage('Số điện thoại giao hàng không hợp lệ.'),
  body('shippingAddress.streetAddress').trim().notEmpty().withMessage('Địa chỉ giao hàng không được để trống.').escape(),
  body('paymentMethod').isIn(['vnpay', 'momo', 'cod', 'vietqr']).withMessage('Phương thức thanh toán không hợp lệ.'),
  validate,
];

module.exports = {
  validate,
  validateRegister,
  validateCreateOrder,
};
