/**
 * Migration 004: Vouchers, Warranties, Reviews, Wishlist, Notifications, Audit
 */
exports.up = async function (knex) {
  // Vouchers
  await knex.schema.createTable('vouchers', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('code', 50).notNullable().unique();
    t.string('name', 255).notNullable();
    t.string('type', 20).notNullable();
    t.decimal('value', 10, 2).notNullable();
    t.decimal('max_discount', 15, 2);
    t.decimal('min_order_amount', 15, 2).defaultTo(0);
    t.string('applicable_to', 20).defaultTo('all');
    t.specificType('applicable_ids', 'uuid[]');
    t.integer('usage_limit');
    t.integer('used_count').defaultTo(0);
    t.integer('per_user_limit').defaultTo(1);
    t.timestamp('starts_at').notNullable();
    t.timestamp('expires_at').notNullable();
    t.boolean('is_active').defaultTo(true);
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index('code');
  });

  await knex.schema.createTable('voucher_usages', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('voucher_id').notNullable().references('id').inTable('vouchers');
    t.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    t.uuid('order_id').notNullable().references('id').inTable('orders');
    t.decimal('discount_applied', 15, 2).notNullable();
    t.timestamp('used_at').defaultTo(knex.fn.now());
    t.unique(['voucher_id', 'order_id']);
  });

  // Warranties
  await knex.schema.createTable('warranties', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('warranty_code', 50).notNullable().unique();
    t.uuid('order_id').notNullable().references('id').inTable('orders');
    t.uuid('order_item_id').notNullable().references('id').inTable('order_items');
    t.uuid('variant_id').references('id').inTable('variants').onDelete('SET NULL');
    t.uuid('instance_id').references('id').inTable('variant_instances').onDelete('SET NULL');
    t.string('customer_name', 255).notNullable();
    t.string('customer_phone', 20).notNullable();
    t.string('customer_email', 255);
    t.date('purchase_date').notNullable();
    t.jsonb('warranty_terms').notNullable();
    t.string('status', 20).defaultTo('active');
    t.text('notes');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index('warranty_code');
    t.index('customer_phone');
    t.index('order_id');
  });

  await knex.schema.createTable('warranty_claims', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('warranty_id').notNullable().references('id').inTable('warranties');
    t.string('claim_type', 30).notNullable();
    t.timestamp('claimed_at').defaultTo(knex.fn.now());
    t.uuid('processed_by').references('id').inTable('users').onDelete('SET NULL');
    t.text('notes');
  });

  // Reviews
  await knex.schema.createTable('reviews', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('product_id').notNullable().references('id').inTable('products');
    t.uuid('variant_id').references('id').inTable('variants').onDelete('SET NULL');
    t.uuid('user_id').notNullable().references('id').inTable('users');
    t.uuid('order_item_id').notNullable().unique().references('id').inTable('order_items');
    t.smallint('rating').notNullable();
    t.string('title', 255);
    t.text('body');
    t.jsonb('images').defaultTo('[]');
    t.boolean('is_verified').defaultTo(true);
    t.boolean('is_approved').defaultTo(false);
    t.uuid('approved_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamps(true, true);
    t.index('product_id');
    t.index('is_approved');
  });

  // Wishlist
  await knex.schema.createTable('wishlists', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('variant_id').notNullable().references('id').inTable('variants').onDelete('CASCADE');
    t.decimal('price_at_add', 15, 2).notNullable();
    t.boolean('notify_on_drop').defaultTo(true);
    t.timestamp('added_at').defaultTo(knex.fn.now());
    t.unique(['user_id', 'variant_id']);
    t.index('user_id');
  });

  // Notifications
  await knex.schema.createTable('notifications', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    t.string('type', 50).notNullable();
    t.string('title', 255).notNullable();
    t.text('body').notNullable();
    t.jsonb('data').defaultTo('{}');
    t.boolean('is_read').defaultTo(false);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['user_id', 'is_read']);
  });

  // Audit Logs
  await knex.schema.createTable('audit_logs', (t) => {
    t.bigIncrements('id').primary();
    t.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    t.string('action', 100).notNullable();
    t.string('entity_type', 50);
    t.uuid('entity_id');
    t.jsonb('old_value');
    t.jsonb('new_value');
    t.specificType('ip_address', 'inet');
    t.text('user_agent');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['entity_type', 'entity_id']);
    t.index(['user_id', 'created_at']);
  });
};

exports.down = async function (knex) {
  const tables = [
    'audit_logs', 'notifications', 'wishlists', 'reviews',
    'warranty_claims', 'warranties', 'voucher_usages', 'vouchers',
  ];
  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
};
