const express = require('express');
const router = express.Router();
const { getChannels, createChannel } = require('../controllers/channelController');
const authMiddleware = require('../middleware/authMiddleware');

// All channel routes are protected
router.get('/', authMiddleware, getChannels);
router.post('/', authMiddleware, createChannel);

module.exports = router;