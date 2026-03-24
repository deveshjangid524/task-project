import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, UserCircle, LogOut, Briefcase, FileText } from 'lucide-react';
import NotificationSystem from './NotificationSystem';
import ChatSystem from './ChatSystem';
import RewardsBadge from './RewardsBadge';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Tasks', href: '/tasks', icon: Briefcase },
        { name: 'Team Overview', href: '/team', icon: Users, roles: ['Admin', 'Project Manager'] },
        { name: 'Notes', href: '/notes', icon: FileText },
        { name: 'Profile', href: '/profile', icon: UserCircle },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="hidden md:flex md:w-64 md:flex-col border-r border-gray-200 bg-white">
                <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
                    <div className="flex items-center flex-shrink-0 px-4">
                        <span className="text-xl font-bold tracking-tight text-primary-600">TaskFlow AI</span>
                    </div>
                    <div className="mt-8 flex-grow flex flex-col">
                        <nav className="flex-1 px-2 space-y-1">
                            {navigation.map((item) => {
                                if (item.roles && !item.roles.includes(user?.role)) return null;
                                const active = location.pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${active
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
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                    {user?.name}
                                </p>
                                <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                                    {user?.role}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-col w-0 flex-1 overflow-hidden">
                {/* Top Header */}
                <div className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <div className="flex-1"></div>
                        <div className="flex items-center space-x-4">
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
