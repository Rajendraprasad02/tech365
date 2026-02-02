import { useState, useEffect, useMemo } from 'react';
import {
    Shield, Plus, Edit2, Trash2, X, Lock, CheckCircle, Search, Info
} from 'lucide-react';
import {
    getRoles,
    createRole,
    updateRole,
    deleteRole,
    seedDatabase,
    getMenuCreator
} from '../../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/context/ToastContext';

const ACTIONS = [
    { key: 'read', label: 'View', color: 'blue' },
    { key: 'create', label: 'Create', color: 'green' },
    { key: 'update', label: 'Edit', color: 'amber' },
    { key: 'delete', label: 'Delete', color: 'red' },
    { key: 'approve', label: 'Approve', color: 'purple' }
];

export default function RoleManagementPage() {
    const { toast } = useToast();

    // State
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isAgent: false,
        permissions: {} // { screenId: { read: bool, create: bool... } }
    });

    // Hardcoded menu structure for matrix (since we need to know what screens exist)
    // In a real app, fetch this from /menu-creator or pass as prop
    // Screens state
    const [systemScreens, setSystemScreens] = useState([]);

    // Fetch Data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [rolesData, menuData] = await Promise.all([
                getRoles(),
                getMenuCreator()
            ]);
            setRoles(rolesData || []);

            // Transform menuData into flat screens list for matrix
            const screens = [];
            if (Array.isArray(menuData)) {
                menuData.forEach(mod => {
                    if (mod.screens) {
                        mod.screens.forEach(scr => {
                            screens.push({
                                id: scr.route, // Keep route as key for state if needed, or switch to ID
                                realId: scr.id || scr.screenId,
                                label: scr.name,
                                module: mod.name
                            });
                        });
                    }
                });
            }
            setSystemScreens(screens);
        } catch (error) {
            console.error("Failed to fetch roles:", error);
            toast({ title: "Error", description: "Failed to fetch roles", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSeed = async () => {
        try {
            await seedDatabase();
            toast({ title: "Success", description: "Database seeded successfully", variant: "success" });
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "Seed failed", variant: "destructive" });
        }
    }

    const handleSave = async () => {
        if (!formData.name) {
            toast({ title: "Validation Error", description: "Role name is required", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            // Transform permissions for backend
            // Backend expects: [{ screenId: 1, actionIds: ["1"] }]

            // Map action keys to IDs (assuming standard mapping or fetch from API)
            // For now, mapping 'read'->1, 'create'->2, etc. based on seed logic
            const ACTION_MAP = {
                'read': '1',
                'create': '2',
                'update': '3',
                'delete': '4'
            };

            const permissionsPayload = Object.entries(formData.permissions).map(([screenRouteOrId, actions]) => {
                // We need to resolve screenRouteOrId to actual numerical ID if possible, 
                // but frontend currently uses route as ID in systemScreens.
                // However, backend DTO expects 'screenId' as number. 
                // We need to find the screen ID from systemScreens or menuData.

                // Find screen in systemScreens (which we populated from menuData)
                const screenObj = systemScreens.find(s => s.id === screenRouteOrId);
                // Note: systemScreens.id was set to scr.route in fetchData. 
                // We should probably change fetchData to store real ID.

                // Let's rely on finding it by route or assume it is ID if number.
                let realScreenId = screenObj?.realId;
                if (!realScreenId && !isNaN(parseInt(screenRouteOrId))) {
                    realScreenId = parseInt(screenRouteOrId);
                }

                if (!realScreenId) return null;

                const actionIds = Object.entries(actions)
                    .filter(([_, isSelected]) => isSelected)
                    .map(([key]) => ACTION_MAP[key])
                    .filter(Boolean);

                return {
                    screenId: realScreenId,
                    actionIds
                };
            }).filter(p => p && p.screenId && p.actionIds.length > 0);

            const payload = {
                name: formData.name,
                description: formData.description,
                isAgent: formData.isAgent,
                permissions: permissionsPayload
            };

            if (editingRole) {
                await updateRole(editingRole.id, payload);
                toast({ title: "Success", description: "Role updated successfully", variant: "success" });
            } else {
                await createRole(payload);
                toast({ title: "Success", description: "Role created successfully", variant: "success" });
            }
            setModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Error saving role:", error);
            toast({ title: "Error", description: "Failed to save role", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (roleId) => {
        if (!confirm("Are you sure you want to delete this role?")) return;
        try {
            await deleteRole(roleId);
            toast({ title: "Success", description: "Role deleted successfully", variant: "success" });
            fetchData();
        } catch (error) {
            console.error("Error deleting role:", error);
            toast({ title: "Error", description: "Failed to delete role", variant: "destructive" });
        }
    };

    const togglePermission = (screenId, actionKey) => {
        const currentScreenPerms = formData.permissions[screenId] || {};
        const isChecked = !!currentScreenPerms[actionKey];

        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [screenId]: {
                    ...currentScreenPerms,
                    [actionKey]: !isChecked
                }
            }
        }));
    };

    const filteredRoles = roles.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Stats
    const totalRoles = roles.length;
    const systemRoles = roles.filter(r => r.isSystem).length;
    const customRoles = totalRoles - systemRoles;

    return (
        <div className="flex-1 flex flex-col bg-gray-50 h-[calc(100vh-64px)] overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between shadow-sm z-10">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Role Permissions</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage role-based access control and permission assignments</p>
                </div>
                <div className="flex gap-3">

                    <Button
                        onClick={() => {
                            setEditingRole(null);
                            setFormData({ name: '', description: '', isAgent: false, permissions: {} });
                            setModalOpen(true);
                        }}
                        className="bg-primary hover:bg-primary-600 text-white gap-2 shadow-lg shadow-primary/20"
                    >
                        <Plus size={18} />
                        Create Role
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-gray-500 text-sm font-medium mb-1">Total Roles</div>
                            <div className="text-3xl font-bold text-gray-900">{totalRoles}</div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-gray-500 text-sm font-medium mb-1">System Roles</div>
                            <div className="text-3xl font-bold text-gray-900">{systemRoles}</div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-green-600 text-sm font-medium mb-1">Custom Roles</div>
                            <div className="text-3xl font-bold text-green-600">{customRoles}</div>
                        </div>
                    </div>
                </div>

                {/* Roles List */}
                <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Roles</h2>
                    </div>
                    {filteredRoles.map(role => (
                        <div key={role.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                            <div className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">{role.name}</h3>
                                            {role.isSystem && (
                                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                                                    System
                                                </span>
                                            )}
                                            {role.isAgent && (
                                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-xs font-medium border border-blue-200">
                                                    Agent Role
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">{role.description}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        setEditingRole(role);
                                        setFormData({
                                            name: role.name,
                                            description: role.description || '',
                                            isAgent: role.isAgent || false,
                                            permissions: role.permissions || {}
                                        });
                                        setModalOpen(true);
                                    }}>
                                        <Edit2 size={16} />
                                    </Button>
                                    {!role.isSystem && (
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(role.id)}>
                                            <Trash2 size={16} />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Area: Permission Matrix (Visual only, actual edit in modal) */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold">Permission Matrix</h2>
                        <p className="text-sm text-gray-500">Configure menu access permissions for Roles (Select a role to edit)</p>
                    </div>
                    {/* Placeholder for Matrix View if needed, or keep it inside Modal */}
                    <div className="p-12 text-center text-gray-400">
                        Click "Edit" on a role to configure permissions.
                    </div>
                </div>
            </div>

            {/* Edit/Create Modal */}
            {
                modalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col">
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {editingRole ? 'Edit Role' : 'Create New Role'}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {editingRole ? `Configure permissions for ${editingRole.name}` : 'Define a new role and its permissions'}
                                    </p>
                                </div>
                                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto p-6 space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                                        <Input
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Support Lead"
                                            disabled={editingRole?.isSystem}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <Input
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Role responsibilities..."
                                        />
                                    </div>
                                    <div className="flex items-center pt-6">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="isAgent"
                                                checked={formData.isAgent}
                                                onChange={e => setFormData({ ...formData, isAgent: e.target.checked })}
                                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            />
                                            <label htmlFor="isAgent" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                                                Treat as Agent Role
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Permission Matrix */}
                                <div className="border rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 font-medium text-gray-900">Menu Screen</th>
                                                {ACTIONS.map(action => (
                                                    <th key={action.key} className="px-6 py-4 font-medium text-gray-900 text-center w-24">
                                                        {action.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {systemScreens.map(screen => (
                                                <tr key={screen.id} className="hover:bg-gray-50/50">
                                                    <td className="px-6 py-4 font-medium text-gray-700">
                                                        {screen.label}
                                                    </td>
                                                    {ACTIONS.map(action => {
                                                        const isChecked = formData.permissions[screen.id]?.[action.key];
                                                        return (
                                                            <td key={`${screen.id}-${action.key}`} className="px-6 py-4 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked || false}
                                                                    onChange={() => togglePermission(screen.id, action.key)}
                                                                    className={`
                                                                    w-5 h-5 rounded border-gray-300 transition-colors cursor-pointer
                                                                    text-${action.color}-600 focus:ring-${action.color}-500
                                                                `}
                                                                />
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50/50">
                                <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-primary hover:bg-primary-600 text-white min-w-[120px]"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

function Database({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
        </svg>
    )
}
