const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const { redis } = require('../../config/redis');
const db = require('../../config/database');

/**
 * Middleware xác thực JWT Access Token
 * Đọc token từ Authorization header hoặc HTTPOnly cookie
 */
const authenticate = async (req, res, next) => {
  try {
    let token;

    // 1. Thử lấy từ Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fallback: lấy từ HTTPOnly cookie
    if (!token && req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      throw ApiError.unauthorized();
    }

    // 3. Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // 4. Kiểm tra token có trong blacklist không (sau logout-all)
    const blacklisted = await redis.get(`blacklist:token:${decoded.userId}:${decoded.jti}`);
    if (blacklisted) {
      throw ApiError.unauthorized('Token đã bị thu hồi. Vui lòng đăng nhập lại.');
    }

    // 5. Lấy user từ DB (ensure user vẫn còn active)
    const user = await db('users')
      .where({ id: decoded.userId, is_active: true })
      .whereNull('deleted_at')
      .select('id', 'email', 'full_name', 'role', 'is_verified')
      .first();

    if (!user) {
      throw ApiError.unauthorized('Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token không hợp lệ hoặc đã hết hạn.'));
    }
    next(err);
  }
};

/**
 * Middleware xác thực tùy chọn (không bắt buộc login)
 * Nếu có token hợp lệ → gán req.user, nếu không → tiếp tục bình thường
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await db('users').where({ id: decoded.userId, is_active: true }).first();
    if (user) req.user = user;
  } catch {
    // Silent fail — không đăng nhập vẫn OK
  }
  next();
};

module.exports = { authenticate, optionalAuthenticate };
