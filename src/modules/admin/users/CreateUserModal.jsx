import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CreateUserModal = ({ isOpen, onClose, onUserCreated, onUserUpdated, roles = [], user = null }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        mobile: '',
        password: '',
        roleId: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                email: user.email || '',
                mobile: user.mobile || '',
                password: '', // Password empty on edit means "don't change"
                roleId: user.roleId || (user.role && user.role.id) || ''
            });
        } else {
            setFormData({
                username: '',
                email: '',
                mobile: '',
                password: '',
                roleId: ''
            });
        }
    }, [user, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Basic validation
        if (!formData.username || !formData.email || (!user && !formData.password) || !formData.roleId) {
            setError('All fields are required');
            return;
        }

        // Mobile validation (E.164 format: + followed by 1-15 digits)
        const mobileRegex = /^\+[1-9]\d{1,14}$/;
        if (formData.mobile && !mobileRegex.test(formData.mobile)) {
            setError('Valid mobile number with country code is required (e.g. +1234567890)');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                username: formData.username,
                email: formData.email,
                mobile: formData.mobile,
                roleId: parseInt(formData.roleId, 10)
            };

            // Only send password if provided (always required for create, optional for update)
            if (formData.password) {
                payload.password = formData.password;
            }

            if (user) {
                await onUserUpdated(user.id, payload);
            } else {
                await onUserCreated(payload);
            }

            // Reset form
            setFormData({
                username: '',
                email: '',
                mobile: '',
                password: '',
                roleId: ''
            });
            onClose();
        } catch (err) {
            console.error("Error saving user:", err);
            setError(err.message || 'Failed to save user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">{user ? 'Edit User' : 'Create New User'}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Username</label>
                        <Input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="johndoe"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                        <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john@example.com"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Mobile Number</label>
                        <Input
                            type="text"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleChange}
                            placeholder="+1234567890"
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-500">Include country code</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            {user ? 'Password (leave blank to keep current)' : 'Password'}
                        </label>
                        <Input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Role</label>
                        <select
                            name="roleId"
                            value={formData.roleId}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={loading}
                        >
                            <option value="">Select a role</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>
                                    {role.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="min-w-[120px]"
                        >
                            {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateUserModal;
