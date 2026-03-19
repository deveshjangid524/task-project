const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    sendMessage, 
    uploadFile, 
    getMessages, 
    getConversations,
    upload 
} = require('../controllers/chatController');

// File upload middleware
router.use('/upload', upload.single('file'));

// @route   POST /api/chat/messages
// @desc    Send a text message
// @access  Private
router.post('/messages', protect, sendMessage);

// @route   POST /api/chat/upload
// @desc    Upload file and send message
// @access  Private
router.post('/upload', protect, uploadFile);

// @route   GET /api/chat/messages/:userId
// @desc    Get messages between two users
// @access  Private
router.get('/messages/:userId', protect, getMessages);

// @route   GET /api/chat/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/conversations', protect, getConversations);

module.exports = router;
