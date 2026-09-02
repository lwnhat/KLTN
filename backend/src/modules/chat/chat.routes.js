const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const chatService = require('./chat.service');
const { success } = require('../../shared/utils/apiResponse');
const ApiError = require('../../shared/utils/ApiError');

// Rate limiter riêng cho chat AI: tối đa 25 câu hỏi / 1 phút / IP
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Quý khách đang gửi câu hỏi quá nhanh. Vui lòng chờ vài giây để Trợ lý AI phản hồi chu đáo hơn nhé!',
    },
  },
});

/**
 * POST /api/v1/chat/message
 * Body: { message: string, history?: Array<{ role: 'user' | 'model', text: string }> }
 */
router.post('/message', chatLimiter, async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      throw ApiError.badRequest('INVALID_MESSAGE', 'Vui lòng nhập nội dung câu hỏi.');
    }

    if (message.length > 500) {
      throw ApiError.badRequest('MESSAGE_TOO_LONG', 'Câu hỏi tối đa 500 ký tự.');
    }

    const reply = await chatService.generateChatResponse(message.trim(), history || []);

    success(res, { reply });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
