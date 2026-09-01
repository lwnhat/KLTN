/**
 * Seed: Rich Jewelry Products, Variants, Certificates for Shop Trang Sức
 */
exports.seed = async function (knex) {
  // Clear existing items in reverse order
  await knex('certificates').del();
  await knex('variant_options').del();
  await knex('variants').del();
  await knex('product_attribute_values').del();
  await knex('products').del();

  // Get Category IDs
  const categories = await knex('categories').select('id', 'slug');
  const catMap = {};
  categories.forEach((c) => { catMap[c.slug] = c.id; });

  const admin = await knex('users').where({ role: 'admin' }).first();
  const adminId = admin ? admin.id : null;

  // 1. Nhẫn Kim Cương Solitaire 18K (Featured Product)
  const [productRing] = await knex('products').insert({
    id: knex.raw('gen_random_uuid()'),
    category_id: catMap['nhan'] || null,
    name: 'Nhẫn Kim Cương Solitaire 18K Luxury',
    slug: 'nhan-kim-cuong-solitaire-18k-luxury',
    description: 'Nhẫn Solitaire chế tác thủ công tỉ mỉ với chất liệu Vàng 18K đính 1 viên kim cương chủ chuẩn kiểm định GIA. Thiết kế 6 chấu cổ điển tôn vinh vẻ đẹp vĩnh cữu của tình yêu.',
    short_description: 'Vàng 18K đính Kim cương GIA 0.5ct - 1.0ct, miễn phí khắc chữ.',
    brand: 'KLTN Fine Jewelry',
    material: 'Vàng 18K',
    base_price: 35000000.00,
    status: 'active',
    is_featured: true,
    tags: ['nhan-kim-cuong', 'bestseller', 'solitaire', 'wedding'],
    created_by: adminId,
  }).returning('*');

  // Variants cho Nhẫn Kim Cương
  const [vRing1] = await knex('variants').insert({
    id: knex.raw('gen_random_uuid()'),
    product_id: productRing.id,
    sku: 'NKD-18K-SIZE6-0.5CT',
    name: 'Size 6 - Kim Cương 0.5ct - Vàng 18K',
    price: 35000000.00,
    compare_price: 39000000.00,
    cost_price: 25000000.00,
    weight_gram: 3.50,
    inventory_type: 'pool',
    stock_quantity: 15,
    reserved_quantity: 0,
    allow_engraving: true,
    engraving_fee: 150000.00,
    max_engraving_chars: 30,
    images: JSON.stringify([
      { url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80', alt: 'Nhẫn kim cương Solitaire 18K mặt trước', is_primary: true },
      { url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80', alt: 'Nhẫn kim cương Solitaire 18K đeo tay', is_primary: false }
    ]),
    is_active: true,
  }).returning('*');

  const [vRing2] = await knex('variants').insert({
    id: knex.raw('gen_random_uuid()'),
    product_id: productRing.id,
    sku: 'NKD-18K-SIZE7-1.0CT',
    name: 'Size 7 - Kim Cương 1.0ct - Vàng 18K (Serialized GIA)',
    price: 85000000.00,
    compare_price: 95000000.00,
    cost_price: 60000000.00,
    weight_gram: 4.20,
    inventory_type: 'serialized',
    stock_quantity: 3,
    reserved_quantity: 0,
    allow_engraving: true,
    engraving_fee: 200000.00,
    max_engraving_chars: 30,
    images: JSON.stringify([
      { url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80', alt: 'Nhẫn kim cương 1ct', is_primary: true }
    ]),
    is_active: true,
  }).returning('*');

  // Certificates cho Variant 1 & 2
  await knex('certificates').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      product_id: productRing.id,
      variant_id: vRing1.id,
      cert_number: 'GIA-245891001',
      issuer: 'GIA',
      cert_type: 'diamond_grading',
      issued_date: '2024-01-15',
      file_url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
      file_type: 'pdf',
      details: JSON.stringify({ carat: 0.50, cut: 'Excellent', color: 'D', clarity: 'VVS1', fluorescence: 'None' }),
      is_active: true,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      product_id: productRing.id,
      variant_id: vRing2.id,
      cert_number: 'GIA-789012344',
      issuer: 'GIA',
      cert_type: 'diamond_grading',
      issued_date: '2024-02-01',
      file_url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
      file_type: 'pdf',
      details: JSON.stringify({ carat: 1.01, cut: 'Ideal', color: 'E', clarity: 'VVS2', fluorescence: 'None' }),
      is_active: true,
    }
  ]);

  // 2. Dây Chuyền Vàng Ý 750 Mặt Trái Tim
  const [productNecklace] = await knex('products').insert({
    id: knex.raw('gen_random_uuid()'),
    category_id: catMap['day-chuyen'] || null,
    name: 'Dây Chuyền Vàng Ý 750 Mặt Trái Tim Chạm Khắc',
    slug: 'day-chuyen-vang-y-750-mat-trai-tim',
    description: 'Dây chuyền Vàng Ý 750 cao cấp với thiết kế mặt trái tim thanh lịch, phủ mạ rhodium bắt sáng tinh tế.',
    short_description: 'Vàng Ý 750, chiều dài linh hoạt 40cm - 45cm.',
    brand: 'KLTN Fine Jewelry',
    material: 'Vàng Ý 750',
    base_price: 12500000.00,
    status: 'active',
    is_featured: true,
    tags: ['day-chuyen', 'gift', 'heart'],
    created_by: adminId,
  }).returning('*');

  await knex('variants').insert({
    id: knex.raw('gen_random_uuid()'),
    product_id: productNecklace.id,
    sku: 'DCV-750-45CM',
    name: 'Chiều dài 45cm - Vàng Ý 750',
    price: 12500000.00,
    compare_price: 14000000.00,
    stock_quantity: 20,
    allow_engraving: true,
    engraving_fee: 100000.00,
    max_engraving_chars: 15,
    images: JSON.stringify([
      { url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80', alt: 'Dây chuyền vàng mặt trái tim', is_primary: true }
    ]),
    is_active: true,
  });

  // 3. Bông Tai Ngọc Trai South Sea Vàng 18K
  const [productEarring] = await knex('products').insert({
    id: knex.raw('gen_random_uuid()'),
    category_id: catMap['bong-tai'] || null,
    name: 'Bông Tai Ngọc Trai South Sea Ánh Vàng 18K',
    slug: 'bong-tai-ngoc-trai-south-sea-18k',
    description: 'Được tuyển chọn từ những viên ngọc trai South Sea tự nhiên tròn hoàn hảo, kết hợp chân nón Vàng 18K sang trọng.',
    short_description: 'Ngọc trai South Sea 10mm - 11mm, Vàng 18K.',
    brand: 'KLTN Fine Jewelry',
    material: 'Vàng 18K',
    base_price: 18900000.00,
    status: 'active',
    is_featured: true,
    tags: ['bong-tai', 'ngoc-trai', 'south-sea'],
    created_by: adminId,
  }).returning('*');

  await knex('variants').insert({
    id: knex.raw('gen_random_uuid()'),
    product_id: productEarring.id,
    sku: 'BT-PEARL-10MM',
    name: 'Size Ngọc Trai 10mm - Vàng 18K',
    price: 18900000.00,
    stock_quantity: 8,
    allow_engraving: false,
    images: JSON.stringify([
      { url: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=80', alt: 'Bông tai ngọc trai South Sea', is_primary: true }
    ]),
    is_active: true,
  });

  console.log('✅ Seeded: jewelry products, variants, and GIA certificates!');
};
