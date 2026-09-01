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

  const hasRealSmtp = process.env.SMTP_HOST &&
                      process.env.SMTP_USER &&
                      !process.env.SMTP_USER.includes('your_email') &&
                      process.env.SMTP_PASS &&
                      !process.env.SMTP_PASS.includes('your_app_password');

  if (hasRealSmtp) {
    const isGmail = (process.env.SMTP_HOST || '').includes('gmail');
    transporter = nodemailer.createTransport(
      isGmail
        ? {
            service: 'gmail',
            auth: {
              user: process.env.SMTP_USER?.trim(),
              pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '',
            },
          }
        : {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
            auth: {
              user: process.env.SMTP_USER?.trim(),
              pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '',
            },
          }
    );
  } else {

    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      console.log('📧 Email dev mode — Ethereal account:', testAccount.user);
    } catch (e) {
      transporter = {
        sendMail: async (mailOptions) => {
          console.log(`📧 [VIRTUAL SMTP SENT] To: ${mailOptions.to} | Subject: ${mailOptions.subject}`);
          return { messageId: `virtual-${Date.now()}` };
        },
      };
    }
  }

  return transporter;
}

const FROM = process.env.EMAIL_FROM || '"Daniel Wellington 💎" <orders@danielwellington.vn>';


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
    subject: 'Đặt lại mật khẩu — Daniel Wellington',
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

/**
 * Gửi email xác nhận thanh toán thành công (TikTok Shop / Daniel Wellington style)
 * @param {string} orderIdOrNumber
 * @param {string|null} overrideEmail
 */

