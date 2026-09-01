const express = require('express');
const router = express.Router();
const { authenticate, optionalAuthenticate } = require('../../shared/middleware/auth.middleware');
const { authorize } = require('../../shared/middleware/rbac.middleware');
const { createOrder, updateOrderStatus } = require('./orders.service');
const db = require('../../config/database');
const { success, paginated } = require('../../shared/utils/apiResponse');
const { v4: uuidv4 } = require('uuid');
const { notifyOrderStatusChange } = require('../notifications/notifications.service');

// POST /api/v1/orders — Tạo đơn hàng
router.post('/', optionalAuthenticate, async (req, res, next) => {
  try {
    const idempotencyKey = req.headers['x-idempotency-key'] || uuidv4();
    const { order, isIdempotent } = await createOrder({
      ...req.body,
      userId: req.user?.id || null,
      idempotencyKey,
    });
    success(res, order, isIdempotent ? 'Đơn hàng đã tồn tại.' : 'Đặt hàng thành công!', 201);
  } catch (err) { next(err); }
});

// GET /api/v1/orders — Lịch sử đơn hàng của user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [orders, countResult] = await Promise.all([
      db('orders').where({ user_id: req.user.id }).orderBy('created_at', 'desc').limit(limit).offset(offset),
      db('orders').where({ user_id: req.user.id }).count('id as total').first(),
    ]);

    paginated(res, orders, { page, limit, total: parseInt(countResult.total) });
  } catch (err) { next(err); }
});

// GET /api/v1/orders/:orderNumber — Theo dõi đơn hàng
router.get('/:orderNumber', optionalAuthenticate, async (req, res, next) => {
  try {
    const order = await db('orders').where({ order_number: req.params.orderNumber }).first();
    if (!order) return next(require('../../shared/utils/ApiError').notFound('ORDER_NOT_FOUND', 'Đơn hàng không tồn tại.'));

    const items = await db('order_items').where({ order_id: order.id });
    const history = await db('order_status_history').where({ order_id: order.id }).orderBy('created_at', 'asc');

    success(res, { ...order, items, history });
  } catch (err) { next(err); }
});

// POST /api/v1/orders/:id/cancel — Hủy đơn
router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const order = await db('orders').where({ id: req.params.id, user_id: req.user.id }).first();
    const ApiError = require('../../shared/utils/ApiError');
    if (!order) return next(ApiError.notFound('ORDER_NOT_FOUND', 'Đơn hàng không tồn tại.'));
    if (!['pending'].includes(order.status)) return next(ApiError.badRequest('CANNOT_CANCEL', 'Chỉ có thể hủy đơn hàng ở trạng thái chờ xử lý.'));

    await updateOrderStatus(order.id, 'cancelled', req.user.id, 'Khách hàng tự hủy đơn.');
    success(res, null, 'Đã hủy đơn hàng.');
  } catch (err) { next(err); }
});

// ─── ADMIN ROUTES ────────────────────────────────────────────────────────────

// GET /api/v1/orders/admin/list
router.get('/admin/list', authenticate, authorize('staff'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    let query = db('orders');
    if (status) query = query.where({ status });
    if (search) query = query.where((q) => q.where('order_number', 'ilike', `%${search}%`));

    const [orders, countResult] = await Promise.all([
      query.clone().orderBy('created_at', 'desc').limit(limit).offset(offset),
      query.clone().count('id as total').first(),
    ]);

    paginated(res, orders, { page: +page, limit: +limit, total: parseInt(countResult?.total || 0) });
  } catch (err) { next(err); }
});

// PUT /api/v1/orders/:id/status — Admin cập nhật trạng thái
router.put('/:id/status', authenticate, authorize('staff'), async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const order = await updateOrderStatus(req.params.id, status, req.user.id, note);
    // Gửi thông báo realtime cho khách hàng
    notifyOrderStatusChange(order, status).catch(console.error);
    success(res, order, 'Đã cập nhật trạng thái đơn hàng.');
  } catch (err) { next(err); }
});

module.exports = router;
