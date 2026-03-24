const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Get performance analytics and dashboard insights
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        console.log('Getting dashboard stats for user:', req.user._id);
        
        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ status: 'Completed' });
        const inProgressTasks = await Task.countDocuments({ status: 'In Progress' });
        const todoTasks = await Task.countDocuments({ status: 'To Do' });
        const blockedTasks = await Task.countDocuments({ status: 'Blocked' });

        console.log('Task counts:', { totalTasks, completedTasks, inProgressTasks, todoTasks, blockedTasks });

        // Bottlenecks: Tasks that are blocked, or tasks that have many dependents
        const bottlenecks = await Task.find({ status: 'Blocked' }).populate('assignedTo', 'name');

        // Overdue tasks - check both manual and AI optimized due dates
        const today = new Date();
        const overdueTasks = await Task.find({
            $or: [
                { 'scheduling.manualDueDate': { $lt: today }, status: { $ne: 'Completed' } },
                { 'scheduling.aiOptimizedDueDate': { $lt: today }, status: { $ne: 'Completed' } }
            ]
        }).populate('assignedTo', 'name');

        console.log('Overdue tasks found:', overdueTasks.length);

        // Workload per user
        const workloadAggregation = await Task.aggregate([
            { $match: { status: { $ne: 'Completed' }, assignedTo: { $ne: null } } },
            { $group: { _id: '$assignedTo', activeTasks: { $sum: 1 }, totalEstimatedHours: { $sum: '$timeEstimates.estimatedHours' } } }
        ]);

        console.log('Workload aggregation:', workloadAggregation);

        const populatedWorkload = await User.populate(workloadAggregation, { path: '_id', select: 'name email role' });

        const result = {
            completionRate: totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100,
            totalTasks,
            completedTasks,
            inProgressTasks,
            todoTasks,
            blockedTasks,
            bottlenecks,
            overdueTasks,
            workload: populatedWorkload.map(w => ({
                user: w._id,
                activeTasks: w.activeTasks,
                totalEstimatedHours: w.totalEstimatedHours
            }))
        };

        console.log('Final analytics result:', result);
        res.json(result);

    } catch (error) {
        console.error('Analytics controller error:', error);
        res.status(500).json({ message: 'Server Error loading analytics', error: error.message });
    }
};

module.exports = {
    getDashboardStats
};
