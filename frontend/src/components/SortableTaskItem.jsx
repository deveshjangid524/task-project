import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Clock } from 'lucide-react';

const priorityColors = {
    Low: 'bg-green-100 text-green-800 border-green-200',
    Medium: 'bg-blue-100 text-blue-800 border-blue-200',
    High: 'bg-orange-100 text-orange-800 border-orange-200',
    Critical: 'bg-red-100 text-red-800 border-red-200',
};

const SortableTaskItem = ({ task, onClick }) => {
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

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:border-primary-400 hover:shadow-md transition-all ${isDragging ? 'shadow-lg border-primary-500' : ''}`}
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
                {task.assignedTo ? (
                    <div className="flex items-center" title={task.assignedTo.name}>
                        <img
                            className="h-6 w-6 rounded-full border border-gray-200"
                            src={`https://ui-avatars.com/api/?name=${task.assignedTo.name}&background=random`}
                            alt={task.assignedTo.name}
                        />
                    </div>
                ) : (
                    <div className="h-6 w-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                        <span className="text-xs text-gray-400">?</span>
                    </div>
                )}

                {(task.scheduling?.aiOptimizedDueDate || task.scheduling?.manualDueDate) && (
                    <div className={`flex items-center text-xs ${task.scheduling.isRescheduledByAI ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(task.scheduling.aiOptimizedDueDate || task.scheduling.manualDueDate)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SortableTaskItem;
