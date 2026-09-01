const express = require('express');
const router = express.Router();
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { authorize } = require('../../shared/middleware/rbac.middleware');
const reviewService = require('./reviews.service');
const { success, paginated } = require('../../shared/utils/apiResponse');

// POST /api/v1/reviews — Tạo review (user đã mua)
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { productId, variantId, orderItemId, rating, title, body, images } = req.body;
    const review = await reviewService.createReview({
      userId: req.user.id, productId, variantId, orderItemId, rating, title, body, images,
    });
    success(res, review, 'Cảm ơn bạn đã đánh giá! Review sẽ được hiển thị sau khi được duyệt.', 201);
  } catch (err) { next(err); }
});

// GET /api/v1/reviews/product/:productId — Lấy reviews của sản phẩm
router.get('/product/:productId', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await reviewService.getProductReviews(req.params.productId, { page: +page, limit: +limit });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// GET /api/v1/reviews/admin — Danh sách review chờ duyệt (admin)
router.get('/admin', authenticate, authorize('staff'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await reviewService.getPendingReviews({ page: +page, limit: +limit });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// GET /api/v1/reviews/admin/all — Alias cho admin reviews
router.get('/admin/all', authenticate, authorize('staff'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, approved } = req.query;
    const offset = (page - 1) * limit;
    const db = require('../../config/database');

    let query = db('reviews as r')
      .join('users as u', 'r.user_id', 'u.id')
      .join('products as p', 'r.product_id', 'p.id')
      .whereNull('p.deleted_at');


    if (approved !== undefined) query = query.where('r.is_approved', approved === 'true');

    const [reviews, countResult] = await Promise.all([
      query.clone()
        .select('r.*', 'u.full_name as reviewer_name', 'u.email as reviewer_email', 'p.name as product_name')
        .orderBy('r.created_at', 'desc')
        .limit(limit)
        .offset(offset),
      query.clone().count('r.id as total').first(),
    ]);

    paginated(res, reviews, { page: +page, limit: +limit, total: parseInt(countResult?.total || 0) });
  } catch (err) { next(err); }
});

// PUT /api/v1/reviews/:id/status — Cập nhật trạng thái duyệt review
router.put('/:id/status', authenticate, authorize('staff'), async (req, res, next) => {
  try {
    const { isApproved } = req.body;
    const db = require('../../config/database');
    const [review] = await db('reviews').where('id', req.params.id)
      .update({ is_approved: !!isApproved, approved_by: req.user.id, updated_at: new Date() })
      .returning('*');
    success(res, review, 'Đã cập nhật trạng thái đánh giá.');
  } catch (err) { next(err); }
});

// PUT /api/v1/reviews/:id/approve — Duyệt review (admin)
router.put('/:id/approve', authenticate, authorize('staff'), async (req, res, next) => {
  try {
    const review = await reviewService.approveReview(req.params.id, req.user.id);
    success(res, review, 'Đã duyệt review.');
  } catch (err) { next(err); }
});

// DELETE /api/v1/reviews/:id — Xóa review (admin)
router.delete('/:id', authenticate, authorize('staff'), async (req, res, next) => {
  try {
    await reviewService.deleteReview(req.params.id);
    success(res, null, 'Đã xóa review.');
  } catch (err) { next(err); }
});

module.exports = router;
