import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectPermissions } from '@/store/slices/authSlice';

export default function SmartRedirect() {
    const permissions = useSelector(selectPermissions);

    console.log('[SmartRedirect] Permissions:', permissions);
    // Order of preference for default landing
    if (permissions['dashboard']?.view) {
        return <Navigate to="/dashboard" replace />;
    }
    if (permissions['conversations']?.view) {
        return <Navigate to="/conversations" replace />;
    }
    if (permissions['role-permissions']?.view) {
        return <Navigate to="/role-permissions" replace />;
    }
    if (permissions['menu-builder']?.view) {
        return <Navigate to="/menu-builder" replace />;
    }
    if (permissions['users']?.view) {
        return <Navigate to="/users" replace />;
    }

    // Fallback: finding first readable route
    const readableRoutes = Object.keys(permissions).filter(key => permissions[key]?.view);
    const firstRoute = readableRoutes.find(key => key !== '/' && key !== '');

    if (firstRoute) {
        // Special case for role-permissions/menu-builder/user-mgmt if they have routes starting with /
        const navigateTo = firstRoute.startsWith('/') ? firstRoute : `/${firstRoute}`;
        return <Navigate to={navigateTo} replace />;
    }

    // If we have permissions but none were found above, maybe there's only one and it's unconventional
    if (readableRoutes.length > 0) {
        const fallbackRoute = readableRoutes[0].startsWith('/') ? readableRoutes[0] : `/${readableRoutes[0]}`;
        return <Navigate to={fallbackRoute} replace />;
    }

    // If permissions object is empty, we might be in a transitional state (waiting for Layout to dispatch)
    // We should wait instead of flashing "Access Denied"
    if (Object.keys(permissions).length === 0) {
        return null;
    }

    // Absolute fallback
    return (
        <div className="flex items-center justify-center min-h-screen bg-transparent flex-col gap-4 p-4">
            <h1 className="text-xl font-bold text-gray-800">Access Denied</h1>
            <p className="text-gray-500">You do not have permission to view any screens.</p>
            
            <div className="w-full max-w-2xl bg-white p-4 rounded-xl border border-gray-200 shadow-sm overflow-auto max-h-96">
                <div className="text-xs font-mono text-gray-400 mb-2 uppercase tracking-widest">Debug Info: Permissions Map</div>
                <pre className="text-[10px] text-gray-600 font-mono">
                    {JSON.stringify(permissions, null, 2)}
                </pre>
            </div>

            <button
                onClick={() => window.location.href = '/#/login'}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm font-medium"
            >
                Back to Login
            </button>
        </div>
    );
}
