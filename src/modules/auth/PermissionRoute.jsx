
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectPermissions, selectIsAgent } from '@/store/slices/authSlice';

export default function PermissionRoute({ requiredScreen, children }) {
    const permissions = useSelector(selectPermissions);
    const isAgent = useSelector(selectIsAgent);

    // If no specific screen required, we assume it's just a pass-through authentication check
    // But this route is specifically for permissions.
    if (!requiredScreen) {
        return children ? children : <Outlet />;
    }

    // Special bypass for Agent routes if user is an Agent
    // This relies on the convention that agent routes start with 'agent/'
    if (isAgent && requiredScreen.startsWith('agent/')) {
        return children ? children : <Outlet />;
    }

    // Debug Log


    const hasAccess = permissions[requiredScreen]?.read;

    if (!hasAccess) {
        // Access Denied
        return <Navigate to="/" replace />;
    }

    return children ? children : <Outlet />;
}
