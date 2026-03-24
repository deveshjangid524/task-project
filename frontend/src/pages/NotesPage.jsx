import React, { useState, useEffect } from 'react';
import NotesSection from '../components/NotesSection';
import { FileText, Users, Clock, TrendingUp, Search, Bell, Settings, Moon, Sun } from 'lucide-react';

const NotesPage = () => {
    const [darkMode, setDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [stats, setStats] = useState({
        totalNotes: 0,
        sharedNotes: 0,
        recentActivity: 0,
        collaborators: 0
    });

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
        // Mock stats data
        setStats({
            totalNotes: 24,
            sharedNotes: 18,
            recentActivity: 7,
            collaborators: 5
        });
    }, []);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

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
                            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                                <div className={`w-16 h-16 rounded-2xl p-1 ${
                                    darkMode 
                                        ? 'bg-gradient-to-br from-blue-700 to-purple-700' 
                                        : 'bg-gradient-to-br from-blue-600 to-purple-600'
                                }`}>
                                    <div className={`w-full h-full rounded-xl flex items-center justify-center ${
                                        darkMode ? 'bg-gray-800' : 'bg-white'
                                    }`}>
                                        <FileText className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                    </div>
                                </div>
                                <div>
                                    <h1 className={`text-3xl font-bold ${
                                        darkMode ? 'text-white' : 'text-gray-900'
                                    }`}>📝 Project Notes & Resources</h1>
                                    <p className={`mt-1 ${
                                        darkMode ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                        Share important documents, links, and notes with your entire team.
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
                                    placeholder="Search notes..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                        darkMode 
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                                    }`}
                                />
                            </div>

                            {/* Notifications */}
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`relative p-3 rounded-xl transition-colors ${
                                    darkMode 
                                        ? 'hover:bg-gray-700 text-gray-300' 
                                        : 'hover:bg-gray-100 text-gray-600'
                                }`}
                            >
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            {/* Dark Mode Toggle */}
                            <button
                                onClick={toggleDarkMode}
                                className={`p-3 rounded-xl transition-colors ${
                                    darkMode 
                                        ? 'hover:bg-gray-700 text-yellow-400' 
                                        : 'hover:bg-gray-100 text-gray-600'
                                }`}
                            >
                                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>

                            {/* Settings */}
                            <button className={`p-3 rounded-xl transition-colors ${
                                darkMode 
                                    ? 'hover:bg-gray-700 text-gray-300' 
                                    : 'hover:bg-gray-100 text-gray-600'
                            }`}>
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Total Notes', value: stats.totalNotes, icon: FileText, color: 'from-blue-500 to-blue-600' },
                        { label: 'Shared Notes', value: stats.sharedNotes, icon: Users, color: 'from-green-500 to-green-600' },
                        { label: 'Recent Activity', value: stats.recentActivity, icon: Clock, color: 'from-purple-500 to-purple-600' },
                        { label: 'Collaborators', value: stats.collaborators, icon: TrendingUp, color: 'from-orange-500 to-orange-600' }
                    ].map((stat, index) => (
                        <div key={index} className={`p-6 rounded-2xl shadow-xl border transition-colors duration-300 ${
                            darkMode 
                                ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700' 
                                : 'bg-white/80 backdrop-blur-xl border-white/20'
                        }`}>
                            <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className={`text-2xl font-bold ${
                                darkMode ? 'text-white' : 'text-gray-900'
                            }`}>{stat.value}</div>
                            <div className={`text-sm mt-1 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Notes Section */}
                <div className={`rounded-3xl shadow-2xl border transition-colors duration-300 overflow-hidden ${
                    darkMode 
                        ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700' 
                        : 'bg-white/80 backdrop-blur-xl border-white/20'
                }`}>
                    <NotesSection darkMode={darkMode} />
                </div>
            </div>
        </div>
    );
};

export default NotesPage;
