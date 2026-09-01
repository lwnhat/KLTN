const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const { redis } = require('../../config/redis');
const ApiError = require('../../shared/utils/ApiError');
const emailService = require('../../shared/services/email.service');

const ACCESS_TOKEN_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';
const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày

// ─── Token Helpers ───────────────────────────────────────────────────────────

function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, jti: uuidv4() },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );
}

async function generateRefreshToken(userId, deviceInfo = {}) {
  const rawToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = await bcrypt.hash(rawToken, 8);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS);

  await db('refresh_tokens').insert({
    user_id: userId,
    token_hash: tokenHash,
    device_info: JSON.stringify(deviceInfo),
    expires_at: expiresAt,
  });

  return rawToken;
}

// ─── Auth Services ───────────────────────────────────────────────────────────

async function register({ email, password, fullName, phone }) {
  const existing = await db('users').where({ email }).first();
  if (existing) {
    throw ApiError.conflict('EMAIL_EXISTS', 'Email này đã được sử dụng.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const [user] = await db('users')
    .insert({ email, password_hash: passwordHash, full_name: fullName, phone: phone || null })
    .returning(['id', 'email', 'full_name', 'phone', 'role', 'is_verified']);


  // Lưu OTP (hết hạn sau 10 phút)
  await db('otp_codes').insert({
    user_id: user.id,
    email,
    code: otp,
    purpose: 'email_verify',
    expires_at: new Date(Date.now() + 10 * 60 * 1000),
  });

  // Gửi OTP qua email (bất đồng bộ — không block response)
  emailService.sendVerificationEmail({ to: email, fullName, otp }).catch(err =>
    console.error('[Email] sendVerificationEmail failed:', err.message)
  );

  return { user, otp }; // otp vẫn trả về cho dev debug
}

async function verifyEmail({ email, code }) {
  const otp = await db('otp_codes')
    .where({ email, code, purpose: 'email_verify' })
    .whereNull('used_at')
    .where('expires_at', '>', new Date())
    .first();

  if (!otp) {
    throw ApiError.badRequest('INVALID_OTP', 'Mã OTP không hợp lệ hoặc đã hết hạn.');
  }

  await db.transaction(async (trx) => {
    await trx('users').where({ email }).update({ is_verified: true });
    await trx('otp_codes').where({ id: otp.id }).update({ used_at: new Date() });
  });

  return { success: true };
}

async function login({ email, password, deviceInfo }) {
  // Rate limiting check (backup — Redis middleware handles first)
  const user = await db('users')
    .where({ email, is_active: true })
    .whereNull('deleted_at')
    .first();

  if (!user || !user.password_hash) {
    throw ApiError.unauthorized('Sai email hoặc mật khẩu.');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw ApiError.unauthorized('Sai email hoặc mật khẩu.');
  }

  // Cập nhật last_login
  await db('users').where({ id: user.id }).update({ last_login_at: new Date() });

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id, deviceInfo);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone || '',
      role: user.role,
      isVerified: user.is_verified,
    },
  };

}

async function refreshAccessToken(rawRefreshToken, deviceInfo = {}) {
  if (!rawRefreshToken) throw ApiError.unauthorized('Refresh token bị thiếu.');

  // Tìm trong tất cả refresh_tokens (kể cả đã bị thu hồi để phát hiện Token Reuse)
  const allTokens = await db('refresh_tokens')
    .join('users', 'refresh_tokens.user_id', 'users.id')
    .where('refresh_tokens.expires_at', '>', new Date())
    .where('users.is_active', true)
    .select('refresh_tokens.*', 'users.id as uid', 'users.email', 'users.role', 'users.full_name');

  let matchedToken = null;
  for (const token of allTokens) {
    if (await bcrypt.compare(rawRefreshToken, token.token_hash)) {
      matchedToken = token;
      break;
    }
  }

  if (!matchedToken) {
    throw ApiError.unauthorized('Refresh token không hợp lệ hoặc đã hết hạn.');
  }

  // ★ PHÁT HIỆN TẤN CÔNG TOKEN REUSE (Cố tình dùng lại Refresh Token đã bị thu hồi)
  if (matchedToken.revoked_at) {
    // Vô hiệu hóa toàn bộ session của user này ngay lập tức!
    await logoutAll(matchedToken.uid);
    throw ApiError.unauthorized('Phát hiện dấu hiệu chiếm quyền phiên đăng nhập (Token Reuse). Toàn bộ phiên làm việc đã bị hủy để bảo vệ tài khoản.');
  }

  // Thu hồi token cũ (Refresh Token Rotation)
  await db('refresh_tokens').where({ id: matchedToken.id }).update({ revoked_at: new Date() });

  // Cấp Refresh Token mới (RTR Pattern)
  const newRefreshToken = await generateRefreshToken(matchedToken.uid, deviceInfo);

  const user = { id: matchedToken.uid, email: matchedToken.email, role: matchedToken.role, fullName: matchedToken.full_name };
  const newAccessToken = generateAccessToken(user);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user,
  };
}

async function logout(userId, refreshToken) {
  if (refreshToken) {
    const tokens = await db('refresh_tokens').where({ user_id: userId }).whereNull('revoked_at');
    for (const token of tokens) {
      if (await bcrypt.compare(refreshToken, token.token_hash)) {
        await db('refresh_tokens').where({ id: token.id }).update({ revoked_at: new Date() });
        break;
      }
    }
  }
}

async function logoutAll(userId) {
  // Thu hồi tất cả refresh tokens
  await db('refresh_tokens').where({ user_id: userId }).whereNull('revoked_at').update({ revoked_at: new Date() });
  // Blacklist trong Redis 15 phút (= thời gian access token còn sống)
  await redis.setex(`blacklist:user:${userId}`, 900, '1');
}

async function forgotPassword(email) {
  const user = await db('users').where({ email }).first();
  if (!user) return; // Không lộ thông tin user tồn tại hay không

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await db('otp_codes').insert({
    user_id: user.id,
    email,
    code: otp,
    purpose: 'reset_password',
    expires_at: new Date(Date.now() + 10 * 60 * 1000),
  });

  // Gửi OTP qua email (bất đồng bộ)
  emailService.sendResetPasswordEmail({ to: email, otp }).catch(err =>
    console.error('[Email] sendResetPasswordEmail failed:', err.message)
  );

  return { otp, userId: user.id }; // otp vẫn trả về cho dev
}

async function resetPassword({ email, code, newPassword }) {
  const otp = await db('otp_codes')
    .where({ email, code, purpose: 'reset_password' })
    .whereNull('used_at')
    .where('expires_at', '>', new Date())
    .first();

  if (!otp) throw ApiError.badRequest('INVALID_OTP', 'Mã OTP không hợp lệ hoặc đã hết hạn.');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.transaction(async (trx) => {
    await trx('users').where({ email }).update({ password_hash: passwordHash });
    await trx('otp_codes').where({ id: otp.id }).update({ used_at: new Date() });
    // Thu hồi tất cả refresh tokens (force re-login)
    await trx('refresh_tokens').where({ user_id: otp.user_id }).update({ revoked_at: new Date() });
  });
}

module.exports = { register, verifyEmail, login, refreshAccessToken, logout, logoutAll, forgotPassword, resetPassword, generateAccessToken };
