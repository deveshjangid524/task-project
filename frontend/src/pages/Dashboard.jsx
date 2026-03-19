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
    const [stats, setStats] = useState({
        totalTasks: 0,
        completedTasks: 0,
        blockedTasks: 0,
        overdueTasks: [],
        completionRate: 0,
        workload: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [aiOptimizing, setAiOptimizing] = useState(false);
    const [aiResults, setAiResults] = useState(null);
    const [showAiResults, setShowAiResults] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                console.log('Fetching dashboard analytics...');
                
                // Then fetch analytics
                const response = await api.get('/analytics/dashboard');
                console.log('Analytics response:', response.data);
                setStats(response.data);
            } catch (err) {
                console.error('Analytics error:', err);
                console.error('Error response:', err.response);
                
                // Check if it's an authentication error
                if (err.response?.status === 401) {
                    console.error('Authentication error - clearing token');
                    localStorage.removeItem('user');
                    setError('Authentication expired - please refresh and log in again');
                } else {
                    setError('Failed to load dashboard analytics');
                }
                
                // Set default values on error
                setStats({
                    totalTasks: 0,
                    completedTasks: 0,
                    blockedTasks: 0,
                    overdueTasks: [],
                    completionRate: 0,
                    workload: []
                });
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    const handleScheduleTasks = async () => {
        try {
            console.log('AI optimize button clicked!');
            console.log('User role:', user?.role);
            console.log('Can access:', ['Admin', 'Project Manager'].includes(user?.role));
            
            if (!['Admin', 'Project Manager'].includes(user?.role)) {
                alert('You do not have permission to use this feature.');
                return;
            }
            
            setAiOptimizing(true);
            console.log('Starting AI optimization with Mistral...');
            
            const response = await api.post('/ai-optimizer/ai-optimize');
            console.log('AI optimization response:', response.data);
            
            setAiResults(response.data);
            setShowAiResults(true);
            
            // Reload stats after AI optimization
            const statsResponse = await api.get('/analytics/dashboard');
            setStats(statsResponse.data);
            
        } catch (err) {
            console.error('AI optimization error:', err);
            console.error('Error response:', err.response);
            
            let errorMessage = 'Failed to optimize schedule';
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            alert(errorMessage);
        } finally {
            setAiOptimizing(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;
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
                        onClick={() => {
                            console.log('Button clicked!');
                            alert('Button clicked! Check console for more info.');
                            handleScheduleTasks();
                        }}
                        disabled={aiOptimizing}
                        className={`mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                            aiOptimizing 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        <Activity className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        {aiOptimizing ? 'AI Optimizing...' : 'AI Optimize Schedule'}
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
                    <div className="h-80 w-full">
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
                    <div className="h-80 w-full">
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

            {/* AI Optimization Results */}
            {showAiResults && aiResults && (
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">AI Optimization Results</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Powered by Mistral AI • Analyzed {aiResults.originalTasks?.length || 0} tasks
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAiResults(false)}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            ×
                        </button>
                    </div>

                    {/* Key Insights */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-900">Estimated Completion</h4>
                            <p className="text-lg font-semibold text-blue-600">
                                {aiResults.aiInsights?.estimatedCompletion || 'TBD'}
                            </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-green-900">Tasks Analyzed</h4>
                            <p className="text-lg font-semibold text-green-600">
                                {aiResults.originalTasks?.length || 0}
                            </p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-purple-900">Optimization Score</h4>
                            <p className="text-lg font-semibold text-purple-600">High</p>
                        </div>
                    </div>

                    {/* Optimized Schedule */}
                    {aiResults.optimizedSchedule?.optimizedSchedule && (
                        <div className="mb-6">
                            <h4 className="text-md font-medium text-gray-900 mb-3">Optimized Task Schedule</h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {aiResults.optimizedSchedule.optimizedSchedule.map((task, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{task.title}</p>
                                            <p className="text-xs text-gray-500">{task.reasoning}</p>
                                        </div>
                                        <div className="text-right ml-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                task.priority === 'High' ? 'bg-red-100 text-red-800' :
                                                task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                                {task.priority}
                                            </span>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {task.suggestedStartDate} → {task.suggestedDueDate}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recommendations */}
                    {aiResults.aiInsights?.recommendations?.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-md font-medium text-gray-900 mb-3">AI Recommendations</h4>
                            <ul className="space-y-2">
                                {aiResults.aiInsights.recommendations.map((rec, index) => (
                                    <li key={index} className="flex items-start">
                                        <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span className="text-sm text-gray-700">{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Potential Bottlenecks */}
                    {aiResults.aiInsights?.bottlenecks?.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-md font-medium text-gray-900 mb-3">Potential Bottlenecks</h4>
                            <div className="space-y-2">
                                {aiResults.aiInsights.bottlenecks.map((bottleneck, index) => (
                                    <div key={index} className="flex items-start p-3 bg-yellow-50 rounded-lg">
                                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                                        <span className="text-sm text-yellow-800">{bottleneck}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Resource Allocation */}
                    {aiResults.aiInsights?.resourceAllocation && Object.keys(aiResults.aiInsights.resourceAllocation).length > 0 && (
                        <div>
                            <h4 className="text-md font-medium text-gray-900 mb-3">Resource Allocation</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {Object.entries(aiResults.aiInsights.resourceAllocation).map(([member, allocation]) => (
                                    <div key={member} className="p-3 border border-gray-200 rounded-lg">
                                        <p className="text-sm font-medium text-gray-900">{member}</p>
                                        <div className="mt-1 text-xs text-gray-500">
                                            <p>Tasks: {allocation.tasksCount}</p>
                                            <p>Hours: {allocation.totalHours}</p>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                allocation.workload === 'Balanced' ? 'bg-green-100 text-green-800' :
                                                allocation.workload === 'Overloaded' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {allocation.workload}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default Dashboard;
