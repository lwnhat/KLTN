require('dotenv').config();

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'kltn_jewelry',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    },
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/database/seeds',
    },
    pool: { min: 2, max: 10 },
  },

  test: {
    client: 'pg',
    connection: process.env.TEST_DATABASE_URL || {
      host: 'localhost',
      port: 5432,
      database: 'kltn_jewelry_test',
      user: 'postgres',
      password: 'postgres',
    },
    migrations: { directory: './src/database/migrations' },
    seeds: { directory: './src/database/seeds' },
  },

  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    migrations: { directory: './src/database/migrations' },
    seeds: { directory: './src/database/seeds' },
    pool: { min: 2, max: 20 },
  },
};

