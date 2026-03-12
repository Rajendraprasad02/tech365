import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    MessageSquare,
    Zap,
    Users,
    Shield,
    Eye,
    EyeOff,
    Loader2
} from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    // State
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form Data
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false,
        otp: ''
    });

    const [authMode, setAuthMode] = useState('login'); // 'login' | 'forgot-password' | 'enter-otp' | 'reset-password'
    const { toast } = useToast();

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
        setLoading(true);

        try {
            if (authMode === 'login') {
                // Login Flow
                const success = await login(formData.email, formData.password);
                if (success) {
                    navigate(from, { replace: true });
                } else {
                    setError('Invalid email or password');
                }
            } else if (authMode === 'forgot-password') {
                await api.forgotPassword(formData.email);
                toast({ title: "OTP Sent", description: "If your email is registered, we have sent a 6-digit OTP.", variant: "success" });
                setAuthMode('enter-otp');
                setFormData(prev => ({ ...prev, password: '', confirmPassword: '', otp: '' }));
            } else if (authMode === 'enter-otp') {
                await api.verifyOtp(formData.email, formData.otp);
                toast({ title: "Verified", description: "OTP verified successfully. Please set your new password.", variant: "success" });
                setAuthMode('reset-password');
                setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            } else if (authMode === 'reset-password') {
                if (formData.password !== formData.confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                await api.resetPassword(formData.email, formData.otp, formData.password);
                toast({ title: "Success", description: "Password reset successful! Please log in with your new password.", variant: "success" });
                setAuthMode('login');
                setFormData(prev => ({ ...prev, password: '', confirmPassword: '', otp: '' }));
            }
        } catch (err) {
            setError(err.message || 'Authentication failed');
            toast({ title: "Error", description: err.message || 'Authentication failed', variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const FeatureItem = ({ icon: Icon, title, desc }) => (
        <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <div className={`p-3 rounded-lg h-fit bg-blue-500/20`}>
                <Icon className="text-blue-400" size={24} />
            </div>
            <div>
                <h3 className="font-semibold text-white mb-1">{title}</h3>
                <p className="text-gray-400 text-sm">{desc}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex bg-white font-sans">
            {/* Left Panel - Dark Branding */}
            <div className="hidden lg:flex w-1/2 bg-[#0F172A] relative overflow-hidden flex-col p-12 justify-between">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-16">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/40">
                            C
                        </div>
                        <div>
                            <div className="text-white font-bold text-xl tracking-tight">ChatFlow</div>
                            <div className="text-gray-400 text-xs font-medium uppercase tracking-wide">Enterprise CRM</div>
                        </div>
                    </div>

                    <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                        Connect with your customers
                    </h1>
                    <p className="text-lg text-gray-400 mb-12 max-w-md">
                        Streamline your WhatsApp communications with powerful automation and team collaboration tools.
                    </p>

                    <div className="space-y-4 max-w-lg">
                        <FeatureItem
                            icon={MessageSquare}
                            title="Bulk Messaging"
                            desc="Send personalized messages to thousands of contacts instantly"
                        />
                        <FeatureItem
                            icon={Zap}
                            title="Instant Automation"
                            desc="Automate responses and workflows with smart triggers"
                        />
                        <FeatureItem
                            icon={Users}
                            title="Team Inbox"
                            desc="Collaborate with your team on customer conversations"
                        />
                        <FeatureItem
                            icon={Shield}
                            title="End-to-End Secure"
                            desc="Enterprise-grade security with WhatsApp Business API"
                        />
                    </div>
                </div>

                <div className="text-gray-500 text-sm relative z-10 mt-12">
                    © 2026 ChatFlow Inc. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Auth Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">C</div>
                        <div className="text-gray-900 font-bold text-lg">ChatFlow</div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {authMode === 'login' && 'Welcome back'}
                            {authMode === 'forgot-password' && 'Reset Password'}
                            {authMode === 'enter-otp' && 'Verify OTP'}
                            {authMode === 'reset-password' && 'New Password'}
                        </h2>
                        <p className="mt-2 text-sm text-gray-500">
                            {authMode === 'login' && 'Enter your credentials to access your account'}
                            {authMode === 'forgot-password' && 'Enter your email to receive a password reset OTP'}
                            {authMode === 'enter-otp' && 'Enter the 6-digit code sent to your email'}
                            {authMode === 'reset-password' && 'Create a new secure password for your account'}
                        </p>
                    </div>

                    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Work Email</label>
                            <input
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                disabled={authMode === 'enter-otp' || authMode === 'reset-password'}
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none ${ (authMode === 'enter-otp' || authMode === 'reset-password') ? 'opacity-50 cursor-not-allowed' : '' }`}
                                placeholder="john@company.com"
                            />
                        </div>

                        {(authMode === 'login' || authMode === 'reset-password') && (
                            <div className="animate-in slide-in-from-top-2">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        {authMode === 'reset-password' ? 'New Password' : 'Password'}
                                    </label>
                                    {authMode === 'login' && (
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setAuthMode('forgot-password');
                                                setFormData(prev => ({ ...prev, password: '', confirmPassword: '', otp: '' }));
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Forgot password?
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete={authMode === 'login' ? "current-password" : "new-password"}
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none"
                                        placeholder={authMode === 'reset-password' ? "Enter new password" : "Enter your password"}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {authMode === 'enter-otp' && (
                            <div className="animate-in slide-in-from-top-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">OTP Code</label>
                                <input
                                    name="otp"
                                    type="text"
                                    required
                                    value={formData.otp}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none text-center font-bold tracking-[0.5em] text-lg"
                                    placeholder="000000"
                                    maxLength={6}
                                />
                                <p className="mt-1 text-[10px] text-gray-400 text-center">Enter the 6-digit code sent to your email</p>
                            </div>
                        )}



                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center font-medium animate-in fade-in">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                authMode === 'login' ? 'Sign In' : (authMode === 'forgot-password' ? 'Send OTP' : (authMode === 'enter-otp' ? 'Verify OTP' : 'Reset Password'))
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-500">
                            {authMode !== 'login' ? (
                                <button
                                    onClick={() => {
                                        setAuthMode('login');
                                        setError('');
                                        setFormData(prev => ({ ...prev, password: '', confirmPassword: '', otp: '' })); 
                                    }}
                                    className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors"
                                >
                                    Back to sign in
                                </button>
                            ) : (
                                <span className="opacity-0">Placeholder</span>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
