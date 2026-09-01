const { redis } = require('../../config/redis');

/**
 * Cache middleware cho GET endpoints (High-Performance In-Memory Cache)
 * @param {number} ttlSeconds - Thời gian sống của cache (mặc định 60s)
 */
function cache(ttlSeconds = 60) {
  return async (req, res, next) => {
    // Chỉ cache request GET
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      const cachedData = await redis.get(key);
      if (cachedData) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(JSON.parse(cachedData));
      }

      // Intercept res.json để lưu vào cache
      res.setHeader('X-Cache', 'MISS');
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis.setex(key, ttlSeconds, JSON.stringify(body)).catch(() => {});
        }
        return originalJson(body);
      };

      next();
    } catch {
      // Nếu Redis lỗi -> bypass cache
      next();
    }
  };
}

/**
 * Xóa toàn bộ cache theo pattern (dùng khi Create/Update/Delete)
 */
async function clearCachePattern(pattern) {
  try {
    const keys = await redis.keys(`cache:${pattern}`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch {
    // Ignored
  }
}

module.exports = { cache, clearCachePattern };
