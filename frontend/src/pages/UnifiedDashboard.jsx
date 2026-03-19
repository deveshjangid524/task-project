import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { showNotification } from '../components/NotificationSystem';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
    CheckCircle, 
    AlertTriangle, 
    Clock, 
    Activity, 
    TrendingUp,
    Calendar,
    Target,
    User,
    BarChart3,
    Users,
    Settings,
    RefreshCw,
    Check,
    X,
    History
} from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const UnifiedDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Team analytics (from Dashboard)
    const [teamStats, setTeamStats] = useState({
        totalTasks: 0,
        completedTasks: 0,
        blockedTasks: 0,
        overdueTasks: [],
        completionRate: 0,
        workload: []
    });
    
    // Personal analytics (from PersonalDashboard)
    const [personalStats, setPersonalStats] = useState({
        total: 0,
        completed: 0,
        inProgress: 0,
        todo: 0,
        overdue: 0,
        completionRate: 0
    });
    
    const [myTasks, setMyTasks] = useState([]);
    const [activeView, setActiveView] = useState('overview'); // overview, personal, team
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [refreshing, setRefreshing] = useState(false);
    const [completionDialog, setCompletionDialog] = useState({ isOpen: false, task: null });
    const [recentCompletions, setRecentCompletions] = useState([]);
    const [teamMemberTasks, setTeamMemberTasks] = useState([]);
    
    // AI Optimization states
    const [aiOptimizing, setAiOptimizing] = useState(false);
    const [aiResults, setAiResults] = useState(null);
    const [showAiResults, setShowAiResults] = useState(false);

    useEffect(() => {
        fetchDashboardData();
        
        // Set up real-time refresh every 30 seconds
        const interval = setInterval(() => {
            fetchDashboardData();
        }, 30000);
        
        // Set up visibility change listener to refresh when tab becomes active
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchDashboardData();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const fetchDashboardData = async () => {
        try {
            console.log('Fetching unified dashboard data...');
            
            // Fetch team analytics
            const teamResponse = await api.get('/analytics/dashboard');
            console.log('Team analytics response:', teamResponse.data);
            setTeamStats(teamResponse.data);
            
            // Fetch all tasks for team member tracking (Admin/PM only)
            if (user?.role === 'Admin' || user?.role === 'Project Manager') {
                const allTasksResponse = await api.get('/tasks');
                const allTasks = allTasksResponse.data;
                
                // Filter tasks based on role:
                // - Admin: See all tasks (current behavior)
                // - Project Manager: Only see tasks they assigned + their own tasks
                const filteredTasks = user?.role === 'Project Manager' 
                    ? allTasks.filter(task => {
                        // Check if current PM assigned this task
                        const pmAssigned = task.createdBy && task.createdBy._id === user._id;
                        // Check if task is assigned to current PM (handle multi-assignee)
                        const assignedToPM = task.assignedTo && (
                            (Array.isArray(task.assignedTo) && task.assignedTo.some(assignee => assignee._id === user._id)) ||
                            (task.assignedTo._id === user._id)
                        );
                        
                        return pmAssigned || assignedToPM;
                    })
                    : allTasks; // Admin sees all tasks
                
                // Group tasks by team member
                const tasksByMember = {};
                filteredTasks.forEach(task => {
                    // Handle both single assignee and multi-assignee scenarios
                    if (task.assignedTo) {
                        let assignees = [];
                        
                        if (Array.isArray(task.assignedTo)) {
                            // Multi-assignee: process each assignee
                            assignees = task.assignedTo;
                        } else {
                            // Single assignee: process as single element array
                            assignees = [task.assignedTo];
                        }
                        
                        assignees.forEach(assignee => {
                            const memberId = assignee._id;
                            const memberName = assignee.name;
                            
                            if (!tasksByMember[memberId]) {
                                tasksByMember[memberId] = {
                                    memberId,
                                    memberName,
                                    totalTasks: 0,
                                    completedTasks: 0,
                                    inProgressTasks: 0,
                                    todoTasks: 0,
                                    overdueTasks: 0,
                                    tasks: []
                                };
                            }
                            
                            tasksByMember[memberId].totalTasks++;
                            tasksByMember[memberId].tasks.push(task);
                            
                            // Count by status
                            if (task.status === 'Completed') {
                                tasksByMember[memberId].completedTasks++;
                            } else if (task.status === 'In Progress') {
                                tasksByMember[memberId].inProgressTasks++;
                            } else if (task.status === 'To Do') {
                                tasksByMember[memberId].todoTasks++;
                            }
                            
                            // Check overdue
                            if (task.scheduling?.manualDueDate && 
                                new Date(task.scheduling.manualDueDate) < new Date() && 
                                task.status !== 'Completed') {
                                tasksByMember[memberId].overdueTasks++;
                            }
                        });
                    } else {
                        // Task has no assignedTo field
                    }
                });
                
                // Convert to array and calculate completion rates
                const teamMembersData = Object.values(tasksByMember).map(member => ({
                    ...member,
                    completionRate: member.totalTasks > 0 ? (member.completedTasks / member.totalTasks * 100) : 0
                }));
                
                // For Admin, sort by assignee name and group tasks by assignment chain
                if (user?.role === 'Admin') {
                    teamMembersData.forEach(member => {
                        // Group tasks by who assigned them (to show PM assignment patterns)
                        const tasksByAssigner = {};
                        member.tasks.forEach(task => {
                            
                            // Handle different assignment scenarios
                            let assignerId, assignerName, assignerRole;
                            
                            if (task.createdBy && task.createdBy._id) {
                                // Normal case: task has a creator
                                assignerId = task.createdBy._id;
                                assignerName = task.createdBy.name || 'Unknown User';
                                assignerRole = task.createdBy.role || 'Unknown Role';
                            } else if (task.assignedBy && task.assignedBy._id) {
                                // Alternative: task has assignedBy field
                                assignerId = task.assignedBy._id;
                                assignerName = task.assignedBy.name || 'Unknown User';
                                assignerRole = task.assignedBy.role || 'Unknown Role';
                            } else {
                                // Fallback: try to determine from context
                                if (user?.role === 'Admin') {
                                    // For Admin, show as "System Assigned" if no creator found
                                    assignerId = 'system';
                                    assignerName = 'System Assigned';
                                    assignerRole = 'System';
                                } else {
                                    // For PM, check if they might have assigned it
                                    assignerId = 'unknown';
                                    assignerName = 'Unknown Assigner';
                                    assignerRole = 'Unknown';
                                }
                            }
                            
                            if (!tasksByAssigner[assignerId]) {
                                tasksByAssigner[assignerId] = {
                                    assignerId,
                                    assignerName,
                                    assignerRole,
                                    tasks: []
                                };
                            }
                            tasksByAssigner[assignerId].tasks.push(task);
                        });
                        
                        member.tasksByAssigner = Object.values(tasksByAssigner);
                    });
                }
                
                setTeamMemberTasks(teamMembersData);
            }
            
            // Fetch personal tasks
            const tasksResponse = await api.get('/tasks');
            const allTasks = tasksResponse.data;
            
            // Filter tasks for current user based on role
            let userTasks;
            if (user?.role === 'Project Manager') {
                // PM sees: tasks assigned to them + tasks they created/assigned
                userTasks = allTasks.filter(task => {
                    // Handle both single assignee and multi-assignee scenarios
                    const assignedToPM = task.assignedTo && (
                        (Array.isArray(task.assignedTo) && task.assignedTo.some(assignee => assignee._id === user._id)) ||
                        (task.assignedTo._id === user._id)
                    );
                    const pmCreated = task.createdBy && task.createdBy._id === user._id;
                    const pmAssigned = task.assignedBy && task.assignedBy._id === user._id;
                    
                    return assignedToPM || pmCreated || pmAssigned;
                });
            } else if (user?.role === 'Admin') {
                // Admin sees all tasks
                userTasks = allTasks;
            } else {
                // Team Member sees only tasks assigned to them (handle multi-assignee)
                userTasks = allTasks.filter(task => 
                    task.assignedTo && (
                        (Array.isArray(task.assignedTo) && task.assignedTo.some(assignee => assignee._id === user._id)) ||
                        (task.assignedTo._id === user._id)
                    )
                );
            }
            
            setMyTasks(userTasks);
            
            // Calculate personal statistics
            const now = new Date();
            const completed = userTasks.filter(t => t.status === 'Completed').length;
            const inProgress = userTasks.filter(t => t.status === 'In Progress').length;
            const todo = userTasks.filter(t => t.status === 'To Do').length;
            const overdue = userTasks.filter(t => 
                t.scheduling?.manualDueDate && 
                new Date(t.scheduling.manualDueDate) < now && 
                t.status !== 'Completed'
            ).length;
            
            const completionRate = userTasks.length > 0 ? (completed / userTasks.length * 100) : 0;
            
            setPersonalStats({
                total: userTasks.length,
                completed,
                inProgress,
                todo,
                overdue,
                completionRate
            });
            
            setLastUpdated(new Date());
            
        } catch (err) {
            console.error('Dashboard error:', err);
            
            if (err.response?.status === 401) {
                localStorage.removeItem('user');
                setError('Authentication expired - please refresh and log in again');
            } else {
                setError('Failed to load dashboard data');
            }
            
            // Set default values on error
            setTeamStats({
                totalTasks: 0,
                completedTasks: 0,
                blockedTasks: 0,
                overdueTasks: [],
                completionRate: 0,
                workload: []
            });
            
            setPersonalStats({
                total: 0,
                completed: 0,
                inProgress: 0,
                todo: 0,
                overdue: 0,
                completionRate: 0
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleManualRefresh = async () => {
        setRefreshing(true);
        await fetchDashboardData();
    };

    const handleScheduleTasks = async () => {
        try {
            if (!['Admin', 'Project Manager'].includes(user?.role)) {
                alert('You do not have permission to use this feature.');
                return;
            }
            
            setAiOptimizing(true);
            
            const response = await api.post('/ai-optimizer/ai-optimize');
            setAiResults(response.data);
            setShowAiResults(true);
            
            // Reload stats after AI optimization
            await fetchDashboardData();
            
        } catch (err) {
            console.error('AI optimization error:', err);
            console.error('Error response:', err.response);
            
            let errorMessage = 'Failed to optimize schedule';
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            alert(errorMessage);
        } finally {
            setAiOptimizing(false);
        }
    };

    const updateTaskStatus = async (taskId, newStatus) => {
        try {
            // If marking as completed, show confirmation dialog
            if (newStatus === 'Completed') {
                const task = myTasks.find(t => t._id === taskId);
                setCompletionDialog({ isOpen: true, task });
                return; // Don't proceed until user confirms
            }
            
            // For "In Progress", update immediately
            await performStatusUpdate(taskId, newStatus);
            
        } catch (error) {
            console.error('Error updating task status:', error);
            showNotification('error', 'Failed to update task status', 'Error');
            
            // Revert to original data on error
            await fetchDashboardData();
        }
    };

    const performStatusUpdate = async (taskId, newStatus) => {
        try {
            // Update task in backend
            await api.put(`/tasks/${taskId}`, { status: newStatus });
            
            // Update local state immediately for instant feedback
            setMyTasks(prevTasks => 
                prevTasks.map(task => 
                    task._id === taskId 
                        ? { ...task, status: newStatus }
                        : task
                )
            );
            
            // Recalculate personal statistics
            const updatedTasks = myTasks.map(task => 
                task._id === taskId 
                    ? { ...task, status: newStatus }
                    : task
            );
            
            const now = new Date();
            const completed = updatedTasks.filter(t => t.status === 'Completed').length;
            const inProgress = updatedTasks.filter(t => t.status === 'In Progress').length;
            const todo = updatedTasks.filter(t => t.status === 'To Do').length;
            const overdue = updatedTasks.filter(t => 
                t.scheduling?.manualDueDate && 
                new Date(t.scheduling.manualDueDate) < now && 
                t.status !== 'Completed'
            ).length;
            
            const completionRate = updatedTasks.length > 0 ? (completed / updatedTasks.length * 100) : 0;
            
            setPersonalStats({
                total: updatedTasks.length,
                completed,
                inProgress,
                todo,
                overdue,
                completionRate
            });
            
            setLastUpdated(new Date());
            
            // Show success notification
            if (newStatus === 'Completed') {
                const task = updatedTasks.find(t => t._id === taskId);
                
                // Add to recent completions
                setRecentCompletions(prev => [
                    { 
                        taskId: task._id, 
                        title: task.title, 
                        completedAt: new Date(),
                        previousStatus: 'In Progress'
                    },
                    ...prev.slice(0, 4) // Keep only last 5 completions
                ]);
                
                showNotification('success', `Task "${task.title}" completed successfully!`, 'Task Completed');
            } else if (newStatus === 'In Progress') {
                showNotification('info', 'Task marked as in progress', 'Task Updated');
            }
            
        } catch (error) {
            console.error('Error performing status update:', error);
            throw error; // Re-throw to handle in calling function
        }
    };

    const confirmTaskCompletion = async () => {
        if (!completionDialog.task) return;
        
        try {
            await performStatusUpdate(completionDialog.task._id, 'Completed');
            setCompletionDialog({ isOpen: false, task: null });
        } catch (error) {
            console.error('Error confirming task completion:', error);
            showNotification('error', 'Failed to complete task', 'Error');
        }
    };

    const cancelTaskCompletion = () => {
        setCompletionDialog({ isOpen: false, task: null });
    };

    const isOverdue = (task) => {
        if (!task.scheduling?.manualDueDate || task.status === 'Completed') return false;
        return new Date(task.scheduling.manualDueDate) < new Date();
    };

    const getStatusColor = (status) => {
        const colors = {
            'To Do': 'bg-gray-100 text-gray-800 border-gray-200',
            'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
            'Completed': 'bg-green-100 text-green-800 border-green-200',
            'Blocked': 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'Low': 'bg-gray-100 text-gray-800 border-gray-200',
            'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'High': 'bg-orange-100 text-orange-800 border-orange-200',
            'Critical': 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    // Prepare data for charts
    const statusData = [
        { name: 'To Do', value: personalStats.todo },
        { name: 'In Progress', value: personalStats.inProgress },
        { name: 'Completed', value: personalStats.completed },
    ].filter(item => item.value > 0);

    // Prepare overall status data for Overview (Admin/PM only)
    const overallStatusData = (user?.role === 'Admin' || user?.role === 'Project Manager') ? (() => {
        const todoTasks = teamMemberTasks.reduce((sum, member) => sum + member.todoTasks, 0);
        const inProgressTasks = teamMemberTasks.reduce((sum, member) => sum + member.inProgressTasks, 0);
        const completedTasks = teamMemberTasks.reduce((sum, member) => sum + member.completedTasks, 0);
        
        const data = [
            { name: 'To Do', value: todoTasks },
            { name: 'In Progress', value: inProgressTasks },
            { name: 'Completed', value: completedTasks },
        ].filter(item => item.value > 0);
        return data;
    })() : [];

    // Prepare team status data for Team Analytics
    const teamStatusData = (user?.role === 'Admin' || user?.role === 'Project Manager') ? (() => {
        const todoTasks = teamStats.todoTasks || 0;
        const inProgressTasks = teamStats.inProgressTasks || 0;
        const completedTasks = teamStats.completedTasks || 0;
        const blockedTasks = teamStats.blockedTasks || 0;
        
        const data = [
            { name: 'To Do', value: todoTasks },
            { name: 'In Progress', value: inProgressTasks },
            { name: 'Completed', value: completedTasks },
            { name: 'Blocked', value: blockedTasks },
        ].filter(item => item.value > 0);
        return data;
    })() : [];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-800">{error}</div>
            </div>
        );
    }

    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="mt-2 text-gray-600">
                            Welcome back, {user?.name}! Here's your complete overview.
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleManualRefresh}
                            disabled={refreshing}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            <RefreshCw className={`-ml-1 mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                        {(user?.role === 'Admin' || user?.role === 'Project Manager') && (
                            <button
                                onClick={handleScheduleTasks}
                                disabled={aiOptimizing}
                                className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                    aiOptimizing 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                <Activity className="-ml-1 mr-2 h-5 w-5" />
                                {aiOptimizing ? 'AI Optimizing...' : 'AI Optimize Schedule'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* View Toggle */}
            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveView('overview')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeView === 'overview'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <BarChart3 className="h-4 w-4 inline mr-2" />
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveView('personal')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeView === 'personal'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <User className="h-4 w-4 inline mr-2" />
                        My Tasks
                    </button>
                    {(user?.role === 'Admin' || user?.role === 'Project Manager') && (
                        <button
                            onClick={() => setActiveView('team')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeView === 'team'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <Users className="h-4 w-4 inline mr-2" />
                            Team Analytics
                        </button>
                    )}
                    {(user?.role === 'Admin' || user?.role === 'Project Manager') && (
                        <button
                            onClick={() => setActiveView('team-members')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeView === 'team-members'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <User className="h-4 w-4 inline mr-2" />
                            Team Members
                        </button>
                    )}
                </nav>
            </div>

            {/* Overview View */}
            {activeView === 'overview' && (
                <div>
                    {/* Alerts */}
                    {(personalStats.overdue > 0 || teamStats.overdueTasks.length > 0) && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex">
                                <AlertTriangle className="h-5 w-5 text-red-400" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        {personalStats.overdue > 0 && (
                                            <>You have {personalStats.overdue} overdue task{personalStats.overdue > 1 ? 's' : ''}. </>
                                        )}
                                        {teamStats.overdueTasks.length > 0 && user?.role !== 'Team Member' && (
                                            <>Team has {teamStats.overdueTasks.length} overdue task{teamStats.overdueTasks.length > 1 ? 's' : ''}.</>
                                        )}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Combined Stats Cards */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                        <div className="bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden border border-gray-100">
                            <dt>
                                <div className="absolute rounded-md p-3 bg-blue-100">
                                    <Target className="h-6 w-6 text-blue-500" />
                                </div>
                                <p className="ml-16 text-sm font-medium text-gray-500 truncate">My Tasks</p>
                            </dt>
                            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                                <p className="text-2xl font-semibold text-gray-900">{personalStats.total}</p>
                            </dd>
                        </div>

                        <div className="bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden border border-gray-100">
                            <dt>
                                <div className="absolute rounded-md p-3 bg-green-100">
                                    <CheckCircle className="h-6 w-6 text-green-500" />
                                </div>
                                <p className="ml-16 text-sm font-medium text-gray-500 truncate">My Completion Rate</p>
                            </dt>
                            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                                <p className="text-2xl font-semibold text-gray-900">{personalStats.completionRate.toFixed(1)}%</p>
                            </dd>
                        </div>

                        <div className="bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden border border-gray-100">
                            <dt>
                                <div className="absolute rounded-md p-3 bg-yellow-100">
                                    <Clock className="h-6 w-6 text-yellow-500" />
                                </div>
                                <p className="ml-16 text-sm font-medium text-gray-500 truncate">In Progress</p>
                            </dt>
                            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                                <p className="text-2xl font-semibold text-gray-900">{personalStats.inProgress}</p>
                            </dd>
                        </div>

                        {(user?.role === 'Admin' || user?.role === 'Project Manager') && (
                            <div className="bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden border border-gray-100">
                                <dt>
                                    <div className="absolute rounded-md p-3 bg-purple-100">
                                        <Activity className="h-6 w-6 text-purple-500" />
                                    </div>
                                    <p className="ml-16 text-sm font-medium text-gray-500 truncate">Team Tasks</p>
                                </dt>
                                <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                                    <p className="text-2xl font-semibold text-gray-900">{teamStats.totalTasks}</p>
                                </dd>
                            </div>
                        )}
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Personal Status Breakdown */}
                        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">My Task Status</h3>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Overall Status Breakdown (Admin/PM only) */}
                        {(user?.role === 'Admin' || user?.role === 'Project Manager') && overallStatusData.length > 0 && (
                            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    {user?.role === 'Admin' ? 'Overall Team Status' : 'My Team Status'}
                                </h3>
                                <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={overallStatusData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                                            >
                                                {overallStatusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Recent Tasks (fallback for non-Admin/PM) */}
                        {!(user?.role === 'Admin' || user?.role === 'Project Manager') && (
                            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">My Recent Tasks</h3>
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {myTasks.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No tasks assigned to you yet.</p>
                                    ) : (
                                        myTasks.slice(0, 5).map((task) => (
                                            <div key={task._id} className="border-b border-gray-100 pb-3 last:border-0">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {task.title}
                                                        </p>
                                                        <div className="mt-1 flex items-center space-x-2">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(task.status)}`}>
                                                                {task.status}
                                                            </span>
                                                            {isOverdue(task) && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                                    Overdue
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {myTasks.length > 5 && (
                                    <p className="text-sm text-gray-500 mt-3 text-center">
                                        Showing 5 of {myTasks.length} tasks
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Recent Completions */}
                    {recentCompletions.length > 0 && (
                        <div className="mt-8 bg-white p-6 rounded-lg shadow border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Recent Completions</h3>
                                <History className="h-5 w-5 text-green-500" />
                            </div>
                            <div className="space-y-3">
                                {recentCompletions.map((completion, index) => (
                                    <div key={`${completion.taskId}-${index}`} className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-green-900">{completion.title}</p>
                                            <p className="text-xs text-green-700">
                                                Completed {completion.completedAt.toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                            Just now
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Personal View */}
            {activeView === 'personal' && (
                <div>
                    {/* Personal Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Target className="h-8 w-8 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                                    <p className="text-2xl font-bold text-gray-900">{personalStats.total}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Clock className="h-8 w-8 text-yellow-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">In Progress</p>
                                    <p className="text-2xl font-bold text-gray-900">{personalStats.inProgress}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Completed</p>
                                    <p className="text-2xl font-bold text-gray-900">{personalStats.completed}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <TrendingUp className="h-8 w-8 text-purple-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                                    <p className="text-2xl font-bold text-gray-900">{personalStats.completionRate}%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Personal Task Status Chart */}
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-100 mb-8">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">My Task Status Breakdown</h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* My Tasks List */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">My Tasks</h3>
                                <span className="text-sm text-gray-500">{myTasks.length} tasks</span>
                            </div>
                        </div>
                        
                        <ul className="divide-y divide-gray-200">
                            {myTasks.length === 0 ? (
                                <li className="px-4 py-8 text-center text-gray-500">
                                    No tasks assigned to you yet.
                                </li>
                            ) : (
                                myTasks.map((task) => (
                                    <li key={task._id}>
                                        <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {task.title}
                                                        </p>
                                                        {isOverdue(task) && (
                                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                                Overdue
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {task.description || 'No description'}
                                                    </p>
                                                    <div className="mt-2 flex items-center space-x-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                                                            {task.status}
                                                        </span>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                                                            {task.priority}
                                                        </span>
                                                        {task.scheduling?.manualDueDate && (
                                                            <div className="flex items-center text-xs text-gray-500">
                                                                <Calendar className="h-3 w-3 mr-1" />
                                                                {new Date(task.scheduling.manualDueDate).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                        {task.timeEstimates?.estimatedHours && (
                                                            <div className="flex items-center text-xs text-gray-500">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                {task.timeEstimates.estimatedHours}h
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="ml-4 flex items-center space-x-2">
                                                    {task.status !== 'In Progress' && task.status !== 'Completed' && (
                                                        <button
                                                            onClick={() => updateTaskStatus(task._id, 'In Progress')}
                                                            className="inline-flex items-center px-3 py-1 border border-blue-300 shadow-sm text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                        >
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            Start
                                                        </button>
                                                    )}
                                                    {task.status !== 'Completed' && (
                                                        <button
                                                            onClick={() => updateTaskStatus(task._id, 'Completed')}
                                                            className="inline-flex items-center px-3 py-1 border border-green-300 shadow-sm text-xs font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                        >
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Complete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>
            )}

            {/* Team View (Admin/PM only) */}
            {activeView === 'team' && (user?.role === 'Admin' || user?.role === 'Project Manager') && (
                <div>
                    {/* Team Stats Cards */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                        {[
                            { name: 'Total Tasks', stat: teamStats.totalTasks, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-100' },
                            { name: 'Completion Rate', stat: `${teamStats.completionRate.toFixed(1)}%`, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
                            { name: 'Blocked Tasks', stat: teamStats.blockedTasks, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100' },
                            { name: 'Overdue Tasks', stat: teamStats.overdueTasks.length, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-100' },
                        ].map((item) => (
                            <div key={item.name} className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden border border-gray-100">
                                <dt>
                                    <div className={`absolute rounded-md p-3 ${item.bg}`}>
                                        <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                                    </div>
                                    <p className="ml-16 text-sm font-medium text-gray-500 truncate">{item.name}</p>
                                </dt>
                                <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                                    <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
                                </dd>
                            </div>
                        ))}
                    </div>

                    {/* Team Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Team Status Breakdown */}
                        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Team Status Distribution</h3>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={teamStatusData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                                        >
                                            {teamStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Status Summary */}
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                {teamStatusData.map((status, index) => (
                                    <div key={status.name} className="flex items-center">
                                        <div 
                                            className="w-3 h-3 rounded-full mr-2" 
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        ></div>
                                        <span className="text-sm text-gray-600">{status.name}:</span>
                                        <span className="ml-auto text-sm font-medium text-gray-900">{status.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Team Workload */}
                        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Team Workload (Active Tasks)</h3>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={teamStats.workload.map(w => ({ name: w.user?.name || 'Unassigned', tasks: w.activeTasks, hours: w.totalEstimatedHours }))}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" tick={{ fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                        <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                                        <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                                        <RechartsTooltip cursor={{ fill: '#F3F4F6' }} />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="tasks" name="Active Tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        <Bar yAxisId="right" dataKey="hours" name="Est. Hours" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Team Members View (Admin/PM only) */}
            {activeView === 'team-members' && (user?.role === 'Admin' || user?.role === 'Project Manager') && (
                <div>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Team Member Task Status</h2>
                        <p className="mt-2 text-gray-600">
                            {user?.role === 'Project Manager' 
                                ? 'Real-time status of tasks you assigned to your team members, plus your own tasks.'
                                : 'Complete overview of all task assignments, timestamps, and team performance metrics.'
                            }
                        </p>
                        {user?.role === 'Admin' && (
                            <div className="mt-2 bg-purple-50 border border-purple-200 rounded-md p-3">
                                <div className="flex">
                                    <Users className="h-5 w-5 text-purple-400" />
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-purple-800">
                                            Admin View - Complete System Overview
                                        </h3>
                                        <div className="mt-1 text-sm text-purple-700">
                                            <p>• All task assignments across the entire system</p>
                                            <p>• Who assigned tasks to whom with timestamps</p>
                                            <p>• Complete performance analytics and statistics</p>
                                            <p>• Full visibility into team productivity</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {user?.role === 'Project Manager' && (
                            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-md p-3">
                                <div className="flex">
                                    <User className="h-5 w-5 text-blue-400" />
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-800">
                                            Project Manager View
                                        </h3>
                                        <div className="mt-1 text-sm text-blue-700">
                                            <p>• Tasks you assigned to team members</p>
                                            <p>• Tasks assigned to you by others</p>
                                            <p>• Your personal task progress</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Admin Statistics Overview */}
                    {user?.role === 'Admin' && teamMemberTasks.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Users className="h-8 w-8 text-purple-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Total Team Members</p>
                                        <p className="text-2xl font-bold text-gray-900">{teamMemberTasks.length}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Target className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Total Assigned Tasks</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {teamMemberTasks.reduce((sum, member) => sum + member.totalTasks, 0)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <CheckCircle className="h-8 w-8 text-green-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Total Completed</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {teamMemberTasks.reduce((sum, member) => sum + member.completedTasks, 0)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <TrendingUp className="h-8 w-8 text-orange-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Team Completion Rate</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {teamMemberTasks.length > 0 
                                                ? (teamMemberTasks.reduce((sum, member) => sum + member.completionRate, 0) / teamMemberTasks.length).toFixed(1)
                                                : 0}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Debug Information (Temporary) */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                            <div className="flex">
                                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-800">
                                        Debug Information
                                    </h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                        <p><strong>Current User:</strong> {user?.name} ({user?.role})</p>
                                        <p><strong>Team Member Tasks Count:</strong> {teamMemberTasks.length}</p>
                                        <p><strong>Overall Status Data:</strong> {JSON.stringify(overallStatusData)}</p>
                                        <p><strong>Team Status Data:</strong> {JSON.stringify(teamStatusData)}</p>
                                        <details className="mt-2">
                                            <summary className="cursor-pointer">Show Team Members Details</summary>
                                            <pre className="mt-2 text-xs bg-white p-2 rounded border">
                                                {JSON.stringify(teamMemberTasks.map(m => ({
                                                    name: m.memberName,
                                                    totalTasks: m.totalTasks,
                                                    completed: m.completedTasks,
                                                    inProgress: m.inProgressTasks,
                                                    todo: m.todoTasks
                                                })), null, 2)}
                                            </pre>
                                        </details>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {teamMemberTasks.length === 0 ? (
                        <div className="bg-white p-8 text-center rounded-lg shadow border border-gray-100">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No team members with assigned tasks found.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {teamMemberTasks.map((member) => (
                                <div key={member.memberId} className="bg-white shadow overflow-hidden sm:rounded-md">
                                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <User className="h-6 w-6 text-blue-600" />
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                                        {member.memberName}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        {member.totalTasks} total tasks • {member.completionRate.toFixed(1)}% completion rate
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-green-600">{member.completedTasks}</p>
                                                    <p className="text-xs text-gray-500">Completed</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-blue-600">{member.inProgressTasks}</p>
                                                    <p className="text-xs text-gray-500">In Progress</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-gray-600">{member.todoTasks}</p>
                                                    <p className="text-xs text-gray-500">To Do</p>
                                                </div>
                                                {member.overdueTasks > 0 && (
                                                    <div className="text-center">
                                                        <p className="text-2xl font-bold text-red-600">{member.overdueTasks}</p>
                                                        <p className="text-xs text-gray-500">Overdue</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                                            <span className="text-sm text-gray-500">{member.completionRate.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${member.completionRate}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Task List */}
                                    <div className="divide-y divide-gray-200">
                                        {member.tasks.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-gray-500">
                                                No tasks assigned to this team member.
                                            </div>
                                        ) : (
                                            <>
                                                {/* Admin View: Group tasks by assigner to show hierarchy */}
                                                {user?.role === 'Admin' && member.tasksByAssigner ? (
                                                    member.tasksByAssigner.map((assignerGroup) => (
                                                        <div key={assignerGroup.assignerId} className="mb-4">
                                                            {/* Assigner Header */}
                                                            <div className="px-4 py-2 bg-purple-50 border-b border-purple-200">
                                                                <div className="flex items-center">
                                                                    <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                                                                        <User className="h-3 w-3 text-purple-600" />
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-sm font-medium text-purple-900">
                                                                            {assignerGroup.assignerName}
                                                                        </span>
                                                                        <span className="ml-2 text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                                                                            {assignerGroup.assignerRole}
                                                                        </span>
                                                                        <span className="ml-2 text-xs text-purple-700">
                                                                            assigned {assignerGroup.tasks.length} task{assignerGroup.tasks.length !== 1 ? 's' : ''}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Tasks from this assigner */}
                                                            {assignerGroup.tasks.map((task) => (
                                                                <div key={task._id} className="px-4 py-3 ml-4 border-l-2 border-purple-200 hover:bg-gray-50">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center">
                                                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                                                    {task.title}
                                                                                </p>
                                                                                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(task.status)}`}>
                                                                                    {task.status}
                                                                                </span>
                                                                                {isOverdue(task) && (
                                                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                                                        Overdue
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-sm text-gray-500 mt-1">
                                                                                {task.description || 'No description'}
                                                                            </p>
                                                                            
                                                                            {/* Assignment Details - Admin Only */}
                                                                            {user?.role === 'Admin' && (
                                                                                <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                                                                                    <div className="flex items-center text-xs text-gray-600">
                                                                                        <User className="h-3 w-3 mr-1" />
                                                                                        <span className="font-medium">Assignment Chain:</span> 
                                                                                        <span className="ml-1 text-gray-800">
                                                                                            {assignerGroup.assignerName} 
                                                                                            {assignerGroup.assignerRole !== 'System' && ` (${assignerGroup.assignerRole})`}
                                                                                            {' → '}
                                                                                            {member.memberName}
                                                                                            {member.memberName === assignerGroup.assignerName && ' (Self-assigned)'}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex items-center text-xs text-gray-600 mt-1">
                                                                                        <Calendar className="h-3 w-3 mr-1" />
                                                                                        <span>Assigned: {task.createdAt ? new Date(task.createdAt).toLocaleDateString() + ' ' + new Date(task.createdAt).toLocaleTimeString() : 'Unknown time'}</span>
                                                                                    </div>
                                                                                    {task.updatedAt && task.updatedAt !== task.createdAt && (
                                                                                        <div className="flex items-center text-xs text-gray-500 mt-1">
                                                                                            <Clock className="h-3 w-3 mr-1" />
                                                                                            <span>Last updated: {new Date(task.updatedAt).toLocaleDateString() + ' ' + new Date(task.updatedAt).toLocaleTimeString()}</span>
                                                                                        </div>
                                                                                    )}
                                                                                    {/* Additional assignment context */}
                                                                                    {assignerGroup.assignerId === 'system' && (
                                                                                        <div className="flex items-center text-xs text-amber-600 mt-1">
                                                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                                                            <span>No assigner recorded - may need manual assignment verification</span>
                                                                                        </div>
                                                                                    )}
                                                                                    {assignerGroup.assignerId === 'unknown' && (
                                                                                        <div className="flex items-center text-xs text-orange-600 mt-1">
                                                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                                                            <span>Assigner information missing - check task creation process</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                            
                                                                            <div className="mt-2 flex items-center space-x-4">
                                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                                                                                    {task.priority}
                                                                                </span>
                                                                                {task.scheduling?.manualDueDate && (
                                                                                    <div className="flex items-center text-xs text-gray-500">
                                                                                        <Calendar className="h-3 w-3 mr-1" />
                                                                                        Due: {new Date(task.scheduling.manualDueDate).toLocaleDateString()}
                                                                                    </div>
                                                                                )}
                                                                                {task.timeEstimates?.estimatedHours && (
                                                                                    <div className="flex items-center text-xs text-gray-500">
                                                                                        <Clock className="h-3 w-3 mr-1" />
                                                                                        {task.timeEstimates.estimatedHours}h estimated
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ))
                                                ) : (
                                                    /* PM View: Regular task list */
                                                    member.tasks.slice(0, 5).map((task) => (
                                                        <div key={task._id} className="px-4 py-3 hover:bg-gray-50">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center">
                                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                                            {task.title}
                                                                        </p>
                                                                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(task.status)}`}>
                                                                            {task.status}
                                                                        </span>
                                                                        {isOverdue(task) && (
                                                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                                                Overdue
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-gray-500 mt-1">
                                                                        {task.description || 'No description'}
                                                                    </p>
                                                                    
                                                                    {/* Assignment Details - Admin Only */}
                                                                    {user?.role === 'Admin' && (
                                                                        <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                                                                            <div className="flex items-center text-xs text-gray-600">
                                                                                <User className="h-3 w-3 mr-1" />
                                                                                <span className="font-medium">Assigned by:</span> 
                                                                                <span className="ml-1 text-gray-800">
                                                                                    {task.createdBy ? task.createdBy.name : 'Unknown'}
                                                                                </span>
                                                                                <span className="mx-2">•</span>
                                                                                <Calendar className="h-3 w-3 mr-1" />
                                                                                <span>Assigned: {task.createdAt ? new Date(task.createdAt).toLocaleDateString() + ' ' + new Date(task.createdAt).toLocaleTimeString() : 'Unknown'}</span>
                                                                            </div>
                                                                            {task.updatedAt && task.updatedAt !== task.createdAt && (
                                                                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                                    <span>Last updated: {new Date(task.updatedAt).toLocaleDateString() + ' ' + new Date(task.updatedAt).toLocaleTimeString()}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    
                                                                    <div className="mt-2 flex items-center space-x-4">
                                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                                                                            {task.priority}
                                                                        </span>
                                                                        {task.scheduling?.manualDueDate && (
                                                                            <div className="flex items-center text-xs text-gray-500">
                                                                                <Calendar className="h-3 w-3 mr-1" />
                                                                                Due: {new Date(task.scheduling.manualDueDate).toLocaleDateString()}
                                                                            </div>
                                                                        )}
                                                                        {task.timeEstimates?.estimatedHours && (
                                                                            <div className="flex items-center text-xs text-gray-500">
                                                                                <Clock className="h-3 w-3 mr-1" />
                                                                                {task.timeEstimates.estimatedHours}h estimated
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </>
                                        )}
                                        {member.tasks.length > 5 && user?.role !== 'Admin' && (
                                            <div className="px-4 py-3 bg-gray-50 text-center">
                                                <p className="text-sm text-gray-500">
                                                    Showing 5 of {member.tasks.length} tasks
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* AI Optimization Results */}
            {showAiResults && aiResults && (
                <div className="mb-8">
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">AI Optimization Results</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Powered by Mistral AI • Analyzed {aiResults.originalTasks?.length || 0} tasks
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAiResults(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                ×
                            </button>
                        </div>

                        {/* Key Insights */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-blue-900">Estimated Completion</h4>
                                <p className="text-lg font-semibold text-blue-600">
                                    {aiResults.aiInsights?.estimatedCompletion || 'TBD'}
                                </p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-green-900">Tasks Analyzed</h4>
                                <p className="text-lg font-semibold text-green-600">
                                    {aiResults.originalTasks?.length || 0}
                                </p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-purple-900">Optimization Score</h4>
                                <p className="text-lg font-semibold text-purple-600">High</p>
                            </div>
                        </div>

                        {/* Optimized Schedule */}
                        {aiResults.optimizedSchedule?.optimizedSchedule && (
                            <div className="mb-6">
                                <h4 className="text-md font-medium text-gray-900 mb-3">Optimized Task Schedule</h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {aiResults.optimizedSchedule.optimizedSchedule.map((task, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">{task.title}</p>
                                                <p className="text-xs text-gray-500">{task.reasoning}</p>
                                            </div>
                                            <div className="text-right ml-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    task.priority === 'High' ? 'bg-red-100 text-red-800' :
                                                    task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                    {task.priority}
                                                </span>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {task.suggestedStartDate} → {task.suggestedDueDate}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recommendations */}
                        {aiResults.aiInsights?.recommendations?.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-md font-medium text-gray-900 mb-3">AI Recommendations</h4>
                                <ul className="space-y-2">
                                    {aiResults.aiInsights.recommendations.map((rec, index) => (
                                        <li key={index} className="flex items-start">
                                            <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                            <span className="text-sm text-gray-700">{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Potential Bottlenecks */}
                        {aiResults.aiInsights?.bottlenecks?.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-md font-medium text-gray-900 mb-3">Potential Bottlenecks</h4>
                                <div className="space-y-2">
                                    {aiResults.aiInsights.bottlenecks.map((bottleneck, index) => (
                                        <div key={index} className="flex items-start p-3 bg-yellow-50 rounded-lg">
                                            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm text-yellow-800">{bottleneck}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Resource Allocation */}
                        {aiResults.aiInsights?.resourceAllocation && Object.keys(aiResults.aiInsights.resourceAllocation).length > 0 && (
                            <div>
                                <h4 className="text-md font-medium text-gray-900 mb-3">Resource Allocation</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {Object.entries(aiResults.aiInsights.resourceAllocation).map(([member, allocation]) => (
                                        <div key={member} className="p-3 border border-gray-200 rounded-lg">
                                            <p className="text-sm font-medium text-gray-900">{member}</p>
                                            <div className="mt-1 text-xs text-gray-500">
                                                <p>Tasks: {allocation.tasksCount}</p>
                                                <p>Hours: {allocation.totalHours}</p>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    allocation.workload === 'Balanced' ? 'bg-green-100 text-green-800' :
                                                    allocation.workload === 'Overloaded' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {allocation.workload}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Task Completion Confirmation Dialog */}
            {completionDialog.isOpen && completionDialog.task && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="mt-3 text-center">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Complete Task
                                </h3>
                                <div className="mt-2 px-7 py-3">
                                    <p className="text-sm text-gray-500">
                                        Are you sure you want to mark this task as completed?
                                    </p>
                                    <p className="text-sm font-medium text-gray-900 mt-2">
                                        "{completionDialog.task.title}"
                                    </p>
                                </div>
                                <div className="items-center px-4 py-3">
                                    <button
                                        onClick={confirmTaskCompletion}
                                        className="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        Yes, Complete
                                    </button>
                                    <button
                                        onClick={cancelTaskCompletion}
                                        className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-24 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnifiedDashboard;
