const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Global Error Handler Middleware
 * Phải là middleware CUỐI CÙNG trong Express app (4 parameters)
 */
const errorHandler = (err, req, res, next) => {
  // Nếu là ApiError (Operational Error) → trả về response có cấu trúc
  if (err instanceof ApiError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
  }

  // Knex / PostgreSQL specific errors
  if (err.code === '23505') { // unique_violation
    return res.status(409).json({
      success: false,
      error: { code: 'DUPLICATE_ENTRY', message: 'Dữ liệu đã tồn tại.' },
    });
  }

  if (err.code === '23503') { // foreign_key_violation
    return res.status(400).json({
      success: false,
      error: { code: 'FOREIGN_KEY_VIOLATION', message: 'Dữ liệu liên kết không tồn tại.' },
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Token không hợp lệ.' },
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: { code: 'TOKEN_EXPIRED', message: 'Token đã hết hạn.' },
    });
  }

  // Unknown / Programming errors → Log đầy đủ, không lộ chi tiết ra client
  logger.error('Unhandled Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
  });

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
        : err.message, // Hiển thị chi tiết khi dev
    },
  });
};

/**
 * 404 Handler — cho các routes không tồn tại
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.url} không tồn tại.`,
    },
  });
};

module.exports = { errorHandler, notFoundHandler };
