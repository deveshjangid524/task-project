const express = require('express');
const router = express.Router();
const { createTask, getTasks, getTaskById, updateTask, deleteTask, scheduleTasks } = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');
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

router.route('/schedule').post(protect, authorize('Admin', 'Project Manager'), scheduleTasks);

router.route('/migrate-createdBy')
    .post(protect, authorize('Admin'), async (req, res) => {
        try {
            console.log('=== MIGRATING CREATEDBY FIELD ===');
            const Task = require('../models/Task');
            
            // Find all tasks without createdBy
            const tasksWithoutCreator = await Task.find({ createdBy: { $exists: false } });
            console.log(`Found ${tasksWithoutCreator.length} tasks without createdBy`);
            
            // Update them with the current admin user as creator
            const updatePromises = tasksWithoutCreator.map(task => 
                Task.findByIdAndUpdate(task._id, { createdBy: req.user._id })
            );
            
            await Promise.all(updatePromises);
            
            console.log('Migration completed successfully');
            res.json({ 
                message: 'Migration completed', 
                updatedCount: tasksWithoutCreator.length 
            });
        } catch (error) {
            console.error('Migration error:', error);
            res.status(500).json({ message: 'Migration failed' });
        }
    });

router.route('/')
    .post(protect, createTask)
    .get(protect, getTasks);

router.route('/:id')
    .get(protect, getTaskById)
    .put(protect, updateTask)
    .delete(protect, deleteTask);

// Add the missing attachments route
router.post('/:id/attachments', protect, upload.array('attachments', 10), async (req, res) => {
    try {
        console.log('=== ATTACHMENT UPLOAD START ===');
        console.log('Task ID:', req.params.id);
        console.log('User:', req.user._id);
        console.log('Files:', req.files);
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }
        
        // Find the task
        const Task = require('../models/Task');
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        // Add file information to task
        const attachments = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            uploadedBy: req.user._id,
            uploadedAt: new Date()
        }));
        
        // Update task with attachments (assuming task model has attachments field)
        task.attachments = task.attachments || [];
        task.attachments.push(...attachments);
        
        await task.save();
        
        console.log('Attachments uploaded successfully:', attachments.length);
        res.status(200).json({
            message: 'Files uploaded successfully',
            attachments: attachments
        });
        
    } catch (error) {
        console.error('=== ATTACHMENT UPLOAD ERROR ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            message: 'Server Error',
            error: error.message
        });
    }
});

module.exports = router;
