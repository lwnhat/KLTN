const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { success } = require('../../shared/utils/apiResponse');
const ApiError = require('../../shared/utils/ApiError');

// GET /api/v1/warranties/lookup?query=... hoặc phone=... hoặc code=...
router.get('/lookup', async (req, res, next) => {
  try {
    const { query, phone, code } = req.query;
    const searchTerm = query || phone || code;

    if (!searchTerm) {
      throw ApiError.badRequest('MISSING_QUERY', 'Vui lòng cung cấp Số điện thoại hoặc Mã bảo hành để tra cứu.');
    }

    const warranties = await db('warranties as w')
      .leftJoin('variants as v', 'w.variant_id', 'v.id')
      .leftJoin('products as p', 'v.product_id', 'p.id')
      .where((builder) => {
        builder
          .where('w.warranty_code', 'ilike', `%${searchTerm.trim()}%`)
          .orWhere('w.customer_phone', 'ilike', `%${searchTerm.trim()}%`);
      })
      .select(
        'w.id',
        'w.warranty_code',
        'w.customer_name',
        'w.customer_phone',
        'w.purchase_date',
        'w.warranty_terms',
        'w.status',
        'w.notes',
        'w.created_at',
        'v.name as variant_name',
        'p.name as product_name',
        'p.slug as product_slug'
      )
      .orderBy('w.created_at', 'desc');

    success(res, warranties, `Tìm thấy ${warranties.length} phiếu bảo hành.`);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/warranties/:code
router.get('/:code', async (req, res, next) => {
  try {
    const warranty = await db('warranties as w')
      .leftJoin('variants as v', 'w.variant_id', 'v.id')
      .leftJoin('products as p', 'v.product_id', 'p.id')
      .where('w.warranty_code', req.params.code)
      .select(
        'w.*',
        'v.name as variant_name',
        'p.name as product_name',
        'p.slug as product_slug'
      )
      .first();

    if (!warranty) {
      throw ApiError.notFound('WARRANTY_NOT_FOUND', 'Không tìm thấy phiếu bảo hành này.');
    }

    const claims = await db('warranty_claims')
      .where('warranty_id', warranty.id)
      .orderBy('claimed_at', 'desc');

    success(res, { ...warranty, claims });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
