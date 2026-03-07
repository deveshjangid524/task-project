const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Get performance analytics and dashboard insights
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ status: 'Completed' });
        const blockedTasks = await Task.countDocuments({ status: 'Blocked' });

        // Bottlenecks: Tasks that are blocked, or tasks that have many dependents
        const bottlenecks = await Task.find({ status: 'Blocked' }).populate('assignedTo', 'name');

        // Overdue tasks
        const today = new Date();
        const overdueTasks = await Task.find({
            'scheduling.aiOptimizedDueDate': { $lt: today },
            status: { $ne: 'Completed' }
        }).populate('assignedTo', 'name');

        // Workload per user
        const workloadAggregation = await Task.aggregate([
            { $match: { status: { $ne: 'Completed' }, assignedTo: { $ne: null } } },
            { $group: { _id: '$assignedTo', activeTasks: { $sum: 1 }, totalEstimatedHours: { $sum: '$timeEstimates.estimatedHours' } } }
        ]);

        const populatedWorkload = await User.populate(workloadAggregation, { path: '_id', select: 'name email role' });

        res.json({
            completionRate: totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100,
            totalTasks,
            completedTasks,
            blockedTasks,
            bottlenecks,
            overdueTasks,
            workload: populatedWorkload.map(w => ({
                user: w._id,
                activeTasks: w.activeTasks,
                totalEstimatedHours: w.totalEstimatedHours
            }))
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error loading analytics' });
    }
};

module.exports = {
    getDashboardStats
};
