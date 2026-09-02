const db = require('../../config/database');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

/**
 * Lấy tóm tắt danh mục sản phẩm từ DB để AI nắm thông tin thực tế
 */
async function getProductCatalogSummary() {
  try {
    const products = await db('products as p')
      .join('categories as c', 'p.category_id', 'c.id')
      .where('p.status', 'active')
      .whereNull('p.deleted_at')
      .select('p.name', 'p.slug', 'p.base_price', 'c.name as category_name')
      .limit(30);

    if (!products.length) return 'Hiện có bộ sưu tập Nhẫn kim cương, Dây chuyền Elan, Vòng tay Classic, Bông tai Lumine.';

    return products
      .map(
        (p) =>
          `• [${p.name}](/products/${p.slug}) - Danh mục: ${p.category_name} - Giá từ: ${Number(
            p.base_price
          ).toLocaleString('vi-VN')}₫`
      )
      .join('\n');
  } catch (error) {
    console.error('[ChatService] Error fetching products:', error.message);
    return 'Bộ sưu tập nhẫn kim cương, dây chuyền, vòng tay, bông tai cao cấp Daniel Wellington.';
  }
}

/**
 * Tra cứu đơn hàng/bảo hành theo mã ORD-, WR-, hoặc số điện thoại
 */
async function lookupOrderOrWarrantyContext(userMessage) {
  let contextInfo = '';
  try {
    const statusMap = {
      pending: 'Chờ thanh toán / xác nhận',
      processing: 'Đang gia công chế tác & chuẩn bị hàng',
      shipped: 'Đang vận chuyển giao hàng hỏa tốc',
      delivered: 'Đã giao hàng thành công',
      cancelled: 'Đã hủy đơn hàng',
    };

    // 1. Tra cứu theo mã đơn hàng ORD-...
    const orderMatch = userMessage.match(/ORD-[\w-]+/i) || userMessage.match(/TJ-[\w-]+/i);
    if (orderMatch) {
      const orderNumber = orderMatch[0].toUpperCase();
      const order = await db('orders')
        .whereRaw("UPPER(order_number) LIKE ?", [`%${orderNumber}%`])
        .first();
      if (order) {
        const items = await db('order_items').where({ order_id: order.id });
        const cust = typeof order.customer_snapshot === 'string' ? JSON.parse(order.customer_snapshot) : order.customer_snapshot;
        contextInfo += `\n[DỮ LIỆU ĐƠN HÀNG THẬT TỪ HỆ THỐNG]:
- Mã đơn hàng: **${order.order_number}**
- Tên khách hàng: ${cust?.name || 'Không rõ'}
- Trạng thái: **${statusMap[order.status] || order.status}**
- Tổng giá trị: **${Number(order.total_amount).toLocaleString('vi-VN')}₫**
- Thanh toán: **${order.payment_status === 'paid' ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}**
- Số sản phẩm: ${items.length} món
- Phương thức: ${order.payment_method?.toUpperCase()}
- Ngày đặt: ${new Date(order.created_at).toLocaleDateString('vi-VN')}
→ Đính kèm link: [Xem chi tiết đơn hàng](/account/orders/${order.order_number})
Hãy trả lời dựa trên thông tin thật trên và đừng bịa thêm thông tin nào khác.\n`;
      } else {
        contextInfo += `\n[THÔNG BÁO HỆ THỐNG]: Không tìm thấy đơn hàng ${orderMatch[0]} trong cơ sở dữ liệu. Hãy thông báo cho Quý khách và đề nghị kiểm tra lại mã đơn.\n`;
      }
    }

    // 2. Tra cứu theo số điện thoại (VN: 10 chữ số, bắt đầu bằng 0 hoặc +84)
    const phoneMatch = userMessage.match(/(?:0|\+?84)[\d\s.-]{8,11}(?!\d)/);
    if (phoneMatch && !orderMatch) {
      const rawPhone = phoneMatch[0].replace(/[\s.\-+]/g, '').replace(/^84/, '0');
      if (rawPhone.length >= 10) {
        const orders = await db('orders')
          .whereRaw("customer_snapshot->>'phone' LIKE ?", [`%${rawPhone}%`])
          .select('id', 'order_number', 'status', 'total_amount', 'payment_status', 'created_at', 'payment_method')
          .orderBy('created_at', 'desc')
          .limit(5);

        if (orders.length > 0) {
          const orderList = orders
            .map(
              (o, idx) =>
                `${idx + 1}. [${o.order_number}](/account/orders/${o.order_number}) — ${statusMap[o.status] || o.status} — **${Number(o.total_amount).toLocaleString('vi-VN')}₫** — ${new Date(o.created_at).toLocaleDateString('vi-VN')}`
            )
            .join('\n');

          contextInfo += `\n[DỮ LIỆU TRA CỨU ĐƠN HÀNG THEO SĐT ${rawPhone}]:
Tìm thấy **${orders.length} đơn hàng** gần nhất:
${orderList}
→ Hãy trình bày danh sách trên và mời Quý khách bấm vào mã đơn để xem chi tiết. Đừng bịa thêm thông tin nào khác.\n`;
        } else {
          contextInfo += `\n[THÔNG BÁO HỆ THỐNG]: Không tìm thấy đơn hàng nào với số điện thoại ${rawPhone}. Hãy thông báo lịch sự và đề nghị kiểm tra lại số hoặc cung cấp mã đơn hàng ORD-...\n`;
        }
      }
    }

    // 3. Tra cứu theo mã bảo hành WR-...
    const warrantyMatch = userMessage.match(/WR-[\w-]+/i);
    if (warrantyMatch) {
      const warrantyCode = warrantyMatch[0].toUpperCase();
      const warranty = await db('warranties')
        .whereRaw("UPPER(warranty_code) LIKE ?", [`%${warrantyCode}%`])
        .first();
      if (warranty) {
        contextInfo += `\n[DỮ LIỆU BẢO HÀNH THẬT TỪ HỆ THỐNG]:
- Mã bảo hành: **${warranty.warranty_code}**
- Trạng thái: **${warranty.status === 'active' ? '✅ Đang có hiệu lực' : '❌ Đã hết hạn'}**
- Hạn bảo hành: **${new Date(warranty.end_date).toLocaleDateString('vi-VN')}**
- Số lần chỉnh size miễn phí còn lại: **${warranty.resizing_count_left ?? 2} lần**
→ Link: [Tra cứu bảo hành chi tiết](/warranty)\n`;
      } else {
        contextInfo += `\n[THÔNG BÁO HỆ THỐNG]: Không tìm thấy phiếu bảo hành ${warrantyMatch[0]}. Hãy thông báo và đề nghị Quý khách kiểm tra lại mã.\n`;
      }
    }
  } catch (err) {
    console.error('[ChatService] Lookup error:', err.message);
  }
  return contextInfo;
}


