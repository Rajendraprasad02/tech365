import { LayoutDashboard, MessageSquare, Database, LogOut, Users, Send, X } from 'lucide-react';

export default function Sidebar({ activePage, onNavigate, isOpen, onClose }) {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'conversations', label: 'Conversations', icon: MessageSquare },
        { id: 'campaigns', label: 'Campaigns', icon: Send },
        { id: 'knowledge-base', label: 'Knowledge Base', icon: Database },
        { id: 'contacts', label: 'Contacts', icon: Users },
        { id: 'templates', label: 'Templates', icon: LayoutDashboard },
    ];

    const handleSignOut = () => {
        // TODO: Implement actual sign out logic
        console.log('Sign out clicked');
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
                bg-[#0c1324] text-white
            `}>
                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white md:hidden"
                >
                    <X size={20} />
                </button>
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-8 mb-2 border-b border-sidebar-border">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-900/20">C</div>
                    <div>
                        <div className="text-white font-bold text-xl tracking-tight">ChatFlow</div>
                        <div className="text-gray-400 text-xs font-medium">Enterprise CRM</div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-4 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activePage === item.id;
                        return (
                            <div
                                key={item.id}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200 group ${isActive
                                    ? 'bg-blue-600/10 text-blue-400 font-semibold'
                                    : 'text-gray-400 hover:bg-sidebar-hover hover:text-white'
                                    }`}
                                onClick={() => onNavigate(item.id)}
                            >
                                <Icon size={20} className={`${isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-white'} transition-colors`} />
                                <span className="text-sm">{item.label}</span>
                            </div>
                        );
                    })}
                </nav>

                {/* Sign Out Button */}
                <div className="p-4 mt-auto border-t border-sidebar-border">
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-sidebar-hover rounded-xl text-sm font-medium transition-all duration-200"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}
