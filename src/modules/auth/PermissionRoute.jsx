
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

    // Role-based bypass removed for strict RBAC

    // Debug Log


    // During initial load or rehydration, permissions might be empty.
    // If we're authenticated, we should wait for permissions to load instead of bouncing immediately.
    if (Object.keys(permissions).length === 0) {
        return null; // Or a minimal loader/spinner
    }

    const hasAccess = permissions[requiredScreen]?.view;

    if (!hasAccess) {
        // Access Denied
        console.warn(`[PermissionRoute] Access Denied for ${requiredScreen}. Redirecting to /`);
        return <Navigate to="/" replace />;
    }

    return children ? children : <Outlet />;
}
