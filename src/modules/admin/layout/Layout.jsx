import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDispatch } from 'react-redux';
import { updatePermissions } from '@/store/slices/authSlice';
import { Menu } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import api from '@/services/api';

export default function Layout() {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const { refreshMenuTrigger } = useAuth();
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const data = await api.getSidebarMenu();
                // Data format expected: { modules: [{ name, path, icon, ... }] } or similar
                // Adjust mapping based on actual API response structure
                // For now, assuming API returns list of modules
                const items = Array.isArray(data) ? data : (data.modules || []);

                // Filter menu items based on explicit permissions for infrastructure
                const filteredItems = items.map(module => ({
                    ...module,
                    screens: (module.screens || []).filter(screen => {
                        const path = (screen.path || screen.route || '').toLowerCase();
                        const actions = screen.actions || [];

                        // Action check helpers
                        const hasManage = actions.some(a => String(a).toLowerCase() === 'manage');
                        const hasConfigure = actions.some(a => String(a).toLowerCase() === 'configure');

                        // 1. Hide My Conversations (Agent-specific logic handled in ConversationsPage)
                        if (path.includes('agent/conversations/my')) return false;

                        // 2. Hide Infrastructure Menus without explicit Manage/Configure permissions
                        const isMenuBuilder = path.includes('menu-builder') || screen.key === 'menu-builder';
                        const isRoles = path.includes('role-permissions') || screen.key === 'role-permissions' || path.includes('roles');
                        const isActions = path.includes('actions') || screen.key === 'actions';
                        const isNotifications = path.includes('notifications') || screen.key === 'notifications';
                        const isUsers = path.includes('users') || screen.key === 'users';

                        if (isMenuBuilder && !hasManage) return false;
                        if (isRoles && !hasManage) return false;
                        if (isActions && !hasManage) return false;
                        if (isNotifications && !hasConfigure) return false;
                        if (isUsers && !hasManage) return false;

                        return true;
                    })
                })).filter(module => module.screens.length > 0);

                console.log('[Layout] Raw Menu Items:', items);
                console.log('[Layout] Filtered Menu Items:', filteredItems);

                setMenuItems(filteredItems);

                // Derive permissions from menu
                const derivedPermissions = {};
                items.forEach(module => {
                    (module.screens || []).forEach(screen => {
                        // Use key as primary identifier, then path/route, then name
                        const routeKey = screen.key || (screen.path || screen.route)?.replace(/^\//, '') || screen.label?.toLowerCase() || screen.id;

                        // Map actions to true/false for UI check consistency
                        const actions = (screen.actions || []).map(a => String(a).toLowerCase());
                        derivedPermissions[routeKey] = {
                            view: actions.some(a => ['view', 'read', 'viewing'].includes(a)),
                            create: actions.some(a => ['create', 'add'].includes(a)),
                            edit: actions.some(a => ['edit', 'update', 'modify'].includes(a)),
                            delete: actions.some(a => ['delete', 'remove'].includes(a)),
                            manage: actions.some(a => ['manage', 'admin', 'configure'].includes(a)),
                            configure: actions.some(a => ['configure', 'settings', 'manage'].includes(a))
                        };
                    });
                });

                console.log('[Layout] Derived Permissions:', derivedPermissions);
                dispatch(updatePermissions(derivedPermissions));
            } catch (error) {
                console.error("Failed to fetch sidebar menu:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMenu();
    }, [refreshMenuTrigger]);

    // Compute allowed routes for context consumption by child pages
    const allowedRoutes = useMemo(() => menuItems.flatMap(module =>
        (module.screens || []).map(screen => screen.path)
    ), [menuItems]);

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center px-4">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    <Menu size={24} />
                </button>
                <span className="ml-2 font-semibold text-gray-900">ChatFlow</span>
            </div>

            <Sidebar
                menuItems={menuItems}
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <main className="flex-1 flex flex-col overflow-hidden w-full relative pt-16 md:pt-0">
                {/* Global Desktop Header */}
                <div className="hidden md:block">
                    <Header />
                </div>

                <div className="flex-1 flex flex-col overflow-auto p-0">
                    {loading ? (
                        <div className="loader-wrapper">
                            <span className="loader"></span>
                        </div>
                    ) : (
                        <Outlet context={{ allowedRoutes }} />
                    )}
                </div>
            </main>
        </div>
    );
}

