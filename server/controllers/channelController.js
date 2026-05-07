const pool = require('../config/db');

// @route  GET /api/channels
const getChannels = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, created_at
       FROM channels
       ORDER BY created_at ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get channels error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route  POST /api/channels
const createChannel = async (req, res) => {
  const { name, description } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ message: 'Channel name is required' });
    }

    // Check if channel name already exists
    const nameCheck = await pool.query(
      'SELECT id FROM channels WHERE name = $1',
      [name.toLowerCase()]
    );
    if (nameCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Channel name already exists' });
    }

    const result = await pool.query(
      `INSERT INTO channels (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING id, name, description, created_at`,
      [name.toLowerCase(), description || '', req.userId]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Create channel error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getChannels, createChannel };