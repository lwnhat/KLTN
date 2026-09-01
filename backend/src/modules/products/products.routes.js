const express = require('express');
const router = express.Router();
const productService = require('./products.service');
const { success, paginated } = require('../../shared/utils/apiResponse');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { authorize } = require('../../shared/middleware/rbac.middleware');
const { cache, clearCachePattern } = require('../../shared/middleware/cache.middleware');

// GET /api/v1/products — Danh sách sản phẩm (Cache 60s)
router.get('/', cache(60), async (req, res, next) => {
  try {
    const { page = 1, limit = 12, category, search, material, minPrice, maxPrice, isFeatured, sort } = req.query;
    const { products, total } = await productService.getProducts({
      page: parseInt(page),
      limit: parseInt(limit),
      categorySlug: category,
      search,
      material,
      minPrice,
      maxPrice,
      isFeatured,
      sort,
    });

    paginated(res, products, { page, limit, total });
  } catch (err) { next(err); }
});

// GET /api/v1/products/:slug — Chi tiết sản phẩm (Cache 120s)
router.get('/:slug', cache(120), async (req, res, next) => {
  try {
    const product = await productService.getProductBySlug(req.params.slug);
    success(res, product);
  } catch (err) { next(err); }
});

// POST /api/v1/products — Tạo sản phẩm mới (Admin/Manager)
router.post('/', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body, req.user.id);
    await clearCachePattern('/api/v1/products*');
    success(res, product, 'Tạo sản phẩm thành công.', 201);
  } catch (err) { next(err); }
});

// PUT /api/v1/products/:id — Cập nhật sản phẩm (Admin/Manager)
router.put('/:id', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    await clearCachePattern('/api/v1/products*');
    success(res, product, 'Cập nhật sản phẩm thành công.');
  } catch (err) { next(err); }
});

// DELETE /api/v1/products/:id — Xóa sản phẩm (Admin/Manager)
router.delete('/:id', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    await clearCachePattern('/api/v1/products*');
    success(res, null, 'Đã xóa sản phẩm thành công.');
  } catch (err) { next(err); }
});

module.exports = router;

