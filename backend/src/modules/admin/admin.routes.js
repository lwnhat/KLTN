/**
 * ADMIN ROUTES — Dashboard Stats, User Management, Voucher CRUD
 */
const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { authorize } = require('../../shared/middleware/rbac.middleware');
const { success, paginated } = require('../../shared/utils/apiResponse');
const ApiError = require('../../shared/utils/ApiError');
const { clearCachePattern } = require('../../shared/middleware/cache.middleware');


// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────

// GET /api/v1/admin/stats — Tổng quan hệ thống
router.get('/stats', authenticate, authorize('staff'), async (req, res, next) => {
  try {
    const [
      revenueResult,
      ordersResult,
      usersResult,
      productsResult,
      revenueChartResult,
      topProductsResult,
      recentOrdersResult,
      orderStatusResult,
    ] = await Promise.all([
      // Doanh thu tháng này
      db('orders')
        .where('status', 'completed')
        .whereRaw("created_at >= date_trunc('month', NOW())")
        .sum('total_amount as revenue')
        .first(),

      // Đơn hàng theo status
      db('orders').select('status').count('id as count').groupBy('status'),

      // Số user mới tháng này
      db('users')
        .whereRaw("created_at >= date_trunc('month', NOW())")
        .count('id as newUsers')
        .first(),

      // Tổng số sản phẩm active
      db('products')
        .where('status', 'active')
        .whereNull('deleted_at')
        .count('id as total')
        .first(),

      // Doanh thu 7 ngày gần nhất
      db('orders')
        .where('status', 'completed')
        .whereRaw("created_at >= NOW() - INTERVAL '7 days'")
        .select(
          db.raw("DATE_TRUNC('day', created_at) as date"),
          db.raw('SUM(total_amount) as revenue'),
          db.raw('COUNT(id) as orders')
        )
        .groupBy(db.raw("DATE_TRUNC('day', created_at)"))
        .orderBy('date', 'asc'),

      // Top 5 sản phẩm bán chạy
      db('order_items as oi')
        .join('orders as o', 'oi.order_id', 'o.id')
        .whereIn('o.status', ['completed', 'delivered'])
        .select(
          'oi.product_name_snapshot as name',
          db.raw('SUM(oi.quantity) as sold'),
          db.raw('SUM(oi.price_snapshot * oi.quantity) as revenue')
        )
        .groupBy('oi.product_name_snapshot')
        .orderBy('sold', 'desc')
        .limit(5),

      // 5 đơn hàng gần nhất
      db('orders').orderBy('created_at', 'desc').limit(5),

      // Phân phối trạng thái đơn
      db('orders').select('status').count('id as count').groupBy('status'),
    ]);

    const orderStatusMap = {};
    orderStatusResult.forEach(r => { orderStatusMap[r.status] = parseInt(r.count); });

    const totalOrders = Object.values(orderStatusMap).reduce((a, b) => a + b, 0);
    const totalRevenue = parseFloat(revenueResult?.revenue || 0);

    success(res, {
      overview: {
        totalRevenue,
        totalOrders,
        newUsers: parseInt(usersResult?.newUsers || 0),
        totalProducts: parseInt(productsResult?.total || 0),
        pendingOrders: orderStatusMap['pending'] || 0,
        processingOrders: (orderStatusMap['confirmed'] || 0) + (orderStatusMap['processing'] || 0),
      },
      orderStatusDistribution: orderStatusMap,
      revenueChart: revenueChartResult.map(r => ({
        date: r.date,
        revenue: parseFloat(r.revenue || 0),
        orders: parseInt(r.orders || 0),
      })),
      topProducts: topProductsResult.map(r => ({
        name: r.name,
        sold: parseInt(r.sold || 0),
        revenue: parseFloat(r.revenue || 0),
      })),
      recentOrders: recentOrdersResult.map(o => {
        let cust = o.customer_snapshot;
        if (typeof cust === 'string') {
          try { cust = JSON.parse(cust); } catch {}
        }
        return {
          ...o,
          customer_name: cust?.name || cust?.fullName || 'Khách vãng lai',
          customer_phone: cust?.phone || '—',
          customer_email: cust?.email || '',
        };
      }),

    });
  } catch (err) { next(err); }
});

// ─── USER MANAGEMENT ─────────────────────────────────────────────────────────

