import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Bell, ChevronDown, Building2, Plus, User, Users, CreditCard, LogOut, BarChart3, PieChart, TrendingUp, Clock, MessageCircle, Send, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Dashboard sections that can be searched

export default function DashboardHeader({ onNavigate, onScrollToSection }) {
    const { user, logout, role } = useAuth();
    const navigate = useNavigate();
    // Workspaces state (local - no API available)
    const [workspacesList, setWorkspacesList] = useState([
        { id: 1, name: 'Default Workspace', icon: '🏢' }
    ]);
    const [activeWorkspace, setActiveWorkspace] = useState(workspacesList[0]);
    const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
    const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');

    // Notifications state (no API - stored locally)
    const [notificationsList, setNotificationsList] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    // User state (using useAuth user)
    const currentUser = {
        name: user?.username || 'User',
        initials: (user?.username || 'U').charAt(0).toUpperCase(),
        role: role?.name || 'Admin'
    };
    const [showUserMenu, setShowUserMenu] = useState(false);


    // Refs
    const workspaceRef = useRef(null);
    const notificationRef = useRef(null);
    const userMenuRef = useRef(null);
    const searchRef = useRef(null);
    const searchInputRef = useRef(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (workspaceRef.current && !workspaceRef.current.contains(event.target)) {
                setShowWorkspaceDropdown(false);
                setShowCreateWorkspace(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard shortcuts (⌘K / Ctrl+K for search)
    useEffect(() => {
        const handleKeyDown = (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                searchInputRef.current?.focus();
                setShowSearchResults(true);
            }
            if (event.key === 'Escape') {
                setShowSearchResults(false);
                setShowWorkspaceDropdown(false);
                setShowNotifications(false);
                setShowUserMenu(false);
                searchInputRef.current?.blur();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);


    // Notification actions
    const markAllRead = () => {
        setNotificationsList([]);
        setShowNotifications(false);
    };

    const dismissNotification = (id) => {
        setNotificationsList(prev => prev.filter(n => n.id !== id));
    };

    // Workspace actions
    const createWorkspace = () => {
        if (newWorkspaceName.trim()) {
            const newWorkspace = {
                id: Date.now(),
                name: newWorkspaceName.trim(),
                icon: '🏢'
            };
            setWorkspacesList(prev => [...prev, newWorkspace]);
            setActiveWorkspace(newWorkspace);
            setNewWorkspaceName('');
            setShowCreateWorkspace(false);
            setShowWorkspaceDropdown(false);
        }
    };

    // User menu actions
    const handleMenuAction = (action) => {
        setShowUserMenu(false);
        switch (action) {
            case 'profile':
                navigate('/profile');
                break;
            case 'signout':
                logout();
                break;
            default:
                break;
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'warning': return 'bg-amber-400';
            case 'success': return 'bg-green-500';
            case 'info': return 'bg-blue-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <header className="flex items-center justify-between px-4 md:px-6 py-3 bg-white border-b border-gray-100">
            <div className="flex items-center gap-4">
                {/* Workspace Selector */}
                <div className="relative" ref={workspaceRef}>
                    <div
                        className="flex items-center gap-2 px-2 md:px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
                    >
                        <div className="w-6 h-6 bg-violet-100 rounded-md flex items-center justify-center flex-shrink-0">
                            <Building2 size={14} className="text-violet-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 hidden sm:block whitespace-nowrap">{activeWorkspace.name}</span>
                        <ChevronDown size={14} className={`text-gray-500 transition-transform ${showWorkspaceDropdown ? 'rotate-180' : ''}`} />
                    </div>

                    {showWorkspaceDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Workspaces</div>
                            {workspacesList.map((workspace) => (
                                <div
                                    key={workspace.id}
                                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${activeWorkspace.id === workspace.id ? 'bg-violet-500 text-white' : 'hover:bg-gray-50 text-gray-700'}`}
                                    onClick={() => { setActiveWorkspace(workspace); setShowWorkspaceDropdown(false); }}
                                >
                                    <div className={`w-6 h-6 rounded flex items-center justify-center ${activeWorkspace.id === workspace.id ? 'bg-white/20' : 'bg-gray-100'}`}>
                                        <Building2 size={14} className={activeWorkspace.id === workspace.id ? 'text-white' : 'text-gray-500'} />
                                    </div>
                                    <span className="text-sm font-medium">{workspace.name}</span>
                                </div>
                            ))}
                            <div className="border-t border-gray-100 mt-2 pt-2">
                                {showCreateWorkspace ? (
                                    <div className="px-3 py-2">
                                        <input type="text" placeholder="Workspace name..." value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createWorkspace()} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-violet-500" autoFocus />
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={createWorkspace} className="flex-1 px-3 py-1.5 bg-violet-500 text-white text-sm rounded-lg hover:bg-violet-600">Create</button>
                                            <button onClick={() => setShowCreateWorkspace(false)} className="px-3 py-1.5 text-gray-500 text-sm hover:bg-gray-100 rounded-lg">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 text-gray-700" onClick={() => setShowCreateWorkspace(true)}>
                                        <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-100"><Plus size={14} className="text-gray-500" /></div>
                                        <span className="text-sm font-medium">Create new workspace</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </div>

            <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <div className="relative" ref={notificationRef}>
                    <div className="relative w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setShowNotifications(!showNotifications)}>
                        <Bell size={18} className="text-gray-600" />
                        {notificationsList.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{notificationsList.length}</span>}
                    </div>

                    {showNotifications && (
                        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                <span className="font-semibold text-gray-900">Notifications</span>
                                {notificationsList.length > 0 && <button onClick={markAllRead} className="text-sm text-gray-500 hover:text-violet-500">Mark all read</button>}
                            </div>
                            <div className="py-2 max-h-80 overflow-y-auto">
                                {notificationsList.length > 0 ? (
                                    notificationsList.map((notification) => (
                                        <div key={notification.id} className="flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 group">
                                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getNotificationColor(notification.type)}`}></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 text-sm">{notification.title}</div>
                                                <div className="text-gray-500 text-[13px] truncate">{notification.description}</div>
                                                <div className="text-gray-400 text-xs mt-1">{notification.time}</div>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); dismissNotification(notification.id); }} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600"><X size={14} /></button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-8 text-center">
                                        <Bell size={24} className="mx-auto text-gray-300 mb-2" />
                                        <div className="text-sm text-gray-500">No notifications</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile */}
                <div className="relative" ref={userMenuRef}>
                    <div className="flex items-center gap-2 md:pl-4 md:border-l border-gray-200 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setShowUserMenu(!showUserMenu)}>
                        <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">{currentUser.initials}</div>
                        <div className="hidden lg:block">
                            <div className="text-sm font-medium text-gray-900 leading-tight">{currentUser.name}</div>
                            <div className="text-xs text-gray-500">{currentUser.role}</div>
                        </div>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                    </div>

                    {showUserMenu && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">My Account</div>
                            <div className="py-1">
                                <div className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 text-gray-700 font-medium" onClick={() => handleMenuAction('profile')}>
                                    <User size={16} className="text-gray-500" />
                                    <span className="text-sm">Profile</span>
                                </div>
                            </div>
                            <div className="border-t border-gray-100 mt-1 pt-1">
                                <div className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-red-50 text-red-500" onClick={() => handleMenuAction('signout')}><LogOut size={16} /><span className="text-sm">Sign out</span></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
