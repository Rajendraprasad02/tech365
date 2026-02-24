import {
    LayoutDashboard, MessageSquare, Database, LogOut, Users, Send, X,
    FileText, Shield, Settings, Circle, Phone, CreditCard, BarChart, FileClock, Inbox
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/store/slices/authSlice';

// Map backend icon names to Lucide components
// Backend may return: LayoutDashboard, MessageSquare, Send, Users, FileText, Database, Shield, Settings, Circle
const iconMap = {
    // Exact matches from backend
    'LayoutDashboard': LayoutDashboard,
    'MessageSquare': MessageSquare,
    'Send': Send,
    'Users': Users,
    'FileText': FileText,
    'Database': Database,
    'Shield': Shield,
    'Settings': Settings,
    'Circle': Circle,
    'Phone': Phone,
    'CreditCard': CreditCard,
    'BarChart': BarChart,
    'FileClock': FileClock,
    'Inbox': Inbox,

    // Lowercase variants
    'dashboard': LayoutDashboard,
    'conversations': MessageSquare,
    'campaigns': Send,
    'knowledge_base': Database,
    'knowledgebase': Database,
    'contacts': Users,
    'templates': FileText,
    'forms': FileText,
    'roles': Shield,
    'menu': Settings,
    'menubuilder': Settings,
    'users': Users,
    'layout': LayoutDashboard,
};

export default function Sidebar({ menuItems, isOpen, onClose }) {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { role } = useSelector(selectAuth);

    // Debug: Check permissions

    const handleNavigation = (path) => {
        navigate(path);
        onClose(); // Close sidebar on mobile
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            <aside className={`
                w-64 bg-sidebar border-r border-sidebar-border flex flex-col fixed inset-y-0 left-0 z-50 
                transition-transform duration-300 ease-in-out md:relative md:translate-x-0 
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                text-sidebar-text
            `}>
                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-900 md:hidden"
                >
                    <X size={20} />
                </button>
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-8 mb-2 border-b border-sidebar-border">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-900/20">
                        {role?.name ? role.name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                        <div className="text-gray-900 font-bold text-xl tracking-tight">
                            {role?.name || 'ChatFlow'}
                        </div>
                        <div className="text-gray-500 text-xs font-medium">Enterprise CRM</div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-4 space-y-4">
                    {menuItems.map((module) => {
                        // Skip empty modules
                        if (!module.screens || module.screens.length === 0) return null;

                        return (
                            <div key={module.id} className="space-y-1">
                                <div className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    {module.label}
                                </div>
                                {module.screens.map((item) => {
                                    // Backend might return 'icon' string, map it
                                    // Remove special characters or spaces from icon name for lookup if needed
                                    const iconName = item.icon ? item.icon.replace(/[^a-zA-Z0-9]/g, '') : '';
                                    const Icon = iconMap[iconName] || LayoutDashboard;

                                    // Robust active state matching
                                    // Remove leading slashes for comparison
                                    const cleanPath = (p) => p ? p.toString().replace(/^\/+/, '') : '';
                                    if (!item) return null; // Defensive check
                                    const currentPath = cleanPath(location.pathname);
                                    const itemPath = cleanPath(item.path || item.route);

                                    const isActive = currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);


                                    return (
                                        <div
                                            key={item.id}
                                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group ${isActive
                                                ? 'bg-[#14137F] text-white font-semibold shadow-md' // New Active State: Brand Blue Background + White Text
                                                : 'text-gray-600 hover:bg-sidebar-hover hover:text-gray-900' // New Inactive State
                                                }`}
                                            onClick={() => {
                                                handleNavigation(itemPath ? `/${itemPath}` : `/${item.id}`);
                                            }}
                                        >
                                            <Icon size={18} className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} transition-colors`} />
                                            <span className="text-sm">{item.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>

                {/* Sign Out Button */}
                <div className="p-4 mt-auto border-t border-sidebar-border">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-all duration-200"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}
