const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();
const pool = require('./config/db');
const initializeSocket = require('./socket');

// Routes
const authRoutes = require('./routes/authRoutes');

const channelRoutes = require('./routes/channelRoutes');

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);

app.use('/api/channels', channelRoutes);

// Health check route
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      message: '🚀 NexTalk server is running!',
      database: 'connected ✅',
      time: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 NexTalk server running on port ${PORT}`);
});