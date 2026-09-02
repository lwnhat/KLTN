const db = require('../../config/database');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

// ─── HELPER: Chuẩn hóa số điện thoại VN ─────────────────────────────────────
function normalizePhone(raw) {
  return raw.replace(/[\s.\-+()\u00a0]/g, '').replace(/^84/, '0');
}

// ─── HELPER: Regex nhận diện SĐT VN ─────────────────────────────────────────
const PHONE_REGEX = /(?:\+?84|0)[1-9]\d{8,9}/;

// ─── HELPER: Status maps ─────────────────────────────────────────────────────
const ORDER_STATUS_MAP = {
  pending: 'Chờ thanh toán / xác nhận',
  processing: 'Đang gia công chế tác & chuẩn bị hàng',
  shipped: 'Đang vận chuyển giao hàng hỏa tốc',
  delivered: 'Đã giao hàng thành công ✅',
  cancelled: 'Đã hủy đơn hàng ❌',
};

/**
 * Lấy tóm tắt danh mục sản phẩm từ DB
 */
async function getProductCatalogSummary() {
  try {
    const products = await db('products as p')
      .join('categories as c', 'p.category_id', 'c.id')
      .where('p.status', 'active')
      .whereNull('p.deleted_at')
      .select('p.name', 'p.slug', 'p.base_price', 'c.name as category_name')
      .limit(30);

    if (!products.length)
      return 'Hiện có bộ sưu tập Nhẫn kim cương, Dây chuyền Elan, Vòng tay Classic, Bông tai Lumine.';

    return products
      .map(
        (p) =>
          `• [${p.name}](/products/${p.slug}) — ${p.category_name} — từ **${Number(p.base_price).toLocaleString('vi-VN')}₫**`
      )
      .join('\n');
  } catch (error) {
    console.error('[ChatService] Error fetching products:', error.message);
    return 'Bộ sưu tập nhẫn kim cương, dây chuyền, vòng tay, bông tai cao cấp Daniel Wellington.';
  }
}

/**
 * Tra cứu đơn hàng theo mã ORD-/TJ- hoặc số điện thoại
 */
async function lookupOrders(userMessage) {
  // 1. Ưu tiên tra theo mã đơn hàng
  const orderCodeMatch = userMessage.match(/(?:ORD|TJ)-[\w-]+/i);
  if (orderCodeMatch) {
    const orderNumber = orderCodeMatch[0].toUpperCase();
    const order = await db('orders')
      .whereRaw('UPPER(order_number) LIKE ?', [`%${orderNumber}%`])
      .first();

    if (!order) {
      return `\n[THÔNG BÁO HỆ THỐNG]: Không tìm thấy đơn hàng **${orderCodeMatch[0]}** trong cơ sở dữ liệu. Hãy thông báo lịch sự và đề nghị khách kiểm tra lại mã đơn.\n`;
    }

    const items = await db('order_items').where({ order_id: order.id }).select('product_name_snapshot', 'quantity', 'final_price');
    const cust =
      typeof order.customer_snapshot === 'string'
        ? JSON.parse(order.customer_snapshot)
        : order.customer_snapshot;

    const itemList = items.map((i) => `  • ${i.product_name_snapshot} × ${i.quantity} — ${Number(i.final_price).toLocaleString('vi-VN')}₫`).join('\n');

    return `
[DỮ LIỆU ĐƠN HÀNG THẬT TỪ HỆ THỐNG — ĐỌC KỸ VÀ TRẢ LỜI ĐÚNG THEO]:
- Mã đơn hàng: **${order.order_number}**
- Tên khách: ${cust?.name || 'Không rõ'} | SĐT: ${cust?.phone || 'N/A'}
- Trạng thái: **${ORDER_STATUS_MAP[order.status] || order.status}**
- Thanh toán: **${order.payment_status === 'paid' ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}** (${order.payment_method?.toUpperCase()})
- Tổng giá trị: **${Number(order.total_amount).toLocaleString('vi-VN')}₫**
- Ngày đặt: ${new Date(order.created_at).toLocaleDateString('vi-VN')}
- Sản phẩm:
${itemList}
→ Link chi tiết: [Xem đơn hàng ${order.order_number}](/account/orders/${order.order_number})
[LƯU Ý: Chỉ dùng thông tin trên, KHÔNG bịa thêm bất kỳ thông tin nào khác]\n`;
  }

  // 2. Tra theo SĐT
  const phoneMatch = userMessage.match(PHONE_REGEX);
  if (phoneMatch) {
    const phone = normalizePhone(phoneMatch[0]);
    if (phone.length >= 10) {
      const orders = await db('orders')
        .whereRaw("customer_snapshot->>'phone' LIKE ?", [`%${phone}%`])
        .select('id', 'order_number', 'status', 'total_amount', 'payment_status', 'created_at')
        .orderBy('created_at', 'desc')
        .limit(5);

      if (!orders.length) {
        return `\n[THÔNG BÁO HỆ THỐNG]: Không tìm thấy đơn hàng nào với SĐT **${phone}**. Thông báo lịch sự và gợi ý khách cung cấp mã đơn ORD-... nếu có.\n`;
      }

      const list = orders
        .map(
          (o, i) =>
            `${i + 1}. [${o.order_number}](/account/orders/${o.order_number}) — ${ORDER_STATUS_MAP[o.status] || o.status} — **${Number(o.total_amount).toLocaleString('vi-VN')}₫** — ${new Date(o.created_at).toLocaleDateString('vi-VN')}`
        )
        .join('\n');

      return `\n[DỮ LIỆU TRA CỨU ĐƠN HÀNG THEO SĐT ${phone}]:\nTìm thấy **${orders.length} đơn hàng** gần nhất:\n${list}\n→ Trình bày danh sách và mời Quý khách bấm mã đơn để xem chi tiết.\n`;
    }
  }

  return '';
}

