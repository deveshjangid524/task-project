import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { CheckCircle, AlertTriangle, Clock, Activity } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await api.get('/analytics/dashboard');
                setStats(response.data);
            } catch (err) {
                setError('Failed to load dashboard analytics');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    const handleScheduleTasks = async () => {
        try {
            setLoading(true);
            const res = await api.post('/tasks/schedule');
            alert(`Schedule Optimized! ${res.data.tasksRescheduled} tasks processed.`);
            // Reload stats after scheduling
            const response = await api.get('/analytics/dashboard');
            setStats(response.data);
        } catch (err) {
            alert('Failed to optimize schedule');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !stats) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    const statusData = [
        { name: 'Completed', value: stats.completedTasks },
        { name: 'Blocked', value: stats.blockedTasks },
        { name: 'Active', value: stats.totalTasks - stats.completedTasks - stats.blockedTasks },
    ];

    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
                    <p className="mt-1 text-sm text-gray-500">Here's your project status at a glance.</p>
                </div>

                {['Admin', 'Project Manager'].includes(user?.role) && (
                    <button
                        onClick={handleScheduleTasks}
                        className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        <Activity className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        AI Optimize Schedule
                    </button>
                )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { name: 'Total Tasks', stat: stats.totalTasks, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-100' },
                    { name: 'Completion Rate', stat: `${stats.completionRate.toFixed(1)}%`, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
                    { name: 'Blocked Tasks', stat: stats.blockedTasks, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100' },
                    { name: 'Overdue Tasks', stat: stats.overdueTasks.length, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-100' },
                ].map((item) => (
                    <div key={item.name} className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden border border-gray-100">
                        <dt>
                            <div className={`absolute rounded-md p-3 ${item.bg}`}>
                                <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                            </div>
                            <p className="ml-16 text-sm font-medium text-gray-500 truncate">{item.name}</p>
                        </dt>
                        <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                            <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
                        </dd>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Status Breakdown */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Task Status Breakdown</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Team Workload */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Team Workload (Active Tasks)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={stats.workload.map(w => ({ name: w.user?.name || 'Unassigned', tasks: w.activeTasks, hours: w.totalEstimatedHours }))}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" tick={{ fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                                <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                                <RechartsTooltip cursor={{ fill: '#F3F4F6' }} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="tasks" name="Active Tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar yAxisId="right" dataKey="hours" name="Est. Hours" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
