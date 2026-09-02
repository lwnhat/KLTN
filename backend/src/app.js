require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

// Config
const { initSocket } = require('./config/socket');
const { subscriber, enableKeyspaceNotifications } = require('./config/redis');
const { handleHoldExpiry } = require('./modules/inventory/inventoryHold.service');
const logger = require('./shared/utils/logger');

// Middleware
const { errorHandler, notFoundHandler } = require('./shared/middleware/errorHandler.middleware');

// Routes
const authRoutes = require('./modules/auth/auth.routes');
const productRoutes = require('./modules/products/products.routes');
const categoryRoutes = require('./modules/categories/categories.routes');
const variantRoutes = require('./modules/variants/variants.routes');
const certificateRoutes = require('./modules/certificates/certificates.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const cartRoutes = require('./modules/cart/cart.routes');
const orderRoutes = require('./modules/orders/orders.routes');
const paymentRoutes = require('./modules/payments/payments.routes');
const webhookRoutes = require('./modules/webhooks/webhooks.routes');
const warrantyRoutes = require('./modules/warranties/warranties.routes');
const reviewRoutes = require('./modules/reviews/reviews.routes');
const wishlistRoutes = require('./modules/wishlist/wishlist.routes');
const notificationRoutes = require('./modules/notifications/notifications.routes');
const voucherRoutes = require('./modules/vouchers/vouchers.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const uploadRoutes = require('./modules/upload/upload.routes');
const chatRoutes = require('./modules/chat/chat.routes');

// ─── App Setup ──────────────────────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

// ─── Socket.io ──────────────────────────────────────────────────────────────
initSocket(httpServer);

// ─── Core Middleware ────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Cho phép Swagger UI load stylesheet & CDN
  crossOriginEmbedderPolicy: false, // Cần cho Cloudinary images
}));

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001')
      .split(',')
      .map((s) => s.trim());
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes('*') ||
      origin.endsWith('.vercel.app')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true, // Cho phép gửi cookie
}));


app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cookieParser());

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Giới hạn tổng: 200 request / 15 phút / IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.' } },
  skip: (req) => process.env.NODE_ENV === 'development', // Tắt rate-limit khi dev
});

// Giới hạn nghiêm ngặt hơn cho endpoint đăng nhập: 10 request / 15 phút / IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.' } },
  skip: (req) => process.env.NODE_ENV === 'development',
});

app.use(globalLimiter);

// ─── Swagger API Documentation ──────────────────────────────────────────────
if (process.env.DISABLE_SWAGGER !== 'true') {
  const swaggerUi = require('swagger-ui-express');
  const { swaggerSpec } = require('./config/swagger');

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: '💎 Daniel Wellington Fine Jewelry API Docs',
    customCss: `
      .swagger-ui .topbar { background-color: #1a1a1a; padding: 10px 0; }
      .swagger-ui .topbar-wrapper img { content: url('https://img.icons8.com/color/48/diamond--v1.png'); width: 32px; height: 32px; }
      .swagger-ui .info { margin: 20px 0; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
    },
  }));

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  logger.info('📚 Swagger UI available at /api-docs');
}


// Webhook routes TRƯỚC express.json() để đọc raw body cho HMAC verification
app.use('/api/v1/webhooks', webhookRoutes);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
const API_PREFIX = '/api/v1';

// Auth routes với rate limiter chặt hơn để chống brute-force
app.use(`${API_PREFIX}/auth`, authLimiter, authRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/variants`, variantRoutes);
app.use(`${API_PREFIX}/certificates`, certificateRoutes);
app.use(`${API_PREFIX}/cart`, cartRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/warranties`, warrantyRoutes);
app.use(`${API_PREFIX}/reviews`, reviewRoutes);
app.use(`${API_PREFIX}/wishlist`, wishlistRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/vouchers`, voucherRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/admin/inventory`, inventoryRoutes);
app.use(`${API_PREFIX}/upload`, uploadRoutes);
app.use(`${API_PREFIX}/chat`, chatRoutes);

// ─── 404 & Error Handler ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Redis Keyspace Notifications (Auto-release Inventory Hold) ───────────────
async function setupRedisSubscriptions() {
  await enableKeyspaceNotifications();

  // Subscribe to key expiry events trên database 0
  await subscriber.subscribe('__keyevent@0__:expired', (err) => {
    if (err) logger.error('Redis subscription error:', err);
    else logger.info('✅ Subscribed to Redis keyspace expired events');
  });

  subscriber.on('message', async (channel, expiredKey) => {
    if (channel === '__keyevent@0__:expired') {
      await handleHoldExpiry(expiredKey);
    }
  });
}

// ─── Server Start ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, async () => {
  logger.info(`🚀 Server running on http://localhost:${PORT} [${process.env.NODE_ENV}]`);

  try {
    await setupRedisSubscriptions();
  } catch (err) {
    logger.error('Failed to setup Redis subscriptions:', err);
  }
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  httpServer.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

module.exports = app; // Export for testing
