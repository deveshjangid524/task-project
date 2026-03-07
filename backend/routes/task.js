const express = require('express');
const router = express.Router();
const { createTask, getTasks, getTaskById, updateTask, deleteTask, scheduleTasks } = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/schedule').post(protect, authorize('Admin', 'Project Manager'), scheduleTasks);

router.route('/')
    .post(protect, createTask)
    .get(protect, getTasks);

router.route('/:id')
    .get(protect, getTaskById)
    .put(protect, updateTask)
    .delete(protect, deleteTask);

module.exports = router;
