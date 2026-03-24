const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, getUsers, uploadProfileImage, removeProfileImage, upload } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.route('/upload-profile-image')
    .post(protect, upload.single('profileImage'), uploadProfileImage);

router.route('/profile-image')
    .delete(protect, removeProfileImage);

router.route('/')
    .get(protect, getUsers);

// Rewards endpoints
router.route('/:id/rewards')
    .get(async (req, res) => {
        try {
            const User = require('../models/User');
            const user = await User.findById(req.params.id);
            
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            
            // For now, return rewards from localStorage simulation
            // In future, this could be stored in the database
            res.json({ 
                totalRewards: 0, // Default value - localStorage is primary source
                lastUpdated: new Date()
            });
        } catch (error) {
            console.error('Error getting rewards:', error);
            res.status(500).json({ message: 'Server Error' });
        }
    })
    .post(protect, async (req, res) => {
        try {
            const { points, taskId } = req.body;
            
            // For now, just acknowledge the reward
            // In future, this could be stored in the database
            console.log(`Reward logged: ${points} points for task ${taskId} by user ${req.params.id}`);
            
            res.json({ 
                message: 'Reward logged successfully',
                points: points,
                taskId: taskId
            });
        } catch (error) {
            console.error('Error logging reward:', error);
            res.status(500).json({ message: 'Server Error' });
        }
    });

module.exports = router;
