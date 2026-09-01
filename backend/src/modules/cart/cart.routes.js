const express = require('express');
const router = express.Router();
const { authenticate, optionalAuthenticate } = require('../../shared/middleware/auth.middleware');
const { authorize } = require('../../shared/middleware/rbac.middleware');
const cartService = require('./cart.service');
const { success } = require('../../shared/utils/apiResponse');

// GET /api/v1/cart — Lấy giỏ hàng user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const cart = await cartService.getUserCart(req.user.id);
    success(res, cart);
  } catch (err) { next(err); }
});

// POST /api/v1/cart — Thêm sản phẩm vào giỏ
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { variantId, quantity, customizationMetadata, instanceId } = req.body;
    const item = await cartService.addToCart(req.user.id, { variantId, quantity, customizationMetadata, instanceId });
    success(res, item, 'Đã thêm vào giỏ hàng.', 201);
  } catch (err) { next(err); }
});

// PUT /api/v1/cart/:itemId — Cập nhật cart item
router.put('/:itemId', authenticate, async (req, res, next) => {
  try {
    const item = await cartService.updateCartItem(req.user.id, req.params.itemId, req.body);
    success(res, item, 'Đã cập nhật giỏ hàng.');
  } catch (err) { next(err); }
});

// DELETE /api/v1/cart/:itemId — Xóa item
router.delete('/:itemId', authenticate, async (req, res, next) => {
  try {
    await cartService.removeCartItem(req.user.id, req.params.itemId);
    success(res, null, 'Đã xóa sản phẩm khỏi giỏ hàng.');
  } catch (err) { next(err); }
});

// POST /api/v1/cart/sync — Merge guest cart sau login
router.post('/sync', authenticate, async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const result = await cartService.mergeGuestCartToUserCart(req.user.id, sessionId);
    success(res, result, `Đã đồng bộ giỏ hàng (${result.merged} sản phẩm).`);
  } catch (err) { next(err); }
});

// POST /api/v1/cart/hold-inventory — Giữ kho khi bắt đầu checkout
router.post('/hold-inventory', authenticate, async (req, res, next) => {
  try {
    const result = await cartService.prepareCheckout(req.user.id);
    success(res, result, 'Tồn kho đã được giữ trong 15 phút.');
  } catch (err) { next(err); }
});

module.exports = router;
