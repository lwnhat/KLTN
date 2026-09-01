/**
 * Migration 002: Product Catalog tables
 * categories → attribute_definitions → products → product_attribute_values
 * → variants → variant_options → variant_instances → certificates
 */
exports.up = async function (knex) {
  // Categories (self-referencing tree)
  await knex.schema.createTable('categories', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('parent_id').references('id').inTable('categories').onDelete('SET NULL');
    t.string('name', 255).notNullable();
    t.string('slug', 255).notNullable().unique();
    t.text('description');
    t.text('image_url');
    t.integer('sort_order').defaultTo(0);
    t.boolean('is_active').defaultTo(true);
    t.jsonb('seo_metadata').defaultTo('{}');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index('slug');
    t.index('parent_id');
  });

  // Dynamic Attribute Definitions (Admin configures)
  await knex.schema.createTable('attribute_definitions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 100).notNullable();
    t.string('code', 50).notNullable().unique(); // "clarity", "weight_gram"
    t.string('type', 20).notNullable().defaultTo('text'); // text|number|select|boolean
    t.string('unit', 20); // "ct", "g"
    t.jsonb('options'); // ["VVS1","VVS2"] for select type
    t.boolean('is_filterable').defaultTo(false);
    t.boolean('is_required').defaultTo(false);
    t.integer('sort_order').defaultTo(0);
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Products (Master)
  await knex.schema.createTable('products', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('category_id').references('id').inTable('categories').onDelete('SET NULL');
    t.string('name', 500).notNullable();
    t.string('slug', 500).notNullable().unique();
    t.text('description');
    t.text('short_description');
    t.string('brand', 100);
    t.string('material', 100);
    t.decimal('base_price', 15, 2);
    t.string('status', 20).notNullable().defaultTo('draft');
    t.boolean('is_featured').defaultTo(false);
    t.specificType('tags', 'text[]');
    t.jsonb('seo_metadata').defaultTo('{}');
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamps(true, true);
    t.timestamp('deleted_at');
    t.index('slug');
    t.index('category_id');
    t.index('status');
  });
  await knex.raw(`ALTER TABLE products ADD CONSTRAINT products_status_check CHECK (status IN ('draft','active','archived'))`);

  // Product Attribute Values
  await knex.schema.createTable('product_attribute_values', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    t.uuid('attribute_id').notNullable().references('id').inTable('attribute_definitions').onDelete('CASCADE');
    t.text('value_text');
    t.decimal('value_number', 15, 4);
    t.unique(['product_id', 'attribute_id']);
  });

  // Variants
  await knex.schema.createTable('variants', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    t.string('sku', 100).notNullable().unique();
    t.string('name', 255);
    t.decimal('price', 15, 2).notNullable();
    t.decimal('compare_price', 15, 2);
    t.decimal('cost_price', 15, 2);
    t.decimal('weight_gram', 8, 2);
    t.jsonb('images').defaultTo('[]');
    t.string('inventory_type', 20).notNullable().defaultTo('pool');
    t.integer('stock_quantity').defaultTo(0);
    t.integer('reserved_quantity').defaultTo(0);
    t.integer('low_stock_threshold').defaultTo(5);
    t.boolean('allow_engraving').defaultTo(false);
    t.decimal('engraving_fee', 10, 2).defaultTo(0);
    t.integer('max_engraving_chars').defaultTo(30);
    t.integer('sort_order').defaultTo(0);
    t.boolean('is_active').defaultTo(true);
    t.timestamps(true, true);
    t.index('product_id');
    t.index('sku');
  });
  await knex.raw(`ALTER TABLE variants ADD CONSTRAINT variants_inventory_type_check CHECK (inventory_type IN ('pool','serialized'))`);

  // Variant Options (size=6, material=Vàng 18K)
  await knex.schema.createTable('variant_options', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('variant_id').notNullable().references('id').inTable('variants').onDelete('CASCADE');
    t.string('option_name', 100).notNullable();
    t.string('option_value', 255).notNullable();
    t.index('variant_id');
  });

  // Variant Instances (Serialized Inventory)
  await knex.schema.createTable('variant_instances', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('variant_id').notNullable().references('id').inTable('variants').onDelete('CASCADE');
    t.string('serial_number', 100).notNullable().unique();
    t.string('status', 20).defaultTo('available');
    t.timestamp('acquired_at');
    t.timestamp('sold_at');
    t.text('notes');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index('variant_id');
    t.index('status');
  });
  await knex.raw(`ALTER TABLE variant_instances ADD CONSTRAINT vi_status_check CHECK (status IN ('available','reserved','sold','damaged','returned'))`);

  // Certificates (Giấy kiểm định)
  await knex.schema.createTable('certificates', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('product_id').references('id').inTable('products').onDelete('CASCADE');
    t.uuid('variant_id').references('id').inTable('variants').onDelete('CASCADE');
    t.uuid('instance_id').references('id').inTable('variant_instances').onDelete('CASCADE');
    t.string('cert_number', 100).notNullable().unique();
    t.string('issuer', 100).notNullable();
    t.string('cert_type', 50).notNullable();
    t.date('issued_date').notNullable();
    t.text('file_url').notNullable();
    t.string('file_type', 10).defaultTo('pdf');
    t.jsonb('details').defaultTo('{}');
    t.boolean('is_active').defaultTo(true);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index('cert_number');
    t.index('variant_id');
  });

  // Product Relations (Cross-sell / Up-sell)
  await knex.schema.createTable('product_relations', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    t.uuid('related_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    t.string('relation_type', 20).notNullable();
    t.integer('sort_order').defaultTo(0);
    t.unique(['product_id', 'related_id', 'relation_type']);
  });

  // Inventory Ledger (Audit trail)
  await knex.schema.createTable('inventory_ledger', (t) => {
    t.bigIncrements('id').primary();
    t.uuid('variant_id').notNullable().references('id').inTable('variants');
    t.uuid('instance_id').references('id').inTable('variant_instances');
    t.string('entry_type', 30).notNullable();
    t.integer('quantity_change').notNullable();
    t.integer('quantity_before').notNullable();
    t.integer('quantity_after').notNullable();
    t.string('reference_type', 30);
    t.uuid('reference_id');
    t.text('note');
    t.uuid('performed_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['variant_id', 'created_at']);
  });
};

exports.down = async function (knex) {
  const tables = [
    'inventory_ledger', 'product_relations', 'certificates',
    'variant_instances', 'variant_options', 'variants',
    'product_attribute_values', 'products', 'attribute_definitions', 'categories',
  ];
  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
};
