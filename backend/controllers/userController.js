const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/profile-images/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + req.user._id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        console.log('Updating profile for user:', req.user._id);
        console.log('Request body:', req.body);
        
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            if (req.body.password) {
                const bcrypt = require('bcryptjs');
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
            }
            if (req.body.skills) user.skills = req.body.skills;
            if (req.body.availability) user.availability = { ...user.availability, ...req.body.availability };

            const updatedUser = await user.save();
            console.log('User updated in database:', updatedUser);

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                skills: updatedUser.skills,
                availability: updatedUser.availability
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all users (Team Overview)
// @route   GET /api/users
// @access  Private/Project Manager or Admin
const getUsers = async (req, res) => {
    try {
        console.log('Fetching all users for team overview...');
        console.log('Request from user:', req.user._id, req.user.role);
        const users = await User.find({}).select('-password');
        console.log('Found users:', users.length);
        res.json(users);
    } catch (error) {
        console.error('Error in getUsers:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Upload profile image
// @route   POST /api/users/upload-profile-image
// @access  Private
const uploadProfileImage = async (req, res) => {
    try {
        console.log('Uploading profile image for user:', req.user._id);
        
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Delete old profile image if exists
        if (user.profileImage) {
            const oldImagePath = path.join(__dirname, '..', user.profileImage);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        // Update user with new profile image path
        user.profileImage = req.file.path;
        await user.save();

        console.log('Profile image uploaded successfully:', req.file.path);
        
        res.json({
            profileImage: req.file.path,
            message: 'Profile image uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading profile image:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Remove profile image
// @route   DELETE /api/users/profile-image
// @access  Private
const removeProfileImage = async (req, res) => {
    try {
        console.log('Removing profile image for user:', req.user._id);
        
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete old profile image if exists
        if (user.profileImage) {
            const imagePath = path.join(__dirname, '..', user.profileImage);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Remove profile image from user document
        user.profileImage = null;
        await user.save();

        console.log('Profile image removed successfully');
        
        res.json({
            message: 'Profile image removed successfully'
        });
    } catch (error) {
        console.error('Error removing profile image:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { 
    getUserProfile, 
    updateUserProfile, 
    getUsers, 
    uploadProfileImage,
    removeProfileImage,
    upload
};
