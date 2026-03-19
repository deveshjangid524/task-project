import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { showNotification } from '../components/NotificationSystem';

const COLUMNS = ['To Do', 'In Progress', 'In Review', 'Completed', 'Blocked'];

const TaskBoard = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'my', 'unassigned'
    const { user } = useAuth();

    useEffect(() => {
        fetchTasks();
    }, [user]); // Refetch tasks when user changes

    const fetchTasks = async () => {
        try {
            const response = await api.get('/tasks');
            const allTasks = response.data;
            
            console.log('=== PM FILTERING DEBUG ===');
            console.log('User ID:', user?._id);
            console.log('User Role:', user?.role);
            console.log('All Tasks:', allTasks.map(t => ({ 
                title: t.title, 
                createdBy: t.createdBy, 
                createdByType: typeof t.createdBy,
                assignedTo: t.assignedTo,
                status: t.status 
            })));
            
            // Filter tasks based on user role - ORIGINAL WORKING LOGIC
            let filteredTasks;
            if (user?.role === 'Admin') {
                // Admin sees all tasks
                filteredTasks = allTasks;
                console.log('Admin mode - showing all tasks:', filteredTasks.length);
            } else if (user?.role === 'Project Manager') {
                // Project Manager sees tasks they created OR assigned to them OR assigned by them to team members
                filteredTasks = allTasks.filter(task => {
                    // Handle both single assignee and multi-assignee scenarios
                    const assignedToPM = task.assignedTo && (
                        (Array.isArray(task.assignedTo) && task.assignedTo.some(assignee => 
                            (typeof assignee === 'string' && assignee === user._id) ||
                            (assignee._id && assignee._id === user._id)
                        )) ||
                        (typeof task.assignedTo === 'string' && task.assignedTo === user._id) ||
                        (task.assignedTo._id && task.assignedTo._id === user._id)
                    );
                    const pmCreated = task.createdBy && (
                    (typeof task.createdBy === 'string' && task.createdBy === user._id) ||
                    (task.createdBy._id && task.createdBy._id === user._id)
                );
                    
                    console.log(`Task "${task.title}":`);
                    console.log(`  - createdBy: ${task.createdBy} (type: ${typeof task.createdBy})`);
                    console.log(`  - assignedTo: ${JSON.stringify(task.assignedTo)}`);
                    console.log(`  - assignedToPM: ${assignedToPM}`);
                    console.log(`  - pmCreated: ${pmCreated}`);
                    console.log(`  - visible: ${assignedToPM || pmCreated}`);
                    
                    // PM should see tasks they created OR assigned to them
                    // This includes tasks they assigned to team members for oversight
                    return assignedToPM || pmCreated;
                });
                console.log('PM mode - filtered tasks:', filteredTasks.length);
            } else {
                // Team Member sees only tasks assigned to them (handle multi-assignee)
                filteredTasks = allTasks.filter(task => 
                    task.assignedTo && (
                        (Array.isArray(task.assignedTo) && task.assignedTo.some(assignee => assignee._id === user._id)) ||
                        (task.assignedTo._id === user._id)
                    )
                );
                console.log('Team Member mode - filtered tasks:', filteredTasks.length);
            }
            
            setTasks(filteredTasks);
        } catch (error) {
            console.error('Error fetching tasks', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickStatusChange = async (taskId, newStatus) => {
        try {
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
            
            // Show notification
            const statusMessages = {
                'In Progress': 'Task started',
                'In Review': 'Task submitted for review',
                'Completed': 'Task completed',
                'Blocked': 'Task blocked',
                'To Do': 'Task reopened'
            };
            
            showNotification('success', statusMessages[newStatus] || 'Status updated', 'Task Updated');
            
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
        // Try both exact match and case-insensitive match
        const exactMatch = tasks.filter(task => task.status === status);
        const caseInsensitiveMatch = tasks.filter(task => task.status && task.status.toLowerCase() === status.toLowerCase());
        
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
            // Optimistic UI update
            setTasks((prevTasks) =>
                prevTasks.map(t => t._id === activeId ? { ...t, status: newStatus } : t)
            );

            // Backend update
            try {
                await api.put(`/tasks/${activeId}`, { status: newStatus });
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

    const handleCloseModal = () => {
        setSelectedTask(null);
        setIsModalOpen(false);
        fetchTasks(); // Refresh list to get new/updated task
    };

    // Filter tasks based on selected filter
    const getFilteredTasks = () => {
        switch (filter) {
            case 'my':
                return tasks.filter(task => {
                    // Handle both single assignee and multi-assignee scenarios
                    return task.assignedTo && (
                        (Array.isArray(task.assignedTo) && task.assignedTo.some(assignee => assignee._id === user._id)) ||
                        (task.assignedTo._id === user._id)
                    );
                });
            case 'unassigned':
                return tasks.filter(task => !task.assignedTo);
            default:
                return tasks;
        }
    };

    const filteredTasks = getFilteredTasks();

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
                
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    New Task
                </button>
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
                                onTaskClick={handleOpenModal}
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
        </div>
    );
};

export default TaskBoard;
