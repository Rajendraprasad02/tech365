import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    role: null,
    permissions: {},
    isAgent: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            const { user, token, role, permissions } = action.payload;
            state.user = user;
            state.token = token;
            state.role = role;
            state.permissions = permissions || state.permissions;
            state.isAuthenticated = !!token;
            // Determine if user is an Agent based on isAgent flag or role name (fallback)
            state.isAgent = role?.isAgent === true || role?.name?.toLowerCase() === 'agent';
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.role = null;
            state.permissions = {};
            state.isAgent = false;
        },
        updatePermissions: (state, action) => {
            state.permissions = action.payload;
        },
    },
});

export const { setCredentials, logout, updatePermissions } = authSlice.actions;

export default authSlice.reducer;

export const selectAuth = (state) => state.auth;
export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
export const selectPermissions = (state) => state.auth.permissions;
export const selectIsAgent = (state) => {
    return state.auth.isAgent;
};