/**
 * Tra cứu bảo hành theo mã WR- hoặc số điện thoại
 */
async function lookupWarranties(userMessage) {
  // 1. Tra theo mã WR-...
  const wrMatch = userMessage.match(/WR-[\w-]+/i);
  if (wrMatch) {
    const code = wrMatch[0].toUpperCase();
    const w = await db('warranties')
      .whereRaw('UPPER(warranty_code) LIKE ?', [`%${code}%`])
      .first();

    if (!w) {
      return `\n[THÔNG BÁO HỆ THỐNG]: Không tìm thấy phiếu bảo hành **${wrMatch[0]}**. Đề nghị khách kiểm tra lại mã hoặc liên hệ hotline.\n`;
    }

    return buildWarrantyContext([w]);
  }

  // 2. Tra theo SĐT (chỉ khi không có mã ORD/TJ trong cùng tin nhắn)
  const hasOrderCode = /(?:ORD|TJ)-[\w-]+/i.test(userMessage);
  if (hasOrderCode) return '';

  const phoneMatch = userMessage.match(PHONE_REGEX);
  if (phoneMatch) {
    const phone = normalizePhone(phoneMatch[0]);
    if (phone.length >= 10) {
      const warranties = await db('warranties')
        .where('customer_phone', 'like', `%${phone}%`)
        .select(
          'warranty_code', 'customer_name', 'customer_phone', 'status',
          'purchase_date', 'warranty_terms', 'notes', 'created_at'
        )
        .orderBy('created_at', 'desc')
        .limit(5);

      if (!warranties.length) {
        return `\n[THÔNG BÁO HỆ THỐNG]: Không tìm thấy phiếu bảo hành nào với SĐT **${phone}**. Thông báo lịch sự và gợi ý kiểm tra lại số hoặc cung cấp mã WR-...\n`;
      }

      return buildWarrantyContext(warranties, phone);
    }
  }

  return '';
}

/**
 * Xây dựng context text cho danh sách phiếu bảo hành
 */
