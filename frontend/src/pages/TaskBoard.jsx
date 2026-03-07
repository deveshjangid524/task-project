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
import { Plus } from 'lucide-react';
import TaskModal from '../components/TaskModal';

const COLUMNS = ['To Do', 'In Progress', 'In Review', 'Completed', 'Blocked'];

const TaskBoard = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await api.get('/tasks');
            setTasks(response.data);
        } catch (error) {
            console.error('Error fetching tasks', error);
        } finally {
            setLoading(false);
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
        return tasks.filter((task) => task.status === status);
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
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedTask(null);
        setIsModalOpen(false);
        fetchTasks(); // Refresh list to get new/updated task
    };

    if (loading) return <div className="p-8 text-center">Loading board...</div>;

    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    New Task
                </button>
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
