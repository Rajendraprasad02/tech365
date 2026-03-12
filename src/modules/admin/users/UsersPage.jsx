import React, { useState, useEffect } from 'react';
import { Plus, User, Mail, MoreVertical, Edit, Trash2, Search } from 'lucide-react';
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
    const { user: currentUserProfile, role: currentRole } = useSelector(selectAuth);
    const currentUserId = currentUserProfile?.id;

    // Editing State
    const [editingUser, setEditingUser] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Filtered Users Logic
    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' ||
            (user.roleId?.toString() === roleFilter) ||
            (user.role?.id?.toString() === roleFilter);
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' ? user.isActive : !user.isActive);
        return matchesSearch && matchesRole && matchesStatus;
    });

    const indexOfLastItem = currentPage * pageSize;
    const indexOfFirstItem = indexOfLastItem - pageSize;
    const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / pageSize);

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

            if (Array.isArray(usersData)) {
                const activeUsers = usersData.filter(u => !u.is_deleted);
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
                    // System-managed filtering should happen on backend
                    // Frontend just shows available roles
                    return true;
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
            // Ensure we handle both single-field updates and full object updates
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
        if (userId === currentUserId) {
            toast({ title: 'Error', description: 'You cannot delete your own account.', variant: 'destructive' });
            return;
        }
        try {
            await deleteUser(userId);
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

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[240px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>
                <div className="flex gap-4">
                    <select
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="all">All Roles</option>
                        {allRoles.map(r => (
                            <option key={r.id} value={r.id.toString()}>{r.name}</option>
                        ))}
                    </select>
                    <select
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
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
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Status
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
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.role?.name?.toLowerCase().includes('agent') ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                                    {user.role?.name || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                    {user.isActive ? 'Active' : 'Inactive'}
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
                                                                disabled={user.id === currentUserId}
                                                                onClick={() => {
                                                                    handleDeleteUser(user.id);
                                                                    setActiveActionId(null);
                                                                }}
                                                                className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${user.id === currentUserId ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                                                            >
                                                                <Trash2 size={14} className="mr-2" />
                                                                Delete User (Soft)
                                                            </button>
                                                            <button
                                                                disabled={user.id === currentUserId}
                                                                onClick={() => {
                                                                    handleUpdateUser(user.id, { isActive: !user.isActive });
                                                                    setActiveActionId(null);
                                                                }}
                                                                className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${user.id === currentUserId ? 'text-gray-300 cursor-not-allowed' : user.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                                                            >
                                                                {user.isActive ? (
                                                                    <>
                                                                        <XCircle size={14} className="mr-2" />
                                                                        Deactivate Account
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle size={14} className="mr-2" />
                                                                        Activate Account
                                                                    </>
                                                                )}
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
                        total={filteredUsers.length}
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
