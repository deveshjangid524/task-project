const Note = require('../models/Note');
const mongoose = require('mongoose');

// @desc    Get all notes
// @route   GET /api/notes
// @access  Private
const getAllNotes = async (req, res) => {
    try {
        console.log('Fetching all notes...');
        const notes = await Note.find({})
            .populate('createdBy', 'name email role')
            .sort({ createdAt: -1 });
        
        console.log(`Found ${notes.length} notes`);
        res.json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create new note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res) => {
    try {
        console.log("REQ.USER:", req.user);
        console.log("REQ.BODY:", req.body);
        
        const { title, content, type, fileUrl, fileName, fileSize, fileType, visibility, visibleTo } = req.body;
        
        // CRITICAL: Validate req.user exists
        if (!req.user) {
            console.log('ERROR: req.user is null or undefined');
            return res.status(401).json({ message: 'User not authenticated - req.user is null' });
        }
        
        if (!req.user._id) {
            console.log('ERROR: req.user._id is null or undefined');
            return res.status(401).json({ message: 'User ID not found in req.user' });
        }
        
        // Check if user is Admin or Project Manager
        if (req.user.role !== 'Admin' && req.user.role !== 'Project Manager') {
            return res.status(403).json({ message: 'Only Admins and Project Managers can create notes' });
        }
        
        // Validate required fields
        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }
        
        // Create note object with GUARANTEED createdBy ObjectId
        const noteData = {
            title,
            content,
            type: type || 'text',
            createdBy: req.user._id // This is now guaranteed to be a valid ObjectId
        };
        
        // Add file fields if they exist
        if (fileUrl) noteData.fileUrl = fileUrl;
        if (fileName) noteData.fileName = fileName;
        if (fileSize) noteData.fileSize = fileSize;
        if (fileType) noteData.fileType = fileType;
        
        console.log('Creating note with data:', noteData);
        console.log('createdBy type:', typeof noteData.createdBy);
        console.log('createdBy value:', noteData.createdBy);
        
        // Try to create and save the note
        console.log('Creating note instance...');
        const note = new Note(noteData);
        console.log('Note instance created:', note);
        
        console.log('Attempting to save note...');
        const createdNote = await note.save();
        console.log('Note saved successfully:', createdNote._id);
        
        // Populate and return the note (without visibility for now)
        const populatedNote = await Note.findById(createdNote._id)
            .populate('createdBy', 'name email role');
        
        console.log('Note created and populated successfully');
        res.status(201).json(populatedNote);
        
    } catch (error) {
        console.error("=== FULL ERROR DETAILS ===");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        console.error("Error occurred at:", new Date().toISOString());
        
        // Check if this is a validation error
        if (error.name === 'ValidationError') {
            console.error("Validation errors:", Object.values(error.errors));
        }
        
        res.status(500).json({
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    }
};

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res) => {
    try {
        console.log('Deleting note:', req.params.id);
        
        const note = await Note.findById(req.params.id);
        
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Check if user is admin or the note creator
        if (req.user.role !== 'Admin' && note.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this note' });
        }

        await Note.findByIdAndDelete(req.params.id);
        console.log('Note deleted successfully');
        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Upload file
// @route   POST /api/notes/upload
// @access  Private
const uploadFile = async (req, res) => {
    try {
        console.log('Uploading file:', req.file);
        
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Create file URL
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        
        const fileInfo = {
            fileName: req.file.originalname,
            fileUrl: fileUrl,
            fileSize: req.file.size,
            fileType: req.file.mimetype,
            uploadedAt: new Date()
        };

        console.log('File uploaded successfully:', fileInfo);
        res.json(fileInfo);
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Test endpoint
// @route   GET /api/notes/test
// @access  Public (for testing)
const testEndpoint = async (req, res) => {
    try {
        console.log('Test endpoint called');
        res.json({ message: 'Notes API is working', timestamp: new Date() });
    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({ message: 'Test endpoint failed' });
    }
};

// @desc    Simple test endpoint for note creation
// @route   POST /api/notes/simple-test
// @access  Public (for debugging)
const simpleTest = async (req, res) => {
    try {
        console.log('Simple test endpoint called');
        console.log('Request body:', req.body);
        
        // Create a minimal note without any complex fields
        const minimalNote = {
            title: 'Test Note',
            content: 'Test content',
            type: 'text',
            createdBy: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011') // Dummy ObjectId
        };
        
        console.log('Creating minimal note:', minimalNote);
        
        const note = new Note(minimalNote);
        const result = await note.save();
        
        console.log('Simple test success:', result._id);
        res.json({ 
            message: 'Simple test successful', 
            noteId: result._id,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Simple test error:', error);
        res.status(500).json({ 
            message: 'Simple test failed', 
            error: error.message,
            stack: error.stack 
        });
    }
};

// @desc    Health check endpoint
// @route   GET /api/notes/health
// @access  Public
const healthCheck = async (req, res) => {
    try {
        console.log('Health check endpoint called');
        res.json({ 
            message: 'Backend is running',
            timestamp: new Date(),
            status: 'OK'
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({ message: 'Health check failed' });
    }
};

module.exports = {
    getAllNotes,
    createNote,
    deleteNote,
    uploadFile,
    testEndpoint,
    simpleTest,
    healthCheck
};
