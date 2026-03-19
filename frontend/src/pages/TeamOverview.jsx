import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TeamOverview = () => {
    const [users, setUsers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

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
                            // Multi-assignee: check if user is in the assignees array
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

    if (loading) return <div className="p-8 text-center">Loading team...</div>;
    if (users.length === 0) return (
        <div className="p-8 text-center text-gray-500">
            <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
                <p className="text-sm text-gray-600">Please check the following:</p>
                <ul className="text-sm text-gray-600 mt-2 list-disc list-inside">
                    <li>Backend is running on port 5000</li>
                    <li>You are logged in with proper authentication</li>
                    <li>Users exist in the database</li>
                </ul>
            </div>
            <div className="text-xs text-gray-400">
                Debug: Check browser console for API errors
            </div>
        </div>
    );

    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Team Overview</h1>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {users.map((user) => (
                        <li key={user._id}>
                            <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <img
                                            className="h-10 w-10 rounded-full"
                                            src={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                            alt=""
                                        />
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-blue-600 truncate">{user.name}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {user.role}
                                        </span>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {user.availability?.workingHoursPerDay || 8} hrs/day
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Task Count Badges */}
                                <div className="mt-3 flex space-x-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                        📋 {user.activeTaskCount} Active
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                        ✅ {user.completedTaskCount} Completed
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                        📊 {user.totalTaskCount} Total
                                    </span>
                                </div>
                                
                                <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex flex-wrap gap-2">
                                        {user.skills && user.skills.length > 0 ? (
                                            user.skills.map((skill, idx) => (
                                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                    {skill}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400">No skills listed</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            
            {/* Summary Stats */}
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Team Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{users.reduce((sum, user) => sum + user.activeTaskCount, 0)}</div>
                        <div className="text-sm text-gray-500">Active Tasks</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{users.reduce((sum, user) => sum + user.completedTaskCount, 0)}</div>
                        <div className="text-sm text-gray-500">Completed Tasks</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">{users.length}</div>
                        <div className="text-sm text-gray-500">Team Members with Tasks</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamOverview;
