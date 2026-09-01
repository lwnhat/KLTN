const bcrypt = require('bcryptjs');

/**
 * Seed: Admin & test users
 */
exports.seed = async function (knex) {
  await knex('users').del();

  const adminHash = await bcrypt.hash('Admin@123456', 12);
  const userHash = await bcrypt.hash('User@123456', 12);

  await knex('users').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      email: 'admin@jewelry.com',
      password_hash: adminHash,
      full_name: 'Super Admin',
      role: 'admin',
      is_verified: true,
      is_active: true,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      email: 'manager@jewelry.com',
      password_hash: adminHash,
      full_name: 'Store Manager',
      role: 'manager',
      is_verified: true,
      is_active: true,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      email: 'staff@jewelry.com',
      password_hash: adminHash,
      full_name: 'Store Staff',
      role: 'staff',
      is_verified: true,
      is_active: true,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      email: 'customer@test.com',
      password_hash: userHash,
      full_name: 'Nguyễn Văn Test',
      role: 'customer',
      is_verified: true,
      is_active: true,
    },
  ]);

  console.log('✅ Seeded: users (admin/manager/staff/customer)');
  console.log('   admin@jewelry.com : Admin@123456');
  console.log('   customer@test.com : User@123456');
};
