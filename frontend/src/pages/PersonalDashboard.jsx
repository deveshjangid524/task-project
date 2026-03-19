import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
    CheckCircle, 
    Clock, 
    AlertTriangle, 
    TrendingUp,
    Calendar,
    Target,
    User,
    BarChart3
} from 'lucide-react';

const PersonalDashboard = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        inProgress: 0,
        todo: 0,
        overdue: 0,
        completionRate: 0
    });

    useEffect(() => {
        fetchPersonalTasks();
    }, []);

    const fetchPersonalTasks = async () => {
        try {
            const response = await api.get('/tasks');
            const allTasks = response.data;
            
            // Filter tasks assigned to current user
            const myTasks = allTasks.filter(task => 
                task.assignedTo && task.assignedTo._id === user._id
            );
            
            setTasks(myTasks);
            
            // Calculate statistics
            const now = new Date();
            const completed = myTasks.filter(t => t.status === 'Completed').length;
            const inProgress = myTasks.filter(t => t.status === 'In Progress').length;
            const todo = myTasks.filter(t => t.status === 'To Do').length;
            const overdue = myTasks.filter(t => 
                t.scheduling?.manualDueDate && 
                new Date(t.scheduling.manualDueDate) < now && 
                t.status !== 'Completed'
            ).length;
            
            setStats({
                total: myTasks.length,
                completed,
                inProgress,
                todo,
                overdue,
                completionRate: myTasks.length > 0 ? Math.round((completed / myTasks.length) * 100) : 0
            });
            
        } catch (error) {
            console.error('Error fetching personal tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Critical': return 'text-red-600 bg-red-50 border-red-200';
            case 'High': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'Low': return 'text-green-600 bg-green-50 border-green-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'text-green-600 bg-green-50 border-green-200';
            case 'In Progress': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'In Review': return 'text-purple-600 bg-purple-50 border-purple-200';
            case 'Blocked': return 'text-red-600 bg-red-50 border-red-200';
            case 'To Do': return 'text-gray-600 bg-gray-50 border-gray-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const isOverdue = (task) => {
        if (!task.scheduling?.manualDueDate || task.status === 'Completed') return false;
        return new Date(task.scheduling.manualDueDate) < new Date();
    };

    if (loading) return <div className="p-8 text-center">Loading personal dashboard...</div>;

    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Personal Dashboard</h1>
                <p className="mt-2 text-gray-600">Welcome back, {user?.name}! Here's your task overview.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Target className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
                            <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
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
                            <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
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
                            <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {stats.overdue > 0 && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                You have {stats.overdue} overdue task{stats.overdue > 1 ? 's' : ''}
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Tasks */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">My Tasks</h3>
                        <span className="text-sm text-gray-500">{tasks.length} tasks</span>
                    </div>
                </div>
                
                <ul className="divide-y divide-gray-200">
                    {tasks.length === 0 ? (
                        <li className="px-4 py-8 text-center text-gray-500">
                            No tasks assigned to you yet.
                        </li>
                    ) : (
                        tasks.slice(0, 10).map((task) => (
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
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
                
                {tasks.length > 10 && (
                    <div className="px-4 py-3 sm:px-6 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                            Showing 10 of {tasks.length} tasks. View all tasks in the Task Board.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PersonalDashboard;
