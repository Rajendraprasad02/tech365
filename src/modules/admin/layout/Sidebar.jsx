import {
    LayoutDashboard, MessageSquare, Database, LogOut, Users, Send, X,
    FileText, Shield, Settings, Circle, Phone, CreditCard, BarChart, FileClock, Inbox, Contact, User, Activity, Bell
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/store/slices/authSlice';

const CustomConversationIcon = ({ size = 24, className = '', ...props }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={className}
        {...props}
    >
        <defs>
            <mask id="chat-pending-mask">
                <rect width="100%" height="100%" fill="white" />
                <circle cx="12" cy="11" r="5" fill="black" />
            </mask>
        </defs>
        <path
            fill="currentColor"
            mask="url(#chat-pending-mask)"
            d="M6 3C3.79086 3 2 4.79086 2 7V15C2 17.2091 3.79086 19 6 19H9.5L12 22.5L14.5 19H18C20.2091 19 22 17.2091 22 15V7C22 4.79086 20.2091 3 18 3H6Z"
        />
        <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8.5V11L13.5 12.5"
        />
    </svg>
);

// Map backend icon names to Lucide components
// Backend may return: LayoutDashboard, MessageSquare, Send, Users, FileText, Database, Shield, Settings, Circle
const iconMap = {
    // Exact matches and common variants
    'layoutdashboard': LayoutDashboard,
    'messagesquare': MessageSquare,
    'send': Send,
    'users': Users,
    'filetext': FileText,
    'database': Database,
    'shield': Shield,
    'settings': Settings,
    'circle': Circle,
    'phone': Phone,
    'creditcard': CreditCard,
    'barchart': BarChart,
    'fileclock': FileClock,
    'inbox': Inbox,
    'contact': Contact,
    'contacts': Contact,

    // Label-based fallbacks (lowercase)
    'dashboard': LayoutDashboard,
    'conversations': MessageSquare,
    'pending': CustomConversationIcon,
    'campaigns': Send,
    'knowledgebase': Database,
    'knowledge-base': Database,
    'templates': FileText,
    'forms': FileText,
    'roles': Shield,
    'rolepermissions': Shield,
    'menu': Settings,
    'menubuilder': Settings,
    'menu-builder': Settings,
    'auditlogs': FileClock,
    'audit-logs': FileClock,
    'actions': Activity,
    'notifications': Bell,
    'profile': User,
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
                <div className="flex items-center gap-3 px-6 py-8 mb-2 border-b border-sidebar-border text-sidebar-logo">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-900/20">
                        {(useSelector(selectAuth)?.user?.username?.startsWith('+') ? useSelector(selectAuth)?.user?.username.substring(1) : (useSelector(selectAuth)?.user?.username || 'C')).charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="text-gray-900 font-bold text-xl tracking-tight leading-none mb-1">
                            ChatFlow
                        </div>
                        <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider opacity-60">Enterprise CRM</div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-4 space-y-6 overflow-y-auto">
                    {menuItems.map((module) => {
                        // Skip empty modules
                        if (!module.screens || module.screens.length === 0) return null;

                        return (
                            <div key={module.id} className="space-y-1">
                                <div className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-3 opacity-80">
                                    {module.label || module.name || 'Module'}
                                </div>
                                {module.screens.map((item) => {
                                    // Robust icon lookup
                                    const labelLower = (item.label || item.name || '').toLowerCase();
                                    const iconAttr = (item.icon || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                                    const routeAttr = (item.path || item.route || '').toLowerCase().replace(/[^a-z0-9]/g, '');

                                    let Icon = iconMap[iconAttr] || iconMap[routeAttr] || LayoutDashboard;

                                    // Special cases based on label contents
                                    if (labelLower.includes('pending')) Icon = CustomConversationIcon;
                                    else if (labelLower.includes('contact')) Icon = Contact;
                                    else if (labelLower.includes('campaign')) Icon = Send;
                                    else if (labelLower.includes('template')) Icon = FileText;
                                    else if (labelLower.includes('form')) Icon = FileText;
                                    else if (labelLower.includes('knowledge')) Icon = Database;
                                    else if (labelLower.includes('audit')) Icon = FileClock;
                                    else if (labelLower.includes('role')) Icon = Shield;
                                    else if (labelLower.includes('menu')) Icon = Settings;
                                    else if (labelLower.includes('user')) Icon = Users;
                                    else if (labelLower.includes('dashboard')) Icon = LayoutDashboard;
                                    else if (labelLower.includes('conversation')) Icon = MessageSquare;

                                    // Robust active state matching
                                    const cleanPath = (p) => p ? p.toString().replace(/^\/+/, '') : '';
                                    if (!item) return null; // Defensive check
                                    const currentPath = cleanPath(location.pathname);
                                    const itemPath = cleanPath(item.path || item.route);

                                    const isActive = currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);

                                    return (
                                        <div
                                            key={item.id}
                                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group ${isActive
                                                ? 'bg-[#14137F] text-white font-semibold shadow-md'
                                                : 'text-gray-600 hover:bg-sidebar-hover hover:text-gray-900'
                                                }`}
                                            onClick={() => {
                                                handleNavigation(itemPath ? `/${itemPath}` : `/${item.id}`);
                                            }}
                                        >
                                            <Icon size={18} className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} transition-colors`} />
                                            <span className="text-sm">{item.label || item.name}</span>
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
