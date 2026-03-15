import { useState, useEffect, useRef } from 'react';
import {
    Bell, Search, ChevronDown, User, Check, Trash2,
    MessageSquare, UserPlus, Send, AlertTriangle, Shield, CheckCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import * as Avatar from '@radix-ui/react-avatar';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NOTIFICATION_ICONS = {
    'info': <Shield size={16} className="text-blue-500" />,
    'success': <CheckCircle size={16} className="text-green-500" />,
    'warning': <AlertTriangle size={16} className="text-amber-500" />,
    'error': <AlertTriangle size={16} className="text-red-500" />,
    'LEAD_RECEIVED': <UserPlus size={16} className="text-indigo-500" />,
    'NEW_CONTACT': <MessageSquare size={16} className="text-primary" />,
    'CAMPAIGN_COMPLETE': <Send size={16} className="text-purple-500" />,
    'SYSTEM_ALERT': <Shield size={16} className="text-red-500" />
};

export default function Header() {
    const { user, logout, role } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const isSuperAdmin = role?.name === 'Super Admin';
    const dropdownRef = useRef(null);

    // Workspace state
    const [workspacesList, setWorkspacesList] = useState([
        { id: 1, name: 'Default Workspace', icon: '🏢' }
    ]);
    const [activeWorkspace, setActiveWorkspace] = useState(workspacesList[0]);
    const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
    const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const workspaceRef = useRef(null);

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

    useEffect(() => {
        fetchNotifications();

        let isMounted = true;
        let wsInstance = null;
        let reconnectTimeout = null;

        const setupWebSocket = () => {
            const userId = user?.id || user?.userId || 'anonymous';
            const clientId = `header_${userId}_${Math.random().toString(36).substring(7)}`;
            const apiUrl = import.meta.env.VITE_DATA_API_URL || 'http://localhost:8000';
            const wsBase = apiUrl.replace(/^http/, 'ws').replace(/\/$/, '');
            const wsUrl = `${wsBase}/ws/${clientId}`;

            console.log("🔗 [Header WS] Connecting to:", wsUrl);
            wsInstance = new WebSocket(wsUrl);

            wsInstance.onmessage = (event) => {
                if (!isMounted) return;
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'notification' && data.notification) {
                        const newNotif = data.notification;
                        console.log("🔔 [Header WS] New Notification:", newNotif);

                        setNotifications(prev => [newNotif, ...prev].slice(0, 100));
                        setUnreadCount(prev => prev + 1);

                        // Show Toast Alert
                        toast({
                            title: newNotif.title,
                            description: newNotif.message,
                            variant: newNotif.type === 'error' ? 'destructive' : 'default',
                        });
                    }
                } catch (err) {
                    console.error("❌ [Header WS] Error processing message:", err);
                }
            };

            wsInstance.onclose = (e) => {
                if (!isMounted) return;
                // Only log if it's not a normal cleanup (1000/1001) or component unmount
                if (e.code !== 1000 && e.code !== 1001) {
                    console.log(`📡 [Header WS] Disconnected (${e.code}). Retrying in 5s...`);
                    reconnectTimeout = setTimeout(setupWebSocket, 5000);
                }
            };

            wsInstance.onerror = (e) => {
                if (!isMounted) return;
                // Only log errors on already established connections
                if (wsInstance.readyState === WebSocket.OPEN) {
                    console.error("❌ [Header WS] Socket Error:", e);
                    wsInstance.close();
                }
            };
        };

        const setupTimeout = setTimeout(() => {
            if (isMounted) setupWebSocket();
        }, 50);

        return () => {
            isMounted = false;
            if (wsInstance) {
                wsInstance.onopen = null;
                wsInstance.onmessage = null;
                wsInstance.onerror = null;
                wsInstance.onclose = null;
                if (wsInstance.readyState === WebSocket.CONNECTING || wsInstance.readyState === WebSocket.OPEN) {
                    wsInstance.close();
                }
            }
            clearTimeout(setupTimeout);
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };
    }, [user?.id]);

    const fetchNotifications = async () => {
        try {
            const data = await getNotifications();
            if (data) {
                // Backend might return notifications:[], results:[], or just []
                const list = data?.notifications || data?.results || (Array.isArray(data) ? data : []);
                const count = data?.unread_count ?? data?.count ?? (Array.isArray(data) ? 0 : data?.unreadCount ?? 0);

                setNotifications(list);
                setUnreadCount(count);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            toast({ title: "Error", description: "Failed to mark notification as read", variant: "destructive" });
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (e) {
            toast({ title: "Error", description: "Failed to mark all as read", variant: "destructive" });
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
            if (workspaceRef.current && !workspaceRef.current.contains(event.target)) {
                setShowWorkspaceDropdown(false);
                setShowCreateWorkspace(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Rich Detailed Notification UI
    const DetailedNotification = ({ notification }) => {
        const metadata = notification.metadata || {};
        const isLead = notification.type === 'LEAD_RECEIVED';
        const isCampaign = notification.type === 'CAMPAIGN_COMPLETE';

        return (
            <div className="flex flex-col gap-2">
                <p className={`font-semibold ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>{notification.title}</p>

                {/* Message Body */}
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                    {notification.message}
                </p>

                {/* Metadata Box for Leads/Campaigns */}
                {Object.keys(metadata).length > 0 && (
                    <div className={`p-2 rounded-lg border text-[10px] space-y-1 ${isLead ? 'bg-indigo-50/50 border-indigo-100' :
                        isCampaign ? 'bg-purple-50/50 border-purple-100' :
                            'bg-gray-50 border-gray-100'
                        }`}>
                        {Object.entries(metadata).map(([key, value]) => (
                            value && typeof value !== 'object' && (
                                <div key={key} className="flex justify-between gap-2">
                                    <span className="text-gray-400 font-bold uppercase tracking-tighter">{key.replace('_', ' ')}:</span>
                                    <span className="text-gray-700 font-semibold truncate max-w-[150px]">{String(value)}</span>
                                </div>
                            )
                        ))}
                    </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-3 mt-1 pt-1 border-t border-gray-100/50">
                    {isLead && (
                        <>
                            <button
                                onClick={() => { navigate('/contacts'); setIsNotificationOpen(false); }}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tight flex items-center gap-1"
                            >
                                <UserPlus size={10} /> View Contact
                            </button>
                            <button
                                onClick={() => { navigate('/conversations'); setIsNotificationOpen(false); }}
                                className="text-[10px] font-bold text-primary hover:text-primary-600 uppercase tracking-tight flex items-center gap-1"
                            >
                                <MessageSquare size={10} /> Chat
                            </button>
                        </>
                    )}
                    {isCampaign && (
                        <button
                            onClick={() => { navigate('/campaigns'); setIsNotificationOpen(false); }}
                            className="text-[10px] font-bold text-purple-600 hover:text-purple-800 uppercase tracking-tight flex items-center gap-1"
                        >
                            <Send size={10} /> View Details
                        </button>
                    )}
                    {notification.type === 'NEW_CONTACT' && (
                        <button
                            onClick={() => { navigate('/conversations'); setIsNotificationOpen(false); }}
                            className="text-[10px] font-bold text-primary hover:text-primary-600 uppercase tracking-tight flex items-center gap-1"
                        >
                            <MessageSquare size={10} /> Accept Chat
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <header className="h-16 bg-white border-b border-gray-100 sticky top-0 z-30 px-6 flex items-center justify-between">
            {/* Left: Workspace & Search */}
            <div className="flex items-center gap-6">
                {/* Workspace Selector */}
                <div className="relative" ref={workspaceRef}>
                    <div
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
                    >
                        <div className="w-6 h-6 bg-violet-100 rounded-md flex items-center justify-center flex-shrink-0">
                            <Shield size={14} className="text-violet-600" />
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
                                    <span className="text-sm font-medium">{workspace.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-4">

                {/* Notifications Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    {!isSuperAdmin && (
                        <button
                            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                            className={`p-2 transition-all rounded-full relative group ${isNotificationOpen ? 'bg-gray-100 text-primary' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                        >
                            <Bell size={20} className={isNotificationOpen ? 'fill-primary' : ''} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center animate-in fade-in zoom-in">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                    )}

                    {isNotificationOpen && !isSuperAdmin && (
                        <div className="absolute right-0 mt-3 w-96 bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <h3 className="font-bold text-gray-900">Notifications</h3>
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs text-primary font-semibold hover:underline"
                                >
                                    Mark all as read
                                </button>
                            </div>

                            <div className="max-h-[450px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-10 text-center text-gray-400">
                                        <Bell className="mx-auto mb-2 opacity-20" size={32} />
                                        <p className="text-sm italic">All caught up!</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50">
                                        {notifications.slice(0, 50).map((n) => (
                                            <div
                                                key={n.id}
                                                className={`p-4 flex gap-3 transition-colors hover:bg-gray-50/50 ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                                            >
                                                <div className="mt-1 flex-shrink-0">
                                                    {NOTIFICATION_ICONS[n.type] || <Shield size={16} className="text-gray-400" />}
                                                </div>
                                                <div className="flex-1">
                                                    <DetailedNotification notification={n} />
                                                    <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                                        {n.created_at ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true }) : ''}
                                                    </p>
                                                </div>
                                                {!n.is_read && (
                                                    <button
                                                        onClick={() => handleMarkAsRead(n.id)}
                                                        className="h-6 w-6 flex items-center justify-center text-gray-300 hover:text-primary transition-colors"
                                                        title="Mark as read"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
                                <button
                                    className="text-xs font-bold text-gray-500 hover:text-gray-700"
                                    onClick={() => { setIsNotificationOpen(false); navigate('/audit-logs'); }}
                                >
                                    View Activity Logs
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200 group cursor-pointer" onClick={() => navigate('/profile')}>
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">{user?.username || 'User'}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{role?.name || 'User'}</div>
                    </div>

                    <Avatar.Root className="w-9 h-9 rounded-full bg-primary/10 border-2 border-white ring-2 ring-gray-100 flex items-center justify-center overflow-hidden select-none transition-transform group-hover:scale-105 shadow-sm">
                        <Avatar.Fallback className="text-primary font-bold text-sm">
                            {(user?.username?.startsWith('+') ? user?.username.substring(1) : (user?.username || 'A')).charAt(0).toUpperCase()}
                        </Avatar.Fallback>
                    </Avatar.Root>
                </div>
            </div>
        </header>
    );
}
