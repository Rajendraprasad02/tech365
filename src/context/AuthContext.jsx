import { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials, logout as logoutAction, selectAuth } from '../store/slices/authSlice';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const dispatch = useDispatch();
    const { user, token, isAuthenticated, permissions, role } = useSelector(selectAuth);
    const [loading, setLoading] = useState(true);
    const [refreshMenuTrigger, setRefreshMenuTrigger] = useState(0);

    // Initial Load - Rehydrate from localStorage
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token');
            const storedRefreshToken = localStorage.getItem('refreshToken');

            if (storedToken) {
                try {
                    // 1. Decode token to get baseline role info
                    const decoded = jwtDecode(storedToken);
                    console.log('[AuthContext] Rehydrating from token:', decoded);

                    // 2. Get user profile
                    let userProfile;
                    try {
                        userProfile = await api.getUserProfile();
                    } catch (error) {
                        // If profile fetch fails with 401, try refreshing token before giving up
                        if (error.message.includes("Unauthorized") && storedRefreshToken) {
                            console.log('[AuthContext] Token expired, attempting refresh...');
                            try {
                                const refreshRes = await api.refreshToken(storedRefreshToken);
                                if (refreshRes && refreshRes.accessToken) {
                                    localStorage.setItem('token', refreshRes.accessToken);
                                    // Retry getting profile with new token
                                    userProfile = await api.getUserProfile();
                                } else {
                                    throw new Error("Refresh failed");
                                }
                            } catch (refreshErr) {
                                console.error("[AuthContext] Refresh attempt failed:", refreshErr);
                                throw error; // Re-throw original unauthorized error
                            }
                        } else {
                            throw error;
                        }
                    }

                    dispatch(setCredentials({
                        user: userProfile,
                        token: localStorage.getItem('token'), // Use latest token
                        role: {
                            id: decoded.roleId || userProfile.roleId || userProfile.role?.id,
                            name: decoded.role || decoded.roleName || userProfile.role?.name || userProfile.role
                        },
                        permissions: {} // Will be populated by Sidebar/Layout
                    }));
                } catch (error) {
                    console.error("Failed to rehydrate auth:", error);
                    // Only logout if truly unauthorized (401)
                    if (error.message.includes("Unauthorized") || error.message.includes("logging out")) {
                        logout();
                    }
                }
            }
            setLoading(false);
        };

        if (localStorage.getItem('token') && !user) {
            initAuth();
        } else {
            setLoading(false);
        }
    }, [dispatch, user]);

    // Login Flow: Standard process
    const login = async (email, password) => {
        try {
            // 1. POST /auth/login-email → { accessToken, refreshToken }
            const loginData = await api.login(email, password);
            const accessToken = loginData.accessToken || loginData.access_token;
            const refreshToken = loginData.refreshToken || loginData.refresh_token;

            if (!accessToken) throw new Error("Login failed: No access token received");

            // Store tokens immediately
            localStorage.setItem('token', accessToken);
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }

            // 2. Decode token for immediate state
            const decoded = jwtDecode(accessToken);
            console.log('[AuthContext] Login decoded claims:', decoded);

            // 3. GET /auth/profile
            const userProfile = await api.getUserProfile();

            // Store user for resilience
            localStorage.setItem('user', JSON.stringify(userProfile));

            dispatch(setCredentials({
                user: userProfile,
                token: accessToken,
                role: {
                    id: decoded.roleId || userProfile.roleId || userProfile.role?.id,
                    name: decoded.role || decoded.roleName || userProfile.role?.name || userProfile.role || ''
                },
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
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
            }
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
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
        role,
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
