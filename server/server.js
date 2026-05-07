const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);

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
app.listen(PORT, () => {
  console.log(`🚀 NexTalk server running on port ${PORT}`);
});