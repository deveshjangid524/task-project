const Message = require('../models/Message');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Create unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        // Allow images, PDFs, and documents
        const allowedTypes = [
            'image/jpeg',
            'image/png', 
            'image/gif',
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
        }
    }
});

// @desc    Send a message
// @route   POST /api/chat/messages
// @access  Private
const sendMessage = async (req, res) => {
    try {
        const { recipientId, message, type = 'text' } = req.body;
        const senderId = req.user._id;

        // Check if sender can chat with recipient
        const canChat = await checkChatPermissions(senderId, recipientId);
        if (!canChat) {
            return res.status(403).json({ 
                message: 'You do not have permission to chat with this user' 
            });
        }

        const newMessage = new Message({
            senderId,
            recipientId,
            message,
            type
        });

        const savedMessage = await newMessage.save();
        await savedMessage.populate('senderId recipientId', 'name email role');

        res.status(201).json(savedMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Upload file and send message
// @route   POST /api/chat/upload
// @access  Private
const uploadFile = async (req, res) => {
    try {
        const { recipientId, message } = req.body;
        const senderId = req.user._id;

        // Check if sender can chat with recipient
        const canChat = await checkChatPermissions(senderId, recipientId);
        if (!canChat) {
            return res.status(403).json({ 
                message: 'You do not have permission to chat with this user' 
            });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const newMessage = new Message({
            senderId,
            recipientId,
            message: message || `Shared file: ${req.file.originalname}`,
            type: 'file',
            fileName: req.file.originalname,
            fileUrl: `/uploads/${req.file.filename}`,
            fileSize: req.file.size
        });

        const savedMessage = await newMessage.save();
        await savedMessage.populate('senderId recipientId', 'name email role');

        res.status(201).json(savedMessage);
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get messages between two users
// @route   GET /api/chat/messages/:userId
// @access  Private
const getMessages = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const otherUserId = req.params.userId;

        // Check if users can chat
        const canChat = await checkChatPermissions(currentUserId, otherUserId);
        if (!canChat) {
            return res.status(403).json({ 
                message: 'You do not have permission to view messages with this user' 
            });
        }

        const messages = await Message.find({
            $or: [
                { senderId: currentUserId, recipientId: otherUserId },
                { senderId: otherUserId, recipientId: currentUserId }
            ]
        })
        .populate('senderId recipientId', 'name email role')
        .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all chat conversations for current user
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res) => {
    try {
        const currentUserId = req.user._id;

        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: currentUserId },
                        { recipientId: currentUserId }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$senderId', currentUserId] },
                            '$recipientId',
                            '$senderId'
                        ]
                    },
                    lastMessage: { $first: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$recipientId', currentUserId] },
                                        { $eq: ['$read', false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    _id: 1,
                    user: {
                        _id: '$user._id',
                        name: '$user.name',
                        email: '$user.email',
                        role: '$user.role'
                    },
                    lastMessage: 1,
                    unreadCount: 1
                }
            }
        ]);

        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Helper function to check chat permissions
const checkChatPermissions = async (senderId, recipientId) => {
    try {
        const User = require('../models/User');
        const [sender, recipient] = await Promise.all([
            User.findById(senderId),
            User.findById(recipientId)
        ]);

        if (!sender || !recipient) return false;

        // Admin and Project Manager can chat with anyone
        if (sender.role === 'Admin' || sender.role === 'Project Manager') {
            return true;
        }

        // Team Members can only chat with Admin and Project Manager
        if (sender.role === 'Team Member') {
            return recipient.role === 'Admin' || recipient.role === 'Project Manager';
        }

        return false;
    } catch (error) {
        console.error('Error checking chat permissions:', error);
        return false;
    }
};

module.exports = {
    sendMessage,
    uploadFile,
    getMessages,
    getConversations,
    upload
};
