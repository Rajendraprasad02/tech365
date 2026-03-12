import React, { useState, useEffect } from 'react';
import { 
    Users, 
    UserCheck, 
    Shield, 
    Lock, 
    Contact, 
    MessageSquare, 
    Clock, 
    Zap, 
    Activity, 
    Bell, 
    FileText 
} from 'lucide-react';
import { getSystemMetrics } from '@/services/api';

const MetricCard = ({ title, value, icon: Icon, color, loading }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
                {loading ? (
                    <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-lg mt-1"></div>
                ) : (
                    <h3 className="text-2xl font-bold text-gray-900">{value?.toLocaleString() || '0'}</h3>
                )}
            </div>
            <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
                <Icon size={20} className={color.replace('bg-', 'text-')} />
            </div>
        </div>
    </div>
);

const SectionHeader = ({ title, subtitle }) => (
    <div className="mb-6">
        <h2 className="text-lg font-bold text-[#14137F]">{title}</h2>
        <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
);

export default function SuperAdminDashboard() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMetrics();
        // Refresh every 30 seconds as requested
        const interval = setInterval(fetchMetrics, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchMetrics = async () => {
        try {
            const data = await getSystemMetrics();
            setMetrics(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching system metrics:', err);
            setError('Failed to load system metrics');
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 max-w-md">
                    <Shield className="mx-auto mb-3 opacity-50" size={40} />
                    <h3 className="font-bold text-lg mb-1">Monitoring Unavailable</h3>
                    <p className="text-sm opacity-80">{error}</p>
                    <button 
                        onClick={() => { setLoading(true); fetchMetrics(); }}
                        className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#F8F9FF] overflow-y-auto custom-scrollbar">
            <div className="p-8 max-w-7xl mx-auto w-full">
                <div className="mb-10">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">System Monitor</h1>
                    <p className="text-sm text-gray-500 mt-1">Platform-wide health and usage overview (Read-only)</p>
                </div>

                {/* Section 1 - System Overview */}
                <div className="mb-12">
                    <SectionHeader 
                        title="System Overview" 
                        subtitle="User management and access control metrics" 
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MetricCard 
                            title="Total Users" 
                            value={metrics?.totalUsers} 
                            icon={Users} 
                            color="bg-blue-500" 
                            loading={loading}
                        />
                        <MetricCard 
                            title="Active Users" 
                            value={metrics?.activeUsers} 
                            icon={UserCheck} 
                            color="bg-emerald-500" 
                            loading={loading}
                        />
                        <MetricCard 
                            title="Total Roles" 
                            value={metrics?.totalRoles} 
                            icon={Shield} 
                            color="bg-violet-500" 
                            loading={loading}
                        />
                        <MetricCard 
                            title="Total Permissions" 
                            value={metrics?.totalPermissions} 
                            icon={Lock} 
                            color="bg-amber-500" 
                            loading={loading}
                        />
                    </div>
                </div>

                {/* Section 2 - Platform Usage */}
                <div className="mb-12">
                    <SectionHeader 
                        title="Platform Usage" 
                        subtitle="Aggregated business and conversation metrics" 
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MetricCard 
                            title="Total Contacts" 
                            value={metrics?.totalContacts} 
                            icon={Contact} 
                            color="bg-indigo-500" 
                            loading={loading}
                        />
                        <MetricCard 
                            title="Total Conversations" 
                            value={metrics?.totalConversations} 
                            icon={MessageSquare} 
                            color="bg-sky-500" 
                            loading={loading}
                        />
                        <MetricCard 
                            title="Pending" 
                            value={metrics?.pendingConversations} 
                            icon={Clock} 
                            color="bg-rose-500" 
                            loading={loading}
                        />
                        <MetricCard 
                            title="Total Campaigns" 
                            value={metrics?.totalCampaigns} 
                            icon={Zap} 
                            color="bg-purple-500" 
                            loading={loading}
                        />
                    </div>
                </div>

                {/* Section 3 - System Health */}
                <div className="mb-12">
                    <SectionHeader 
                        title="System Health" 
                        subtitle="Real-time connectivity and activity logs" 
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
                        <MetricCard 
                            title="Active WebSockets" 
                            value={metrics?.activeWebSockets} 
                            icon={Activity} 
                            color="bg-cyan-500" 
                            loading={loading}
                        />
                        <MetricCard 
                            title="Notifications Today" 
                            value={metrics?.notificationsToday} 
                            icon={Bell} 
                            color="bg-orange-500" 
                            loading={loading}
                        />
                        <MetricCard 
                            title="Audit Logs Today" 
                            value={metrics?.auditLogsToday} 
                            icon={FileText} 
                            color="bg-gray-500" 
                            loading={loading}
                        />
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    <div>Data refreshes every 30 seconds</div>
                    <div>System Monitoring • v1.0.0</div>
                </div>
            </div>
        </div>
    );
}
