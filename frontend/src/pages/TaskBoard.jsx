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
import { Plus, Filter, User, Users } from 'lucide-react';
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
    const [filter, setFilter] = useState('all'); // 'all', 'my', 'unassigned'
    const { user } = useAuth();
    
    // Track completed tasks to prevent duplicate rewards
    const [completedTasks, setCompletedTasks] = useState(new Set());

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
            
            const response = await api.get('/tasks');
            const allTasks = response.data;
            
            // Filter tasks based on user role - FIXED LOGIC with null checks
            let filteredTasks = [];
            
            if (user.role === 'Admin') {
                // Admin sees all tasks
                filteredTasks = allTasks;
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
                    
                    // Fallback: If createdBy is undefined, show task to PM for now
                    // This handles cases where createdBy wasn't set properly
                    const showTask = pmCreated || !task.createdBy;
                    
                    return showTask;
                });
            } else {
                // Team Member sees only tasks assigned to them (handle multi-assignee)
                filteredTasks = allTasks.filter(task => {
                    if (!task) return false;
                    
                    return task.assignedTo && (
                        (Array.isArray(task.assignedTo) && task.assignedTo.some(assignee => 
                            (typeof assignee === 'string' && assignee === user._id) ||
                            (assignee._id && assignee._id === user._id)
                        )) ||
                        (typeof task.assignedTo === 'string' && task.assignedTo === user._id) ||
                        (task.assignedTo._id && task.assignedTo._id === user._id)
                    );
                });
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

    const getTasksByStatus = (status) => {
        // Try both exact match and case-insensitive match on filtered tasks
        const exactMatch = filteredTasks.filter(task => task.status === status);
        const caseInsensitiveMatch = filteredTasks.filter(task => task.status && task.status.toLowerCase() === status.toLowerCase());
        
        // Use case-insensitive match as fallback
        const tasksByStatus = exactMatch.length > 0 ? exactMatch : caseInsensitiveMatch;
        
        return tasksByStatus;
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeTask = tasks.find(t => t._id === activeId);
        if (!activeTask) return;

        // Check if dragging over a column or another item
        const isOverAColumn = COLUMNS.includes(overId);
        let newStatus = activeTask.status;

        if (isOverAColumn) {
            newStatus = overId;
        } else {
            const overTask = tasks.find(t => t._id === overId);
            if (overTask) {
                newStatus = overTask.status;
            }
        }

        if (activeTask.status !== newStatus) {
            // Check if task is being completed
            const isCompleting = activeTask.status !== 'Completed' && newStatus === 'Completed';
            
            // Optimistic UI update
            setTasks((prevTasks) =>
                prevTasks.map(t => t._id === activeId ? { ...t, status: newStatus } : t)
            );

            // Backend update
            try {
                await api.put(`/tasks/${activeId}`, { status: newStatus });
                
                // Add rewards if task is completed (with synchronization)
                if (isCompleting) {
                    addRewardsSafely(activeId, 100);
                    
                    // Show special completion notification
                    showNotification('success', '🎉 Task completed! +100 reward points earned!', 'Task Completed & Rewarded!');
                }
            } catch (error) {
                console.error('Error updating task status', error);
                // Revert on failure
                fetchTasks();
            }
        }
    };

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

    // Filter tasks based on selected filter (memoized for performance)
    const filteredTasks = useMemo(() => {
        if (!user) return []; // No user, no tasks
        
        switch (filter) {
            case 'my':
                return tasks.filter(task => {
                    if (!task) return false;
                    
                    // Handle different assignedTo structures
                    const assignedTo = task.assignedTo;
                    
                    // If assignedTo is an array, check if user is in the array
                    if (Array.isArray(assignedTo)) {
                        return assignedTo.some(assignee => {
                            if (!assignee) return false;
                            // Handle both string IDs and object IDs
                            return (typeof assignee === 'string' && assignee === user._id) ||
                                   (assignee._id && assignee._id.toString() === user._id) ||
                                   (assignee.toString && assignee.toString() === user._id);
                        });
                    }
                    
                    // If assignedTo is a string, check direct match
                    if (typeof assignedTo === 'string') {
                        return assignedTo === user._id;
                    }
                    
                    // If assignedTo is an object, check _id
                    if (assignedTo && assignedTo._id) {
                        return assignedTo._id.toString() === user._id;
                    }
                    
                    return false;
                });
            case 'unassigned':
                return tasks.filter(task => {
                    if (!task) return false;
                    
                    const assignedTo = task.assignedTo;
                    
                    // Task is unassigned if:
                    // 1. assignedTo is null or undefined
                    // 2. assignedTo is an empty array
                    // 3. assignedTo is an empty string
                    if (assignedTo === null || assignedTo === undefined || assignedTo === '') {
                        return true;
                    }
                    
                    // If assignedTo is an array, check if it's empty
                    if (Array.isArray(assignedTo)) {
                        return assignedTo.length === 0;
                    }
                    
                    return false;
                });
            default:
                return tasks;
        }
    }, [tasks, filter, user]);

    if (loading) return <div className="p-8 text-center">Loading board...</div>;

    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
                    
                    {/* Filter Buttons - Role-based */}
                    <div className="flex space-x-2">
                        {user?.role === 'Admin' && (
                            <button
                                onClick={() => setFilter('all')}
                                className={`inline-flex items-center px-3 py-1 border text-sm font-medium rounded-md ${
                                    filter === 'all' 
                                        ? 'bg-blue-600 text-white border-blue-600' 
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <Users className="h-4 w-4 mr-1" />
                                All Tasks
                            </button>
                        )}
                        
                        {(user?.role === 'Admin' || user?.role === 'Project Manager') && (
                            <button
                                onClick={() => setFilter('unassigned')}
                                className={`inline-flex items-center px-3 py-1 border text-sm font-medium rounded-md ${
                                    filter === 'unassigned' 
                                        ? 'bg-blue-600 text-white border-blue-600' 
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <Filter className="h-4 w-4 mr-1" />
                                Unassigned
                            </button>
                        )}
                        
                        <button
                            onClick={() => setFilter('my')}
                            className={`inline-flex items-center px-3 py-1 border text-sm font-medium rounded-md ${
                                filter === 'my' 
                                    ? 'bg-blue-600 text-white border-blue-600' 
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <User className="h-4 w-4 mr-1" />
                            {user?.role === 'Admin' ? 'My Tasks' : 'My Tasks'}
                        </button>
                    </div>
                </div>
                
                {(user?.role === 'Admin' || user?.role === 'Project Manager') && (
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    New Task
                </button>
            )}
            </div>
            
            {/* Task Count Summary */}
            <div className="mb-4 text-sm text-gray-600">
                Showing: <span className="font-medium">
                    {filter === 'my' ? 'My Tasks' : filter === 'unassigned' ? 'Unassigned Tasks' : 
                     user?.role === 'Admin' ? 'All Tasks' : 'My Tasks'}
                </span> ({filteredTasks.length} tasks)
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden">
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
                            />
                        ))}
                    </DndContext>
                </div>
            </div>

            {isModalOpen && (
                <TaskModal
                    task={selectedTask}
                    onClose={handleCloseModal}
                    allTasks={tasks}
                />
            )}

            {isDetailsModalOpen && (
                <TaskDetailsModal
                    task={selectedTask}
                    onClose={handleCloseDetailsModal}
                    onStatusChange={handleQuickStatusChange}
                    onTaskUpdate={fetchTasks}
                />
            )}
        </div>
    );
};

export default TaskBoard;
