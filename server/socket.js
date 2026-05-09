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

  // Track online users per channel
  const channelUsers = new Map();

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error - no token'));
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

    const userResult = await pool.query(
      'SELECT id, username, avatar_color FROM users WHERE id = $1',
      [socket.userId]
    );
    const user = userResult.rows[0];
    socket.username = user.username;
    socket.avatarColor = user.avatar_color;
    socket.currentChannel = null;

    // Join a channel room
    socket.on('join-channel', async (channelId) => {
      // Leave previous channel
      if (socket.currentChannel) {
        const prevUsers = channelUsers.get(socket.currentChannel) || new Map();
        prevUsers.delete(socket.userId);
        channelUsers.set(socket.currentChannel, prevUsers);

        // Notify previous channel
        socket.to(socket.currentChannel).emit('online-users', 
          Array.from(prevUsers.values())
        );
        socket.leave(socket.currentChannel);
      }

      // Join new channel
      socket.join(channelId);
      socket.currentChannel = channelId;

      // Add user to channel's online list
      if (!channelUsers.has(channelId)) {
        channelUsers.set(channelId, new Map());
      }
      const users = channelUsers.get(channelId);
      users.set(socket.userId, {
        id: socket.userId,
        username: user.username,
        avatarColor: user.avatar_color
      });

      console.log(`📢 ${user.username} joined channel: ${channelId}`);

      // Send message history
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
      socket.emit('message-history', messages.rows);

      // Send online users to everyone in channel
      io.to(channelId).emit('online-users', Array.from(users.values()));

      // Notify others
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
        const result = await pool.query(
          `INSERT INTO messages (content, user_id, channel_id)
           VALUES ($1, $2, $3)
           RETURNING id, content, created_at`,
          [content.trim(), socket.userId, channelId]
        );

        const message = result.rows[0];

        io.to(channelId).emit('receive-message', {
          id: message.id,
          content: message.content,
          createdAt: message.created_at,
          user_id: socket.userId,
          username: user.username,
          avatarColor: user.avatar_color
        });

      } catch (error) {
        console.error('Message error:', error.message);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing-start', (channelId) => {
      socket.to(channelId).emit('user-typing', { username: user.username });
    });

    socket.on('typing-stop', (channelId) => {
      socket.to(channelId).emit('user-stop-typing', { username: user.username });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${user.username}`);

      if (socket.currentChannel) {
        const users = channelUsers.get(socket.currentChannel) || new Map();
        users.delete(socket.userId);
        channelUsers.set(socket.currentChannel, users);

        // Notify channel of updated online users
        io.to(socket.currentChannel).emit('online-users',
          Array.from(users.values())
        );

        // Notify others user left
        socket.to(socket.currentChannel).emit('user-left', {
          username: user.username
        });
      }
    });
  });

  return io;
};

module.exports = initializeSocket;