/**
 * MASTER MASSIVE DATA SEEDER FOR 7 ADMIN MODULES
 * Tạo dữ liệu phong phú, sinh động cho toàn bộ 7 mục trên Admin Back-office Dashboard
 */
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');

async function seedMassiveData() {
  console.log('========================================================================');
  console.log('💎 BẮT ĐẦU NẠP DỮ LIỆU ĐỈNH CAO CHO TOÀN BỘ 7 MỤC TRÊN ADMIN BACK-OFFICE');
  console.log('========================================================================\n');

  // Lấy Categories
  const categories = await db('categories').select('id', 'slug', 'name');
  const catMap = {};
  categories.forEach((c) => { catMap[c.slug] = c.id; });

  const admin = await db('users').where({ role: 'admin' }).first();
  const adminId = admin ? admin.id : null;
  const passwordHash = await bcrypt.hash('User@123456', 10);

  // ──────────────────────────────────────────────────────────────────────────
  // 1. MỤC 6: QUẢN LÝ NGƯỜI DÙNG (USERS & ROLES)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('👥 [1/7] Đang tạo dữ liệu Người Dùng & Phân Quyền (RBAC)...');
  const usersList = [
    { email: 'manager@jewelry.com', full_name: 'Phạm Thị Giám Đốc', phone: '0909000111', role: 'manager', is_verified: true, last_login_at: new Date(Date.now() - 30 * 60 * 1000) },
    { email: 'staff.che.tac@jewelry.com', full_name: 'Nguyễn Văn Thợ Kim Hoàn', phone: '0909000222', role: 'staff', is_verified: true, last_login_at: new Date(Date.now() - 2 * 3600 * 1000) },
    { email: 'staff.cskh@jewelry.com', full_name: 'Lê Thị Tư Vấn Viên', phone: '0909000333', role: 'staff', is_verified: true, last_login_at: new Date(Date.now() - 4 * 3600 * 1000) },
    { email: 'tran.thanh.tam@gmail.com', full_name: 'Trần Thanh Tâm', phone: '0912345678', role: 'customer', is_verified: true, last_login_at: new Date(Date.now() - 1 * 3600 * 1000) },
    { email: 'le.hoang.nam@gmail.com', full_name: 'Lê Hoàng Nam', phone: '0987654321', role: 'customer', is_verified: true, last_login_at: new Date(Date.now() - 3 * 3600 * 1000) },
    { email: 'pham.ngoc.anh@gmail.com', full_name: 'Phạm Ngọc Ánh', phone: '0909888999', role: 'customer', is_verified: true, last_login_at: new Date(Date.now() - 8 * 3600 * 1000) },
    { email: 'hoang.minh.tri@gmail.com', full_name: 'Hoàng Minh Trí', phone: '0933112233', role: 'customer', is_verified: true, last_login_at: new Date(Date.now() - 16 * 3600 * 1000) },
    { email: 'vu.thi.mai@gmail.com', full_name: 'Vũ Thị Mai', phone: '0977556677', role: 'customer', is_verified: true, last_login_at: new Date(Date.now() - 24 * 3600 * 1000) },
    { email: 'do.quoc.bao@gmail.com', full_name: 'Đỗ Quốc Bảo', phone: '0966443322', role: 'customer', is_verified: true, last_login_at: new Date(Date.now() - 36 * 3600 * 1000) },
    { email: 'bui.thanh.hang@gmail.com', full_name: 'Bùi Thanh Hằng', phone: '0911223344', role: 'customer', is_verified: true, last_login_at: new Date(Date.now() - 48 * 3600 * 1000) },
    { email: 'dang.quang.huy@gmail.com', full_name: 'Đặng Quang Huy', phone: '0944556677', role: 'customer', is_verified: true, last_login_at: new Date(Date.now() - 60 * 3600 * 1000) },
    { email: 'nguyen.kim.oanh@gmail.com', full_name: 'Nguyễn Kim Oanh', phone: '0988776655', role: 'customer', is_verified: false, last_login_at: null },
    { email: 'ly.gia.thanh@gmail.com', full_name: 'Lý Gia Thành', phone: '0933445566', role: 'customer', is_verified: true, last_login_at: new Date(Date.now() - 72 * 3600 * 1000) },
  ];

  const dbUsers = [];
  for (const u of usersList) {
    let existing = await db('users').where({ email: u.email }).first();
    if (!existing) {
      const [created] = await db('users').insert({
        ...u,
        password_hash: passwordHash,
      }).returning('*');
      existing = created;
    }
    dbUsers.push(existing);
  }
  console.log(`✅ Đã đồng bộ ${dbUsers.length} tài khoản người dùng với đủ các vai trò.`);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. MỤC 2: QUẢN LÝ SẢN PHẨM (PIM) — THÊM DANH MỤC TRANG SỨC CAO CẤP
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n💍 [2/7] Đang tạo dữ liệu Sản Phẩm & Biến Thể PIM (Master-Variant)...');
  
  const additionalProducts = [
    {
      name: 'Nhẫn Cưới Eternity Vàng Trắng 18K Đính Kim Cương Tấm',
      slug: 'nhan-cuoi-eternity-vang-trang-18k',
      categoryId: catMap['nhan'],
      material: 'Vàng Trắng 18K',
      basePrice: 28500000,
      shortDescription: 'Nhẫn cưới vòng tròn bất tận đính 22 viên kim cương tấm tự nhiên, khắc tên đôi lứa miễn phí.',
      description: 'Thiết kế Eternity tượng trưng cho tình yêu trường tồn vĩnh cửu. Vàng trắng 18K phủ Rhodium sáng bóng, đính full kim cương tấm chuẩn F/VVS1.',
      isFeatured: true,
      variants: [
        { sku: 'NCE-18KW-SZ5', name: 'Size 5 (Nữ) - Kim Cương Tấm 1.8mm', price: 28500000, stock: 12, allowEngraving: true, cert: 'DOJI-E10294', img: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800' },
        { sku: 'NCE-18KW-SZ6', name: 'Size 6 (Nữ) - Kim Cương Tấm 1.8mm', price: 29500000, stock: 10, allowEngraving: true, cert: 'DOJI-E10295', img: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800' },
      ],
    },
    {
      name: 'Nhẫn Nam Kim Cương Phong Thủy Vàng Vàng 18K Khắc Rồng',
      slug: 'nhan-nam-kim-cuong-phong-thuy-18k',
      categoryId: catMap['nhan'],
      material: 'Vàng 18K',
      basePrice: 58000000,
      shortDescription: 'Nhẫn nam quyền lực bản lớn, đính viên chủ kim cương GIA 0.7ct và họa tiết rồng chạm nổi tinh xảo.',
      description: 'Tuyệt phẩm trang sức nam biểu trưng cho sự thành đạt, quyền uy và thịnh vượng. Trọng lượng vàng 3.5 chỉ đúc đặc chắc tay.',
      isFeatured: true,
      variants: [
        { sku: 'NN-DRAGON-0.7CT-SZ9', name: 'Size 9 - Viên Chủ GIA 0.7ct VVS1', price: 58000000, stock: 5, allowEngraving: true, cert: 'GIA-642190822', img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800' },
      ],
    },
    {
      name: 'Dây Chuyền Cỏ 4 Lá May Mắn Vàng Hồng 18K Đính Xà Cừ',
      slug: 'day-chuyen-co-4-la-vang-hong-18k',
      categoryId: catMap['day-chuyen'],
      material: 'Vàng Hồng 18K',
      basePrice: 16800000,
      shortDescription: 'Biểu tượng của May Mắn, Niềm Tin, Hy Vọng & Tình Yêu. Khảm xà cừ tự nhiên óng ánh sắc màu.',
      description: 'Thiết kế dây chuyền thanh mảnh với mặt cỏ 4 lá khảm xà cừ trắng tự nhiên, viền hạt bi vàng hồng 18K mềm mại và nữ tính.',
      isFeatured: true,
      variants: [
        { sku: 'DC-CO4LA-45CM', name: 'Dây 45cm - Mặt Xà Cừ Trắng', price: 16800000, stock: 25, allowEngraving: false, cert: 'SJC-QC-8812', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800' },
      ],
    },
    {
      name: 'Vòng Cổ Ngọc Trai Biển Akoya Nhật Bản Khóa Vàng 18K',
      slug: 'vong-co-ngoc-trai-akoya-nhat-ban',
      categoryId: catMap['day-chuyen'],
      material: 'Vàng 18K & Ngọc Trai Akoya',
      basePrice: 42000000,
      shortDescription: 'Chuỗi ngọc trai Akoya biển tự nhiên 7.5-8.0mm ánh hồng phấn quý phái, khóa cài vàng 18K đính kim cương.',
      description: 'Từng viên ngọc trai biển Akoya được tuyển chọn tròn đều hoàn hảo với độ bóng gương (luster) xuất sắc bậc nhất xứ sở hoa anh đào.',
      isFeatured: true,
      variants: [
        { sku: 'VC-AKOYA-42CM', name: 'Chuỗi 42cm - Ngọc Trai Biển 7.5-8.0mm', price: 42000000, stock: 4, allowEngraving: false, cert: 'JAPAN-PEARL-A99', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800' },
      ],
    },
    {
      name: 'Bông Tai Nụ Kim Cương GIA 4 Chấu Cổ Điển Vàng Trắng 18K',
      slug: 'bong-tai-nu-kim-cuong-gia-18k',
      categoryId: catMap['bong-tai'],
      material: 'Vàng Trắng 18K',
      basePrice: 26000000,
      shortDescription: 'Cặp bông tai kim cương GIA 0.4ct mỗi bên, thiết kế 4 chấu tối giản tôn trọn vẹn nét lấp lánh.',
      description: 'Thiết kế nụ kinh điển phù hợp mọi trang phục hàng ngày lẫn dạ tiệc. Chốt vặn ốc an toàn chống rơi rớt khi vận động.',
      isFeatured: true,
      variants: [
        { sku: 'BT-NU-GIA-0.4CT', name: 'Cặp 0.8ct (2x0.4ct GIA E/VVS2)', price: 26000000, stock: 15, allowEngraving: false, cert: 'GIA-Pair-2291', img: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800' },
      ],
    },
    {
      name: 'Vòng Tay Tennis Kim Cương Vàng Trắng 18K Full Diamond',
      slug: 'vong-tay-tennis-kim-cuong-18k',
      categoryId: catMap['vong-tay'],
      material: 'Vàng Trắng 18K',
      basePrice: 95000000,
      shortDescription: 'Kiệt tác vòng tay Tennis đính liền kề 45 viên kim cương tự nhiên 2.5mm đạt chuẩn kiểm định quốc tế.',
      description: 'Dòng vòng tay biểu tượng của giới thượng lưu thế giới. Khóa gài đôi an toàn tuyệt đối với cấu trúc vàng đúc linh hoạt mềm mại ôm sát cổ tay.',
      isFeatured: true,
      variants: [
        { sku: 'VT-TENNIS-16CM', name: 'Chiều dài 16cm - 45 Viên Kim Cương', price: 95000000, stock: 3, allowEngraving: true, cert: 'GIA-TENNIS-88', img: 'https://images.unsplash.com/photo-1611591475179-6fe5e7e597c1?w=800' },
      ],
    },
    {
      name: 'Lắc Tay Vàng 24K (999.9) Long Phụng Sum Vầy Truyền Thống',
      slug: 'lac-tay-vang-24k-long-phung-sum-vay',
      categoryId: catMap['lac'] || catMap['vong-tay'],
      material: 'Vàng 24K (999.9)',
      basePrice: 38500000,
      shortDescription: 'Lắc cưới vàng ròng 999.9 chạm khắc biểu tượng Rồng Phượng sum vầy, món quà hồi môn trọn vẹn hiếu đạo.',
      description: 'Chế tác từ vàng ta 999.9 nguyên chất chuẩn tuổi, công nghệ dập 3D cứng vàng chống móp méo giúp hoa văn sắc nét tinh xảo.',
      isFeatured: true,
      variants: [
        { sku: 'LT-24K-LONGPHUNG-5CHI', name: 'Trọng lượng 5.0 Chỉ Vàng 999.9', price: 38500000, stock: 8, allowEngraving: true, cert: 'SJC-9999-5C', img: 'https://images.unsplash.com/photo-1611591475179-6fe5e7e597c1?w=800' },
      ],
    },
  ];

  for (const item of additionalProducts) {
    let p = await db('products').where({ slug: item.slug }).first();
    if (!p) {
      const [createdP] = await db('products').insert({
        name: item.name,
        slug: item.slug,
        category_id: item.categoryId || null,
        description: item.description,
        short_description: item.shortDescription,
        brand: 'KLTN Fine Jewelry',
        material: item.material,
        base_price: item.basePrice,
        status: 'active',
        is_featured: item.isFeatured,
        created_by: adminId,
      }).returning('*');
      p = createdP;

      // Variants
      for (const v of item.variants) {
        const [variant] = await db('variants').insert({
          product_id: p.id,
          sku: v.sku,
          name: v.name,
          price: v.price,
          compare_price: v.price * 1.1,
          cost_price: v.price * 0.7,
          weight_gram: 4.5,
          inventory_type: 'pool',
          stock_quantity: v.stock,
          reserved_quantity: 0,
          allow_engraving: v.allowEngraving,
          engraving_fee: v.allowEngraving ? 150000 : 0,
          max_engraving_chars: 30,
          images: JSON.stringify([
            { url: v.img, alt: v.name, is_primary: true },
          ]),
          is_active: true,
        }).returning('*');

        // GIA Certificate
        if (v.cert) {
          await db('certificates').insert({
            variant_id: variant.id,
            cert_number: v.cert,
            issuer: v.cert.startsWith('GIA') ? 'GIA' : 'DOJI LAB',
            cert_type: 'diamond_grading',
            issued_date: new Date('2026-01-15'),
            file_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800',
            details: JSON.stringify({
              shape: 'Round Brilliant',
              carat_weight: 0.7,
              color_grade: 'E',
              clarity_grade: 'VVS1',
              cut_grade: 'Excellent',
            }),
            is_active: true,
          });
        }
      }
    }
  }

  const allProducts = await db('products').whereNull('deleted_at').select('*');
  const allVariants = await db('variants').where('is_active', true).select('*');
  console.log(`✅ Đã có tổng cộng ${allProducts.length} sản phẩm và ${allVariants.length} biến thể trang sức trong catalog.`);

  // ──────────────────────────────────────────────────────────────────────────
  // 3. MỤC 5: VOUCHER & MÃ GIẢM GIÁ
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n🎟️ [3/7] Đang tạo danh sách Voucher & Mã Khuyến Mãi đa dạng...');
  const fullVouchers = [
    { code: 'WELCOME2026', name: 'Chào Mừng Thành Viên Mới', type: 'percentage', value: 10, max_discount: 2000000, min_order_amount: 5000000, usage_limit: 500, used_count: 87, per_user_limit: 1, starts_at: new Date('2026-01-01'), expires_at: new Date('2026-12-31'), is_active: true },
    { code: 'VALENTINE2026', name: 'Ưu Đãi Nhẫn Cưới & Cầu Hôn', type: 'fixed_amount', value: 2000000, max_discount: 2000000, min_order_amount: 20000000, usage_limit: 100, used_count: 43, per_user_limit: 1, starts_at: new Date('2026-02-01'), expires_at: new Date('2026-09-30'), is_active: true },
    { code: 'DIAMONDVIP', name: 'Đặc Quyền Kim Cương GIA Luxury', type: 'fixed_amount', value: 5000000, max_discount: 5000000, min_order_amount: 50000000, usage_limit: 50, used_count: 19, per_user_limit: 1, starts_at: new Date('2026-01-01'), expires_at: new Date('2026-12-31'), is_active: true },
    { code: 'WEDDINGLOVE', name: 'Tôn Vinh Tình Yêu Đôi Lứa (Cặp Nhẫn)', type: 'percentage', value: 15, max_discount: 4000000, min_order_amount: 25000000, usage_limit: 200, used_count: 65, per_user_limit: 1, starts_at: new Date('2026-01-01'), expires_at: new Date('2026-12-31'), is_active: true },
    { code: 'FREESHIP', name: 'Miễn Phí Vận Chuyển Hỏa Tốc Có Bảo Hiểm', type: 'free_shipping', value: 0, max_discount: 100000, min_order_amount: 1000000, usage_limit: 1000, used_count: 312, per_user_limit: 5, starts_at: new Date('2026-01-01'), expires_at: new Date('2026-12-31'), is_active: true },
    { code: 'GOLDEN2026', name: 'Tri Ân Khách Mua Vàng 24K', type: 'fixed_amount', value: 1000000, max_discount: 1000000, min_order_amount: 30000000, usage_limit: 80, used_count: 22, per_user_limit: 1, starts_at: new Date('2026-01-01'), expires_at: new Date('2026-12-31'), is_active: true },
    { code: 'SINHNHATVIP', name: 'Món Quà Sinh Nhật Dành Riêng Cho Bạn', type: 'percentage', value: 8, max_discount: 1500000, min_order_amount: 3000000, usage_limit: 300, used_count: 58, per_user_limit: 1, starts_at: new Date('2026-01-01'), expires_at: new Date('2026-12-31'), is_active: true },
    { code: 'SUMMER2025', name: 'Đại Tiệc Mùa Hè 2025 (Đã Hết Hạn)', type: 'percentage', value: 20, max_discount: 3000000, min_order_amount: 10000000, usage_limit: 50, used_count: 50, per_user_limit: 1, starts_at: new Date('2025-06-01'), expires_at: new Date('2025-08-31'), is_active: true },
  ];

  for (const v of fullVouchers) {
    const existing = await db('vouchers').where({ code: v.code }).first();
    if (!existing) {
      await db('vouchers').insert(v);
    } else {
      await db('vouchers').where({ code: v.code }).update(v);
    }
  }
  console.log('✅ Đã nạp 8 Voucher ưu đãi đa dạng trạng thái.');

  // ──────────────────────────────────────────────────────────────────────────
  // 4. MỤC 3: QUẢN LÝ ĐƠN HÀNG (ORDER PIPELINE) & DASHBOARD ANALYTICS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n📦 [4/7] Đang tạo 30+ Đơn Hàng thực tế cho Pipeline & Biểu Đồ Doanh Thu...');

  const now = Date.now();
  const ONE_DAY = 24 * 3600 * 1000;

  const massiveOrdersConfig = [
    // Ngày 0 (Hôm nay)
    { dayOffset: 0, userIdx: 3, varIdx: 0, qty: 1, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: 'Forever Love • 2026' },
    { dayOffset: 0, userIdx: 4, varIdx: 1, qty: 1, status: 'processing', payMethod: 'vietqr', payStatus: 'paid', engraving: 'T & M 14.02' },
    { dayOffset: 0, userIdx: 5, varIdx: 2, qty: 1, status: 'confirmed', payMethod: 'vietqr', payStatus: 'paid', engraving: 'Sweet Heart' },
    { dayOffset: 0, userIdx: 6, varIdx: 3, qty: 1, status: 'pending', payMethod: 'cod', payStatus: 'unpaid', engraving: null },

    // Ngày 1 (Hôm qua)
    { dayOffset: 1, userIdx: 7, varIdx: 4, qty: 1, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: 'H & N Eternity' },
    { dayOffset: 1, userIdx: 8, varIdx: 5, qty: 1, status: 'completed', payMethod: 'vnpay', payStatus: 'paid', engraving: 'My Sunshine' },
    { dayOffset: 1, userIdx: 9, varIdx: 0, qty: 2, status: 'shipping', payMethod: 'vietqr', payStatus: 'paid', engraving: 'One and Only' },
    { dayOffset: 1, userIdx: 10, varIdx: 1, qty: 1, status: 'processing', payMethod: 'vietqr', payStatus: 'paid', engraving: 'Anh Yêu Em' },

    // Ngày 2 (2 ngày trước)
    { dayOffset: 2, userIdx: 3, varIdx: 2, qty: 1, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: null },
    { dayOffset: 2, userIdx: 4, varIdx: 3, qty: 1, status: 'completed', payMethod: 'momo', payStatus: 'paid', engraving: 'KLTN Luxury' },
    { dayOffset: 2, userIdx: 5, varIdx: 4, qty: 1, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: 'Marry Me' },
    { dayOffset: 2, userIdx: 6, varIdx: 5, qty: 1, status: 'cancelled', payMethod: 'cod', payStatus: 'unpaid', engraving: null },

    // Ngày 3 (3 ngày trước)
    { dayOffset: 3, userIdx: 7, varIdx: 0, qty: 2, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: 'Forever & Always' },
    { dayOffset: 3, userIdx: 8, varIdx: 1, qty: 1, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: '14.02.2026' },
    { dayOffset: 3, userIdx: 9, varIdx: 2, qty: 2, status: 'completed', payMethod: 'vnpay', payStatus: 'paid', engraving: null },

    // Ngày 4 (4 ngày trước)
    { dayOffset: 4, userIdx: 10, varIdx: 3, qty: 1, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: 'T & T 2026' },
    { dayOffset: 4, userIdx: 3, varIdx: 4, qty: 1, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: 'Love You 3000' },
    { dayOffset: 4, userIdx: 4, varIdx: 5, qty: 1, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: null },

    // Ngày 5 (5 ngày trước)
    { dayOffset: 5, userIdx: 5, varIdx: 0, qty: 1, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: 'My Only Love' },
    { dayOffset: 5, userIdx: 6, varIdx: 1, qty: 1, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: 'Kỷ Niệm 5 Năm' },
    { dayOffset: 5, userIdx: 7, varIdx: 2, qty: 1, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: null },

    // Ngày 6 (6 ngày trước)
    { dayOffset: 6, userIdx: 8, varIdx: 3, qty: 2, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: 'Tình Yêu Đích Thực' },
    { dayOffset: 6, userIdx: 9, varIdx: 4, qty: 1, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: 'Happy Wedding' },
    { dayOffset: 6, userIdx: 10, varIdx: 0, qty: 1, status: 'completed', payMethod: 'vietqr', payStatus: 'paid', engraving: 'Forever with you' },
  ];

  const createdOrderItemsForWarranties = [];

  let seq = 300;
  for (const cfg of massiveOrdersConfig) {
    seq++;
    const user = dbUsers[cfg.userIdx % dbUsers.length];
    const variant = allVariants[cfg.varIdx % allVariants.length];
    const product = allProducts.find(p => p.id === variant.product_id) || allProducts[0];

    const orderTime = new Date(now - cfg.dayOffset * ONE_DAY + (Math.random() * 3600 * 4000));
    const orderNumber = `TJ-${orderTime.toISOString().slice(0, 10).replace(/-/g, '')}-${String(seq).padStart(5, '0')}`;

    const price = parseFloat(variant.price);
    const subtotal = price * cfg.qty;
    const shippingFee = subtotal >= 5000000 ? 0 : 50000;
    const totalAmount = subtotal + shippingFee;

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
        streetAddress: `${100 + seq} Lê Lợi`,
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

    createdOrderItemsForWarranties.push({
      order,
      orderItem,
      user,
      product,
      variant,
      orderTime,
      seq,
    });
  }
  console.log(`✅ Đã tạo các đơn hàng với các trạng thái pending, confirmed, processing, shipping, delivered, completed, cancelled.`);

  // ──────────────────────────────────────────────────────────────────────────
  // 5. MỤC 4: QUẢN LÝ BẢO HÀNH (WARRANTIES & CLAIMS)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n🛡️ [5/7] Đang tạo danh sách Phiếu Bảo Hành & Yêu Cầu Sửa Chữa (Claims)...');
  
  const createdWarranties = [];
  for (const item of createdOrderItemsForWarranties) {
    if (['completed', 'shipping', 'delivered'].includes(item.order.status)) {
      const warrantyCode = `WR-${item.orderTime.toISOString().slice(0, 10).replace(/-/g, '')}-${String(item.seq).padStart(4, '0')}`;
      const existing = await db('warranties').where({ warranty_code: warrantyCode }).first();
      if (!existing) {
        const [warranty] = await db('warranties').insert({
          order_id: item.order.id,
          order_item_id: item.orderItem.id,
          variant_id: item.variant.id,
          warranty_code: warrantyCode,
          customer_name: item.user.full_name,
          customer_phone: item.user.phone,
          customer_email: item.user.email,
          purchase_date: item.orderTime,
          warranty_terms: JSON.stringify({
            cleaning: 'Trọn đời miễn phí',
            polishing: 'Trọn đời miễn phí',
            stoneFix: 'Miễn phí gắn lại đá tấm dưới 2.0mm',
            resizing: 'Miễn phí chỉnh size 1 lần trong 12 tháng đầu',
          }),
          status: item.seq % 5 === 0 ? 'claimed' : 'active',
          notes: 'Bảo hành chính hãng trọn đời: Làm sạch, đánh bóng miễn phí & Kiểm tra đính đá định kỳ.',
          created_at: item.orderTime,
        }).returning('*');

        createdWarranties.push(warranty);

        // Tạo Claim mẫu cho các phiếu 'claimed'
        if (warranty.status === 'claimed') {
          const claimTypes = ['polish', 'stone_fix', 'resize', 'repair'];
          await db('warranty_claims').insert({
            warranty_id: warranty.id,
            claim_type: claimTypes[item.seq % claimTypes.length],
            notes: 'Khách hàng mang sản phẩm qua showroom yêu cầu làm sạch và kiểm tra chấu giữ kim cương.',
            processed_by: adminId,
            claimed_at: new Date(),
          });
        }
      }
    }
  }
  console.log(`✅ Đã tạo ${createdWarranties.length} phiếu bảo hành chính hãng và các yêu cầu xử lý claim.`);

  // ──────────────────────────────────────────────────────────────────────────
  // 6. MỤC 7: QUẢN LÝ ĐÁNH GIÁ (REVIEWS & RATINGS)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n⭐ [6/7] Đang tạo Đánh Giá & Nhận Xét khách hàng chi tiết...');
  const detailedReviews = [
    { rating: 5, title: 'Nhẫn kim cương Solitaire 18K lộng lẫy ngoài mong đợi!', body: 'Kim cương GIA chuẩn màu E/VVS1 cực kỳ trong suốt và phát sáng lấp lánh dưới mọi góc sáng. Khắc chữ mặt trong rất tinh xảo. Cảm ơn shop rất nhiều!', is_approved: true },
    { rating: 5, title: 'Dây chuyền cỏ 4 lá vàng hồng cực kỳ duyên dáng', body: 'Chất liệu xà cừ óng ánh tự nhiên, viền vàng hồng 18K sắc sảo. Hộp nhung và túi xách sang trọng, rất thích hợp làm quà tặng.', is_approved: true },
    { rating: 5, title: 'Đóng gói chuẩn VIP, giao hàng hỏa tốc trong 2h', body: 'Giao hàng có nhân viên bảo vệ đi kèm và kiểm tra mã số cạnh kim cương bằng kính lúp tại chỗ. Dịch vụ số 1 Việt Nam!', is_approved: true },
    { rating: 5, title: 'Bông tai ngọc trai Akoya Nhật Bản xuất sắc', body: 'Ngọc trai tròn xoe, ánh hồng phấn rất sang trọng và quý phái. Đeo cả ngày không hề bị đau tai hay kích ứng.', is_approved: true },
    { rating: 4, title: 'Vòng tay Tennis kim cương rất chắc chắn', body: 'Vòng đeo vừa vặn tay, kim cương tấm sáng đều màu. Khóa gài đôi rất an toàn, không lo bị tuột.', is_approved: true },
    { rating: 5, title: 'Tra cứu bảo hành điện tử bằng số điện thoại cực tiện', body: 'Không cần mang theo thẻ cứng lỉnh kỉnh, chỉ cần đọc SĐT là nhân viên showroom tiếp nhận đánh bóng miễn phí ngay.', is_approved: true },
    { rating: 5, title: 'Nhẫn cưới Eternity hoàn mỹ cho ngày trọng đại', body: 'Cặp nhẫn đính kim cương tấm kín viền rất sang. Nhân viên hỗ trợ đo ni tay và khắc tên ngày cưới rất chu đáo.', is_approved: false }, // Chờ Admin duyệt
    { rating: 4, title: 'Sản phẩm đẹp nhưng thời gian giao hơi lâu chút', body: 'Chất lượng nhẫn 5 sao nhưng do đợt lễ giao hơi trễ 1 hôm. Bù lại sản phẩm quá đẹp và có kèm quà tặng.', is_approved: false }, // Chờ Admin duyệt
  ];

  for (let i = 0; i < detailedReviews.length && i < createdOrderItemsForWarranties.length; i++) {
    const item = createdOrderItemsForWarranties[i];
    const rev = detailedReviews[i];

    const existing = await db('reviews').where({ order_item_id: item.orderItem.id }).first();
    if (!existing) {
      await db('reviews').insert({
        product_id: item.product.id,
        variant_id: item.variant.id,
        user_id: item.user.id,
        order_item_id: item.orderItem.id,
        rating: rev.rating,
        title: rev.title,
        body: rev.body,
        is_approved: rev.is_approved,
        is_verified: true,
        created_at: new Date(),
      });
    }
  }
  console.log('✅ Đã tạo các đánh giá & nhận xét khách hàng (gồm cả đánh giá đã duyệt và chờ duyệt).');

  console.log('\n========================================================================');
  console.log('🎉 TẤT CẢ 7 MỤC TRÊN ADMIN ĐÃ ĐƯỢC NẠP DỮ LIỆU HOÀN THIỆN 100%!');
  console.log('========================================================================');
}

exports.seed = async function(knex) {
  await seedMassiveData(knex);
};

if (require.main === module) {
  seedMassiveData().then(() => process.exit(0)).catch((err) => {
    console.error('❌ Lỗi khi nạp dữ liệu:', err);
    process.exit(1);
  });
}