function buildWarrantyContext(warranties, phone = null) {
  const formatWarranty = (w, idx = null) => {
    const terms = typeof w.warranty_terms === 'string' ? JSON.parse(w.warranty_terms) : w.warranty_terms;
    const periodMonths = terms?.period_months || 12;
    const purchaseDate = new Date(w.purchase_date || w.created_at);
    const expiryDate = new Date(purchaseDate);
    expiryDate.setMonth(expiryDate.getMonth() + periodMonths);
    const isActive = w.status === 'active' && expiryDate > new Date();
    const covers = Array.isArray(terms?.covers) ? terms.covers.join(', ') : 'Đánh bóng, Làm mới, Gắn đá phụ, Chỉnh size nhẫn 2 lần';

    const prefix = idx !== null ? `${idx + 1}. ` : '';
    return `${prefix}**${w.warranty_code}** — Chủ sở hữu: ${w.customer_name || 'N/A'}
   - Trạng thái: **${isActive ? '✅ Đang có hiệu lực' : '❌ Đã hết hạn'}**
   - Hạn bảo hành: **${expiryDate.toLocaleDateString('vi-VN')}** (${periodMonths} tháng từ ngày mua)
   - Ngày mua: ${purchaseDate.toLocaleDateString('vi-VN')}
   - Dịch vụ được bảo hành: ${covers}
   - Tra cứu & yêu cầu bảo hành: [Tra cứu bảo hành](/warranty)`;
  };

  if (warranties.length === 1) {
    return `\n[DỮ LIỆU BẢO HÀNH THẬT TỪ HỆ THỐNG]:\n${formatWarranty(warranties[0])}\n[Chỉ dùng thông tin trên, KHÔNG bịa thêm]\n`;
  }

  const label = phone ? `THEO SĐT ${phone}` : 'TRA CỨU';
  const list = warranties.map((w, i) => formatWarranty(w, i)).join('\n\n');
  return `\n[DỮ LIỆU BẢO HÀNH ${label}]:\nTìm thấy **${warranties.length} phiếu bảo hành**:\n\n${list}\n→ Trình bày chi tiết và mời Quý khách bấm link tra cứu.\n`;
}

/**
 * Phân tích ý định tra cứu — có chứa từ khóa tra cứu không?
 */
function detectLookupIntent(msg) {
  const lower = msg.toLowerCase();
  const orderKeywords = ['đơn hàng', 'mã đơn', 'ord-', 'tj-', 'đơn của tôi', 'kiểm tra đơn', 'tra đơn', 'tình trạng đơn', 'giao hàng chưa'];
  const warrantyKeywords = ['bảo hành', 'phiếu bảo hành', 'wr-', 'mã bảo hành', 'hết hạn bảo hành', 'tra bảo hành'];
  const phonePresent = PHONE_REGEX.test(msg);

  const hasOrder = orderKeywords.some((kw) => lower.includes(kw)) || /(?:ORD|TJ)-[\w-]+/i.test(msg);
  const hasWarranty = warrantyKeywords.some((kw) => lower.includes(kw)) || /WR-[\w-]+/i.test(msg);

  return { hasOrder, hasWarranty, phonePresent };
}

/**
 * Hàm tổng hợp: Tra cứu thông tin thực tế từ DB theo nội dung tin nhắn
 */
async function lookupRealTimeContext(userMessage) {
  let context = '';
  try {
    const intent = detectLookupIntent(userMessage);

    // Tra đơn hàng nếu có ý định
    if (intent.hasOrder || (intent.phonePresent && !intent.hasWarranty)) {
      const orderCtx = await lookupOrders(userMessage);
      context += orderCtx;
    }

    // Tra bảo hành nếu có ý định (hoặc có SĐT + từ khóa bảo hành)
    if (intent.hasWarranty || (intent.phonePresent && !intent.hasOrder)) {
      const warrantyCtx = await lookupWarranties(userMessage);
      context += warrantyCtx;
    }
  } catch (err) {
    console.error('[ChatService] lookupRealTimeContext error:', err.message);
  }
  return context;
}

/**
 * Xử lý trò chuyện với Google Gemini API
 */
