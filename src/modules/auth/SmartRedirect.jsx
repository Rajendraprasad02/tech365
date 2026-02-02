import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectPermissions } from '@/store/slices/authSlice';

export default function SmartRedirect() {
    const permissions = useSelector(selectPermissions);

    // Order of preference for default landing
    if (permissions['dashboard']?.read) {
        return <Navigate to="/dashboard" replace />;
    }
    if (permissions['conversations']?.read) {
        return <Navigate to="/conversations" replace />;
    }
    if (permissions['roles']?.read) {
        return <Navigate to="/roles" replace />;
    }

    // Fallback: finding first readable route
    const firstRoute = Object.keys(permissions).find(key => permissions[key].read);
    if (firstRoute) {
        return <Navigate to={`/${firstRoute}`} replace />;
    }

    // Absolute fallback
    return (
        <div className="flex items-center justify-center h-screen bg-gray-50 flex-col gap-4">
            <h1 className="text-xl font-bold text-gray-800">Access Denied</h1>
            <p className="text-gray-500">You do not have permission to view any screens.</p>
            <button
                onClick={() => window.location.href = '/login'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
                Back to Login
            </button>
        </div>
    );
}
