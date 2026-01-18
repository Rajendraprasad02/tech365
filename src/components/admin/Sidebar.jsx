import { LayoutDashboard, MessageSquare, Database, LogOut, Users } from 'lucide-react';

export default function Sidebar({ activePage, onNavigate }) {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'conversations', label: 'Conversations', icon: MessageSquare },
        { id: 'knowledge-base', label: 'Knowledge Base', icon: Database },
        { id: 'contacts', label: 'Contacts', icon: Users },
    ];

    const handleSignOut = () => {
        // TODO: Implement actual sign out logic
        console.log('Sign out clicked');
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-6 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">C</div>
                <div>
                    <div className="text-gray-900 font-semibold text-base">ChatFlow</div>
                    <div className="text-gray-500 text-xs">AI Messaging Platform</div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;
                    return (
                        <div
                            key={item.id}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 mb-1 ${isActive
                                ? 'bg-violet-500 text-white'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                            onClick={() => onNavigate(item.id)}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </div>
                    );
                })}
            </nav>

            {/* Sign Out Button */}
            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-xl text-sm font-medium transition-all"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
