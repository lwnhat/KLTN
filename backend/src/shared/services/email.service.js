/**
 * EMAIL SERVICE — Nodemailer
 *
 * Dev mode: Dùng Ethereal (fake SMTP) để xem email mà không cần cấu hình thật
 * Production: Cấu hình SMTP qua .env
 */
const nodemailer = require('nodemailer');

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    // Production: sử dụng cấu hình thật từ .env
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Dev mode: Ethereal fake SMTP (emails xuất hiện ở console)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('📧 Email dev mode — Ethereal account:', testAccount.user);
  }

  return transporter;
}

const FROM = process.env.EMAIL_FROM || '"KLTN Jewelry 💎" <no-reply@kltn-jewelry.vn>';

/**
 * Gửi email xác thực tài khoản (OTP)
 */
async function sendVerificationEmail({ to, fullName, otp }) {
  const t = await getTransporter();
  const info = await t.sendMail({
    from: FROM,
    to,
    subject: 'Xác thực tài khoản KLTN Jewelry',
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff; border: 1px solid #e5e5e5;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 48px; height: 48px; background: #111; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 20px;">K</div>
          <h2 style="font-size: 20px; font-weight: bold; color: #111; margin: 8px 0 0;">KLTN JEWELRY</h2>
        </div>
        <h3 style="color: #111; font-size: 16px;">Chào ${fullName}! 👋</h3>
        <p style="color: #707072; font-size: 14px; line-height: 1.6;">Cảm ơn bạn đã đăng ký tài khoản tại KLTN Jewelry. Nhập mã OTP bên dưới để xác thực email:</p>
        <div style="text-align: center; margin: 28px 0;">
          <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #111; background: #f5f5f5; padding: 16px 32px; display: inline-block; border-radius: 8px;">${otp}</span>
        </div>
        <p style="color: #9e9ea0; font-size: 12px; text-align: center;">Mã có hiệu lực trong <strong>10 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        <p style="color: #9e9ea0; font-size: 11px; text-align: center;">© 2026 KLTN Jewelry. All rights reserved.</p>
      </div>
    `,
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log(`📧 [Verify Email] To: ${to} | Preview: ${nodemailer.getTestMessageUrl(info)}`);
  }
  return info;
}

/**
 * Gửi email xác nhận đơn hàng
 */
async function sendOrderConfirmationEmail({ to, customerName, orderNumber, totalAmount, items, shippingAddress }) {
  const t = await getTransporter();
  const formattedTotal = parseInt(totalAmount).toLocaleString('vi-VN') + 'đ';

  const itemsHtml = (items || []).map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #111; font-size: 13px;">${item.product_name_snapshot} — ${item.variant_name_snapshot}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; text-align: center; color: #707072; font-size: 13px;">x${item.quantity}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; text-align: right; color: #111; font-size: 13px; font-weight: 600;">${parseInt(item.price_snapshot * item.quantity).toLocaleString('vi-VN')}đ</td>
    </tr>
  `).join('');

  const info = await t.sendMail({
    from: FROM,
    to,
    subject: `✅ Xác nhận đơn hàng ${orderNumber} — KLTN Jewelry`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #fff; border: 1px solid #e5e5e5;">
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="width: 48px; height: 48px; background: #111; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 20px; margin-bottom: 8px;">K</div>
          <h2 style="font-size: 20px; font-weight: bold; color: #111; margin: 0;">KLTN JEWELRY</h2>
        </div>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
          <p style="margin: 0; color: #707072; font-size: 13px;">Mã đơn hàng</p>
          <p style="margin: 4px 0 0; color: #111; font-size: 22px; font-weight: bold; letter-spacing: 2px;">${orderNumber}</p>
        </div>
        <h3 style="color: #111; font-size: 15px; margin-bottom: 4px;">Cảm ơn ${customerName}!</h3>
        <p style="color: #707072; font-size: 14px; line-height: 1.6; margin-top: 4px;">Đơn hàng của bạn đã được tiếp nhận và đang xử lý. Chúng tôi sẽ thông báo khi đơn được xác nhận.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          <thead><tr style="background: #111; color: #fff;">
            <th style="padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600;">SẢN PHẨM</th>
            <th style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 600;">SL</th>
            <th style="padding: 10px 12px; text-align: right; font-size: 12px; font-weight: 600;">THÀNH TIỀN</th>
          </tr></thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot><tr>
            <td colspan="2" style="padding: 16px 0; font-weight: bold; color: #111; font-size: 15px;">TỔNG CỘNG</td>
            <td style="padding: 16px 0; text-align: right; font-weight: bold; color: #111; font-size: 15px;">${formattedTotal}</td>
          </tr></tfoot>
        </table>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; font-size: 13px; color: #707072;">
          <strong style="color: #111;">Địa chỉ giao hàng:</strong><br/>
          ${shippingAddress?.street || ''}, ${shippingAddress?.district || ''}, ${shippingAddress?.city || ''}
        </div>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        <p style="color: #9e9ea0; font-size: 11px; text-align: center;">© 2026 KLTN Jewelry — Trang sức kim cương cao cấp chuẩn GIA</p>
      </div>
    `,
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log(`📧 [Order Confirm] To: ${to} | Preview: ${nodemailer.getTestMessageUrl(info)}`);
  }
  return info;
}

/**
 * Gửi email reset password (OTP)
 */
async function sendResetPasswordEmail({ to, otp }) {
  const t = await getTransporter();
  const info = await t.sendMail({
    from: FROM,
    to,
    subject: 'Đặt lại mật khẩu — KLTN Jewelry',
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff; border: 1px solid #e5e5e5;">
        <h2 style="color: #111; font-size: 18px; text-align: center;">Đặt Lại Mật Khẩu</h2>
        <p style="color: #707072; font-size: 14px; line-height: 1.6;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhập mã OTP bên dưới:</p>
        <div style="text-align: center; margin: 28px 0;">
          <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #111; background: #f5f5f5; padding: 16px 32px; display: inline-block; border-radius: 8px;">${otp}</span>
        </div>
        <p style="color: #9e9ea0; font-size: 12px; text-align: center;">Mã có hiệu lực trong <strong>10 phút</strong>. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      </div>
    `,
  });
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📧 [Reset Password] To: ${to} | Preview: ${nodemailer.getTestMessageUrl(info)}`);
  }
  return info;
}

module.exports = { sendVerificationEmail, sendOrderConfirmationEmail, sendResetPasswordEmail };