async function generateChatResponse(userMessage, history = []) {
  if (!GEMINI_API_KEY) {
    return 'Dạ Daniel Wellington xin chào Quý khách! Hệ thống trợ lý AI đang được nâng cấp. Quý khách vui lòng liên hệ hotline **093 202 9606** hoặc ghé [Showroom gần nhất](/stores) ạ!';
  }

  // Chạy song song catalog + lookup để giảm latency
  const [catalogText, realTimeDataContext] = await Promise.all([
    getProductCatalogSummary(),
    lookupRealTimeContext(userMessage),
  ]);

  const systemInstruction = `
Bạn là "Trợ Lý Kim Hoàn AI" (Luxury Concierge) độc quyền của thương hiệu trang sức & đồng hồ cao cấp Daniel Wellington.

═══ PHONG CÁCH & THÁI ĐỘ ═══
- Lịch sự, nhã nhặn, sang trọng, tinh tế chuẩn phong cách Bắc Âu.
- Xưng "em" và gọi khách hàng là "Quý khách" hoặc "anh/chị".
- Trả lời ngắn gọn, súc tích, dùng markdown: gạch đầu dòng, **in đậm**, emoji trang nhã (💍 ✨ 💎 🛡️ 📏 🚚 📞).
- KHÔNG bịa thêm thông tin. Nếu không biết → thừa nhận lịch sự và hướng dẫn liên hệ hotline.

═══ KIẾN THỨC NGHIỆP VỤ ═══
1. **Chất liệu**: Thép 316L chuẩn y tế, mạ vàng 18K PVD chân không, đá Cubic Zirconia & kim cương nhân tạo Thụy Sĩ.
2. **Khắc laser**: Miễn phí 100%, 4 font (Script/Classic/Modern/Bold), tối đa 30 ký tự, hoàn thiện 24-48 giờ.
3. **Bảo hành**: 12 tháng điện tử mã WR-..., miễn phí chỉnh size nhẫn 2 lần, đánh bóng siêu âm trọn đời.
4. **Giao hàng**: Hỏa tốc 2H tại TP.HCM & Hà Nội. Miễn ship cho đơn ≥ 5.000.000₫. Đồng kiểm khi nhận.
5. **Showroom**: 123 Lê Lợi, Q.1, TP.HCM | 24 Tràng Tiền, Hoàn Kiếm, Hà Nội. Mở cửa 09:00–21:30 hàng ngày.
6. **Hotline**: 📞 [093 202 9606](tel:0932029606) (hỗ trợ 9h–22h).
7. **Thanh toán**: VietQR, VNPay, MoMo, COD.

═══ QUY TẮC CHÈN LINK ═══
- Nhắc sản phẩm → Link dạng [Tên](/products/slug)
- Hỏi đo size → [Hướng dẫn đo size nhẫn](/guide/size)
- Hỏi bảo hành → [Tra cứu bảo hành điện tử](/warranty)
- Hỏi địa chỉ/showroom → [Xem bản đồ Showroom](/stores)
- Xem tất cả sản phẩm → [Bộ sưu tập trang sức](/products)
- Hỏi khắc chữ → [Dịch vụ khắc laser](/guide/engraving)
- Hỏi chính sách → [Chính sách vận chuyển](/shipping) | [Điều khoản](/terms) | [Bảo mật](/privacy)
${realTimeDataContext ? `\n═══ DỮ LIỆU THỰC TẾ TỪ HỆ THỐNG ═══${realTimeDataContext}` : ''}
═══ SẢN PHẨM HIỆN CÓ ═══
${catalogText}
`;

  const contents = [];
  contents.push({
    role: 'user',
    parts: [{ text: `[SYSTEM INSTRUCTIONS]:\n${systemInstruction}` }],
  });
  contents.push({
    role: 'model',
    parts: [{ text: 'Dạ Daniel Wellington xin kính chào! Em là Trợ Lý Kim Hoàn AI, sẵn sàng tư vấn và hỗ trợ Quý khách 💎' }],
  });

  const recentHistory = (history || []).slice(-8);
  for (const item of recentHistory) {
    if (item.role === 'user' || item.role === 'model') {
      contents.push({ role: item.role, parts: [{ text: item.text || '' }] });
    }
  }

  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.65,
        maxOutputTokens: 900,
        topP: 0.92,
      },
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    'Xin lỗi Quý khách, em gặp gián đoạn tạm thời. Vui lòng gọi **📞 093 202 9606** để được hỗ trợ ngay ạ!'
  );
}

module.exports = { generateChatResponse };
