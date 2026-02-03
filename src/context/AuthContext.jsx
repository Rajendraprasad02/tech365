import { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials, logout as logoutAction, selectAuth } from '../store/slices/authSlice';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const dispatch = useDispatch();
    const { user, token, isAuthenticated, permissions } = useSelector(selectAuth);
    const [loading, setLoading] = useState(true);
    const [refreshMenuTrigger, setRefreshMenuTrigger] = useState(0);

    // Helper: Deriving permissions moved to Layout/Sidebar


    // Initial Load - Rehydrate from localStorage
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token');
            const storedRoleId = localStorage.getItem('roleId');

            if (storedToken && storedRoleId) {
                try {
                    // 1. Get user profile
                    const userProfile = await api.getUserProfile();

                    dispatch(setCredentials({
                        user: userProfile,
                        token: storedToken,
                        role: { id: storedRoleId, name: userProfile.role?.name || userProfile.role },
                        permissions: {} // Will be populated by Sidebar/Layout
                    }));
                } catch (error) {
                    console.error("Failed to rehydrate auth:", error);
                    // Only logout if truly unauthorized (401)
                    if (error.message.includes("Unauthorized") || error.message.includes("logging out")) {
                        logout();
                    } else if (error.message === 'FORBIDDEN') {
                        // Valid token, but no permissions - keep logged in with empty perms
                        dispatch(setCredentials({
                            user: { name: 'Restricted User' },
                            token: storedToken,
                            role: null,
                            permissions: {}
                        }));
                    }
                }
            }
            setLoading(false);
        };

        if (!isAuthenticated && localStorage.getItem('token')) {
            initAuth();
        } else {
            setLoading(false);
        }
    }, [dispatch, isAuthenticated]);

    // Login Flow: Standard 3-step process
    const login = async (email, password) => {
        try {
            // 1. POST /auth/login → { accessToken, roleId }
            const loginData = await api.login(email, password);
            const accessToken = loginData.accessToken || loginData.access_token;
            let roleId = loginData.roleId || loginData.role_id;

            if (!accessToken) throw new Error("Login failed: No access token received");

            // Store token immediately
            localStorage.setItem('token', accessToken);

            // 2. GET /auth/profile
            const userProfile = await api.getUserProfile();

            // Fallback: Get roleId from userProfile if not in loginData
            if (!roleId) {
                roleId = userProfile.roleId || userProfile.role_id || userProfile.role?.id;
                console.warn('[AuthContext] roleId not in login response, extracted from profile:', roleId);
            }

            // Store roleId
            if (roleId) {
                localStorage.setItem('roleId', roleId);
            } else {
                console.error('[AuthContext] CRITICAL: No roleId found in login or profile. Sidebar will be empty.');
            }

            // Also store roleName for reference
            const roleName = userProfile.role?.name || userProfile.role || '';
            if (roleName) {
                localStorage.setItem('roleName', roleName);
            }

            // 3. Dispatch to Redux (Permissions will be populated by Layout/Sidebar later)
            // Persist user for resilience
            localStorage.setItem('user', JSON.stringify(userProfile));

            dispatch(setCredentials({
                user: userProfile,
                token: accessToken,
                role: { id: roleId, name: roleName },
                permissions: {}
            }));

            return true;
        } catch (error) {
            console.error("Login failed:", error);

            // On 403, user is authenticated but may have no permissions
            if (error.message === 'FORBIDDEN') {
                const accessToken = localStorage.getItem('token');
                dispatch(setCredentials({
                    user: { email },
                    token: accessToken,
                    role: null,
                    permissions: {}
                }));
                return true;
            }

            // On 401, clear token
            if (error.message.includes('Unauthorized')) {
                localStorage.removeItem('token');
                localStorage.removeItem('roleId');
                localStorage.removeItem('user');
            }
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('roleId');
        localStorage.removeItem('user'); // Clear user
        dispatch(logoutAction());
        window.location.href = '/#/login';
    };

    const refreshMenu = () => {
        setRefreshMenuTrigger(prev => prev + 1);
    };

    const value = {
        user,
        token,
        login,
        logout,
        isAuthenticated,
        permissions,
        refreshMenuTrigger,
        refreshMenu
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) { 
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
