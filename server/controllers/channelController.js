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
      [name, description || '', req.userId]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Create channel error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route  DELETE /api/channels/:id
const deleteChannel = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if channel exists and user is the creator
    const channel = await pool.query(
      'SELECT * FROM channels WHERE id = $1',
      [id]
    );

    if (channel.rows.length === 0) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Prevent deleting default channels
    const defaultChannels = ['general', 'random', 'introductions'];
    if (defaultChannels.includes(channel.rows[0].name)) {
      return res.status(403).json({ message: 'Cannot delete default channels' });
    }

    // Check if user is the creator
    if (channel.rows[0].created_by !== req.userId) {
      return res.status(403).json({ message: 'Only the channel creator can delete it' });
    }

    // Delete all messages in channel first
    await pool.query('DELETE FROM messages WHERE channel_id = $1', [id]);

    // Delete the channel
    await pool.query('DELETE FROM channels WHERE id = $1', [id]);

    res.json({ message: 'Channel deleted successfully' });

  } catch (error) {
    console.error('Delete channel error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getChannels, createChannel, deleteChannel };