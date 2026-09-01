/**
 * Migration 001: Users & Auth tables
 */
exports.up = async function (knex) {
  // Enable UUID extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  // Users
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('email', 255).unique().notNullable();
    t.string('phone', 20);
    t.string('password_hash', 255); // NULL if social login only
    t.string('full_name', 255).notNullable();
    t.text('avatar_url');
    t.string('role', 20).notNullable().defaultTo('customer');
    t.boolean('is_verified').defaultTo(false);
    t.boolean('is_active').defaultTo(true);
    t.jsonb('metadata').defaultTo('{}');
    t.timestamp('last_login_at');
    t.timestamps(true, true);
    t.timestamp('deleted_at');
  });
  await knex.raw(`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer','staff','manager','admin'))`);

  // Refresh Tokens
  await knex.schema.createTable('refresh_tokens', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('token_hash', 255).notNullable().unique();
    t.jsonb('device_info');
    t.timestamp('expires_at').notNullable();
    t.timestamp('revoked_at');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index('user_id');
  });

  // OTP Codes
  await knex.schema.createTable('otp_codes', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    t.string('email', 255);
    t.string('code', 10).notNullable();
    t.string('purpose', 30).notNullable();
    t.timestamp('expires_at').notNullable();
    t.timestamp('used_at');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Addresses
  await knex.schema.createTable('addresses', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    t.string('full_name', 255).notNullable();
    t.string('phone', 20).notNullable();
    t.string('province', 100).notNullable();
    t.string('district', 100).notNullable();
    t.string('ward', 100).notNullable();
    t.text('street_address').notNullable();
    t.boolean('is_default').defaultTo(false);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index('user_id');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('addresses');
  await knex.schema.dropTableIfExists('otp_codes');
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('users');
};
