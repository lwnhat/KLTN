/**
 * REVIEWS SERVICE
 * - Tạo review (chỉ khi đã mua hàng)
 * - Lấy review theo sản phẩm
 * - Admin duyệt review
 */
const db = require('../../config/database');
const ApiError = require('../../shared/utils/ApiError');

async function createReview({ userId, productId, variantId, orderItemId, rating, title, body, images }) {
  // Kiểm tra orderItemId thuộc về user này
  const orderItem = await db('order_items as oi')
    .join('orders as o', 'oi.order_id', 'o.id')
    .where('oi.id', orderItemId)
    .where('o.user_id', userId)
    .where('o.status', 'completed')
    .first();

  if (!orderItem) {
    throw ApiError.forbidden('NOT_PURCHASED', 'Bạn chỉ có thể đánh giá sản phẩm đã mua và đơn hàng đã hoàn thành.');
  }

  // Kiểm tra đã review chưa
  const existing = await db('reviews').where({ order_item_id: orderItemId }).first();
  if (existing) {
    throw ApiError.conflict('ALREADY_REVIEWED', 'Bạn đã đánh giá sản phẩm này rồi.');
  }

  if (rating < 1 || rating > 5) {
    throw ApiError.badRequest('INVALID_RATING', 'Đánh giá phải từ 1 đến 5 sao.');
  }

  const [review] = await db('reviews').insert({
    product_id: productId,
    variant_id: variantId || null,
    user_id: userId,
    order_item_id: orderItemId,
    rating,
    title: title || null,
    body: body || null,
    images: images ? JSON.stringify(images) : JSON.stringify([]),
    is_verified: true,
    is_approved: false, // Cần admin duyệt
  }).returning('*');

  return review;
}

async function getProductReviews(productId, { page = 1, limit = 10, approved = true } = {}) {
  const offset = (page - 1) * limit;

  const [reviews, countResult, statsResult] = await Promise.all([
    db('reviews as r')
      .join('users as u', 'r.user_id', 'u.id')
      .where('r.product_id', productId)
      .where('r.is_approved', approved)
      .orderBy('r.created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .select(
        'r.*',
        'u.full_name as reviewer_name',
      ),
    db('reviews').where({ product_id: productId, is_approved: approved }).count('id as total').first(),
    db('reviews').where({ product_id: productId, is_approved: true })
      .avg('rating as avg_rating')
      .count('id as total_reviews')
      .select(
        db.raw('COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star'),
        db.raw('COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star'),
        db.raw('COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star'),
        db.raw('COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star'),
        db.raw('COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star'),
      )
      .first(),
  ]);

  return {
    reviews,
    stats: {
      avgRating: parseFloat(statsResult?.avg_rating || 0).toFixed(1),
      totalReviews: parseInt(statsResult?.total_reviews || 0),
      distribution: {
        5: parseInt(statsResult?.five_star || 0),
        4: parseInt(statsResult?.four_star || 0),
        3: parseInt(statsResult?.three_star || 0),
        2: parseInt(statsResult?.two_star || 0),
        1: parseInt(statsResult?.one_star || 0),
      },
    },
    pagination: { page, limit, total: parseInt(countResult?.total || 0) },
  };
}

async function approveReview(reviewId, approvedBy) {
  const review = await db('reviews').where('id', reviewId).first();
  if (!review) throw ApiError.notFound('REVIEW_NOT_FOUND', 'Review không tồn tại.');

  const [updated] = await db('reviews').where('id', reviewId).update({
    is_approved: true,
    approved_by: approvedBy,
    updated_at: new Date(),
  }).returning('*');

  // Cập nhật avg_rating trên bảng products
  const stats = await db('reviews')
    .where({ product_id: review.product_id, is_approved: true })
    .avg('rating as avg')
    .count('id as cnt')
    .first();

  await db('products').where('id', review.product_id).update({
    avg_rating: parseFloat(stats.avg || 0),
    review_count: parseInt(stats.cnt || 0),
  });

  return updated;
}

async function deleteReview(reviewId) {
  const review = await db('reviews').where('id', reviewId).first();
  if (!review) throw ApiError.notFound('REVIEW_NOT_FOUND', 'Review không tồn tại.');
  await db('reviews').where('id', reviewId).delete();
  return { success: true };
}

async function getPendingReviews({ page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  const [reviews, countResult] = await Promise.all([
    db('reviews as r')
      .join('users as u', 'r.user_id', 'u.id')
      .join('products as p', 'r.product_id', 'p.id')
      .where('r.is_approved', false)
      .whereNull('p.deleted_at')
      .orderBy('r.created_at', 'desc')
      .limit(limit).offset(offset)
      .select('r.*', 'u.full_name as reviewer_name', 'u.email as reviewer_email', 'p.name as product_name'),

    db('reviews').where('is_approved', false).count('id as total').first(),
  ]);
  return { reviews, pagination: { page, limit, total: parseInt(countResult?.total || 0) } };
}

module.exports = { createReview, getProductReviews, approveReview, deleteReview, getPendingReviews };
