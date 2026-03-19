import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { showNotification } from './NotificationSystem';
import { X } from 'lucide-react';

const TaskModal = ({ task, onClose, allTasks }) => {

    if (!allTasks) return null;

    const [formData, setFormData] = useState({
        title: task?.title || '',
        description: task?.description || '',
        category: task?.category || '',
        priority: task?.priority || 'Medium',
        status: task?.status || 'To Do',
        assignedTo: task?.assignedTo ? (Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo._id]) : [],
        estimatedHours: task?.timeEstimates?.estimatedHours || 1,
        manualDueDate: task?.scheduling?.manualDueDate
            ? new Date(task.scheduling.manualDueDate).toISOString().split('T')[0]
            : '',
        attachments: []
    });

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/users');
                setUsers(res.data);
            } catch (err) {
                console.error('Failed to load users', err);
            }
        };
        fetchUsers();
    }, []);

    const handleChange = (e) => {
        const value =
            e.target.type === 'select-multiple'
                ? Array.from(e.target.selectedOptions, option => option.value)
                : e.target.value;

        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => {
            const maxSize = 10 * 1024 * 1024; // 10MB
            const validTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/plain',
                'image/jpeg',
                'image/png',
                'image/gif'
            ];
            return file.size <= maxSize && validTypes.includes(file.type);
        });

        if (validFiles.length !== files.length) {
            setError('Some files were invalid. Only PDF, Word, Excel, PowerPoint, text, and image files up to 10MB are allowed.');
        }

        setFormData({ ...formData, attachments: validFiles });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Get current user from localStorage
        const currentUser = JSON.parse(localStorage.getItem('user'));
        console.log(' Current user for task creation:', currentUser);

        const payload = {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            priority: formData.priority,
            status: formData.status,
            assignedTo: formData.assignedTo,
            timeEstimates: { estimatedHours: Number(formData.estimatedHours) },
            scheduling: formData.manualDueDate
                ? { manualDueDate: new Date(formData.manualDueDate) }
                : {}
        };

        console.log('Submitting task payload:', payload);
        console.log('User authentication:', currentUser);

        try {
            if (task) {
                await api.put(`/tasks/${task._id}`, payload);
                showNotification('success', 'Task updated successfully', 'Task Updated');
            } else {
                console.log('Making POST request to /tasks');
                console.log('Current user role:', JSON.parse(localStorage.getItem('user'))?.role);
                const response = await api.post('/tasks', payload);
                console.log('Task creation response:', response);
                
                // If there are attachments, upload them
                if (formData.attachments.length > 0) {
                    const formDataUpload = new FormData();
                    formData.attachments.forEach(file => {
                        formDataUpload.append('attachments', file);
                    });
                    formDataUpload.append('taskId', response.data._id);
                    
                    await api.post(`/tasks/${response.data._id}/attachments`, formDataUpload, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                }
                
                // Show notification for task creation
                showNotification('success', `Task "${payload.title}" created successfully`, 'Task Created');
                
                // If task is assigned to someone, show assignment notification
                if (payload.assignedTo && payload.assignedTo.length > 0) {
                    const assignedUsers = users.filter(u => payload.assignedTo.includes(u._id));
                    if (assignedUsers.length > 0) {
                        const names = assignedUsers.map(u => u.name).join(', ');
                        showNotification('info', `Task assigned to ${names}`, 'Task Assigned');
                        
                        // Send chat notification to all assigned users
                        assignedUsers.forEach(user => {
                            sendTaskAssignmentNotification(user, payload.title);
                        });
                    }
                }
            }
            onClose();
        } catch (err) {
            console.error('Task creation error:', err);
            console.error('Error response:', err.response);
            console.error('Error status:', err.response?.status);
            console.error('Error message:', err.response?.data?.message);
            setError(err.response?.data?.message || 'Failed to save task');
            showNotification('error', err.response?.data?.message || 'Failed to save task', 'Task Error');
            setLoading(false);
        }
    };

    const sendTaskAssignmentNotification = async (assignedUser, taskTitle) => {
        try {
            await api.post('/chat/messages', {
                recipientId: assignedUser._id,
                message: `🎯 New task assigned: "${taskTitle}". Please check your task board for details.`,
                type: 'text'
            });
        } catch (error) {
            console.error('Error sending task assignment notification:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border-4 border-blue-500">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">

                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                {task ? 'Edit Task' : 'Create New Task'}
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    rows="3"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        <option value="To Do">To Do</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="In Review">In Review</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Blocked">Blocked</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Priority
                                    </label>
                                    <select
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Category
                                    </label>
                                    <input
                                        type="text"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Assignees <span className="text-xs text-gray-500">(Select multiple team members)</span>
                                    </label>
                                    <select
                                        multiple
                                        name="assignedTo"
                                        value={formData.assignedTo}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-24"
                                        size="4"
                                    >
                                        <option value="" disabled>
                                            {formData.assignedTo.length === 0 
                                                ? 'Select assignees...' 
                                                : `${formData.assignedTo.length} member(s) selected`}
                                        </option>
                                        {users
                                            .filter(u => {
                                                // Get current user role
                                                const currentUserRole = JSON.parse(localStorage.getItem('user'))?.role;
                                                
                                                // Team members can only assign to other team members
                                                if (currentUserRole === 'Team Member') {
                                                    return u.role === 'Team Member';
                                                }
                                                
                                                // Project Managers can assign to Team Members and other PMs (but not Admins)
                                                if (currentUserRole === 'Project Manager') {
                                                    return u.role === 'Team Member' || u.role === 'Project Manager';
                                                }
                                                
                                                // Admins can assign to anyone
                                                return true;
                                            })
                                            .map(u => (
                                                <option key={u._id} value={u._id}>
                                                    {u.name} ({u.role})
                                                </option>
                                            ))}
                                    </select>
                                    {formData.assignedTo.length > 0 && (
                                        <p className="mt-1 text-xs text-gray-600">
                                            🎯 Task will be assigned to {formData.assignedTo.length} team member(s)
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Est. Hours <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="estimatedHours"
                                        required
                                        min="1"
                                        value={formData.estimatedHours}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Manual Due Date
                                    </label>
                                    <input
                                        type="date"
                                        name="manualDueDate"
                                        value={formData.manualDueDate}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Task Attachments
                                </label>
                                <div className="mt-1">
                                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                        <div className="space-y-1 text-center">
                                            <svg
                                                className="mx-auto h-12 w-12 text-gray-400"
                                                stroke="currentColor"
                                                fill="none"
                                                viewBox="0 0 48 48"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                                    strokeWidth={2}
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                            <div className="flex text-sm text-gray-600">
                                                <label
                                                    htmlFor="file-upload"
                                                    className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                                >
                                                    <span>Upload files</span>
                                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                                                </label>
                                                <p className="pl-1">or drag and drop</p>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                PDF, Word, Excel, PowerPoint, Images up to 10MB each
                                            </p>
                                        </div>
                                    </div>
                                    {formData.attachments.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-600">
                                                {formData.attachments.length} file(s) selected:
                                            </p>
                                            <ul className="text-xs text-gray-500 mt-1">
                                                {formData.attachments.map((file, index) => (
                                                    <li key={index} className="flex items-center justify-between">
                                                        <span>{file.name}</span>
                                                        <span className="text-gray-400 ml-2">
                                                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save Task'}
                                </button>

                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>

                    </div>

                </div>

            </div>
        </div>
    );
};

export default TaskModal;
