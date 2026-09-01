const express = require('express');
const router = express.Router();
const authService = require('./auth.service');
const emailService = require('../../shared/services/email.service');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { success, error } = require('../../shared/utils/apiResponse');
const rateLimit = require('express-rate-limit');
const { redis } = require('../../config/redis');

// Rate limit: 5 lần login/15 phút per IP (bỏ qua khi dev)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Quá nhiều lần đăng nhập. Thử lại sau 15 phút.' } },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
});


// POST /api/v1/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, fullName, phone } = req.body;
    const { user, otp } = await authService.register({ email, password, fullName, phone });
    
    // Gửi email OTP xác thực tài khoản
    emailService.sendVerificationEmail({ to: email, fullName, otp }).catch((err) => {
      console.error('[Email] Failed to send verification email:', err.message);
    });
    
    console.log(`[Dev Log] OTP for ${email}: ${otp}`);
    success(res, { user }, 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực.', 201);
  } catch (err) { next(err); }
});

// POST /api/v1/auth/verify-email
router.post('/verify-email', async (req, res, next) => {
  try {
    const { email, code } = req.body;
    await authService.verifyEmail({ email, code });
    success(res, null, 'Xác thực email thành công.');
  } catch (err) { next(err); }
});

// Cấu hình chuẩn HttpOnly Cookie để bảo vệ phiên đăng nhập chống XSS & CSRF
const REFRESH_COOKIE_NAME = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true, // ★ Tuyệt đối không cho JavaScript/XSS đọc cookie
  secure: process.env.NODE_ENV === 'production', // Bắt buộc HTTPS khi chạy production
  sameSite: 'lax', // Bảo vệ chống tấn công CSRF
  path: '/', // Áp dụng toàn domain
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
};

// POST /api/v1/auth/login
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const deviceInfo = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const result = await authService.login({ email, password, deviceInfo });

    // ★ Thiết lập Refresh Token an toàn tuyệt đối trong HttpOnly Cookie
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

    // ★ Response JSON CHỈ chứa short-lived Access Token (15m) & User metadata, KHÔNG BAO GIỜ trả Refresh Token qua JSON body!
    success(res, { accessToken: result.accessToken, user: result.user }, 'Đăng nhập thành công.');
  } catch (err) { next(err); }
});

// POST /api/v1/auth/refresh — Refresh Token Rotation (RTR)
router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
    const deviceInfo = { ip: req.ip, userAgent: req.headers['user-agent'] };
    
    const result = await authService.refreshAccessToken(refreshToken, deviceInfo);

    // ★ Xoay vòng Refresh Token: Cấp token mới và ghi đè vào HttpOnly Cookie
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

    success(res, { accessToken: result.accessToken, user: result.user }, 'Làm mới phiên đăng nhập thành công.');
  } catch (err) { next(err); }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    await authService.logout(req.user.id, refreshToken);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
    success(res, null, 'Đăng xuất thành công.');
  } catch (err) { next(err); }
});

// POST /api/v1/auth/logout-all (Đăng xuất mọi thiết bị)
router.post('/logout-all', authenticate, async (req, res, next) => {
  try {
    await authService.logoutAll(req.user.id);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
    success(res, null, 'Đã đăng xuất khỏi tất cả thiết bị.');
  } catch (err) { next(err); }
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    if (result) {
      emailService.sendPasswordResetEmail({ to: email, otp: result.otp }).catch((err) => {
        console.error('[Email] Failed to send password reset email:', err.message);
      });
      console.log(`[Dev Log] Reset OTP for ${email}: ${result.otp}`);
    }
    // Luôn trả về success để không lộ email tồn tại hay không
    success(res, null, 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.');
  } catch (err) { next(err); }
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;
    await authService.resetPassword({ email, code, newPassword });
    success(res, null, 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.');
  } catch (err) { next(err); }
});

// GET /api/v1/auth/me
router.get('/me', authenticate, (req, res) => {
  success(res, req.user);
});

// PUT /api/v1/auth/profile — Cập nhật thông tin cá nhân
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { fullName, phone } = req.body;
    const db = require('../../config/database');
    const ApiError = require('../../shared/utils/ApiError');

    const [updated] = await db('users')
      .where('id', req.user.id)
      .update({
        ...(fullName && { full_name: fullName }),
        ...(phone && { phone }),
        updated_at: new Date(),
      })
      .returning(['id', 'email', 'full_name', 'phone', 'role', 'is_verified']);

    if (!updated) throw ApiError.notFound('USER_NOT_FOUND', 'Người dùng không tồn tại.');
    success(res, updated, 'Cập nhật thông tin thành công.');
  } catch (err) { next(err); }
});

// PUT /api/v1/auth/change-password — Đổi mật khẩu
router.put('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const db = require('../../config/database');
    const bcrypt = require('bcryptjs');
    const ApiError = require('../../shared/utils/ApiError');

    if (!currentPassword || !newPassword) {
      throw ApiError.badRequest('MISSING_FIELDS', 'Vui lòng điền mật khẩu hiện tại và mật khẩu mới.');
    }

    if (newPassword.length < 6) {
      throw ApiError.badRequest('INVALID_PASSWORD', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
    }

    const user = await db('users').where('id', req.user.id).first();
    if (!user) throw ApiError.notFound('USER_NOT_FOUND', 'Người dùng không tồn tại.');

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      throw ApiError.badRequest('WRONG_PASSWORD', 'Mật khẩu hiện tại không chính xác.');
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await db('users').where('id', req.user.id).update({
      password_hash: newHash,
      updated_at: new Date(),
    });

    success(res, null, 'Đổi mật khẩu thành công!');
  } catch (err) { next(err); }
});

module.exports = router;
