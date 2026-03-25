import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { showNotification } from './NotificationSystem';
import { X, Calendar, Clock, Users, Link2, AlertCircle, CheckCircle2, Target, FileText, Flag, Search, User, UserPlus, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TaskModal = ({ task, onClose, allTasks }) => {

    if (!allTasks) return null;
    
    const { user } = useAuth();

    // Sanitize URL to prevent XSS
    const sanitizeUrl = (url) => {
        if (!url || typeof url !== 'string') return '';
        
        // Remove potentially dangerous characters and scripts
        const sanitized = url
            .replace(/[<>]/g, '') // Remove angle brackets
            .replace(/javascript:/gi, '') // Remove javascript protocol
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .trim();
            
        // Ensure URL has a protocol
        if (!sanitized.match(/^https?:\/\//)) {
            return `https://${sanitized}`;
        }
        
        return sanitized;
    };

    const [formData, setFormData] = useState({
        title: task?.title || '',
        description: task?.description || '',
        category: task?.category || '',
        priority: task?.priority || 'Medium',
        status: task?.status || 'To Do',
        assignedTo: task?.assignedTo ? 
            (Array.isArray(task.assignedTo) 
                ? task.assignedTo.map(assignee => 
                    typeof assignee === 'string' ? assignee : assignee._id
                  )
                : (typeof task.assignedTo === 'string' 
                    ? [task.assignedTo] 
                    : [task.assignedTo._id])
            ) : [],
        estimatedHours: task?.timeEstimates?.estimatedHours || 1,
        manualDueDate: task?.scheduling?.manualDueDate
            ? new Date(task.scheduling.manualDueDate).toISOString().split('T')[0]
            : '',
        attachmentLinks: task?.attachmentLinks || []
    });

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Search dropdown state
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const dropdownRef = useRef(null);

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

    // Update formData when task prop changes (for editing different tasks)
    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                category: task.category || '',
                priority: task.priority || 'Medium',
                status: task.status || 'To Do',
                assignedTo: task.assignedTo ? 
                    (Array.isArray(task.assignedTo) 
                        ? task.assignedTo.map(assignee => 
                            typeof assignee === 'string' ? assignee : assignee._id
                          )
                        : (typeof task.assignedTo === 'string' 
                            ? [task.assignedTo] 
                            : [task.assignedTo._id])
                    ) : [],
                estimatedHours: task?.timeEstimates?.estimatedHours || 1,
                manualDueDate: task?.scheduling?.manualDueDate
                    ? new Date(task.scheduling.manualDueDate).toISOString().split('T')[0]
                    : '',
                attachmentLinks: task?.attachmentLinks || []
            });
        } else {
            // Reset form for new task
            setFormData({
                title: '',
                description: '',
                category: '',
                priority: 'Medium',
                status: 'To Do',
                assignedTo: [],
                estimatedHours: 1,
                manualDueDate: '',
                attachmentLinks: []
            });
        }
        // Reset search and dropdown when task changes
        setSearchTerm('');
        setIsDropdownOpen(false);
    }, [task]);

    // Filter users based on search term
    useEffect(() => {
        const availableUsers = users.filter(u => {
            // For PMs: show all team members except themselves
            if (user?.role === 'Project Manager') {
                return u.role === 'Team Member' && u._id !== user._id;
            }
            // For Admins: show all users except themselves
            if (user?.role === 'Admin') {
                return u._id !== user._id;
            }
            // For Team Members: show other team members
            return u.role === 'Team Member' && u._id !== user._id;
        });

        if (searchTerm) {
            const filtered = availableUsers.filter(u => 
                u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.role.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(availableUsers);
        }
    }, [searchTerm, users, user]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleChange = (e) => {
        const value =
            e.target.type === 'select-multiple'
                ? Array.from(e.target.selectedOptions, option => option.value)
                : e.target.value;

        setFormData({ ...formData, [e.target.name]: value });
    };

    // Handle user selection in dropdown
    const handleUserSelect = (userId) => {
        if (!formData.assignedTo.includes(userId)) {
            setFormData({ 
                ...formData, 
                assignedTo: [...formData.assignedTo, userId] 
            });
        }
        setSearchTerm('');
        setIsDropdownOpen(false);
    };

    // Handle user removal from selected list
    const handleUserRemove = (userId) => {
        setFormData({ 
            ...formData, 
            assignedTo: formData.assignedTo.filter(id => id !== userId) 
        });
    };

    // Get selected user details
    const getSelectedUsers = () => {
        return formData.assignedTo.map(userId => 
            users.find(u => u._id === userId)
        ).filter(Boolean);
    };

    // Get role color for styling
    const getRoleColor = (role) => {
        switch(role) {
            case 'Admin': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Project Manager': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Team Member': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const handleLinkAdd = () => {
        const linkInput = document.getElementById('attachment-link');
        const link = linkInput.value.trim();
        
        if (link) {
            // Sanitize the URL first
            const sanitizedLink = sanitizeUrl(link);
            
            // Basic URL validation for sanitized link
            const urlPattern = /^https:\/\/([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            if (!urlPattern.test(sanitizedLink)) {
                setError('Please enter a valid URL (e.g., https://example.com/document.pdf)');
                return;
            }
            
            setFormData({ 
                ...formData, 
                attachmentLinks: [...formData.attachmentLinks, sanitizedLink] 
            });
            linkInput.value = '';
            setError('');
        }
    };

    const handleLinkRemove = (index) => {
        setFormData({ 
            ...formData, 
            attachmentLinks: formData.attachmentLinks.filter((_, i) => i !== index) 
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validation: Ensure at least one assignee is selected
        if (!formData.assignedTo || formData.assignedTo.length === 0) {
            setError('Please select at least one assignee for the task.');
            setLoading(false);
            return;
        }

        // Use current user from AuthContext instead of localStorage
        const currentUser = user;

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
                : {},
            createdBy: currentUser?._id,
            attachmentLinks: formData.attachmentLinks
        };

        
        
        try {
            if (task) {
                await api.put(`/tasks/${task._id}`, payload);
                showNotification('success', 'Task updated successfully', 'Task Updated');
            } else {
                const response = await api.post('/tasks', payload);
                
                // Save attachment links to task
                if (formData.attachmentLinks.length > 0) {
                    await api.put(`/tasks/${response.data._id}`, {
                        attachmentLinks: formData.attachmentLinks
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
                    className="fixed inset-0 bg-gradient-to-br from-slate-900/90 to-blue-900/90 backdrop-blur-sm transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="relative inline-block align-bottom bg-white/95 backdrop-blur-xl rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-white/20">
                    {/* Header with gradient background */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 sm:px-8 sm:py-8">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <Target className="h-6 w-6 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white" id="modal-title">
                                        {task ? 'Edit Task' : 'Create New Task'}
                                    </h3>
                                </div>
                                <p className="text-blue-100 text-sm">
                                    {task ? 'Update task details and assignments' : 'Add a new task to your project board'}
                                </p>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="ml-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
                            >
                                <X className="h-5 w-5 text-white" />
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-6 sm:px-8 sm:py-8 bg-gradient-to-b from-gray-50 to-white">

                        {error && (
                            <div className="mb-6 flex items-center p-4 bg-red-50 border border-red-200 rounded-xl">
                                <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                                <span className="text-sm text-red-700">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Title Section */}
                            <div className="space-y-2">
                                <label className="flex items-center text-sm font-semibold text-gray-900">
                                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                                    Task Title <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Enter task title..."
                                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
                                />
                            </div>

                            {/* Description Section */}
                            <div className="space-y-2">
                                <label className="flex items-center text-sm font-semibold text-gray-900">
                                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    rows="4"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Provide detailed task description..."
                                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400 resize-none"
                                ></textarea>
                            </div>

                            {/* Status and Priority Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="flex items-center text-sm font-semibold text-gray-900">
                                        <Flag className="h-4 w-4 mr-2 text-blue-600" />
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    >
                                        <option value="To Do">📝 To Do</option>
                                        <option value="In Progress">🚀 In Progress</option>
                                        <option value="In Review">👀 In Review</option>
                                        <option value="Completed">✅ Completed</option>
                                        <option value="Blocked">🚫 Blocked</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center text-sm font-semibold text-gray-900">
                                        <Flag className="h-4 w-4 mr-2 text-blue-600" />
                                        Priority
                                    </label>
                                    <select
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleChange}
                                        className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    >
                                        <option value="Low">🟢 Low</option>
                                        <option value="Medium">🔵 Medium</option>
                                        <option value="High">🟠 High</option>
                                        <option value="Critical">🔴 Critical</option>
                                    </select>
                                </div>
                            </div>

                            {/* Advanced Assignees Section */}
                            <div className="space-y-3">
                                <label className="flex items-center text-sm font-semibold text-gray-900">
                                    <Users className="h-4 w-4 mr-2 text-blue-600" />
                                    Assignees <span className="text-red-500 ml-1">*</span>
                                    <span className="ml-2 text-xs font-normal text-gray-500">(Search and select team members)</span>
                                </label>
                                
                                <div ref={dropdownRef} className="relative">
                                    {/* Search Input */}
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setIsDropdownOpen(true);
                                            }}
                                            onFocus={() => setIsDropdownOpen(true)}
                                            placeholder="Search team members by name, email, or role..."
                                            className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>

                                    {/* Selected Users Display */}
                                    {getSelectedUsers().length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {getSelectedUsers().map(selectedUser => (
                                                <div 
                                                    key={selectedUser._id}
                                                    className="inline-flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-full"
                                                >
                                                    <img
                                                        className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
                                                        src={`https://ui-avatars.com/api/?name=${selectedUser.name}&background=6366f1&color=fff&size=24`}
                                                        alt={selectedUser.name}
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">{selectedUser.name}</span>
                                                    <span className={`text-xs px-2 py-1 rounded-full border ${getRoleColor(selectedUser.role)}`}>
                                                        {selectedUser.role}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUserRemove(selectedUser._id)}
                                                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Dropdown Results */}
                                    {isDropdownOpen && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                                            {filteredUsers.length > 0 ? (
                                                <div className="py-2">
                                                    {filteredUsers.map(filteredUser => (
                                                        <button
                                                            key={filteredUser._id}
                                                            type="button"
                                                            onClick={() => handleUserSelect(filteredUser._id)}
                                                            disabled={formData.assignedTo.includes(filteredUser._id)}
                                                            className={`w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                                                                formData.assignedTo.includes(filteredUser._id) 
                                                                    ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                                                                    : ''
                                                            }`}
                                                        >
                                                            <img
                                                                className="h-8 w-8 rounded-full border-2 border-gray-200"
                                                                src={`https://ui-avatars.com/api/?name=${filteredUser.name}&background=random&size=32`}
                                                                alt={filteredUser.name}
                                                            />
                                                            <div className="flex-1 text-left">
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-sm font-medium text-gray-900">
                                                                        {filteredUser.name}
                                                                    </span>
                                                                    <span className={`text-xs px-2 py-1 rounded-full border ${getRoleColor(filteredUser.role)}`}>
                                                                        {filteredUser.role}
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs text-gray-500">{filteredUser.email}</span>
                                                            </div>
                                                            {formData.assignedTo.includes(filteredUser._id) && (
                                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                            )}
                                                            {!formData.assignedTo.includes(filteredUser._id) && (
                                                                <UserPlus className="h-4 w-4 text-gray-400" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="px-4 py-8 text-center">
                                                    <User className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                                    <p className="text-sm text-gray-500">
                                                        {searchTerm ? 'No users found matching your search' : 'No available users'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Status Messages */}
                                {getSelectedUsers().length > 0 && (
                                    <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                                        <span className="text-sm text-green-700">
                                            Task will be assigned to {getSelectedUsers().length} team member(s)
                                        </span>
                                    </div>
                                )}
                                {getSelectedUsers().length === 0 && (
                                    <div className="flex items-center p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                                        <span className="text-sm text-amber-700">
                                            Please select at least one assignee
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Category and Time Estimates */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="flex items-center text-sm font-semibold text-gray-900">
                                        <Target className="h-4 w-4 mr-2 text-blue-600" />
                                        Category
                                    </label>
                                    <input
                                        type="text"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        placeholder="e.g., Development, Design"
                                        className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center text-sm font-semibold text-gray-900">
                                        <Clock className="h-4 w-4 mr-2 text-blue-600" />
                                        Est. Hours <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="estimatedHours"
                                        required
                                        min="1"
                                        value={formData.estimatedHours}
                                        onChange={handleChange}
                                        placeholder="Hours"
                                        className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
                                    />
                                </div>
                            </div>

                            {/* Due Date */}
                            <div className="space-y-2">
                                <label className="flex items-center text-sm font-semibold text-gray-900">
                                    <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    name="manualDueDate"
                                    value={formData.manualDueDate}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                            </div>

                            {/* Attachment Links */}
                            <div className="space-y-3">
                                <label className="flex items-center text-sm font-semibold text-gray-900">
                                    <Link2 className="h-4 w-4 mr-2 text-blue-600" />
                                    Attachment Links
                                </label>
                                <div className="space-y-3">
                                    <div className="flex space-x-3">
                                        <input
                                            type="url"
                                            id="attachment-link"
                                            placeholder="https://example.com/document.pdf"
                                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleLinkAdd();
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleLinkAdd}
                                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-lg"
                                        >
                                            Add Link
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Add links to external documents (Google Drive, Dropbox, etc.)
                                    </p>
                                    
                                    {formData.attachmentLinks.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-700">
                                                Added Links ({formData.attachmentLinks.length}):
                                            </p>
                                            <ul className="space-y-2">
                                                {formData.attachmentLinks.map((link, index) => (
                                                    <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                        <div className="flex items-center flex-1 min-w-0">
                                                            <Link2 className="h-4 w-4 text-blue-500 mr-3 flex-shrink-0" />
                                                            <a 
                                                                href={sanitizeUrl(link)} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer nofollow"
                                                                className="text-sm text-blue-600 hover:text-blue-800 truncate font-medium"
                                                                title={link}
                                                            >
                                                                {link}
                                                            </a>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLinkRemove(index)}
                                                            className="ml-3 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center">
                                            {task ? '✏️ Update Task' : '🚀 Create Task'}
                                        </span>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
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
