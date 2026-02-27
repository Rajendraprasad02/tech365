import React, { useState, useEffect } from 'react';
import { Plus, User, Mail, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { getUsers, createUser, updateUser, getUserRoles, deleteUser } from '@/services/api';
import CreateUserModal from './CreateUserModal';
import { useToast } from '@/context/ToastContext';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/store/slices/authSlice';
import Pagination from '@/components/ui/Pagination';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]); // Filtered roles for modal
    const [allRoles, setAllRoles] = useState([]); // All roles for display
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { toast } = useToast();
    const { role: currentRole } = useSelector(selectAuth);

    // Editing State
    const [editingUser, setEditingUser] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Filtered & Paginated Users
    const indexOfLastItem = currentPage * pageSize;
    const indexOfFirstItem = indexOfLastItem - pageSize;
    const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(users.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersData, rolesData] = await Promise.all([
                getUsers(),
                getUserRoles()
            ]);

            setAllRoles(rolesData);

            // Filter Users: Exclude 'Super Admin' users
            if (Array.isArray(usersData) && Array.isArray(rolesData)) {
                const superAdminRole = rolesData.find(r => String(r.name).trim().toLowerCase() === 'super admin');
                const superAdminRoleId = superAdminRole ? superAdminRole.id : null;

                const filteredUsers = usersData.filter(user => {
                    // Soft delete filter
                    if (user.is_deleted) return false;

                    const userRoleId = user.roleId || (user.role && user.role.id) || user.role;
                    // If we found the ID, compare it. If not, rely on string check if populated
                    if (superAdminRoleId) {
                        return parseInt(userRoleId) !== parseInt(superAdminRoleId);
                    }
                    // Fallback if role is populated object
                    if (user.role && user.role.name) {
                        return String(user.role.name).trim().toLowerCase() !== 'super admin';
                    }
                    return true;
                });
                setUsers(filteredUsers);
            } else {
                // Ensure soft deleted users are filtered even if not role-filtering
                const activeUsers = Array.isArray(usersData) ? usersData.filter(u => !u.is_deleted) : [];
                setUsers(activeUsers);
            }

            // Filter roles for dropdown: Exclude current user's role
            let currentRoleName = '';
            if (currentRole) {
                currentRoleName = typeof currentRole === 'string' ? currentRole : currentRole.name;
            }

            if (Array.isArray(rolesData)) {
                // Case-insensitive comparison and strict cleanup
                const normalize = (str) => String(str).trim().toLowerCase();
                const normalizedCurrentRole = currentRoleName ? normalize(currentRoleName) : '';

                const filtered = rolesData.filter(r => {
                    const normalizedName = normalize(r.name);
                    // Exclude 'Super Admin' explicitly AND the current user's role
                    return normalizedName !== 'super admin' && normalizedName !== normalizedCurrentRole;
                });
                setRoles(filtered);
            } else {
                setRoles(rolesData);
            }

        } catch (error) {
            console.error("Error fetching users:", error);
            toast({
                title: 'Error',
                description: 'Failed to fetch users or roles',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };


    const handleCreateUser = async (userData) => {
        try {
            await createUser(userData);
            toast({
                title: 'Success',
                description: 'User created successfully',
                variant: 'success',
            });
            setIsModalOpen(false);
            fetchData(); // Refresh list
        } catch (error) {
            console.error("Error creating user:", error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to create user',
                variant: 'destructive',
            });
            throw error;
        }
    };

    const handleUpdateUser = async (userId, userData) => {
        try {
            await updateUser(userId, userData);
            toast({
                title: 'Success',
                description: 'User updated successfully',
                variant: 'success',
            });
            setIsModalOpen(false);
            setEditingUser(null);
            fetchData(); // Refresh list
        } catch (error) {
            console.error("Error updating user:", error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update user',
                variant: 'destructive',
            });
            throw error;
        }
    };

    // Actions State
    const [activeActionId, setActiveActionId] = useState(null);

    const handleEditUser = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDeleteUser = async (userId) => {
        try {
            // Soft delete: Update is_deleted flag instead of hard DELETE
            await updateUser(userId, { is_deleted: true });
            toast({ title: 'Success', description: 'User deleted successfully', variant: 'success' });
            fetchData();
        } catch (error) {
            console.error("Error deleting user:", error);
            toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
        }
    };

    const getRoleName = (roleId) => {
        if (!roleId) return 'N/A';
        // Handle both string and number roleId
        const foundRole = allRoles.find(r => r.id === roleId || r.id === parseInt(roleId));
        return foundRole ? foundRole.name : 'Unknown';
    };



    if (loading) {
        return (
            <div className="loader-wrapper bg-gray-50/50">
                <span className="loader mb-4"></span>
                <p className="mt-4 text-sm font-bold text-gray-500 uppercase tracking-widest animate-pulse">Syncing user database...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage system users and their roles</p>
                </div>
                <button
                    onClick={() => {
                        setEditingUser(null);
                        setIsModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 shadow-primary/20 shadow-lg"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Optional: Add search/filters here later */}

                <div className="overflow-visible min-h-[400px]">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-500">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <User className="h-8 w-8 text-gray-300" />
                                            <p>No users found. Create one to get started.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentUsers.map((user, index) => {
                                    const isLastItems = index >= currentUsers.length - 2;
                                    return (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center text-primary font-bold text-sm ring-2 ring-white shadow-sm border border-primary-100">
                                                            {(user.username || user.full_name || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{user.username || user.full_name || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Mail className="mr-2 h-3.5 w-3.5 text-gray-400" />
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                    {getRoleName(user.roleId || user.role?.id || user.role)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                                                <button
                                                    onClick={() => setActiveActionId(activeActionId === user.id ? null : user.id)}
                                                    className="text-gray-400 hover:text-primary transition-colors p-1 rounded-full hover:bg-primary-50 focus:outline-none"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>

                                                {/* Actions Dropdown */}
                                                {activeActionId === user.id && (
                                                    <div className={`absolute right-0 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-100 animate-in fade-in zoom-in duration-200 ${isLastItems ? 'bottom-full mb-2 origin-bottom-right' : 'mt-2 origin-top-right'}`}>
                                                        <div className="py-1">
                                                            <button
                                                                onClick={() => {
                                                                    handleEditUser(user);
                                                                    setActiveActionId(null);
                                                                }}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                                                            >
                                                                <Edit size={14} className="mr-2" />
                                                                Edit User
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                                                                        handleDeleteUser(user.id);
                                                                    }
                                                                    setActiveActionId(null);
                                                                }}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                            >
                                                                <Trash2 size={14} className="mr-2" />
                                                                Delete User
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Overlay to close dropdown when clicking outside */}
                                                {activeActionId === user.id && (
                                                    <div
                                                        className="fixed inset-0 z-40 bg-transparent"
                                                        onClick={() => setActiveActionId(null)}
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {users.length > 0 && (
                    <Pagination
                        page={currentPage - 1}
                        pageSize={pageSize}
                        total={users.length}
                        onPageChange={(p) => setCurrentPage(p + 1)}
                        onPageSizeChange={(s) => {
                            setPageSize(s);
                            setCurrentPage(1);
                        }}
                    />
                )}
            </div>

            <CreateUserModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingUser(null);
                }}
                onUserCreated={handleCreateUser}
                onUserUpdated={handleUpdateUser}
                roles={roles}
                user={editingUser}
            />
        </div >
    );
};

export default UsersPage;
