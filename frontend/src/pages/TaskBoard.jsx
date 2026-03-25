import React, { useState, useEffect, useMemo } from 'react';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import BoardColumn from '../components/BoardColumn';
import api from '../services/api';
import { Plus, Filter, User, Users, Search, Moon, Sun, BarChart3, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import TaskModal from '../components/TaskModal';
import TaskDetailsModal from '../components/TaskDetailsModal';
import { useAuth } from '../context/AuthContext';
import { showNotification } from '../components/NotificationSystem';

const COLUMNS = ['To Do', 'In Progress', 'In Review', 'Completed', 'Blocked'];

const TaskBoard = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'my'
    const [darkMode, setDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useAuth();
    
    // Track completed tasks to prevent duplicate rewards
    const [completedTasks, setCompletedTasks] = useState(new Set());

    useEffect(() => {
        // Apply dark mode to document
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    useEffect(() => {
        if (user && user._id) {
            fetchTasks();
        } else {
            setTasks([]);
            setLoading(false);
        }
    }, [user]); // Refetch tasks when user changes

    const addRewardsSafely = (taskId, points) => {
        // Check if this task was already rewarded
        if (completedTasks.has(taskId)) {
            console.log(`Task ${taskId} already rewarded, skipping`);
            return;
        }
        
        // Mark task as rewarded
        setCompletedTasks(prev => new Set([...prev, taskId]));
        
        // Add rewards with proper error handling
        if (window.addRewards) {
            try {
                window.addRewards(points);
            } catch (error) {
                console.error('Error adding rewards:', error);
                // Remove from completed set on error to allow retry
                setCompletedTasks(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(taskId);
                    return newSet;
                });
            }
        }
    };

    const fetchTasks = async () => {
        try {
            // Wait for user data to be available
            if (!user || !user._id) {
                setTasks([]);
                setLoading(false);
                return;
            }
            
            console.log('🔄 Fetching tasks for user:', user._id, user.role);
            
            const response = await api.get('/tasks');
            const allTasks = response.data;
            
            console.log('📊 All tasks fetched:', allTasks.length);
            console.log('🔍 Sample task structure:', allTasks.slice(0, 2).map(t => ({
                title: t.title,
                assignedTo: t.assignedTo,
                createdBy: t.createdBy
            })));
            
            // Filter tasks based on user role - FIXED LOGIC with null checks
            let filteredTasks = [];
            
            if (user.role === 'Admin') {
                // Admin sees all tasks
                filteredTasks = allTasks;
                console.log('👑 Admin: Showing all tasks:', filteredTasks.length);
            } else if (user.role === 'Project Manager') {
                // Project Manager sees all tasks they created (for oversight)
                // This includes tasks they assigned to team members
                filteredTasks = allTasks.filter(task => {
                    if (!task) return false;
                    
                    // PM sees any task they created, regardless of who it's assigned to
                    // Handle both string and ObjectId comparisons
                    const pmCreated = task.createdBy && (
                        (typeof task.createdBy === 'string' && task.createdBy === user._id) ||
                        (task.createdBy._id && task.createdBy._id.toString() === user._id) ||
                        (task.createdBy === user._id)
                    );
                    
                    // PM also sees tasks assigned to them
                    const pmAssigned = task.assignedTo && (
                        (Array.isArray(task.assignedTo) && task.assignedTo.some(assignee => 
                            (typeof assignee === 'string' && assignee === user._id) ||
                            (assignee._id && assignee._id.toString() === user._id) ||
                            (assignee.toString && assignee.toString() === user._id)
                        )) ||
                        (typeof task.assignedTo === 'string' && task.assignedTo === user._id) ||
                        (task.assignedTo._id && task.assignedTo._id.toString() === user._id)
                    );
                    
                    const showTask = pmCreated || pmAssigned;
                    
                    if (showTask) {
                        console.log('👨‍💼 PM showing task:', task.title, 'created:', pmCreated, 'assigned:', pmAssigned);
                    }
                    
                    return showTask;
                });
                console.log('👨‍💼 PM: Showing filtered tasks:', filteredTasks.length);
            } else {
                // Team Member sees only tasks assigned to them (handle multi-assignee)
                filteredTasks = allTasks.filter(task => {
                    if (!task) return false;
                    
                    const isAssigned = task.assignedTo && (
                        (Array.isArray(task.assignedTo) && task.assignedTo.some(assignee => 
                            (typeof assignee === 'string' && assignee === user._id) ||
                            (assignee._id && assignee._id.toString() === user._id) ||
                            (assignee.toString && assignee.toString() === user._id)
                        )) ||
                        (typeof task.assignedTo === 'string' && task.assignedTo === user._id) ||
                        (task.assignedTo._id && task.assignedTo._id.toString() === user._id)
                    );
                    
                    if (isAssigned) {
                        console.log('👤 Team Member showing task:', task.title);
                    }
                    
                    return isAssigned;
                });
                console.log('👤 Team Member: Showing assigned tasks:', filteredTasks.length);
            }
            
            setTasks(filteredTasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setTasks([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const handleQuickStatusChange = async (taskId, newStatus) => {
        try {
            // Find the task to check if it's being completed
            const task = tasks.find(t => t._id === taskId);
            const isCompleting = task?.status !== 'Completed' && newStatus === 'Completed';
            
            // Optimistic UI update
            setTasks(prevTasks => 
                prevTasks.map(task => 
                    task._id === taskId 
                        ? { ...task, status: newStatus }
                        : task
                )
            );

            // Backend update
            await api.put(`/tasks/${taskId}`, { status: newStatus });
            
            // Add rewards if task is completed (with synchronization)
            if (isCompleting) {
                addRewardsSafely(taskId, 100);
                
                // Show special completion notification
                showNotification('success', '🎉 Task completed! +100 reward points earned!', 'Task Completed & Rewarded!');
            } else {
                // Show regular notification
                const statusMessages = {
                    'In Progress': 'Task started',
                    'In Review': 'Task submitted for review',
                    'Completed': 'Task completed',
                    'Blocked': 'Task blocked',
                    'To Do': 'Task reopened'
                };
                
                showNotification('success', statusMessages[newStatus] || 'Status updated', 'Task Updated');
            }
            
        } catch (error) {
            console.error('Error updating task status:', error);
            // Revert on error
            fetchTasks();
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Filter tasks based on selected filter (memoized for performance)
    const filteredTasks = useMemo(() => {
        if (!user) return []; // No user, no tasks
        
        console.log('🔍 Filtering tasks for user:', user._id, user.role);
        console.log('📋 Available tasks:', tasks.length);
        console.log('🎯 Filter type:', filter);
        
        switch (filter) {
            case 'my':
                const myTasks = tasks.filter(task => {
                    if (!task) return false;
                    
                    console.log('🔍 Checking task:', task.title, 'assignedTo:', task.assignedTo);
                    
                    // Handle different assignedTo structures
                    const assignedTo = task.assignedTo;
                    
                    // If assignedTo is an array, check if user is in the array
                    if (Array.isArray(assignedTo)) {
                        const isAssigned = assignedTo.some(assignee => {
                            if (!assignee) return false;
                            
                            // Handle string IDs
                            if (typeof assignee === 'string') {
                                return assignee === user._id;
                            }
                            
                            // Handle object IDs with _id
                            if (assignee._id) {
                                return assignee._id.toString() === user._id;
                            }
                            
                            // Handle toString method
                            if (assignee.toString && typeof assignee.toString === 'function') {
                                return assignee.toString() === user._id;
                            }
                            
                            return false;
                        });
                        
                        console.log('📊 Array assignment check:', isAssigned);
                        return isAssigned;
                    }
                    
                    // If assignedTo is a string, check direct match
                    if (typeof assignedTo === 'string') {
                        const isAssigned = assignedTo === user._id;
                        console.log('📊 String assignment check:', isAssigned);
                        return isAssigned;
                    }
                    
                    // If assignedTo is an object, check _id
                    if (assignedTo && assignedTo._id) {
                        const isAssigned = assignedTo._id.toString() === user._id;
                        console.log('📊 Object assignment check:', isAssigned);
                        return isAssigned;
                    }
                    
                    console.log('❌ No assignment match found');
                    return false;
                });
                
                console.log('✅ My tasks filtered:', myTasks.length);
                return myTasks;
                
            default:
                console.log('✅ All tasks returned:', tasks.length);
                return tasks;
        }
    }, [tasks, filter, user]);

    const getTasksByStatus = (status) => {
        // Use the filteredTasks instead of raw tasks
        const exactMatch = filteredTasks.filter(task => task.status === status);
        const caseInsensitiveMatch = filteredTasks.filter(task => task.status && task.status.toLowerCase() === status.toLowerCase());
        
        // Use case-insensitive match as fallback
        const tasksByStatus = exactMatch.length > 0 ? exactMatch : caseInsensitiveMatch;
        
        console.log(`📋 Getting tasks for status "${status}":`, tasksByStatus.length);
        
        return tasksByStatus;
    };

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    // Filter tasks based on search query
    const getFilteredTasks = () => {
        if (!searchQuery.trim()) return filteredTasks;
        
        return filteredTasks.filter(task => 
            task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    // Calculate task statistics (moved after filteredTasks definition)
    const taskStats = useMemo(() => {
        if (!user) return { total: 0, completed: 0, inProgress: 0, blocked: 0 };
        
        return {
            total: filteredTasks.length,
            completed: filteredTasks.filter(t => t.status === 'Completed').length,
            inProgress: filteredTasks.filter(t => t.status === 'In Progress').length,
            blocked: filteredTasks.filter(t => t.status === 'Blocked').length
        };
    }, [filteredTasks, user]);

    const handleOpenModal = (task = null) => {
        console.log("New Task button clicked");
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const handleOpenDetailsModal = (task) => {
        setSelectedTask(task);
        setIsDetailsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedTask(null);
        setIsModalOpen(false);
        fetchTasks(); // Refresh list to get new/updated task
    };

    const handleCloseDetailsModal = () => {
        setSelectedTask(null);
        setIsDetailsModalOpen(false);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (!over) return;

        const taskId = active.id;
        const newStatus = over.id;

        // Find the task
        const task = tasks.find(t => t._id === taskId);
        if (!task) return;

        // Don't do anything if status hasn't changed
        if (task.status === newStatus) return;

        try {
            // Optimistic UI update
            setTasks(prevTasks => 
                prevTasks.map(t => 
                    t._id === taskId 
                        ? { ...t, status: newStatus }
                        : t
                )
            );

            // Backend update
            await api.put(`/tasks/${taskId}`, { status: newStatus });
            
            // Check if task is being completed
            const isCompleting = task.status !== 'Completed' && newStatus === 'Completed';
            
            if (isCompleting) {
                addRewardsSafely(taskId, 100);
                showNotification('success', '🎉 Task completed! +100 reward points earned!', 'Task Completed & Rewarded!');
            } else {
                const statusMessages = {
                    'In Progress': 'Task started',
                    'In Review': 'Task submitted for review',
                    'Completed': 'Task completed',
                    'Blocked': 'Task blocked',
                    'To Do': 'Task reopened'
                };
                
                showNotification('success', statusMessages[newStatus] || 'Status updated', 'Task Updated');
            }
            
        } catch (error) {
            console.error('Error updating task status:', error);
            // Revert on error
            fetchTasks();
        }
    };

    if (loading) return (
        <div className={`min-h-screen transition-colors duration-300 flex items-center justify-center ${
            darkMode 
                ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
                : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
        }`}>
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Loading board...</p>
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode 
                ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
                : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
        }`}>
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 blur-3xl ${
                    darkMode 
                        ? 'bg-gradient-to-br from-blue-800 to-purple-800' 
                        : 'bg-gradient-to-br from-blue-200 to-purple-200'
                }`}></div>
                <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-20 blur-3xl ${
                    darkMode 
                        ? 'bg-gradient-to-br from-indigo-800 to-pink-800' 
                        : 'bg-gradient-to-br from-indigo-200 to-pink-200'
                }`}></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className={`p-8 mb-8 rounded-3xl shadow-2xl border transition-colors duration-300 ${
                    darkMode 
                        ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700' 
                        : 'bg-white/80 backdrop-blur-xl border-white/20'
                }`}>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
                        <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                                <div className={`w-16 h-16 rounded-2xl p-1 ${
                                    darkMode 
                                        ? 'bg-gradient-to-br from-blue-700 to-purple-700' 
                                        : 'bg-gradient-to-br from-blue-600 to-purple-600'
                                }`}>
                                    <div className={`w-full h-full rounded-xl flex items-center justify-center ${
                                        darkMode ? 'bg-gray-800' : 'bg-white'
                                    }`}>
                                        <BarChart3 className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                    </div>
                                </div>
                                <div>
                                    <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Task Board
                                    </h1>
                                    <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        Manage and track your team's tasks efficiently
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {/* Search */}
                            <div className="relative">
                                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                                    darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                        darkMode 
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                                    }`}
                                />
                            </div>

                            {/* Filter Buttons */}
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-xl transition-all ${
                                        filter === 'all' 
                                            ? 'bg-blue-600 text-white border-blue-600' 
                                            : darkMode 
                                                ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600' 
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <Users className="w-4 h-4 mr-1" />
                                    All
                                </button>
                                
                                <button
                                    onClick={() => setFilter('my')}
                                    className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-xl transition-all ${
                                        filter === 'my' 
                                            ? 'bg-green-600 text-white border-green-600' 
                                            : darkMode 
                                                ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600' 
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <User className="w-4 h-4 mr-1" />
                                    My Tasks
                                </button>
                            </div>

                            {/* Dark Mode Toggle */}
                            <button
                                onClick={toggleDarkMode}
                                className={`p-3 rounded-xl transition-colors ${
                                    darkMode 
                                        ? 'hover:bg-gray-700 text-yellow-400' 
                                        : 'hover:bg-gray-100 text-gray-600'
                                }`}
                            >
                                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>

                            {/* New Task Button */}
                            {(user?.role === 'Admin' || user?.role === 'Project Manager') && (
                                <button
                                    onClick={() => handleOpenModal()}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-lg text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                    New Task
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Total Tasks', value: taskStats.total, icon: BarChart3, color: 'from-blue-500 to-blue-600' },
                        { label: 'In Progress', value: taskStats.inProgress, icon: Clock, color: 'from-orange-500 to-orange-600' },
                        { label: 'Completed', value: taskStats.completed, icon: CheckCircle, color: 'from-green-500 to-green-600' },
                        { label: 'Blocked', value: taskStats.blocked, icon: TrendingUp, color: 'from-red-500 to-red-600' }
                    ].map((stat, index) => (
                        <div key={index} className={`p-6 rounded-2xl shadow-xl border transition-colors duration-300 ${
                            darkMode 
                                ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700' 
                                : 'bg-white/80 backdrop-blur-xl border-white/20'
                        }`}>
                            <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {stat.value}
                            </div>
                            <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Task Count Summary */}
                <div className={`mb-6 p-4 rounded-2xl border ${
                    darkMode 
                        ? 'bg-gray-800/50 border-gray-700 text-gray-300' 
                        : 'bg-blue-50 border-blue-200 text-gray-700'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                filter === 'my' 
                                    ? 'bg-green-600 text-white' 
                                    : filter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-600 text-white'
                            }`}>
                                {filter === 'my' && <User className="w-4 h-4 mr-1" />}
                                {filter === 'all' && <Users className="w-4 h-4 mr-1" />}
                                {filter === 'my' ? 'My Tasks' : 'All Tasks'}
                            </span>
                            <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                ({searchQuery.trim() ? 
                                    tasks.filter(task => 
                                        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
                                    ).length 
                                    : filteredTasks.length} tasks)
                            </span>
                        </div>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className={`text-sm ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                </div>

                {/* Task Board */}
                <div className={`flex-1 overflow-x-auto overflow-y-hidden rounded-3xl shadow-2xl border transition-colors duration-300 ${
                    darkMode 
                        ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700' 
                        : 'bg-white/80 backdrop-blur-xl border-white/20'
                }`}>
                    <div className="flex h-full space-x-4 pb-4 items-start min-w-[1200px]">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCorners}
                            onDragEnd={handleDragEnd}
                        >
                            {COLUMNS.map((col) => (
                                <BoardColumn
                                    key={col}
                                    title={col}
                                    tasks={getTasksByStatus(col)}
                                    onTaskClick={handleOpenDetailsModal}
                                    onStatusChange={handleQuickStatusChange}
                                    darkMode={darkMode}
                                    searchQuery={searchQuery}
                                />
                            ))}
                        </DndContext>
                    </div>
                </div>

                {/* Modals */}
                {isModalOpen && (
                    <TaskModal
                        task={selectedTask}
                        onClose={handleCloseModal}
                        allTasks={tasks}
                        darkMode={darkMode}
                    />
                )}

                {isDetailsModalOpen && (
                    <TaskDetailsModal
                        task={selectedTask}
                        onClose={handleCloseDetailsModal}
                        onStatusChange={handleQuickStatusChange}
                        onTaskUpdate={fetchTasks}
                        darkMode={darkMode}
                    />
                )}
            </div>
        </div>
    );
};

export default TaskBoard;