// GET /api/v1/admin/users
router.get('/users', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, isActive } = req.query;
    const offset = (page - 1) * limit;

    let query = db('users').whereNull('deleted_at');

    if (role) query = query.where({ role });
    if (isActive !== undefined) query = query.where('is_active', isActive === 'true');
    if (search) query = query.where(q =>
      q.where('email', 'ilike', `%${search}%`)
        .orWhere('full_name', 'ilike', `%${search}%`)
        .orWhere('phone', 'ilike', `%${search}%`)
    );

    const [users, countResult] = await Promise.all([
      query.clone()
        .select('id', 'email', 'full_name', 'phone', 'role', 'is_active', 'is_verified', 'last_login_at', 'created_at')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset),
      query.clone().count('id as total').first(),
    ]);

    paginated(res, users, { page: +page, limit: +limit, total: parseInt(countResult?.total || 0) });
  } catch (err) { next(err); }
});

// PUT /api/v1/admin/users/:id/role
router.put('/users/:id/role', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ['customer', 'staff', 'manager', 'admin'];
    if (!validRoles.includes(role)) throw ApiError.badRequest('INVALID_ROLE', 'Role không hợp lệ.');

    // Không thể tự thay đổi role của chính mình
    if (req.params.id === req.user.id) throw ApiError.badRequest('SELF_ROLE_CHANGE', 'Không thể thay đổi role của chính mình.');

    const [user] = await db('users').where('id', req.params.id).update({ role }).returning(['id', 'email', 'full_name', 'role']);
    if (!user) throw ApiError.notFound('USER_NOT_FOUND', 'User không tồn tại.');
    success(res, user, `Đã thay đổi role thành ${role}.`);
  } catch (err) { next(err); }
});

// PUT /api/v1/admin/users/:id/toggle-active
router.put('/users/:id/toggle-active', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const user = await db('users').where('id', req.params.id).first();
    if (!user) throw ApiError.notFound('USER_NOT_FOUND', 'User không tồn tại.');
    const [updated] = await db('users').where('id', req.params.id)
      .update({ is_active: !user.is_active }).returning(['id', 'email', 'is_active']);
    success(res, updated, updated.is_active ? 'Tài khoản đã được kích hoạt.' : 'Tài khoản đã bị vô hiệu hóa.');
  } catch (err) { next(err); }
});

// ─── VOUCHER MANAGEMENT ───────────────────────────────────────────────────────

// GET /api/v1/admin/vouchers
router.get('/vouchers', authenticate, authorize('staff'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isActive } = req.query;
    const offset = (page - 1) * limit;

    let query = db('vouchers');
    if (isActive !== undefined) query = query.where('is_active', isActive === 'true');

    const [vouchers, countResult] = await Promise.all([
      query.clone().orderBy('created_at', 'desc').limit(limit).offset(offset),
      query.clone().count('id as total').first(),
    ]);

    // Thêm usage count
    const voucherIds = vouchers.map(v => v.id);
    const usages = voucherIds.length ? await db('voucher_usages')
      .whereIn('voucher_id', voucherIds)
      .select('voucher_id')
      .count('id as count')
      .groupBy('voucher_id') : [];

    const usageMap = {};
    usages.forEach(u => { usageMap[u.voucher_id] = parseInt(u.count); });

    const enriched = vouchers.map(v => ({
      ...v,
      actualUsage: usageMap[v.id] || 0,
      isExpired: new Date(v.expires_at) < new Date(),
    }));

    paginated(res, enriched, { page: +page, limit: +limit, total: parseInt(countResult?.total || 0) });
  } catch (err) { next(err); }
});

// POST /api/v1/admin/vouchers
router.post('/vouchers', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const { code, name, type, value, maxDiscount, minOrderAmount, usageLimit, perUserLimit, startsAt, expiresAt } = req.body;

    const existing = await db('vouchers').where('code', code.toUpperCase()).first();
    if (existing) throw ApiError.conflict('CODE_EXISTS', 'Mã voucher đã tồn tại.');

    const [voucher] = await db('vouchers').insert({
      code: code.toUpperCase(),
      name,
      type, // 'percentage' | 'fixed_amount' | 'free_shipping'
      value,
      max_discount: maxDiscount || null,
      min_order_amount: minOrderAmount || 0,
      usage_limit: usageLimit || null,
      per_user_limit: perUserLimit || 1,
      starts_at: startsAt || new Date(),
      expires_at: expiresAt,
      is_active: true,
      created_by: req.user.id,
    }).returning('*');

    success(res, voucher, 'Tạo voucher thành công.', 201);
  } catch (err) { next(err); }
});

