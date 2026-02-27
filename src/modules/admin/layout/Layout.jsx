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
                let items = [];
                if (Array.isArray(data)) {
                    items = data;
                } else if (data.modules) {
                    items = data.modules;
                }

                setMenuItems(items);

                // Derive permissions from menu
                const derivedPermissions = {};
                items.forEach(module => {
                    (module.screens || []).forEach(screen => {
                        const routeKey = screen.path?.replace(/^\//, '') || screen.id;
                        derivedPermissions[routeKey] = {
                            read: true,
                            create: true,
                            update: true,
                            delete: true
                        };
                    });
                });

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
                {/* Desktop Header */}
                {/* Desktop Header - Hidden as per user request to remove duplicate navbar
                <div className="hidden md:block">
                    <Header />
                </div>
                */}

                <div className="flex-1 overflow-auto p-0">
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

