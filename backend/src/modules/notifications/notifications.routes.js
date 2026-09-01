const express = require('express');
const router = express.Router();
const { authenticate } = require('../../shared/middleware/auth.middleware');
const notificationService = require('./notifications.service');
const { success } = require('../../shared/utils/apiResponse');

// GET /api/v1/notifications
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await notificationService.getUserNotifications(req.user.id, { page: +page, limit: +limit });
    success(res, result);
  } catch (err) { next(err); }
});

// PUT /api/v1/notifications/:id/read
router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    await notificationService.markAsRead(req.params.id, req.user.id);
    success(res, null, 'Đã đánh dấu đã đọc.');
  } catch (err) { next(err); }
});

// PUT /api/v1/notifications/read-all
router.put('/read-all', authenticate, async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    success(res, null, 'Đã đánh dấu tất cả đã đọc.');
  } catch (err) { next(err); }
});

module.exports = router;
