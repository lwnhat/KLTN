/**
 * NOTIFICATIONS SERVICE
 * Push thông báo vào DB + emit Socket.io event
 */
const db = require('../../config/database');
const { getIO } = require('../../config/socket');

async function sendNotification({ userId, type, title, body, data = {} }) {
  const [notification] = await db('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    data: JSON.stringify(data),
  }).returning('*');

  // Emit realtime nếu user đang online
  try {
    const io = getIO();
    if (io) {
      io.to(`user_${userId}`).emit('notification', {
        id: notification.id,
        type,
        title,
        body,
        data,
        createdAt: notification.created_at,
      });
    }
  } catch (err) {
    console.error('Socket emit error:', err.message);
  }

  return notification;
}

async function getUserNotifications(userId, { page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  const [notifications, countResult, unreadCount] = await Promise.all([
    db('notifications').where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(limit).offset(offset),
    db('notifications').where('user_id', userId).count('id as total').first(),
    db('notifications').where({ user_id: userId, is_read: false }).count('id as count').first(),
  ]);

  return {
    notifications,
    pagination: { page, limit, total: parseInt(countResult?.total || 0) },
    unreadCount: parseInt(unreadCount?.count || 0),
  };
}

async function markAsRead(notificationId, userId) {
  await db('notifications')
    .where({ id: notificationId, user_id: userId })
    .update({ is_read: true });
  return { success: true };
}

async function markAllAsRead(userId) {
  await db('notifications').where({ user_id: userId, is_read: false }).update({ is_read: true });
  return { success: true };
}

// Helper: gửi thông báo khi đơn hàng thay đổi trạng thái
async function notifyOrderStatusChange(order, newStatus) {
  if (!order.user_id) return; // Guest order — không gửi

  const statusMessages = {
    confirmed: { title: '✅ Đơn hàng đã được xác nhận', body: `Đơn hàng ${order.order_number} đã được xác nhận và đang chuẩn bị.` },
    processing: { title: '⚙️ Đang xử lý đơn hàng', body: `Đơn hàng ${order.order_number} đang được đóng gói và kiểm tra chất lượng.` },
    shipping: { title: '🚚 Đơn hàng đang giao', body: `Đơn hàng ${order.order_number} đã được giao cho đơn vị vận chuyển.` },
    delivered: { title: '📦 Đã giao hàng thành công', body: `Đơn hàng ${order.order_number} đã được giao thành công. Cảm ơn bạn!` },
    completed: { title: '🎉 Đơn hàng hoàn thành', body: `Đơn hàng ${order.order_number} đã hoàn thành. Hãy đánh giá sản phẩm nhé!` },
    cancelled: { title: '❌ Đơn hàng đã bị hủy', body: `Đơn hàng ${order.order_number} đã bị hủy. Liên hệ hỗ trợ nếu cần.` },
    refunded: { title: '💰 Hoàn tiền thành công', body: `Đơn hàng ${order.order_number} đã được hoàn tiền.` },
  };

  const msg = statusMessages[newStatus];
  if (!msg) return;

  await sendNotification({
    userId: order.user_id,
    type: 'order_status',
    title: msg.title,
    body: msg.body,
    data: { orderId: order.id, orderNumber: order.order_number, status: newStatus },
  });
}

module.exports = { sendNotification, getUserNotifications, markAsRead, markAllAsRead, notifyOrderStatusChange };
