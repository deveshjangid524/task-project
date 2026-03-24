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
        <div className="flex h-screen bg-transparent">
            {/* Sidebar */}
            <div className="hidden md:flex md:w-64 md:flex-col border-r border-white/20 bg-white/10 backdrop-blur-md">
                <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
                    <div className="flex items-center flex-shrink-0 px-4">
                        <span className="text-xl font-bold tracking-tight text-white drop-shadow-lg">TaskFlow AI</span>
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
                                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${active
                                                ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30'
                                                : 'text-white/70 hover:bg-white/10 hover:text-white hover:backdrop-blur-sm'
                                            }`}
                                    >
                                        <item.icon
                                            className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200 ${active ? 'text-white' : 'text-white/60 group-hover:text-white'
                                                }`}
                                            aria-hidden="true"
                                        />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                    <div className="flex-shrink-0 p-4 border-t border-white/20 bg-white/5 backdrop-blur-sm">
                        <div className="flex items-center">
                            <div>
                                <img
                                    className="inline-block h-9 w-9 rounded-full border-2 border-white/30 shadow-lg"
                                    src={`https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=random`}
                                    alt=""
                                />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-white group-hover:text-white drop-shadow">
                                    {user?.name}
                                </p>
                                <p className="text-xs font-medium text-white/60 group-hover:text-white/80">
                                    {user?.role}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-white/20 text-sm font-medium rounded-lg text-white bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm transition-all duration-200"
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
                <div className="bg-white/10 backdrop-blur-md border-b border-white/20 px-4 py-3 sm:px-6 lg:px-8 shadow-lg">
                    <div className="flex justify-between items-center">
                        <div className="flex-1"></div>
                        <div className="flex items-center space-x-4">
                            <RewardsBadge />
                            <ChatSystem />
                            <NotificationSystem />
                        </div>
                    </div>
                </div>
                
                <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none bg-transparent">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none"></div>
                    <div className="relative z-10">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
