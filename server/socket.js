const jwt = require('jsonwebtoken');
const pool = require('./config/db');

const initializeSocket = (server) => {
  const io = require('socket.io')(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authenticate socket connection using JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error - no token'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      return next(new Error('Authentication error - invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`⚡ User connected: ${socket.userId}`);

    // Get user info from database
    const userResult = await pool.query(
      'SELECT id, username, avatar_color FROM users WHERE id = $1',
      [socket.userId]
    );
    const user = userResult.rows[0];
    socket.username = user.username;
    socket.avatarColor = user.avatar_color;

    // Join a channel room
    socket.on('join-channel', async (channelId) => {
      // Leave all previous rooms except own socket room
      const rooms = [...socket.rooms];
      rooms.forEach((room) => {
        if (room !== socket.id) socket.leave(room);
      });

      // Join the new channel room
      socket.join(channelId);
      console.log(`📢 ${user.username} joined channel: ${channelId}`);

      // Load message history from database
      const messages = await pool.query(
        `SELECT m.id, m.content, m.created_at,
                u.id as user_id, u.username, u.avatar_color
         FROM messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.channel_id = $1
         ORDER BY m.created_at ASC
         LIMIT 50`,
        [channelId]
      );

      // Send message history to the user who just joined
      socket.emit('message-history', messages.rows);

      // Notify others in the room
      socket.to(channelId).emit('user-joined', {
        username: user.username,
        avatarColor: user.avatar_color
      });
    });

    // Handle sending a message
    socket.on('send-message', async (data) => {
      const { channelId, content } = data;

      if (!content || !content.trim()) return;

      try {
        // Save message to database
        const result = await pool.query(
          `INSERT INTO messages (content, user_id, channel_id)
           VALUES ($1, $2, $3)
           RETURNING id, content, created_at`,
          [content.trim(), socket.userId, channelId]
        );

        const message = result.rows[0];

        // Broadcast message to everyone in the channel room
        io.to(channelId).emit('receive-message', {
          id: message.id,
          content: message.content,
          createdAt: message.created_at,
          userId: socket.userId,
          username: user.username,
          avatarColor: user.avatar_color
        });

      } catch (error) {
        console.error('Message error:', error.message);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (channelId) => {
      socket.to(channelId).emit('user-typing', {
        username: user.username
      });
    });

    socket.on('typing-stop', (channelId) => {
      socket.to(channelId).emit('user-stop-typing', {
        username: user.username
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${user.username}`);
    });
  });

  return io;
};

module.exports = initializeSocket;