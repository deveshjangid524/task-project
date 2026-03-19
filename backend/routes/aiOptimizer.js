const express = require('express');
const router = express.Router();
const { optimizeTasksWithAI } = require('../controllers/aiOptimizerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/ai-optimize')
    .post(protect, authorize('Admin', 'Project Manager'), optimizeTasksWithAI);

module.exports = router;
