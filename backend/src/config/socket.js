const { Server } = require('socket.io');

let io;

/**
 * Khởi tạo Socket.io server
 * @param {import('http').Server} httpServer
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Admin tham gia room để nhận thông báo đơn hàng mới
    socket.on('join_admin_room', (data) => {
      // TODO: Verify token trước khi join
      socket.join('admin_room');
      console.log(`👑 Admin joined admin_room: ${socket.id}`);
    });

    // User theo dõi thông báo cá nhân
    socket.on('join_user_room', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`👤 User ${userId} joined their room`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Lấy instance Socket.io để emit events từ bất kỳ đâu
 */
function getIO() {
  if (!io) throw new Error('Socket.io not initialized. Call initSocket() first.');
  return io;
}

module.exports = { initSocket, getIO };