// PUT /api/v1/admin/vouchers/:id
router.put('/vouchers/:id', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const { name, value, maxDiscount, minOrderAmount, usageLimit, perUserLimit, expiresAt, isActive } = req.body;
    const [voucher] = await db('vouchers').where('id', req.params.id).update({
      ...(name !== undefined && { name }),
      ...(value !== undefined && { value }),
      ...(maxDiscount !== undefined && { max_discount: maxDiscount }),
      ...(minOrderAmount !== undefined && { min_order_amount: minOrderAmount }),
      ...(usageLimit !== undefined && { usage_limit: usageLimit }),
      ...(perUserLimit !== undefined && { per_user_limit: perUserLimit }),
      ...(expiresAt !== undefined && { expires_at: expiresAt }),
      ...(isActive !== undefined && { is_active: isActive }),
    }).returning('*');

    if (!voucher) throw ApiError.notFound('VOUCHER_NOT_FOUND', 'Voucher không tồn tại.');
    success(res, voucher, 'Đã cập nhật voucher.');
  } catch (err) { next(err); }
});

// DELETE /api/v1/admin/vouchers/:id
router.delete('/vouchers/:id', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    await db('vouchers').where('id', req.params.id).update({ is_active: false });
    success(res, null, 'Đã vô hiệu hóa voucher.');
  } catch (err) { next(err); }
});

// ─── WARRANTY MANAGEMENT ─────────────────────────────────────────────────────

// GET /api/v1/admin/warranties
router.get('/warranties', authenticate, authorize('staff'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const offset = (page - 1) * limit;

    let query = db('warranties as w')
      .leftJoin('variants as v', 'w.variant_id', 'v.id')
      .leftJoin('products as p', 'v.product_id', 'p.id');

    if (status) query = query.where('w.status', status);
    if (search) query = query.where(q =>
      q.where('w.warranty_code', 'ilike', `%${search}%`)
        .orWhere('w.customer_phone', 'ilike', `%${search}%`)
        .orWhere('w.customer_name', 'ilike', `%${search}%`)
    );

    const [warranties, countResult] = await Promise.all([
      query.clone()
        .select('w.*', 'v.name as variant_name', 'p.name as product_name')
        .orderBy('w.created_at', 'desc')
        .limit(limit)
        .offset(offset),
      query.clone().count('w.id as total').first(),
    ]);

    paginated(res, warranties, { page: +page, limit: +limit, total: parseInt(countResult?.total || 0) });
  } catch (err) { next(err); }
});

// PUT /api/v1/admin/warranties/:id/status
router.put('/warranties/:id/status', authenticate, authorize('staff'), async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const [warranty] = await db('warranties').where('id', req.params.id)
      .update({ status, notes }).returning('*');
    if (!warranty) throw ApiError.notFound('WARRANTY_NOT_FOUND', 'Phiếu bảo hành không tồn tại.');
    success(res, warranty, 'Đã cập nhật trạng thái bảo hành.');
  } catch (err) { next(err); }
});

// POST /api/v1/admin/warranties/:id/claims
router.post('/warranties/:id/claims', authenticate, authorize('staff'), async (req, res, next) => {
  try {
    const { claimType, notes } = req.body;
    const warranty = await db('warranties').where('id', req.params.id).first();
    if (!warranty) throw ApiError.notFound('WARRANTY_NOT_FOUND', 'Phiếu bảo hành không tồn tại.');

    const [claim] = await db('warranty_claims').insert({
      warranty_id: req.params.id,
      claim_type: claimType,
      notes,
      processed_by: req.user.id,
    }).returning('*');

    success(res, claim, 'Đã tạo yêu cầu bảo hành.', 201);
  } catch (err) { next(err); }
});

// ─── REVIEW MANAGEMENT ───────────────────────────────────────────────────────