async function sendPaymentSuccessEmail(orderIdOrNumber, overrideEmail = null) {
  try {
    const db = require('../../config/database');

    // Tìm order theo UUID id hoặc theo order_number
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let query = db('orders');
    if (UUID_REGEX.test(orderIdOrNumber)) {
      query = query.where('id', orderIdOrNumber);
    } else {
      query = query.where('order_number', orderIdOrNumber);
    }
    const order = await query.first();


    if (!order) {
      console.warn(`[Email] Không tìm thấy đơn hàng ${orderIdOrNumber} để gửi email.`);
      return null;
    }

    // Parse customer snapshot
    let customerSnapshot = order.customer_snapshot;
    if (typeof customerSnapshot === 'string') {
      try { customerSnapshot = JSON.parse(customerSnapshot); } catch {}
    }
    customerSnapshot = customerSnapshot || {};

    const customerEmail = overrideEmail || customerSnapshot.email;
    if (!customerEmail) {
      console.log(`[Email] Đơn hàng ${order.order_number} không có email khách hàng để gửi.`);
      return null;
    }

    // Lấy danh sách sản phẩm trong đơn hàng
    const items = await db('order_items').where('order_id', order.id);

    // Parse shipping address
    let shippingAddress = order.shipping_address;
    if (typeof shippingAddress === 'string') {
      try { shippingAddress = JSON.parse(shippingAddress); } catch {}
    }
    shippingAddress = shippingAddress || {};

    const customerName = customerSnapshot.name || 'Quý khách';
    const customerPhone = customerSnapshot.phone || '';
    const orderNumber = order.order_number;
    const subtotal = Number(order.subtotal || 0);
    const discountAmount = Number(order.discount_amount || 0);
    const shippingFee = Number(order.shipping_fee || 0);
    const totalAmount = Number(order.total_amount || 0);
    const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);

    const addrStr = [
      shippingAddress.streetAddress || shippingAddress.street,
      shippingAddress.ward,
      shippingAddress.district,
      shippingAddress.province || shippingAddress.city,
    ].filter(Boolean).join(', ');

    const orderDateFormatted = new Date(order.created_at || Date.now()).toLocaleString('vi-VN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const itemsHtml = items.map((item) => {
      let customText = '';
      if (item.customization_metadata) {
        let meta = item.customization_metadata;
        if (typeof meta === 'string') {
          try { meta = JSON.parse(meta); } catch {}
        }
        if (meta && meta.text) customText = meta.text;
      }
      const itemPrice = Number(item.price_snapshot || 0);
      const itemQty = Number(item.quantity || 1);
      const imgUrl = item.image_snapshot || 'https://res.cloudinary.com/akmq0b0f/image/upload/v1788240781/mn-jewelry/products/cwqs6ovoy0e1sxft1tgd.png';

      return `
        <div style="display: flex; gap: 14px; padding: 14px 0; border-bottom: 1px solid #f1f5f9; align-items: center;">
          <img src="${imgUrl}" alt="${item.product_name_snapshot}" style="width: 72px; height: 72px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; flex-shrink: 0;" />
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 700; font-size: 13px; color: #0f172a; line-height: 1.4; text-transform: uppercase;">${item.product_name_snapshot}</div>
            <div style="color: #64748b; font-size: 11px; margin-top: 2px;">${item.variant_name_snapshot || 'Tiêu chuẩn'}</div>
            ${customText ? `<div style="color: #b45309; font-size: 11px; font-weight: 600; margin-top: 2px;">✨ Khắc Laser: "${customText}"</div>` : ''}
            <div style="margin-top: 6px; display: flex; justify-content: space-between; align-items: baseline;">
              <span style="font-weight: 700; font-size: 13px; color: #0f172a;">${itemPrice.toLocaleString('vi-VN')}₫</span>
              <span style="color: #64748b; font-size: 12px; font-weight: 600;">× ${itemQty}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đơn hàng đã thanh toán thành công — Daniel Wellington</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <div style="max-width: 520px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
    
    <!-- 1. Header Banner -->
    <div style="background-color: #000000; padding: 20px 16px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 14px; letter-spacing: 3px; font-weight: 800; text-transform: uppercase; white-space: nowrap; line-height: 1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        DANIEL WELLINGTON
      </h1>
    </div>


    <!-- 2. Sub Navigation Bar -->
    <div style="background-color: #f8fafc; padding: 10px 24px; text-align: center; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 600;">
      <a href="https://kltn-ashy.vercel.app/account/orders" style="color: #334155; text-decoration: none; padding: 0 14px;">Đơn hàng</a>
      <span style="color: #cbd5e1;">|</span>
      <a href="https://kltn-ashy.vercel.app/cart" style="color: #334155; text-decoration: none; padding: 0 14px;">Giỏ hàng</a>
    </div>

    <!-- 3. Headline & Greeting -->
    <div style="padding: 28px 24px 16px 24px;">
      <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.3;">
        Đơn hàng đã thanh toán thành công
      </h2>
      <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #334155;">
        Xin chào ${customerName}!
      </p>
      <p style="margin: 0 0 20px 0; font-size: 13px; color: #64748b; line-height: 1.6;">
        Đơn hàng của bạn đã được thanh toán thành công và đang được chuẩn bị đóng gói xuất kho. Bạn có thể theo dõi chi tiết đơn hàng theo liên kết bên dưới.
      </p>

      <!-- 4. Big CTA Button -->
      <a href="https://kltn-ashy.vercel.app/checkout/success?order=${orderNumber}" style="display: block; width: 100%; box-sizing: border-box; background-color: #fe2c55; color: #ffffff; text-align: center; padding: 14px 20px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none; box-shadow: 0 4px 12px rgba(254, 44, 85, 0.25);">
        Xem chi tiết thông tin đơn hàng →
      </a>
    </div>

    <!-- Divider -->
    <div style="height: 8px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;"></div>

    <!-- 5. Product Items -->
    <div style="padding: 20px 24px;">
      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #64748b; margin-bottom: 10px;">
        — DANIEL WELLINGTON
      </div>
      
      ${itemsHtml}

      <!-- Order ID & Date -->
      <div style="padding-top: 14px; font-size: 12px; color: #64748b; line-height: 1.8;">
        <div style="display: flex; justify-content: space-between;">
          <span>ID đơn hàng:</span>
          <span style="font-family: monospace; font-weight: 700; color: #0f172a;">${orderNumber}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Ngày đặt hàng:</span>
          <span style="color: #334155; font-weight: 500;">${orderDateFormatted}</span>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div style="height: 8px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;"></div>

    <!-- 6. Tóm tắt kiện hàng (Billing Summary) -->
    <div style="padding: 20px 24px;">
      <h3 style="margin: 0 0 14px 0; font-size: 14px; font-weight: 800; text-transform: uppercase; color: #0f172a;">
        Tóm tắt kiện hàng
      </h3>
      
      <div style="font-size: 13px; color: #475569; line-height: 2;">
        <div style="display: flex; justify-content: space-between;">
          <span>Tổng phụ:</span>
          <span style="font-weight: 600; color: #0f172a;">${subtotal.toLocaleString('vi-VN')}₫</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Vận chuyển:</span>
          <span style="color: #16a34a; font-weight: 600;">Miễn phí</span>
        </div>
        ${discountAmount > 0 ? `
        <div style="display: flex; justify-content: space-between; color: #16a34a;">
          <span>Phiếu giảm giá:</span>
          <span style="font-weight: 600;">-${discountAmount.toLocaleString('vi-VN')}₫</span>
        </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; padding-top: 10px; margin-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 15px;">
          <span style="font-weight: 800; color: #0f172a;">Tổng (${totalQuantity} mặt hàng):</span>
          <span style="font-weight: 800; color: #e11d48; font-size: 16px;">${totalAmount.toLocaleString('vi-VN')}₫</span>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div style="height: 8px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;"></div>

    <!-- 7. Địa chỉ nhận hàng (Shipping Address) -->
    <div style="padding: 20px 24px;">
      <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 800; text-transform: uppercase; color: #0f172a;">
        Địa chỉ nhận hàng
      </h3>
      <div style="font-size: 13px; color: #334155; line-height: 1.6;">
        <div style="font-weight: 700; color: #0f172a;">${customerName}</div>
        <div style="color: #64748b; margin-top: 2px;">(+84) ${customerPhone}</div>
        <div style="color: #475569; margin-top: 4px;">${addrStr || 'Địa chỉ tiêu chuẩn'}</div>
      </div>
    </div>

    <!-- 8. Hỗ trợ khách hàng -->
    <div style="padding: 18px 24px; background-color: #fafaf9; border-top: 1px solid #f1f5f9;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 13px; font-weight: 700; color: #0f172a;">Bạn gặp vấn đề?</span>
        <a href="https://kltn-ashy.vercel.app/faq" style="font-size: 12px; color: #64748b; text-decoration: none;">Xem tất cả vấn đề &rsaquo;</a>
      </div>
      <div style="margin-top: 12px;">
        <a href="https://kltn-ashy.vercel.app/warranty" style="display: block; width: 100%; box-sizing: border-box; background-color: #ffffff; color: #0f172a; text-align: center; padding: 10px 16px; border-radius: 6px; font-weight: 600; font-size: 13px; text-decoration: none; border: 1px solid #d1d5db;">
          Truy cập Trung tâm trợ giúp & Bảo hành
        </a>
      </div>
    </div>

    <!-- 9. Footer Legal -->
    <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.6;">
      <p style="margin: 0 0 8px 0;">
        Tin nhắn này được gửi tự động tới <strong style="color: #475569;">${customerEmail}</strong> để xác nhận giao dịch thanh toán thành công tại Daniel Wellington.
      </p>
      <div style="margin: 12px 0;">
        <a href="https://kltn-ashy.vercel.app/terms" style="color: #64748b; text-decoration: underline; margin: 0 6px;">Chính sách bảo mật</a>
        &bull;
        <a href="https://kltn-ashy.vercel.app/terms" style="color: #64748b; text-decoration: underline; margin: 0 6px;">Điều khoản bán hàng</a>
      </div>
      <p style="margin: 8px 0 16px 0; color: #94a3b8;">
        Vui lòng không trả lời tin nhắn này vì hộp thư không tiếp nhận thư phản hồi.
      </p>
      <div style="font-weight: 800; letter-spacing: 0.2em; color: #0f172a; font-size: 12px; text-transform: uppercase;">
        DANIEL WELLINGTON
      </div>
    </div>

  </div>
</body>
</html>
    `;

    const t = await getTransporter();
    const mailOptions = {
      from: FROM,
      to: customerEmail,
      subject: `🎉 [DANIEL WELLINGTON] Đơn hàng #${orderNumber} đã thanh toán thành công!`,
      html: htmlContent,
    };

    const info = await t.sendMail(mailOptions);
    console.log(`📧 [Payment Success Email Sent] Order: ${orderNumber} | To: ${customerEmail} | ID: ${info.messageId}`);
    if (info && nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log(`🔗 [Email Preview URL]: ${previewUrl}`);
    }
    return info;
  } catch (err) {
    console.error(`[Email Service Error] Failed to send payment success email for order ${orderIdOrNumber}:`, err);
    throw err;
  }
}

module.exports = {
  sendVerificationEmail,
  sendOrderConfirmationEmail,
  sendResetPasswordEmail,
  sendPaymentSuccessEmail,
};

