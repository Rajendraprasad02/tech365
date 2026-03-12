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

    const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot-password' | 'verify-otp'

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
            } else if (authMode === 'register') {
                // Register Flow
                if (formData.password !== formData.confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                if (!formData.agreeToTerms) {
                    throw new Error("You must agree to the Terms of Service");
                }

                await api.createAppUser({
                    username: formData.email.split('@')[0], // Generate simplistic username
                    email: formData.email,
                    password: formData.password
                });

                // On success, switch to login or auto-login
                alert("Account created successfully! Please sign in.");
                setAuthMode('login');
            } else if (authMode === 'forgot-password') {
                await api.forgotPassword(formData.email);
                alert("If your email is registered, we have sent a 6-digit OTP.");
                setAuthMode('verify-otp');
            } else if (authMode === 'verify-otp') {
                if (formData.password !== formData.confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                await api.resetPassword(formData.email, formData.otp, formData.password);
                alert("Password reset successful! Please log in with your new password.");
                setAuthMode('login');
            }
        } catch (err) {
            setError(err.message || 'Authentication failed');
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
                            {authMode === 'register' && 'Create an account'}
                            {authMode === 'forgot-password' && 'Reset Password'}
                            {authMode === 'verify-otp' && 'Verify OTP'}
                        </h2>
                        <p className="mt-2 text-sm text-gray-500">
                            {authMode === 'login' && 'Enter your credentials to access your account'}
                            {authMode === 'register' && 'Get started with your WhatsApp Business integration'}
                            {authMode === 'forgot-password' && 'Enter your email to receive a password reset OTP'}
                            {authMode === 'verify-otp' && 'Enter the OTP sent to your email and your new password'}
                        </p>
                    </div>

                    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                        {/* Registration Extra Fields */}
                        {authMode === 'register' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    name="fullName"
                                    type="text"
                                    autoComplete="name"
                                    required={authMode === 'register'}
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none"
                                    placeholder="John Doe"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Work Email</label>
                            <input
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none"
                                placeholder="john@company.com"
                            />
                        </div>

                        {authMode !== 'forgot-password' && (
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        {authMode === 'verify-otp' ? 'New Password' : 'Password'}
                                    </label>
                                    {authMode === 'login' && (
                                        <button 
                                            type="button" 
                                            onClick={() => setAuthMode('forgot-password')}
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
                                        required={authMode !== 'forgot-password'}
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none"
                                        placeholder={authMode === 'register' ? "Create a strong password" : (authMode === 'verify-otp' ? "Enter new password" : "Enter your password")}
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

                        {authMode === 'verify-otp' && (
                            <div className="animate-in slide-in-from-top-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">OTP Code</label>
                                <input
                                    name="otp"
                                    type="text"
                                    required={authMode === 'verify-otp'}
                                    value={formData.otp}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none text-center font-bold tracking-[0.5em] text-lg"
                                    placeholder="000000"
                                    maxLength={6}
                                />
                                <p className="mt-1 text-[10px] text-gray-400 text-center">Enter the 6-digit code sent to your email</p>
                            </div>
                        )}

                        {(authMode === 'register' || authMode === 'verify-otp') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {authMode === 'verify-otp' ? 'Confirm New Password' : 'Confirm Password'}
                                </label>
                                <input
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    required={authMode === 'register' || authMode === 'verify-otp'}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none"
                                    placeholder="Confirm your password"
                                />
                            </div>
                        )}

                        {/* Terms / Remember Me */}
                        <div className="flex items-center">
                            {authMode === 'login' ? (
                                <>
                                    <input
                                        key="remember-me"
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-500">
                                        Remember me for 30 days
                                    </label>
                                </>
                            ) : authMode === 'register' ? (
                                <>
                                    <input
                                        key="agree-terms"
                                        id="agree-terms"
                                        name="agreeToTerms"
                                        type="checkbox"
                                        required
                                        checked={formData.agreeToTerms}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-500">
                                        I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                                    </label>
                                </>
                            ) : null}
                        </div>

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
                                <span className="loader-sm"></span>
                            ) : (
                                authMode === 'login' ? 'Sign In' : (authMode === 'register' ? 'Create Account' : (authMode === 'forgot-password' ? 'Send OTP' : 'Reset Password'))
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-500">
                            {authMode === 'login' ? "Don't have an account?" : "Back to"}{' '}
                            <button
                                onClick={() => {
                                    if (authMode === 'login') setAuthMode('register');
                                    else setAuthMode('login');
                                    setError('');
                                    setFormData(prev => ({ ...prev, password: '', confirmPassword: '', otp: '' })); 
                                }}
                                className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors"
                            >
                                {authMode === 'login' ? 'Create an account' : 'Sign in'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