// GET /api/v1/admin/reviews — Tất cả review
router.get('/reviews', authenticate, authorize('staff'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, approved } = req.query;
    const offset = (page - 1) * limit;

    let query = db('reviews as r')
      .join('users as u', 'r.user_id', 'u.id')
      .join('products as p', 'r.product_id', 'p.id');

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

// ─── INVENTORY LEDGER ─────────────────────────────────────────────────────────

// GET /api/v1/admin/inventory/ledger
router.get('/inventory/ledger', authenticate, authorize('staff'), async (req, res, next) => {
  try {
    const { page = 1, limit = 30, variantId } = req.query;
    const offset = (page - 1) * limit;

    let query = db('inventory_ledger as il')
      .join('variants as v', 'il.variant_id', 'v.id')
      .join('products as p', 'v.product_id', 'p.id');

    if (variantId) query = query.where('il.variant_id', variantId);

    const [ledger, countResult] = await Promise.all([
      query.clone()
        .select('il.*', 'v.sku', 'v.name as variant_name', 'p.name as product_name')
        .orderBy('il.created_at', 'desc')
        .limit(limit)
        .offset(offset),
      query.clone().count('il.id as total').first(),
    ]);

    paginated(res, ledger, { page: +page, limit: +limit, total: parseInt(countResult?.total || 0) });
  } catch (err) { next(err); }
});

// ─── VARIANT MANAGEMENT ────────────────────────────────────────────────────────

// GET /api/v1/admin/variants?productId=xxx — Danh sách biến thể của 1 sản phẩm
router.get('/variants', authenticate, authorize('staff'), async (req, res, next) => {
  try {
    const { productId } = req.query;
    if (!productId) throw ApiError.badRequest('MISSING_PRODUCT_ID', 'Thiếu productId.');

    const variants = await db('variants')
      .where({ product_id: productId })
      .orderBy('sort_order', 'asc');

    const enriched = variants.map(v => ({
      ...v,
      images: typeof v.images === 'string' ? JSON.parse(v.images) : (v.images || []),
    }));
    success(res, enriched);
  } catch (err) { next(err); }
});

// POST /api/v1/admin/variants — Tạo biến thể mới cho sản phẩm
router.post('/variants', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const {
      productId, name, sku, price, comparePrice,
      stockQuantity = 0, imageUrls = [], allowEngraving = false,
      engravingFee = 0, maxEngravingChars = 20, sortOrder = 0,
    } = req.body;

    if (!productId || !name || !sku || !price) {
      throw ApiError.badRequest('MISSING_FIELDS', 'Thiếu productId, name, sku hoặc price.');
    }

    // Kiểm tra SKU trùng lặp
    const existing = await db('variants').where({ sku }).first();
    if (existing) throw ApiError.badRequest('DUPLICATE_SKU', `SKU "${sku}" đã tồn tại.`);

    // Kiểm tra product tồn tại
    const product = await db('products').where('id', productId).whereNull('deleted_at').first();
    if (!product) throw ApiError.notFound('PRODUCT_NOT_FOUND', 'Sản phẩm không tồn tại.');

    // images: mảng URL => format chuẩn [{ url, alt }]
    const images = imageUrls.map((url, idx) => ({ url, alt: `${name} - ảnh ${idx + 1}` }));

    const [variant] = await db('variants').insert({
      product_id: productId,
      name,
      sku,
      price,
      compare_price: comparePrice || null,
      stock_quantity: stockQuantity,
      reserved_quantity: 0,
      images: JSON.stringify(images),
      allow_engraving: allowEngraving,
      engraving_fee: engravingFee,
      max_engraving_chars: maxEngravingChars,
      sort_order: sortOrder,
      is_active: true,
    }).returning('*');

    await clearCachePattern('/api/v1/products*');
    success(res, { ...variant, images }, 'Tạo biến thể thành công.', 201);
  } catch (err) { next(err); }
});

// PUT /api/v1/admin/variants/:id — Cập nhật biến thể (bao gồm ảnh)
router.put('/variants/:id', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const {
      name, sku, price, comparePrice,
      stockQuantity, imageUrls, allowEngraving, engravingFee,
      maxEngravingChars, sortOrder, isActive,
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (sku !== undefined) updateData.sku = sku;
    if (price !== undefined) updateData.price = price;
    if (comparePrice !== undefined) updateData.compare_price = comparePrice;
    if (stockQuantity !== undefined) updateData.stock_quantity = stockQuantity;
    if (allowEngraving !== undefined) updateData.allow_engraving = allowEngraving;
    if (engravingFee !== undefined) updateData.engraving_fee = engravingFee;
    if (maxEngravingChars !== undefined) updateData.max_engraving_chars = maxEngravingChars;
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;
    if (isActive !== undefined) updateData.is_active = isActive;

    if (imageUrls !== undefined) {
      const images = imageUrls.map((url, idx) => ({ url, alt: `Ảnh ${idx + 1}` }));
      updateData.images = JSON.stringify(images);
    }

    const [variant] = await db('variants').where('id', req.params.id).update(updateData).returning('*');
    if (!variant) throw ApiError.notFound('VARIANT_NOT_FOUND', 'Biến thể không tồn tại.');

    await clearCachePattern('/api/v1/products*');
    const result = { ...variant, images: typeof variant.images === 'string' ? JSON.parse(variant.images) : variant.images };
    success(res, result, 'Đã cập nhật biến thể.');
  } catch (err) { next(err); }
});

// DELETE /api/v1/admin/variants/:id — Xóa biến thể
router.delete('/variants/:id', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const deleted = await db('variants').where('id', req.params.id).update({ is_active: false });
    if (!deleted) throw ApiError.notFound('VARIANT_NOT_FOUND', 'Biến thể không tồn tại.');
    await clearCachePattern('/api/v1/products*');
    success(res, null, 'Đã xóa biến thể.');
  } catch (err) { next(err); }
});

module.exports = router;


