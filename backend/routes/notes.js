const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getAllNotes, createNote, deleteNote, uploadFile, testEndpoint, simpleTest, healthCheck } = require('../controllers/noteController');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Test endpoint (no authentication required)
router.get('/test', testEndpoint);

// Health check endpoint (no auth)
router.get('/health', healthCheck);

// Simple test endpoint for debugging (no auth)
router.post('/simple-test', simpleTest);

// Test endpoint to create test user and get token (no auth)
router.post('/create-test-user', async (req, res) => {
    try {
        const User = require('../models/User');
        const bcrypt = require('bcryptjs');
        const jwt = require('jsonwebtoken');
        
        // Create or find test admin user
        const testEmail = 'test@example.com';
        let user = await User.findOne({ email: testEmail });
        
        if (!user) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);
            
            user = await User.create({
                name: 'Test Admin',
                email: testEmail,
                password: hashedPassword,
                role: 'Admin'
            });
        }
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });
        
        res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.error('Error creating test user:', error);
        res.status(500).json({ message: 'Error creating test user' });
    }
});

// Get all notes
router.get('/', protect, getAllNotes);

// Create new note
router.post('/', protect, createNote);

// Upload file
router.post('/upload', protect, upload.single('file'), uploadFile);

// Delete note
router.delete('/:id', protect, deleteNote);

module.exports = router;
