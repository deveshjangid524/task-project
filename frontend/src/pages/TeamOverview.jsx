import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TeamOverview = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/users');
                setUsers(response.data);
            } catch (error) {
                console.error('Error fetching team:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading team...</div>;

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
                                            <p className="text-sm font-medium text-primary-600 truncate">{user.name}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {user.role}
                                        </span>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {user.availability.workingHoursPerDay} hrs/day
                                        </span>
                                    </div>
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
        </div>
    );
};

export default TeamOverview;
