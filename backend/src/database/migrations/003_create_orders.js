/**
 * Migration 003: Cart, Orders, Payments tables
 */
exports.up = async function (knex) {
  // Carts
  await knex.schema.createTable('carts', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    t.string('session_id', 255); // Guest cart
    t.timestamp('expires_at');
    t.timestamps(true, true);
    t.index('user_id');
    t.index('session_id');
  });

  // Cart Items
  await knex.schema.createTable('cart_items', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('cart_id').notNullable().references('id').inTable('carts').onDelete('CASCADE');
    t.uuid('variant_id').notNullable().references('id').inTable('variants');
    t.uuid('instance_id').references('id').inTable('variant_instances');
    t.integer('quantity').notNullable().defaultTo(1);
    t.decimal('price_snapshot', 15, 2).notNullable();
    t.jsonb('customization_metadata'); // ★ Khắc chữ, chiều dài dây chuyền...
    t.boolean('is_customized').defaultTo(false);
    t.boolean('non_returnable').defaultTo(false);
    t.string('hold_key', 255); // Redis hold key
    t.timestamp('hold_expires_at');
    t.timestamps(true, true);
    t.index('cart_id');
  });

  // Orders
  await knex.schema.createTable('orders', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('order_number', 30).notNullable().unique();
    t.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    t.jsonb('customer_snapshot').notNullable();
    t.jsonb('shipping_address').notNullable();
    t.string('status', 30).notNullable().defaultTo('pending');
    t.decimal('subtotal', 15, 2).notNullable();
    t.decimal('discount_amount', 15, 2).defaultTo(0);
    t.string('voucher_code', 50);
    t.decimal('shipping_fee', 15, 2).defaultTo(0);
    t.decimal('tax_amount', 15, 2).defaultTo(0);
    t.decimal('total_amount', 15, 2).notNullable();
    t.string('payment_method', 30).notNullable();
    t.string('payment_status', 20).defaultTo('pending');
    t.string('idempotency_key', 255).unique();
    t.text('notes');
    t.text('admin_notes');
    t.timestamp('confirmed_at');
    t.timestamp('shipped_at');
    t.timestamp('delivered_at');
    t.timestamp('completed_at');
    t.timestamp('cancelled_at');
    t.text('cancel_reason');
    t.uuid('handled_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamps(true, true);
    t.index('user_id');
    t.index('status');
    t.index('order_number');
    t.index('payment_status');
  });

  // Order Items
  await knex.schema.createTable('order_items', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
    t.uuid('variant_id').references('id').inTable('variants').onDelete('SET NULL');
    t.uuid('instance_id').references('id').inTable('variant_instances').onDelete('SET NULL');
    t.string('sku_snapshot', 100).notNullable();
    t.string('product_name_snapshot', 500).notNullable();
    t.string('variant_name_snapshot', 255);
    t.text('image_snapshot');
    t.decimal('price_snapshot', 15, 2).notNullable();
    t.integer('quantity').notNullable();
    t.jsonb('customization_metadata');
    t.boolean('is_customized').defaultTo(false);
    t.boolean('non_returnable').defaultTo(false);
    t.integer('returned_quantity').defaultTo(0);
    t.decimal('refund_amount', 15, 2).defaultTo(0);
    t.index('order_id');
  });

  // Order Status History
  await knex.schema.createTable('order_status_history', (t) => {
    t.bigIncrements('id').primary();
    t.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
    t.string('from_status', 30);
    t.string('to_status', 30).notNullable();
    t.text('note');
    t.uuid('changed_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index('order_id');
  });

  // Payments
  await knex.schema.createTable('payments', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
    t.string('provider', 20).notNullable();
    t.string('transaction_id', 255);
    t.string('provider_order_id', 255);
    t.decimal('amount', 15, 2).notNullable();
    t.string('currency', 5).defaultTo('VND');
    t.string('status', 20).defaultTo('pending');
    t.string('idempotency_key', 255).notNullable().unique();
    t.jsonb('webhook_payload');
    t.timestamp('paid_at');
    t.timestamps(true, true);
    t.index('order_id');
    t.index('transaction_id');
  });

  // Refunds
  await knex.schema.createTable('refunds', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('order_id').notNullable().references('id').inTable('orders');
    t.uuid('payment_id').notNullable().references('id').inTable('payments');
    t.decimal('amount', 15, 2).notNullable();
    t.text('reason').notNullable();
    t.string('status', 20).defaultTo('pending');
    t.string('refund_method', 30);
    t.jsonb('bank_info');
    t.uuid('processed_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('processed_at');
    t.text('notes');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  const tables = ['refunds', 'payments', 'order_status_history', 'order_items', 'orders', 'cart_items', 'carts'];
  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
};
