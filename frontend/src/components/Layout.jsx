import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, UserCircle, LogOut, Briefcase, FileText, BookOpen, ClipboardList, Library, Menu, X } from 'lucide-react';
import NotificationSystem from './NotificationSystem';
import ChatSystem from './ChatSystem';
import RewardsBadge from './RewardsBadge';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Tasks', href: '/tasks', icon: Briefcase },
        { name: 'Team Overview', href: '/team', icon: Users, roles: ['Admin', 'Project Manager'] },
        { name: 'Assessments', href: '/assessments', icon: ClipboardList },
        { name: 'Marks', href: '/marks', icon: BookOpen },
        { name: 'Notes', href: '/notes', icon: FileText },
        { name: 'Library', href: '/library', icon: Library },
        { name: 'Profile', href: '/profile', icon: UserCircle },
    ];

    return (
        <div className="flex h-screen bg-gray-50 relative">
            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
                mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between flex-shrink-0 px-4 py-4 border-b border-gray-200">
                        <span className="text-xl font-bold tracking-tight text-primary-600">TaskFlow AI</span>
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="flex-1 pt-5 overflow-y-auto">
                        <nav className="flex-1 px-2 space-y-1">
                            {navigation.map((item) => {
                                if (item.roles && !item.roles.includes(user?.role)) return null;
                                const active = location.pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md ${active
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <item.icon
                                            className={`mr-3 flex-shrink-0 h-5 w-5 ${active ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                                                }`}
                                            aria-hidden="true"
                                        />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                    <div className="flex-shrink-0 p-4 border-t border-gray-200">
                        <div className="flex items-center">
                            <div>
                                <img
                                    className="inline-block h-9 w-9 rounded-full border border-gray-200"
                                    src={`https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=random`}
                                    alt=""
                                />
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">
                                    {user?.name}
                                </p>
                                <p className="text-xs font-medium text-gray-500 truncate">
                                    {user?.role}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Sign out</span>
                            <span className="sm:hidden">Out</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Top Header */}
                <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            {/* Mobile menu button */}
                            <button
                                onClick={() => setMobileMenuOpen(true)}
                                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 mr-2"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <RewardsBadge />
                            <ChatSystem />
                            <NotificationSystem />
                        </div>
                    </div>
                </div>
                
                <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
