/**
 * SEED DASHBOARD REALISTIC DATA SCRIPT
 * Tạo dữ liệu phong phú, sinh động và đầy đủ cho Dashboard Admin & Toàn bộ Hệ Thống
 */
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');

async function seedDashboardData() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU TẠO DỮ LIỆU PHONG PHÚ CHO DASHBOARD VÀ CÁC MODULE...');
  console.log('================================================================');

  // 1. Lấy danh sách Users, Products và Variants hiện có
  const products = await db('products').whereNull('deleted_at').select('*');
  const variants = await db('variants').where('is_active', true).select('*');

  if (products.length === 0 || variants.length === 0) {
    console.error('❌ Chưa có sản phẩm/biến thể. Vui lòng kiểm tra seed database trước.');
    process.exit(1);
  }

  // 2. Tạo thêm Users khách hàng mẫu
  console.log('👤 Đang tạo thêm người dùng khách hàng mẫu...');
  const passwordHash = await bcrypt.hash('User@123456', 10);
  const sampleUsers = [
    { email: 'tran.thanh.tam@gmail.com', full_name: 'Trần Thanh Tâm', phone: '0912345678', role: 'customer', is_verified: true, last_login_at: new Date(Date.now() - 2 * 3600 * 1000) },
    { email: 'le.hoang.nam@gmail.com', full_name: 'Lê Hoàng Nam', phone: '0987654321', role: 'customer', is_verified: true, last_login_at: new Date(Date.now() - 5 * 3600 * 1000) },
    { email: 'pham.ngoc.anh@gmail.com', full_name: 'Phạm Ngọc Ánh', phone: '0909888999', role: 'customer', is_verified: true, last_login_at: new Date(Date.now() - 24 * 3600 * 1000) },
    { email: 'hoang.minh.tri@gmail.com', full_name: 'Hoàng Minh Trí', phone: '0933112233', role: 'customer', is_verified: true, last_login_at: new Date(Date.now() - 48 * 3600 * 1000) },
    { email: 'vu.thi.mai@gmail.com', full_name: 'Vũ Thị Mai', phone: '0977556677', role: 'customer', is_verified: true, last_login_at: new Date(Date.now() - 72 * 3600 * 1000) },
    { email: 'do.quoc.bao@gmail.com', full_name: 'Đỗ Quốc Bảo', phone: '0966443322', role: 'customer', is_verified: true, last_login_at: new Date(Date.now() - 12 * 3600 * 1000) },
  ];

  const createdUsers = [];
  for (const u of sampleUsers) {
    const existing = await db('users').where({ email: u.email }).first();
    if (!existing) {
      const [newUser] = await db('users').insert({
        ...u,
        password_hash: passwordHash,
      }).returning('*');
      createdUsers.push(newUser);
    } else {
      createdUsers.push(existing);
    }
  }

  // Lấy thêm user customer mặc định
  const defaultCustomer = await db('users').where({ email: 'customer@test.com' }).first();
  if (defaultCustomer) createdUsers.push(defaultCustomer);

  console.log(`✅ Đã có ${createdUsers.length} tài khoản khách hàng.`);

  // 3. Tạo Vouchers phong phú
  console.log('🎟️ Đang tạo Voucher & Mã giảm giá...');
  const vouchersData = [
    {
      code: 'WELCOME2026',
      name: 'Chào Mừng Thành Viên Mới',
      type: 'percentage',
      value: 10,
      max_discount: 2000000,
      min_order_amount: 5000000,
      usage_limit: 500,
      per_user_limit: 1,
      starts_at: new Date('2026-01-01'),
      expires_at: new Date('2026-12-31'),
      is_active: true,
    },
    {
      code: 'VALENTINE2026',
      name: 'Ưu Đãi Nhẫn Cưới & Cầu Hôn',
      type: 'fixed_amount',
      value: 2000000,
      max_discount: 2000000,
      min_order_amount: 20000000,
      usage_limit: 100,
      per_user_limit: 1,
      starts_at: new Date('2026-02-01'),
      expires_at: new Date('2026-09-30'),
      is_active: true,
    },
    {
      code: 'DIAMONDVIP',
      name: 'Đặc Quyền Kim Cương GIA Luxury',
      type: 'fixed_amount',
      value: 5000000,
      max_discount: 5000000,
      min_order_amount: 50000000,
      usage_limit: 50,
      per_user_limit: 1,
      starts_at: new Date('2026-01-01'),
      expires_at: new Date('2026-12-31'),
      is_active: true,
    },
    {
      code: 'FREESHIP',
      name: 'Miễn Phí Vận Chuyển Toàn Quốc',
      type: 'free_shipping',
      value: 0,
      max_discount: 100000,
      min_order_amount: 1000000,
      usage_limit: 1000,
      per_user_limit: 5,
      starts_at: new Date('2026-01-01'),
      expires_at: new Date('2026-12-31'),
      is_active: true,
    },
  ];

  for (const v of vouchersData) {
    const existing = await db('vouchers').where({ code: v.code }).first();
    if (!existing) {
      await db('vouchers').insert(v);
    }
  }
  console.log('✅ Đã tạo các Voucher ưu đãi chuẩn.');

  // 4. Tạo các Đơn Hàng phong phú trong 7 ngày gần nhất
  console.log('📦 Đang tạo các Đơn Hàng mẫu cho Biểu đồ Doanh thu & Recent Orders...');
  
  const now = Date.now();
  const ONE_DAY = 24 * 3600 * 1000;

  const mockOrdersConfig = [
    // Ngày 0 (Hôm nay)
    { dayOffset: 0, customerIndex: 0, variantIndex: 0, qty: 1, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: 'Forever Love • 2026' },
    { dayOffset: 0, customerIndex: 1, variantIndex: 1 || 0, qty: 2, status: 'processing', payMethod: 'vietqr', payStatus: 'paid', engraving: 'T & M 14.02' },
    { dayOffset: 0, customerIndex: 2, variantIndex: 2 || 0, qty: 1, status: 'pending', payMethod: 'cod', payStatus: 'unpaid', engraving: null },

    // Ngày 1 (Hôm qua)
    { dayOffset: 1, customerIndex: 3, variantIndex: 0, qty: 2, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: 'H & N Eternity' },
    { dayOffset: 1, customerIndex: 4, variantIndex: 1 || 0, qty: 1, status: 'completed', payMethod: 'vnpay', payStatus: 'paid', engraving: 'Sweet Heart' },
    { dayOffset: 1, customerIndex: 5, variantIndex: 2 || 0, qty: 1, status: 'shipping', payMethod: 'vietqr', payStatus: 'paid', engraving: null },

    // Ngày 2 (2 ngày trước)
    { dayOffset: 2, customerIndex: 0, variantIndex: 1 || 0, qty: 1, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: null },
    { dayOffset: 2, customerIndex: 1, variantIndex: 0, qty: 1, status: 'completed', payMethod: 'momo', payStatus: 'paid', engraving: 'Anh Yêu Em' },

    // Ngày 3 (3 ngày trước)
    { dayOffset: 3, customerIndex: 2, variantIndex: 2 || 0, qty: 3, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: 'KLTN Luxury' },
    { dayOffset: 3, customerIndex: 3, variantIndex: 0, qty: 1, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: 'Marry Me' },

    // Ngày 4 (4 ngày trước)
    { dayOffset: 4, customerIndex: 4, variantIndex: 1 || 0, qty: 2, status: 'completed', payMethod: 'vnpay', payStatus: 'paid', engraving: null },
    { dayOffset: 4, customerIndex: 5, variantIndex: 0, qty: 1, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: 'Forever & Always' },

    // Ngày 5 (5 ngày trước)
    { dayOffset: 5, customerIndex: 0, variantIndex: 0, qty: 1, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: '14.02.2026' },
    { dayOffset: 5, customerIndex: 1, variantIndex: 2 || 0, qty: 1, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: null },

    // Ngày 6 (6 ngày trước)
    { dayOffset: 6, customerIndex: 2, variantIndex: 1 || 0, qty: 1, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: 'One and Only' },
    { dayOffset: 6, customerIndex: 3, variantIndex: 0, qty: 2, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: 'T & T 2026' },
  ];

  const createdOrderItemsForReviews = [];

  let orderSequence = 200;
  for (const cfg of mockOrdersConfig) {
    orderSequence++;
    const user = createdUsers[cfg.customerIndex % createdUsers.length];
    const variant = variants[cfg.variantIndex % variants.length];
    const product = products.find(p => p.id === variant.product_id) || products[0];

    const orderTime = new Date(now - cfg.dayOffset * ONE_DAY - Math.floor(Math.random() * 3600 * 1000 * 6) - 120000);
    const orderNumber = `TJ-${orderTime.toISOString().slice(0, 10).replace(/-/g, '')}-${String(orderSequence).padStart(5, '0')}`;


    const price = parseFloat(variant.price);
    const subtotal = price * cfg.qty;
    const shippingFee = subtotal >= 5000000 ? 0 : 50000;
    const totalAmount = subtotal + shippingFee;

    // Check existing
    const existingOrder = await db('orders').where({ order_number: orderNumber }).first();
    if (existingOrder) continue;

    const [order] = await db('orders').insert({
      order_number: orderNumber,
      user_id: user.id,
      status: cfg.status,
      total_amount: totalAmount,
      subtotal,
      shipping_fee: shippingFee,
      discount_amount: 0,
      payment_method: cfg.payMethod,
      payment_status: cfg.payStatus,
      shipping_address: JSON.stringify({
        province: 'TP. Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        streetAddress: `${100 + orderSequence} Lê Lợi`,
      }),
      customer_snapshot: JSON.stringify({
        name: user.full_name,
        phone: user.phone,
        email: user.email,
      }),
      idempotency_key: uuidv4(),
      created_at: orderTime,
      updated_at: orderTime,
    }).returning('*');

    // Tạo Order Item
    const [orderItem] = await db('order_items').insert({
      order_id: order.id,
      variant_id: variant.id,
      product_name_snapshot: product.name,
      variant_name_snapshot: variant.name,
      sku_snapshot: variant.sku,
      price_snapshot: price,
      quantity: cfg.qty,
      customization_metadata: cfg.engraving ? JSON.stringify({ text: cfg.engraving, font: 'Classic' }) : null,
    }).returning('*');

    createdOrderItemsForReviews.push({
      orderItem,
      user,
      product,
      variant,
    });

    // Nếu đơn hàng completed hoặc shipping -> Tạo phiếu bảo hành
    if (['completed', 'shipping', 'delivered'].includes(cfg.status)) {
      const warrantyCode = `WR-${orderTime.toISOString().slice(0, 10).replace(/-/g, '')}-${String(orderSequence).padStart(4, '0')}`;
      const existingWarranty = await db('warranties').where({ warranty_code: warrantyCode }).first();
      if (!existingWarranty) {
        await db('warranties').insert({
          order_id: order.id,
          order_item_id: orderItem.id,
          variant_id: variant.id,
          warranty_code: warrantyCode,
          customer_name: user.full_name,
          customer_phone: user.phone,
          customer_email: user.email,
          purchase_date: orderTime,
          warranty_terms: JSON.stringify({
            cleaning: 'Trọn đời miễn phí',
            polishing: 'Trọn đời miễn phí',
            stoneFix: 'Miễn phí gắn lại đá tấm dưới 2.0mm',
            resizing: 'Miễn phí chỉnh size 1 lần trong 12 tháng đầu',
          }),
          status: 'active',
          notes: 'Bảo hành chính hãng trọn đời: Làm sạch, đánh bóng miễn phí & Kiểm tra đính đá định kỳ.',
          created_at: orderTime,
        });
      }
    }
  }

  console.log('✅ Đã tạo các đơn hàng hoàn tất & phiếu bảo hành trải đều 7 ngày.');

  // 5. Tạo Đánh Giá Sản Phẩm (Reviews)
  console.log('⭐ Đang tạo Đánh Giá & Nhận Xét mẫu...');
  const reviewsConfig = [
    {
      rating: 5,
      title: 'Nhẫn kim cương Solitaire tuyệt đẹp, sáng lấp lánh!',
      body: 'Mình đã nhận được nhẫn đúng ngày hẹn. Kim cương GIA có mã số khắc cạnh laser sắc nét, kiểm định đầy đủ. Vàng 18K hoàn thiện rất mịn và cao cấp. Rất hài lòng!',
      is_approved: true,
    },
    {
      rating: 5,
      title: 'Dịch vụ khắc chữ laser rất tinh tế và ý nghĩa',
      body: 'Khắc chữ mặt trong nhẫn rất nét, đúng font chữ mình chọn. Vợ mình rất xúc động khi nhận được món quà kỷ niệm này. 10/10 cho KLTN Jewelry!',
      is_approved: true,
    },
    {
      rating: 5,
      title: 'Dây chuyền vàng Ý sáng bóng, giao hàng nhanh',
      body: 'Đóng gói hộp nhung kèm nơ cực kỳ sang trọng. Nhân viên hỗ trợ tư vấn nhiệt tình qua Zalo. Sẽ tiếp tục ủng hộ shop.',
      is_approved: true,
    },
    {
      rating: 4,
      title: 'Bông tai ngọc trai rất sang trọng, đeo rất êm tai',
      body: 'Ngọc trai có ánh ngũ sắc đẹp, chốt vặn vàng 18K chắc chắn. Giao hàng trong 2 tiếng tại TP.HCM rất ấn tượng.',
      is_approved: true,
    },
    {
      rating: 5,
      title: 'Xứng đáng là thương hiệu trang sức hàng đầu',
      body: 'Phiếu bảo hành điện tử tra cứu trực tiếp bằng số điện thoại rất tiện lợi, không lo bị mất thẻ cứng. Trải nghiệm mua sắm tuyệt vời!',
      is_approved: false, // Để admin duyệt thử
    },
  ];

  for (let i = 0; i < reviewsConfig.length && i < createdOrderItemsForReviews.length; i++) {
    const item = createdOrderItemsForReviews[i];
    const r = reviewsConfig[i];

    const existing = await db('reviews').where({ order_item_id: item.orderItem.id }).first();
    if (!existing) {
      await db('reviews').insert({
        product_id: item.product.id,
        variant_id: item.variant.id,
        user_id: item.user.id,
        order_item_id: item.orderItem.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        is_approved: r.is_approved,
        is_verified: true,
        created_at: new Date(),
      });
    }
  }
  console.log('✅ Đã tạo các đánh giá & nhận xét khách hàng gắn với đơn mua thực tế.');

  console.log('\n================================================================');
  console.log('🎉 TẠO DỮ LIỆU DASHBOARD THÀNH CÔNG RỰC RỠ 100%!');
  console.log('================================================================');
}

exports.seed = async function(knex) {
  await seedDashboardData(knex);
};

if (require.main === module) {
  seedDashboardData().then(() => process.exit(0)).catch((err) => {
    console.error('❌ Lỗi khi seed dữ liệu:', err);
    process.exit(1);
  });
}

