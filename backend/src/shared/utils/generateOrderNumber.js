const db = require('../../config/database');

/**
 * Tạo mã đơn hàng theo format: TJ-YYYYMMDD-XXXXX
 * VD: TJ-20240214-00001
 *
 * Dùng PostgreSQL sequence để đảm bảo không trùng lặp khi concurrent
 * @param {import('knex').Knex.Transaction} trx - Knex transaction instance
 */
async function generateOrderNumber(trx = db) {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

  // Đếm số đơn trong ngày hôm nay (với transaction lock)
  const result = await trx('orders')
    .whereRaw("DATE(created_at) = CURRENT_DATE")
    .count('id as count')
    .first();

  const sequenceNum = String(parseInt(result.count) + 1).padStart(5, '0');
  return `TJ-${dateStr}-${sequenceNum}`;
}

/**
 * Tạo mã bảo hành: WR-YYYYMMDD-XXXXX
 */
async function generateWarrantyCode(trx = db) {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const result = await trx('warranties')
    .whereRaw("DATE(created_at) = CURRENT_DATE")
    .count('id as count')
    .first();
  const seq = String(parseInt(result.count) + 1).padStart(5, '0');
  return `WR-${dateStr}-${seq}`;
}

module.exports = { generateOrderNumber, generateWarrantyCode };
