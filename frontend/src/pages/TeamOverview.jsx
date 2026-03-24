import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, TrendingUp, Clock, CheckCircle, AlertCircle, Search, Filter, Calendar, Award, Activity } from 'lucide-react';

const TeamOverview = () => {
    const [users, setUsers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');

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
        const fetchData = async () => {
            try {
                console.log('Fetching team users and tasks...');
                
                // Fetch users
                const usersResponse = await api.get('/users');
                const usersData = usersResponse.data;
                
                // Fetch tasks
                const tasksResponse = await api.get('/tasks');
                const tasksData = tasksResponse.data;
                
                setTasks(tasksData);
                
                // Count tasks per user
                const usersWithTaskCount = usersData.map(user => {
                    // Handle both single assignee and multi-assignee scenarios
                    const assignedTasks = tasksData.filter(task => {
                        if (!task.assignedTo) return false;
                        
                        if (Array.isArray(task.assignedTo)) {
                            // Multi-assignee: check if user is in assignees array
                            return task.assignedTo.some(assignee => assignee._id === user._id);
                        } else {
                            // Single assignee: check direct match
                            return task.assignedTo._id === user._id;
                        }
                    });
                    
                    console.log(`🔍 User ${user.name} has ${assignedTasks.length} assigned tasks`);
                    
                    return {
                        ...user,
                        activeTaskCount: assignedTasks.filter(task => 
                            task.status !== 'Completed' && task.status !== 'Blocked'
                        ).length,
                        totalTaskCount: assignedTasks.length,
                        completedTaskCount: assignedTasks.filter(task => 
                            task.status === 'Completed'
                        ).length
                    };
                });
                
                // Show all team members (not just those with tasks) for better visibility
                console.log('Team members with task counts:', usersWithTaskCount);
                setUsers(usersWithTaskCount);
                
            } catch (error) {
                console.error('Error fetching data:', error);
                // Show error state but don't crash the app
                setUsers([]);
                setTasks([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const teamStats = {
        totalMembers: users.length,
        activeTasks: users.reduce((sum, user) => sum + user.activeTaskCount, 0),
        completedTasks: users.reduce((sum, user) => sum + user.completedTaskCount, 0),
        totalTasks: users.reduce((sum, user) => sum + user.totalTaskCount, 0)
    };

    if (loading) return (
        <div className={`min-h-screen transition-colors duration-300 flex items-center justify-center ${
            darkMode 
                ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
                : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
        }`}>
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Loading team...</p>
            </div>
        </div>
    );

    if (users.length === 0) return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode 
                ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
                : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
        }`}>
            <div className="flex items-center justify-center min-h-screen">
                <div className={`p-8 rounded-3xl shadow-2xl border text-center max-w-md ${
                    darkMode 
                        ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700' 
                        : 'bg-white/80 backdrop-blur-xl border-white/20'
                }`}>
                    <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                    <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        No team members found
                    </h3>
                    <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Please check the following:
                    </p>
                    <ul className={`text-sm text-left space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <li>• Backend is running on port 5000</li>
                        <li>• You are logged in with proper authentication</li>
                        <li>• Users exist in the database</li>
                    </ul>
                    <p className={`text-xs mt-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Debug: Check browser console for API errors
                    </p>
                </div>
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
                            <div className="flex items-center space-x-4">
                                <div className={`w-16 h-16 rounded-2xl p-1 ${
                                    darkMode 
                                        ? 'bg-gradient-to-br from-blue-700 to-purple-700' 
                                        : 'bg-gradient-to-br from-blue-600 to-purple-600'
                                }`}>
                                    <div className={`w-full h-full rounded-xl flex items-center justify-center ${
                                        darkMode ? 'bg-gray-800' : 'bg-white'
                                    }`}>
                                        <Users className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                    </div>
                                </div>
                                <div>
                                    <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Team Overview
                                    </h1>
                                    <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        Manage and monitor your team's performance and tasks
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
                                    placeholder="Search team members..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                        darkMode 
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                                    }`}
                                />
                            </div>

                            {/* Role Filter */}
                            <div className="relative">
                                <Filter className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                                    darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                                <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className={`pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none ${
                                        darkMode 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-200 text-gray-900'
                                    }`}
                                >
                                    <option value="all">All Roles</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Project Manager">Project Manager</option>
                                    <option value="Team Member">Team Member</option>
                                </select>
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
                                {darkMode ? <span className="w-5 h-5">☀️</span> : <span className="w-5 h-5">🌙</span>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[/* eslint-disable indent */
                        { label: 'Team Members', value: teamStats.totalMembers, icon: Users, color: 'from-blue-500 to-blue-600' },
                        { label: 'Active Tasks', value: teamStats.activeTasks, icon: Clock, color: 'from-orange-500 to-orange-600' },
                        { label: 'Completed Tasks', value: teamStats.completedTasks, icon: CheckCircle, color: 'from-green-500 to-green-600' },
                        { label: 'Total Tasks', value: teamStats.totalTasks, icon: Activity, color: 'from-purple-500 to-purple-600' }
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

                {/* Team Members List */}
                <div className={`rounded-3xl shadow-2xl border transition-colors duration-300 overflow-hidden ${
                    darkMode 
                        ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700' 
                        : 'bg-white/80 backdrop-blur-xl border-white/20'
                }`}>
                    <div className="p-6">
                        <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Team Members
                        </h2>
                        
                        <div className="space-y-4">
                            {filteredUsers.map((user) => (
                                <div key={user._id} className={`p-4 rounded-2xl border transition-all duration-200 hover:shadow-lg ${
                                    darkMode 
                                        ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' 
                                        : 'bg-gray-50 border-gray-200 hover:bg-white'
                                }`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-4 flex-1">
                                            <img
                                                className="w-12 h-12 rounded-full border-2 border-blue-500"
                                                src={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                                alt={user.name}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        {user.name}
                                                    </h3>
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        user.role === 'Admin' 
                                                            ? 'bg-red-100 text-red-700 border border-red-200'
                                                            : user.role === 'Project Manager'
                                                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                            : 'bg-green-100 text-green-700 border border-green-200'
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                </div>
                                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {user.email}
                                                </p>
                                                <div className="flex items-center space-x-2 mt-2">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        darkMode 
                                                            ? 'bg-gray-600 text-gray-200' 
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        🕐 {user.availability?.workingHoursPerDay || 8} hrs/day
                                                    </span>
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        darkMode 
                                                            ? 'bg-blue-900/50 text-blue-300' 
                                                            : 'bg-blue-50 text-blue-700'
                                                    }`}>
                                                        📊 {user.totalTaskCount} tasks
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end space-y-2 ml-4">
                                            <div className="flex space-x-2">
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium ${
                                                    darkMode 
                                                        ? 'bg-orange-900/50 text-orange-300 border border-orange-700' 
                                                        : 'bg-orange-50 text-orange-700 border border-orange-200'
                                                }`}>
                                                    🔥 {user.activeTaskCount} Active
                                                </span>
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium ${
                                                    darkMode 
                                                        ? 'bg-green-900/50 text-green-300 border border-green-700' 
                                                        : 'bg-green-50 text-green-700 border border-green-200'
                                                }`}>
                                                    ✅ {user.completedTaskCount} Done
                                                </span>
                                            </div>
                                            
                                            {user.skills && user.skills.length > 0 && (
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {user.skills.slice(0, 3).map((skill, idx) => (
                                                        <span key={idx} className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                                                            darkMode 
                                                                ? 'bg-blue-900/30 text-blue-300 border border-blue-700' 
                                                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                        }`}>
                                                            {skill}
                                                        </span>
                                                    ))}
                                                    {user.skills.length > 3 && (
                                                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            +{user.skills.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamOverview;
