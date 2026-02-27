import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Phone, Shield, Lock, Clock, CheckCircle, Save, Eye, EyeOff, X } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import api from '@/services/api';

export default function ProfilePage() {
    const { user, role } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        mobile: '',
        role: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const fetchUserData = async () => {
            // Check both userId (from login) and id (from generic user objects)
            const uid = user?.userId || user?.id;

            if (!uid) {
                console.warn("[ProfilePage] No user ID found in session user:", user);
                // If we have a user but no ID, we might still want to stop loading
                if (user) setLoading(false);
                return;
            }

            try {
                setLoading(true);
                // Fetch full user data from backend
                const data = await api.getUserData(uid);
                setFormData({
                    fullName: data.username || user?.username || '',
                    email: data.email || user?.email || '',
                    mobile: data.mobile || '',
                    role: role?.name || user?.role?.name || 'User'
                });
            } catch (error) {
                console.error("[ProfilePage] Failed to fetch user data:", error);
                toast({
                    title: "Error",
                    description: "Failed to load profile details",
                    variant: "destructive"
                });
                // Fallback to basic info from session
                setFormData(prev => ({
                    ...prev,
                    fullName: user?.username || '',
                    email: user?.email || '',
                    role: role?.name || 'User'
                }));
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user, role, toast]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Backend API call to update profile
            const uid = user?.userId || user?.id;
            await api.updateUser(uid, {
                username: formData.fullName,
                email: formData.email,
                mobile: formData.mobile
            });
            toast({
                title: "Success",
                description: "Profile updated successfully",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to update profile",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
            toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
            return;
        }

        setPasswordSaving(true);
        try {
            // Using updateOnlyPassword which takes email and password
            await api.updateOnlyPassword({
                email: formData.email,
                password: passwordData.newPassword
            });
            toast({ title: "Success", description: "Password updated successfully" });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setIsPasswordModalOpen(false);
        } catch (error) {
            toast({ title: "Error", description: error.message || "Failed to update password", variant: "destructive" });
        } finally {
            setPasswordSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="loader-wrapper">
                <span className="loader"></span>
            </div>
        );
    }

    const initials = (formData.fullName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Header Area */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Profile</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>My Account</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-[#4f45e6] font-medium">Profile</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Avatar & Summary */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="h-24 bg-gradient-to-r from-[#14137F] to-[#4f45e6]"></div>
                            <div className="px-6 pb-8 -mt-12 text-center">
                                <div className="relative inline-block">
                                    <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg ring-4 ring-white">
                                        <div className="w-full h-full rounded-xl bg-indigo-50 flex items-center justify-center text-[#4f45e6] text-2xl font-bold">
                                            {initials}
                                        </div>
                                    </div>
                                </div>

                                <h2 className="mt-4 text-xl font-bold text-gray-900">{formData.fullName}</h2>
                                <p className="text-sm font-medium text-[#4f45e6] uppercase tracking-wider mt-1">{formData.role}</p>

                                <div className="mt-8 pt-8 border-t border-gray-50 space-y-4">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Mail size={16} className="text-gray-400" />
                                        <span>{formData.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Phone size={16} className="text-gray-400" />
                                        <span>{formData.mobile || 'No phone set'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Account Status</h3>
                            <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                <span className="text-sm text-gray-500">Member since</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 mt-2">
                                <span className="text-sm text-gray-500">Status</span>
                                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                    <CheckCircle size={12} />
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details & Settings */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Profile Details Form */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
                                <div className="flex items-center gap-2">
                                    <User size={18} className="text-[#4f45e6]" />
                                    <h3 className="font-bold text-gray-900">Profile Details</h3>
                                </div>
                            </div>
                            <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 ml-1">Full Name</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={formData.fullName}
                                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                className="w-full pl-4 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#4f45e6] focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                                placeholder="Enter full name"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#4f45e6] focus:ring-4 focus:ring-indigo-500/5 transition-all text-gray-500"
                                            placeholder="Enter email"
                                            disabled
                                        />
                                    </div>
                                    <div className="space-y-2 text-gray-400">
                                        <label className="text-sm font-semibold text-gray-700 ml-1">Phone Number</label>
                                        <input
                                            type="text"
                                            value={formData.mobile}
                                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#4f45e6] focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                            placeholder="Enter phone number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 ml-1">Role</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={formData.role}
                                                className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 outline-none cursor-not-allowed"
                                                disabled
                                            />
                                            <Shield size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4 border-t border-gray-50">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-[#4f45e6] text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-[#3d36b8] transition-all disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        ) : (
                                            <Save size={18} />
                                        )}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Security Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
                                <div className="flex items-center gap-2">
                                    <Lock size={18} className="text-[#4f45e6]" />
                                    <h3 className="font-bold text-gray-900">Security</h3>
                                </div>
                            </div>
                            <div className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Change Password</h4>
                                        <p className="text-sm text-gray-500 mt-1">Ensure your account is using a long, random password to stay secure.</p>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setIsPasswordModalOpen(true)}
                                            className="px-5 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all">
                                            Update Password
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Session History */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden font-mono">
                            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                                <div className="flex items-center gap-2 font-sans">
                                    <Clock size={18} className="text-[#4f45e6]" />
                                    <h3 className="font-bold text-gray-900">Recent Login Activity</h3>
                                </div>
                            </div>
                            <div className="overflow-x-auto font-sans">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50/50">
                                            <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Browser / OS</th>
                                            <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">IP Address</th>
                                            <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-gray-50">
                                        <tr>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">Chrome on Window 11</div>
                                                <div className="text-xs text-[#4f45e6] font-bold mt-0.5 uppercase tracking-tighter">Current Session</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">182.72.112.234</td>
                                            <td className="px-6 py-4 text-gray-500">Just now</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 text-gray-900 font-medium">Firefox on macOS</td>
                                            <td className="px-6 py-4 text-gray-600">102.11.45.19</td>
                                            <td className="px-6 py-4 text-gray-500">2 days ago</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Update Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                        <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Lock size={20} className="text-[#4f45e6]" />
                                <h3 className="font-bold text-gray-900">Change Password</h3>
                            </div>
                            <button
                                onClick={() => setIsPasswordModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdatePassword} className="p-8 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 ml-1">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-[#4f45e6] focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                        placeholder="Minimum 6 characters"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 ml-1">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-[#4f45e6] focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                        placeholder="Repeat new password"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={passwordSaving}
                                    className="flex-1 py-3 bg-[#4f45e6] text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 hover:bg-[#3d36b8] transition-all disabled:opacity-50">
                                    {passwordSaving ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span>
                                    ) : (
                                        'Update & Save'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
