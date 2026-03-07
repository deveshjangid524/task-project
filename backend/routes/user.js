const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, getUsers } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.route('/')
    .get(protect, authorize('Admin', 'Project Manager'), getUsers);

module.exports = router;
