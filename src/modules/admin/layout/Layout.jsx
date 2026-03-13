import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
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
    const role = useSelector(state => state.auth.role);
    const isSuperAdmin = role?.name?.toLowerCase() === 'super admin' || role?.name?.toLowerCase() === 'superadmin';

    console.log('[Layout] Role Check:', { roleName: role?.name, isSuperAdmin });

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const data = await api.getSidebarMenu();
                // Data format expected: { modules: [{ name, path, icon, ... }] } or similar
                // Adjust mapping based on actual API response structure
                // For now, assuming API returns list of modules
                let items = Array.isArray(data) ? [...data] : [...(data.modules || [])];

                // For Super Admin, inject System Monitor and distinguish from Dashboard
                if (isSuperAdmin) {
                    const systemMonitorScreen = {
                        id: 'system-monitor',
                        label: 'System Monitor',
                        path: 'system-monitor',
                        key: 'system-monitor',
                        icon: 'Activity',
                        actions: ['view']
                    };

                    // Find "System Configuration" or "Setup" module to put it in
                    let sysConfigModule = items.find(m =>
                        (m.label || m.name || '').toLowerCase().includes('system') ||
                        (m.label || m.name || '').toLowerCase().includes('config')
                    );

                    if (sysConfigModule) {
                        // Prepend to System Config
                        if (!sysConfigModule.screens.some(s => s.id === 'system-monitor')) {
                            sysConfigModule.screens = [systemMonitorScreen, ...sysConfigModule.screens];
                        }
                    } else {
                        // Create new module
                        items.unshift({
                            id: 'sys-oversight',
                            label: 'System Oversight',
                            screens: [systemMonitorScreen]
                        });
                    }

                    // Rename existing "Dashboard" to "Dashboard" if it exists
                    items.forEach(m => {
                        m.screens?.forEach(s => {
                            const label = (s.label || s.name || '').toLowerCase();
                            if (label === 'dashboard') {
                                s.label = 'Dashboard';
                            }
                        });
                    });
                }

                // Ensure Dashboard always exists in the items (fallback if backend doesn't provide)
                const dashboardExists = items.some(m => m.screens?.some(s => 
                    (s.label || s.name || s.path || '').toLowerCase().includes('dashboard')
                ));

                if (!dashboardExists) {
                    items.unshift({
                        id: 'auto-dashboard-module',
                        label: 'Overview',
                        screens: [{
                            id: 'dashboard',
                            label: 'Dashboard',
                            path: 'dashboard',
                            key: 'dashboard',
                            icon: 'LayoutDashboard',
                            actions: ['view', '1']
                        }]
                    });
                }

                // Filter menu items based on explicit permissions for infrastructure
                const filteredItems = items.map(module => ({
                    ...module,
                    screens: (module.screens || []).filter(screen => {
                        const path = (screen.path || screen.route || '').toLowerCase();
                        const label = (screen.label || screen.name || '').toLowerCase();
                        const actions = screen.actions || [];

                        // Action check helpers
                        const hasManage = actions.some(a => String(a).toLowerCase() === 'manage');
                        const hasConfigure = actions.some(a => String(a).toLowerCase() === 'configure');

                        // 0. Priority: Always show Dashboard regardless of actions
                        if (path.includes('dashboard') || label.includes('dashboard')) return true;

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

                // Rename existing "Dashboard" to "Dashboard" for transparency
                filteredItems.forEach(m => {
                    m.screens?.forEach(s => {
                        const label = (s.label || s.name || '').toLowerCase();
                        if (label === 'dashboard') s.label = 'Dashboard';
                    });
                });

                // Inject Super Admin specific oversight screens if they are missing
                if (isSuperAdmin) {
                    const oversightScreens = [
                        { id: 'system-monitor', label: 'System Monitor', path: 'system-monitor', key: 'system-monitor', icon: 'Activity', actions: ['view'] },
                        { id: 'audit-logs', label: 'Audit Logs', path: 'audit-logs', key: 'audit-logs', icon: 'FileClock', actions: ['view'] }
                    ];

                    oversightScreens.forEach(screen => {
                        const exists = filteredItems.some(m => m.screens.some(s => s.id === screen.id || s.key === screen.key));
                        if (!exists) {
                            let sysConfigModule = filteredItems.find(m =>
                                (m.label || m.name || '').toLowerCase().includes('system') ||
                                (m.label || m.name || '').toLowerCase().includes('config')
                            );

                            if (sysConfigModule) {
                                sysConfigModule.screens.unshift(screen);
                            } else {
                                filteredItems.unshift({
                                    id: `sys-oversight-${screen.id}`,
                                    label: 'System Oversight',
                                    screens: [screen]
                                });
                            }
                        }
                    });
                }

                // Sort so Dashboard is ALWAYS at the top
                const sortedItems = [...filteredItems].sort((a, b) => {
                    const aHasDash = a.screens?.some(s => (s.label || s.name || '').toLowerCase().includes('dashboard'));
                    const bHasDash = b.screens?.some(s => (s.label || s.name || '').toLowerCase().includes('dashboard'));
                    if (aHasDash && !bHasDash) return -1;
                    if (!aHasDash && bHasDash) return 1;
                    return 0;
                });

                console.log('[Layout] Raw Menu Items:', items);
                console.log('[Layout] Filtered Menu Items:', filteredItems);

                setMenuItems(sortedItems);

                // Derive permissions from menu
                const derivedPermissions = {};
                items.forEach(module => {
                    (module.screens || []).forEach(screen => {
                        const label = (screen.label || screen.name || '').toLowerCase();
                        const path = (screen.path || screen.route || '').toLowerCase();

                        // Use key as primary identifier, then normalize path/label
                        let routeKey = screen.key || path.replace(/^\//, '') || label || screen.id.toString();
                        
                        // Force normalization for Dashboard for reliable redirection
                        if (label.includes('dashboard') || path.includes('dashboard')) {
                            routeKey = 'dashboard';
                        }

                        // Map actions to true/false for UI check consistency
                        const actions = (screen.actions || []).map(a => String(a).toLowerCase());
                        derivedPermissions[routeKey] = {
                            view: actions.some(a => ['view', 'read', 'viewing', '1', 'manage'].includes(a)) || routeKey === 'dashboard',
                            create: actions.some(a => ['create', 'add', '2'].includes(a)),
                            edit: actions.some(a => ['edit', 'update', 'modify', '3'].includes(a)),
                            delete: actions.some(a => ['delete', 'remove', '4'].includes(a)),
                            manage: actions.some(a => ['manage', 'admin', 'configure', '13'].includes(a)),
                            configure: actions.some(a => ['configure', 'settings', 'manage', '13'].includes(a))
                        };
                    });
                });

                // Force permissions for oversight screens and Dashboard
                if (isSuperAdmin) {
                    ['system-monitor', 'audit-logs'].forEach(key => {
                        derivedPermissions[key] = {
                            view: true, create: false, edit: false, delete: false, manage: false, configure: false
                        };
                    });
                }

                // Global override: Dashboard is ALWAYS viewable if it's in the system
                if (derivedPermissions['dashboard']) {
                    derivedPermissions['dashboard'].view = true;
                } else {
                    // Safety fallback for redirection
                    derivedPermissions['dashboard'] = { view: true };
                }
                
                // CRITICAL: Force Dashboard view permission if it exists in the menu
                // This prevents SmartRedirect from falling back to Conversations
                if (derivedPermissions['dashboard']) {
                    derivedPermissions['dashboard'].view = true;
                } else {
                    // Fallback: search for any dashboard-like key and alias it
                    const altDashKey = Object.keys(derivedPermissions).find(k => k.toLowerCase().includes('dashboard'));
                    if (altDashKey) {
                        derivedPermissions['dashboard'] = { ...derivedPermissions[altDashKey], view: true };
                    }
                }

                console.log('[Layout] Derived Permissions:', derivedPermissions);
                dispatch(updatePermissions(derivedPermissions));
            } catch (error) {
                console.error("Failed to fetch sidebar menu:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMenu();
    }, [refreshMenuTrigger, role]);

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

