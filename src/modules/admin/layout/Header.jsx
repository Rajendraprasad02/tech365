import { Bell, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import * as Avatar from '@radix-ui/react-avatar';

export default function Header() {
    const { user, logout } = useAuth();
    const env = import.meta.env.MODE === 'development' ? 'DEV' : 'PROD';

    return (
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 px-6 flex items-center justify-between">
            {/* Left: Search or Breadcrumbs (Placeholder) */}
            <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 transition-all"
                    />
                </div>
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-4">
                {/* Environment Indicator */}
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${env === 'PROD' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                    {env}
                </span>

                {/* Notifications */}
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>

                {/* Profile Dropdown */}
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-semibold text-gray-900">{user?.username || 'Admin User'}</div>
                        <div className="text-xs text-gray-500 capitalize">{user?.roleName || 'User'}</div>
                    </div>

                    <Avatar.Root className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden select-none">
                        <Avatar.Fallback className="text-blue-600 font-medium text-sm">
                            {(user?.username || 'A').charAt(0).toUpperCase()}
                        </Avatar.Fallback>
                    </Avatar.Root>
                </div>
            </div>
        </header>
    );
}
