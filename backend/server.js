const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');

dotenv.config();

// Fix for Node.js DNS resolution issues on some Windows machines
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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
        // Allowed file types
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
            cb(new Error('Invalid file type. Only PDF, Word, Excel, PowerPoint, text, and image files are allowed.'));
        }
    }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/tasks', require('./routes/task'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/ai-optimizer', require('./routes/aiOptimizer'));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Express Error Middleware
app.use((err, req, res, next) => {
    console.error("EXPRESS ERROR:", err.stack);
    res.status(500).json({
        message: err.message,
        stack: err.stack
    });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Basic Route for testing
app.get('/', (req, res) => {
    res.send('Task Management System API is running...');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Process Error Handlers
process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
    console.error("UNHANDLED PROMISE:", err);
});
