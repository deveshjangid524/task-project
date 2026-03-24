import React, { useState } from 'react';
import { X, Edit, MoreVertical, Calendar, Clock, User, Users, FileText, ExternalLink, CheckCircle, AlertCircle, Play, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TaskModal from './TaskModal';

const TaskDetailsModal = ({ task, onClose, onStatusChange }) => {
    const { user } = useAuth();
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    if (!task) return null;

    const priorityColors = {
        Low: 'bg-green-100 text-green-800 border-green-200',
        Medium: 'bg-blue-100 text-blue-800 border-blue-200',
        High: 'bg-orange-100 text-orange-800 border-orange-200',
        Critical: 'bg-red-100 text-red-800 border-red-200',
    };

    const statusColors = {
        'To Do': 'bg-gray-100 text-gray-800 border-gray-200',
        'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
        'In Review': 'bg-purple-100 text-purple-800 border-purple-200',
        'Completed': 'bg-green-100 text-green-800 border-green-200',
        'Blocked': 'bg-red-100 text-red-800 border-red-200',
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    const getQuickActions = () => {
        switch (task.status) {
            case 'To Do':
                return (
                    <button
                        onClick={() => onStatusChange(task._id, 'In Progress')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Start Task"
                    >
                        <Play className="w-4 h-4" />
                    </button>
                );
            case 'In Progress':
                return (
                    <div className="flex space-x-1">
                        <button
                            onClick={() => onStatusChange(task._id, 'In Review')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Submit for Review"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onStatusChange(task._id, 'Blocked')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Mark as Blocked"
                        >
                            <AlertCircle className="w-4 h-4" />
                        </button>
                    </div>
                );
            case 'In Review':
                return (
                    <button
                        onClick={() => onStatusChange(task._id, 'Completed')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Complete Task"
                    >
                        <CheckCircle className="w-4 h-4" />
                    </button>
                );
            case 'Blocked':
                return (
                    <button
                        onClick={() => onStatusChange(task._id, 'In Progress')}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Unblock Task"
                    >
                        <Play className="w-4 h-4" />
                    </button>
                );
            case 'Completed':
                return (
                    <button
                        onClick={() => onStatusChange(task._id, 'In Progress')}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Reopen Task"
                    >
                        <Play className="w-4 h-4" />
                    </button>
                );
            default:
                return null;
        }
    };

    const canEdit = () => {
        return user?.role === 'Admin' || 
               user?.role === 'Project Manager' || 
               (task.createdBy && (
                   (typeof task.createdBy === 'string' && task.createdBy === user._id) ||
                   (task.createdBy._id && task.createdBy._id === user._id)
               ));
    };

    const getAssigneeNames = () => {
        if (!task.assignedTo) return 'Unassigned';
        
        if (Array.isArray(task.assignedTo)) {
            return task.assignedTo.map(assignee => 
                typeof assignee === 'string' ? assignee : assignee.name
            ).join(', ');
        }
        
        return typeof task.assignedTo === 'string' 
            ? task.assignedTo 
            : task.assignedTo.name || 'Unknown';
    };

    const getCreatorName = () => {
        if (!task.createdBy) return 'Unknown';
        return typeof task.createdBy === 'string' ? task.createdBy : task.createdBy.name || 'Unknown';
    };

    return (
        <>
            <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div
                        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                        aria-hidden="true"
                        onClick={onClose}
                    ></div>
                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                    <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                        {/* Header */}
                        <div className="bg-white px-6 py-4 border-b border-gray-200">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{task.title}</h3>
                                    <div className="flex items-center space-x-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[task.status] || statusColors['To Do']}`}>
                                            {task.status}
                                        </span>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${priorityColors[task.priority] || priorityColors.Medium}`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                    {canEdit() && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowDropdown(!showDropdown)}
                                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="More options"
                                            >
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                            
                                            {showDropdown && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                                    <button
                                                        onClick={() => {
                                                            setShowDropdown(false);
                                                            setShowEditModal(true);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                                    >
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Edit Task
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <button
                                        onClick={onClose}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Main Content */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Description */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                                            <FileText className="w-4 h-4 mr-2" />
                                            Description
                                        </h4>
                                        <p className="text-gray-700 whitespace-pre-wrap">
                                            {task.description || 'No description provided'}
                                        </p>
                                    </div>

                                    {/* Attachment Links */}
                                    {task.attachmentLinks && task.attachmentLinks.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-2">Attachment Links</h4>
                                            <div className="space-y-2">
                                                {task.attachmentLinks.map((link, index) => (
                                                    <div key={index} className="flex items-center p-2 bg-gray-50 rounded-lg">
                                                        <ExternalLink className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                                                        <a 
                                                            href={link} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-blue-600 hover:text-blue-800 truncate flex-1"
                                                        >
                                                            {link}
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Category */}
                                    {task.category && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-2">Category</h4>
                                            <p className="text-gray-700">{task.category}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Sidebar */}
                                <div className="space-y-6">
                                    {/* Assignees */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                                            <Users className="w-4 h-4 mr-2" />
                                            Assigned To
                                        </h4>
                                        <p className="text-gray-700">{getAssigneeNames()}</p>
                                    </div>

                                    {/* Created By */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                                            <User className="w-4 h-4 mr-2" />
                                            Created By
                                        </h4>
                                        <p className="text-gray-700">{getCreatorName()}</p>
                                    </div>

                                    {/* Time Estimates */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                                            <Clock className="w-4 h-4 mr-2" />
                                            Time Estimate
                                        </h4>
                                        <p className="text-gray-700">
                                            {task.timeEstimates?.estimatedHours || 0} hours
                                        </p>
                                    </div>

                                    {/* Due Date */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Due Date
                                        </h4>
                                        <p className="text-gray-700">
                                            {formatDate(task.scheduling?.manualDueDate)}
                                        </p>
                                    </div>

                                    {/* Quick Actions */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h4>
                                        <div className="flex space-x-2">
                                            {getQuickActions()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <TaskModal
                    task={task}
                    onClose={() => setShowEditModal(false)}
                    allTasks={[]}
                />
            )}
        </>
    );
};

export default TaskDetailsModal;
