const Task = require('../models/Task');
const { calculateOptimizedSchedule } = require('../utils/aiScheduler');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
    try {
        console.log("=== TASK CREATION START ===");
        console.log("REQ.USER:", req.user);
        console.log("REQ.BODY:", req.body);
        
        // CRITICAL: Validate req.user exists
        if (!req.user) {
            console.log('ERROR: req.user is null or undefined');
            return res.status(401).json({ message: 'User not authenticated - req.user is null' });
        }
        
        if (!req.user._id) {
            console.log('ERROR: req.user._id is null or undefined');
            return res.status(401).json({ message: 'User ID not found in req.user' });
        }
        
        console.log('User role:', req.user.role);
        console.log('User ID:', req.user._id);
        
        const { title, description, category, priority, assignedTo, dependsOn, timeEstimates, scheduling, attachmentLinks } = req.body;
        
        // Validate required fields
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }
        
        if (!timeEstimates || !timeEstimates.estimatedHours) {
            return res.status(400).json({ message: 'Estimated hours is required' });
        }
        
        // Check assignment permissions
        if (assignedTo && !['Admin', 'Project Manager'].includes(req.user.role)) {
            console.log('Task assignment denied for user role:', req.user.role);
            return res.status(403).json({ message: 'Only Admin or Project Manager can assign tasks' });
        }
        
        // Create task object with GUARANTEED createdBy ObjectId
        const taskData = {
            title,
            description,
            category,
            priority: priority || 'Medium',
            assignedTo: assignedTo || null,
            dependsOn: dependsOn || [],
            timeEstimates: timeEstimates || { estimatedHours: 1 },
            scheduling: scheduling || {},
            createdBy: req.user._id, // This is now guaranteed to be a valid ObjectId
            attachmentLinks: attachmentLinks ? attachmentLinks.map(link => ({
                url: link,
                addedBy: req.user._id
            })) : [],
            historyLogs: [{
                action: 'Created',
                changedBy: req.user._id,
                details: 'Task created'
            }]
        };
        
        console.log('Creating task with data:', taskData);
        console.log('createdBy type:', typeof taskData.createdBy);
        console.log('createdBy value:', taskData.createdBy);
        
        // Try to create and save the task
        console.log('Creating task instance...');
        const task = new Task(taskData);
        console.log('Task instance created:', task);
        
        console.log('Attempting to save task...');
        const createdTask = await task.save();
        console.log('Task saved successfully:', createdTask._id);
        
        // Populate and return the task
        const populatedTask = await Task.findById(createdTask._id)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email role');
        
        console.log('Task created and populated successfully');
        res.status(201).json(populatedTask);
        
    } catch (error) {
        console.error("=== FULL ERROR DETAILS ===");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        console.error("Error occurred at:", new Date().toISOString());
        
        // Check if this is a validation error
        if (error.name === 'ValidationError') {
            console.error("Validation errors:", Object.values(error.errors));
            return res.status(400).json({
                message: 'Validation Error',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }
        
        res.status(500).json({
            message: 'Server Error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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
