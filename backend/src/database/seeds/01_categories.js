/**
 * Seed: Categories cho shop trang sức
 */
exports.seed = async function (knex) {
  await knex('categories').del();

  await knex('categories').insert([
    // Danh mục gốc
    { id: knex.raw('gen_random_uuid()'), name: 'Nhẫn', slug: 'nhan', sort_order: 1, is_active: true },
    { id: knex.raw('gen_random_uuid()'), name: 'Dây chuyền', slug: 'day-chuyen', sort_order: 2, is_active: true },
    { id: knex.raw('gen_random_uuid()'), name: 'Bông tai', slug: 'bong-tai', sort_order: 3, is_active: true },
    { id: knex.raw('gen_random_uuid()'), name: 'Vòng tay', slug: 'vong-tay', sort_order: 4, is_active: true },
    { id: knex.raw('gen_random_uuid()'), name: 'Lắc', slug: 'lac', sort_order: 5, is_active: true },
    { id: knex.raw('gen_random_uuid()'), name: 'Bộ trang sức', slug: 'bo-trang-suc', sort_order: 6, is_active: true },
  ]);

  console.log('✅ Seeded: categories');
};
