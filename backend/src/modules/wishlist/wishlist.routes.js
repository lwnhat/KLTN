const express = require('express');
const router = express.Router();
const { authenticate } = require('../../shared/middleware/auth.middleware');
const wishlistService = require('./wishlist.service');
const { success } = require('../../shared/utils/apiResponse');

// GET /api/v1/wishlist
router.get('/', authenticate, async (req, res, next) => {
  try {
    const items = await wishlistService.getWishlist(req.user.id);
    success(res, items);
  } catch (err) { next(err); }
});

// POST /api/v1/wishlist
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { variantId, notifyOnDrop } = req.body;
    const item = await wishlistService.addToWishlist(req.user.id, { variantId, notifyOnDrop });
    success(res, item, 'Đã thêm vào danh sách yêu thích.', 201);
  } catch (err) { next(err); }
});

// DELETE /api/v1/wishlist/:variantId
router.delete('/:variantId', authenticate, async (req, res, next) => {
  try {
    await wishlistService.removeFromWishlist(req.user.id, req.params.variantId);
    success(res, null, 'Đã xóa khỏi danh sách yêu thích.');
  } catch (err) { next(err); }
});

// GET /api/v1/wishlist/check/:variantId
router.get('/check/:variantId', authenticate, async (req, res, next) => {
  try {
    const result = await wishlistService.checkInWishlist(req.user.id, req.params.variantId);
    success(res, result);
  } catch (err) { next(err); }
});

module.exports = router;