/**
 * Xử lý trò chuyện với Google Gemini API
 * @param {string} userMessage - Tin nhắn của khách hàng
 * @param {Array} history - Lịch sử trò chuyện trước đó
 */
async function generateChatResponse(userMessage, history = []) {
  if (!GEMINI_API_KEY) {
    return 'Dạ Daniel Wellington xin chào Quý khách! Hiện tại hệ thống trợ lý AI đang được nâng cấp bảo trì. Quý khách vui lòng liên hệ hotline **093 202 9606** hoặc ghé thăm [Hệ thống Showroom](/stores) để được phục vụ chu đáo nhất ạ!';
  }

  const catalogText = await getProductCatalogSummary();
  const realTimeDataContext = await lookupOrderOrWarrantyContext(userMessage);

  const systemInstruction = `
Bạn là "Trợ Lý Kim Hoàn AI" (Luxury Concierge) độc quyền của thương hiệu trang sức & đồng hồ cao cấp Daniel Wellington.

Phong cách & Thái độ:
- Lịch sự, nhã nhặn, sang trọng, tinh tế chuẩn phong cách Bắc Âu.
- Xưng hô "Daniel Wellington" hoặc "em" và gọi khách hàng là "Quý khách" hoặc "anh/chị".
- Câu trả lời ngắn gọn, súc tích, định dạng markdown đẹp mắt (dùng dấu gạch đầu dòng, in đậm tên và giá, dùng icon trang nhã: 💍 ✨ 💎 🛡️ 📏).

Kiến thức thương hiệu & Nghiệp vụ cốt lõi:
1. Chất liệu chế tác: Thép không gỉ 316L chuẩn y tế, mạ vàng 18K chân không PVD bền màu vĩnh cửu, đính kết đá quý khối Cubic Zirconia và kim cương nhân tạo Thụy Sĩ.
2. Dịch vụ Khắc chữ Laser độc quyền: Miễn phí 100% theo yêu cầu, 4 font chữ (Script chữ thảo lãng mạn, Classic cổ điển, Modern in hoa thanh thoát, Bold nét đậm), tối đa 30 ký tự, hoàn thiện trong 24-48 giờ.
3. Chính sách Bảo hành: Bảo hành điện tử 12 tháng theo mã WR-..., miễn phí chỉnh size nhẫn 2 lần, làm sạch siêu âm & đánh bóng làm mới kim hoàn trọn đời.
4. Giao hàng: Giao hỏa tốc 2H tại nội thành TP.HCM & Hà Nội. Miễn phí vận chuyển toàn quốc cho đơn hàng từ 5.000.000₫. Đồng kiểm và ướm thử khi nhận hàng.
5. Hệ thống Showroom: Flagship Boutique tại 123 Lê Lợi, Quận 1, TP.HCM và 24 Tràng Tiền, Quận Hoàn Kiếm, Hà Nội (Mở cửa 09:00 - 21:30 hàng ngày, hotline: 093 202 9606).
6. Phương thức thanh toán: Chuyển khoản VietQR tự động, cổng VNPay, MoMo, và thanh toán khi nhận hàng (COD).

Quy tắc chèn liên kết điều hướng:
- Khi nhắc đến sản phẩm, HÃY DÙNG LINK NỘI BỘ dạng: [Tên Sản Phẩm](/products/slug-san-pham) để khách bấm vào xem ngay!
- Khi khách hỏi hướng dẫn đo size nhẫn: Tóm tắt 5 bước đo bằng giấy và kèm link [Hướng dẫn đo size nhẫn chuẩn](/guide/size).
- Khi khách hỏi tra cứu bảo hành: Kèm link [Tra cứu bảo hành điện tử](/warranty).
- Khi khách hỏi địa chỉ cửa hàng: Kèm link [Xem bản đồ Showroom](/stores).
- Khi khách muốn xem tất cả sản phẩm: Kèm link [Bộ sưu tập trang sức](/products).
${realTimeDataContext ? `\n${realTimeDataContext}` : ''}

Danh mục các sản phẩm nổi bật hiện có trong kho:
${catalogText}
`;

  // Chuẩn hóa lịch sử tin nhắn cho Gemini API
  const contents = [];

  // Thêm system instruction làm tin nhắn khởi tạo
  contents.push({
    role: 'user',
    parts: [{ text: `[HƯỚNG DẪN HỆ THỐNG VÀ THÔNG TIN CỬA HÀNG]:\n${systemInstruction}` }],
  });
  contents.push({
    role: 'model',
    parts: [
      {
        text: 'Dạ vâng, Daniel Wellington xin kính chào Quý khách! Em là Trợ Lý Kim Hoàn AI, rất vinh hạnh được đồng hành và tư vấn những tuyệt tác trang sức phù hợp nhất cho Quý khách.',
      },
    ],
  });

  // Thêm lịch sử hội thoại gần nhất (tối đa 6 lượt)
  const recentHistory = (history || []).slice(-6);
  for (const item of recentHistory) {
    if (item.role === 'user' || item.role === 'model') {
      contents.push({
        role: item.role,
        parts: [{ text: item.text || '' }],
      });
    }
  }

  // Thêm câu hỏi hiện tại
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
        topP: 0.9,
      },
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gemini API error status: ${response.status}`);
  }

  const data = await response.json();
  const replyText =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    'Xin lỗi Quý khách, em đang gặp gián đoạn tạm thời. Quý khách vui lòng liên hệ hotline **093 202 9606** để được tư vấn viên hỗ trợ ngay ạ!';

  return replyText;
}

module.exports = {
  generateChatResponse,
};
