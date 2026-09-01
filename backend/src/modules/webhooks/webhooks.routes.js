const express = require('express');
const router = express.Router();
const { handleVNPayWebhook, handleVNPayReturn } = require('./vnpay.webhook');

// VNPay Webhook (IPN) — KHÔNG cần auth
router.post('/vnpay', handleVNPayWebhook);

// VNPay Return URL redirect
router.get('/vnpay/return', handleVNPayReturn);

module.exports = router;
