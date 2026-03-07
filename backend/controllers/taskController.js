const Task = require('../models/Task');
const { calculateOptimizedSchedule } = require('../utils/aiScheduler');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
    try {
        console.log('Creating task:', req.body);
        const { title, description, category, priority, assignedTo, dependsOn, timeEstimates, scheduling } = req.body;

        const task = new Task({
            title,
            description,
            category,
            priority,
            assignedTo: assignedTo || null,
            dependsOn: dependsOn || [],
            timeEstimates: timeEstimates || { estimatedHours: 1 },
            scheduling: scheduling || {},
            historyLogs: [{
                action: 'Created',
                changedBy: req.user._id,
                details: 'Task created'
            }]
        });

        const createdTask = await task.save();
        res.status(201).json(createdTask);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
    try {
        const status = req.query.status;
        const query = status ? { status } : {};

        const tasks = await Task.find(query)
            .populate('assignedTo', 'name email')
            .populate('dependsOn', 'title status');

        res.json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignedTo', 'name email')
            .populate('dependsOn', 'title status')
            .populate('historyLogs.changedBy', 'name');

        if (task) {
            res.json(task);
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (task) {
            const updates = req.body;
            const historyDetails = [];

            // Check fields and log changes
            if (updates.status && updates.status !== task.status) {
                historyDetails.push(`Status changed from ${task.status} to ${updates.status}`);
            }
            if (updates.assignedTo && String(updates.assignedTo) !== String(task.assignedTo)) {
                historyDetails.push(`Assigned user updated`);
            }

            // Apply updates (in a real app, you'd carefully merge objects like timeEstimates)
            Object.assign(task, updates);

            if (historyDetails.length > 0) {
                task.historyLogs.push({
                    action: 'Updated',
                    changedBy: req.user._id,
                    details: historyDetails.join(', ')
                });
            }

            const updatedTask = await task.save();
            res.json(updatedTask);
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (task) {
            await task.deleteOne();
            res.json({ message: 'Task removed' });
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Run AI Scheduler to optimize dates
// @route   POST /api/tasks/schedule
// @access  Private
const scheduleTasks = async (req, res) => {
    try {
        const sortedTasks = await calculateOptimizedSchedule();
        res.json({ message: 'Schedule optimized successfully', tasksRescheduled: sortedTasks.length });
    } catch (error) {
        res.status(500).json({ message: 'Server Error during scheduling' });
    }
};

module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
    scheduleTasks
};
