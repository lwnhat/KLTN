const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  lazyConnect: false,
});

// Subscriber client riêng biệt cho Keyspace Notifications
// (một Redis client không thể vừa publish vừa subscribe)
const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err));

/**
 * Kích hoạt Keyspace Notifications để theo dõi khi key TTL hết hạn
 * Cần thiết cho cơ chế tự động release Inventory Hold
 * CONFIG SET notify-keyspace-events "Ex" (E=keyevent, x=expired)
 */
async function enableKeyspaceNotifications() {
  try {
    await redis.config('SET', 'notify-keyspace-events', 'Ex');
    console.log('✅ Redis Keyspace Notifications enabled');
  } catch (err) {
    console.warn('⚠️ Could not set notify-keyspace-events (managed Redis restriction):', err.message);
  }
}


module.exports = { redis, subscriber, enableKeyspaceNotifications };
