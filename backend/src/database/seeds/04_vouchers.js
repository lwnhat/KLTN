/**
 * Seed: Vouchers & Aftermarket sample data
 */
exports.seed = async function (knex) {
  // Clear existing seed vouchers
  await knex('vouchers').del();

  const admin = await knex('users').where({ role: 'admin' }).first();

  await knex('vouchers').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      code: 'WELCOME2026',
      name: 'Chào mừng thành viên mới - Giảm 10%',
      type: 'percentage',
      value: 10,
      max_discount: 1000000,
      min_order_amount: 5000000,
      usage_limit: 100,
      used_count: 5,
      per_user_limit: 1,
      starts_at: new Date('2026-01-01'),
      expires_at: new Date('2026-12-31'),
      is_active: true,
      created_by: admin?.id || null,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      code: 'DIAMOND500K',
      name: 'Ưu đãi trang sức kim cương - Giảm 500K',
      type: 'fixed_amount',
      value: 500000,
      max_discount: 500000,
      min_order_amount: 15000000,
      usage_limit: 50,
      used_count: 12,
      per_user_limit: 1,
      starts_at: new Date('2026-01-01'),
      expires_at: new Date('2026-12-31'),
      is_active: true,
      created_by: admin?.id || null,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      code: 'FREESHIP',
      name: 'Miễn phí vận chuyển toàn quốc',
      type: 'free_shipping',
      value: 30000,
      min_order_amount: 0,
      usage_limit: 1000,
      used_count: 88,
      per_user_limit: 5,
      starts_at: new Date('2026-01-01'),
      expires_at: new Date('2026-12-31'),
      is_active: true,
      created_by: admin?.id || null,
    },
  ]);

  console.log('✅ Seeded: vouchers (WELCOME2026, DIAMOND500K, FREESHIP)');
};
