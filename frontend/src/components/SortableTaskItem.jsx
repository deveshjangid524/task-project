import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Clock, Play, Eye, AlertCircle, CheckCircle } from 'lucide-react';

const priorityColors = {
    Low: 'bg-green-100 text-green-800 border-green-200',
    Medium: 'bg-blue-100 text-blue-800 border-blue-200',
    High: 'bg-orange-100 text-orange-800 border-orange-200',
    Critical: 'bg-red-100 text-red-800 border-red-200',
};

const SortableTaskItem = ({ task, onClick, onStatusChange, searchQuery }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleStatusChange = (e, newStatus) => {
        e.stopPropagation(); // Prevent opening task modal
        if (onStatusChange) {
            onStatusChange(task._id, newStatus);
        }
    };

    // Check if task matches search query for highlighting
    const isTaskHighlighted = () => {
        if (!searchQuery || !searchQuery.trim()) return false;
        
        const query = searchQuery.toLowerCase();
        return (
            task.title?.toLowerCase().includes(query) ||
            task.description?.toLowerCase().includes(query) ||
            task.category?.toLowerCase().includes(query)
        );
    };

    const getQuickActions = () => {
        switch (task.status) {
            case 'To Do':
                return (
                    <button
                        onClick={(e) => handleStatusChange(e, 'In Progress')}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Start Task"
                    >
                        <Play className="w-4 h-4" />
                    </button>
                );
            case 'In Progress':
                return (
                    <div className="flex space-x-1">
                        <button
                            onClick={(e) => handleStatusChange(e, 'In Review')}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Submit for Review"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => handleStatusChange(e, 'Blocked')}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Mark as Blocked"
                        >
                            <AlertCircle className="w-4 h-4" />
                        </button>
                    </div>
                );
            case 'In Review':
                return (
                    <button
                        onClick={(e) => handleStatusChange(e, 'Completed')}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Complete Task"
                    >
                        <CheckCircle className="w-4 h-4" />
                    </button>
                );
            case 'Blocked':
                return (
                    <button
                        onClick={(e) => handleStatusChange(e, 'In Progress')}
                        className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                        title="Unblock Task"
                    >
                        <Play className="w-4 h-4" />
                    </button>
                );
            case 'Completed':
                return (
                    <button
                        onClick={(e) => handleStatusChange(e, 'In Progress')}
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                        title="Reopen Task"
                    >
                        <Play className="w-4 h-4" />
                    </button>
                );
            default:
                return null;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={`bg-white p-4 rounded-lg shadow-sm border cursor-grab active:cursor-grabbing hover:border-primary-400 hover:shadow-md transition-all ${
                isDragging ? 'shadow-lg border-primary-500' : ''
            } ${
                isTaskHighlighted() 
                    ? 'ring-2 ring-blue-400 ring-opacity-50 border-blue-400 bg-blue-50' 
                    : 'border-gray-200'
            }`}
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${priorityColors[task.priority] || priorityColors.Medium}`}>
                    {task.priority}
                </span>
                {task.timeEstimates?.estimatedHours && (
                    <span className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {task.timeEstimates.estimatedHours}h
                    </span>
                )}
            </div>

            <h4 className="text-sm font-medium text-gray-900 mb-1">{task.title}</h4>

            {task.category && (
                <p className="text-xs text-gray-500 mb-3 truncate">{task.category}</p>
            )}

            <div className="flex items-center justify-between mt-3">
                {task.assignedTo && (
                    <div className="flex items-center">
                        {Array.isArray(task.assignedTo) ? (
                            // Multiple assignees - show first 2 with count
                            <div className="flex -space-x-2">
                                {task.assignedTo.slice(0, 2).map((assignee, index) => (
                                    <div key={index} className="relative" title={typeof assignee === 'string' ? assignee : assignee.name}>
                                        <img
                                            className="h-6 w-6 rounded-full border border-gray-200"
                                            src={`https://ui-avatars.com/api/?name=${typeof assignee === 'string' ? assignee : assignee.name}&background=random`}
                                            alt={typeof assignee === 'string' ? assignee : assignee.name}
                                        />
                                    </div>
                                ))}
                                {task.assignedTo.length > 2 && (
                                    <div className="h-6 w-6 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-gray-600 font-medium">
                                        +{task.assignedTo.length - 2}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Single assignee
                            <div title={typeof task.assignedTo === 'string' ? task.assignedTo : task.assignedTo.name}>
                                <img
                                    className="h-6 w-6 rounded-full border border-gray-200"
                                    src={`https://ui-avatars.com/api/?name=${typeof task.assignedTo === 'string' ? task.assignedTo : task.assignedTo.name}&background=random`}
                                    alt={typeof task.assignedTo === 'string' ? task.assignedTo : task.assignedTo.name}
                                />
                            </div>
                        )}
                    </div>
                )}
                {!task.assignedTo && (
                    <div className="h-6 w-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                        <span className="text-xs text-gray-400">?</span>
                    </div>
                )}

                <div className="flex items-center space-x-1">
                    {getQuickActions()}
                    
                    {(task.scheduling?.aiOptimizedDueDate || task.scheduling?.manualDueDate) && (
                        <div className={`flex items-center text-xs ${task.scheduling.isRescheduledByAI ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(task.scheduling.aiOptimizedDueDate || task.scheduling.manualDueDate)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SortableTaskItem;
