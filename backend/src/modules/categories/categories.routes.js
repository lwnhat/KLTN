const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { success } = require('../../shared/utils/apiResponse');
const { cache } = require('../../shared/middleware/cache.middleware');

// GET /api/v1/categories — Danh sách tất cả danh mục (Cache 5 phút)
router.get('/', cache(300), async (req, res, next) => {
  try {
    const categories = await db('categories')
      .where('is_active', true)
      .orderBy('sort_order', 'asc');
    success(res, categories);
  } catch (err) { next(err); }
});

module.exports = router;

