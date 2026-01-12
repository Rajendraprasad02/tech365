import { useState, useEffect, useCallback } from 'react';
import { getSessions, getWhatsAppConversations, getWhatsAppCosts } from '../services/api';

// Helper to group sessions by date for chart data
function groupSessionsByDay(sessions) {
    if (!Array.isArray(sessions) || sessions.length === 0) {
        return [
            { name: 'Mon', thisWeek: 0, lastWeek: 0 },
            { name: 'Tue', thisWeek: 0, lastWeek: 0 },
            { name: 'Wed', thisWeek: 0, lastWeek: 0 },
            { name: 'Thu', thisWeek: 0, lastWeek: 0 },
            { name: 'Fri', thisWeek: 0, lastWeek: 0 },
            { name: 'Sat', thisWeek: 0, lastWeek: 0 },
            { name: 'Sun', thisWeek: 0, lastWeek: 0 },
        ];
    }

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const thisWeek = {};
    const lastWeek = {};

    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    days.forEach(day => {
        thisWeek[day] = 0;
        lastWeek[day] = 0;
    });

    sessions.forEach(session => {
        const sessionDate = new Date(session.created_at);
        const dayName = days[sessionDate.getDay()];

        if (sessionDate >= startOfThisWeek) {
            thisWeek[dayName] += session.message_count || 1;
        } else if (sessionDate >= startOfLastWeek) {
            lastWeek[dayName] += session.message_count || 1;
        }
    });

    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
        name: day,
        thisWeek: thisWeek[day],
        lastWeek: lastWeek[day],
    }));
}

// Helper to group messages by hour
function groupMessagesByHour(sessions) {
    const hours = ['6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM'];
    const hourlyData = {};

    hours.forEach(hour => {
        hourlyData[hour] = 0;
    });

    if (!Array.isArray(sessions)) {
        return hours.map(time => ({ time, messages: 0 }));
    }

    sessions.forEach(session => {
        const sessionDate = new Date(session.created_at);
        const hour = sessionDate.getHours();

        let slot;
        if (hour >= 6 && hour < 8) slot = '6AM';
        else if (hour >= 8 && hour < 10) slot = '8AM';
        else if (hour >= 10 && hour < 12) slot = '10AM';
        else if (hour >= 12 && hour < 14) slot = '12PM';
        else if (hour >= 14 && hour < 16) slot = '2PM';
        else if (hour >= 16 && hour < 18) slot = '4PM';
        else if (hour >= 18 && hour < 20) slot = '6PM';
        else if (hour >= 20 && hour < 22) slot = '8PM';
        else if (hour >= 22) slot = '10PM';

        if (slot) {
            hourlyData[slot] += session.message_count || 1;
        }
    });

    return hours.map(time => ({
        time,
        messages: hourlyData[time],
    }));
}

// Helper to calculate average response time from conversations
function calculateAvgResponseTime(sessions) {
    if (!Array.isArray(sessions) || sessions.length === 0) {
        return { value: '0s', seconds: 0 };
    }

    let totalResponseTime = 0;
    let responseCount = 0;

    sessions.forEach(session => {
        const conversation = session.conversation || [];

        for (let i = 0; i < conversation.length - 1; i++) {
            const current = conversation[i];
            const next = conversation[i + 1];

            // Look for in → out pairs (user message followed by bot response)
            if (current.direction === 'in' && next.direction === 'out') {
                const inTime = new Date(current.timestamp);
                const outTime = new Date(next.timestamp);
                const diffMs = outTime - inTime;

                // Only count valid positive differences (max 5 minutes)
                if (diffMs > 0 && diffMs < 300000) {
                    totalResponseTime += diffMs;
                    responseCount++;
                }
            }
        }
    });

    if (responseCount === 0) {
        return { value: '0s', seconds: 0 };
    }

    const avgMs = totalResponseTime / responseCount;
    const avgSeconds = avgMs / 1000;

    if (avgSeconds < 60) {
        return { value: `${avgSeconds.toFixed(1)}s`, seconds: avgSeconds };
    } else {
        const minutes = Math.floor(avgSeconds / 60);
        const secs = Math.round(avgSeconds % 60);
        return { value: `${minutes}m ${secs}s`, seconds: avgSeconds };
    }
}

// Custom hook for dashboard data
export function useDashboardData() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        llmCost: { inr: '₹0.00', usd: '$0.00' },
        whatsappCost: { inr: '₹0.00', total: '$0.00' },
        walletBalance: { inr: '₹2,450.00', messages: '~12,250 messages' },
        totalConversations: { value: '0', comparison: '', trend: '+0%', trendUp: true },
        activeUsers: { value: '0', comparison: '', trend: '+0%', trendUp: true },
        costPerConversation: { value: '$0.00', trend: '+0%', trendUp: false },
        avgResponseTime: { value: '0s', trend: '+0%', trendUp: true },
        conversationVolumeData: [],
        hourlyActivityData: [],
        recentConversations: [],
    });

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [sessionsRes, conversationsRes, costsRes] = await Promise.allSettled([
                getSessions(),
                getWhatsAppConversations(),
                getWhatsAppCosts(),
            ]);

            // Handle sessions - could be array directly or { sessions: [...] }
            let sessions = [];
            if (sessionsRes.status === 'fulfilled') {
                const sessionsData = sessionsRes.value;
                sessions = Array.isArray(sessionsData) ? sessionsData : (sessionsData?.sessions || []);
            }

            // Handle conversations - API returns { conversations: { phone: [...] }, total_users: n }
            let activeUserCount = 0;
            if (conversationsRes.status === 'fulfilled') {
                const convData = conversationsRes.value;
                activeUserCount = convData?.total_users || 0;

                // If total_users not provided, count keys of conversations object
                if (!activeUserCount && convData?.conversations) {
                    activeUserCount = Object.keys(convData.conversations).length;
                }
            }

            // Handle costs
            const costs = costsRes.status === 'fulfilled' ? costsRes.value : null;
            const llmCostUsd = costs?.llm_cost_usd || costs?.total_llm_cost || 0;
            const llmCostInr = costs?.llm_cost_inr || (llmCostUsd * 83);
            const whatsappCostUsd = costs?.whatsapp_cost || costs?.total_cost_usd || 0;
            const whatsappCostInr = costs?.whatsapp_cost_inr || costs?.total_cost_inr || (whatsappCostUsd * 83);
            const totalCost = llmCostUsd + whatsappCostUsd;

            const totalConversations = sessions.length;
            const costPerConv = totalConversations > 0 ? totalCost / totalConversations : 0;

            // Chart data
            const conversationVolumeData = groupSessionsByDay(sessions);
            const hourlyActivityData = groupMessagesByHour(sessions);

            // Calculate average response time
            const avgResponseTime = calculateAvgResponseTime(sessions);

            // Recent conversations
            const recentConversations = sessions
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 4)
                .map((session, index) => ({
                    name: session.user_name || session.name || `User ${index + 1}`,
                    status: session.status || 'active',
                    message: session.last_message || session.messages?.[session.messages.length - 1]?.content || 'No messages',
                    time: formatTimeAgo(session.created_at),
                    count: `${session.message_count || session.messages?.length || 0} messages`,
                    color: ['#10b981', '#f59e0b', '#6366f1', '#ec4899'][index % 4],
                }));

            setData({
                llmCost: {
                    inr: `₹${llmCostInr.toFixed(2)}`,
                    usd: `$${llmCostUsd.toFixed(4)} USD`,
                },
                whatsappCost: {
                    inr: `₹${whatsappCostInr.toFixed(2)}`,
                    total: `Total: $${totalCost.toFixed(4)}`,
                },
                walletBalance: { inr: '₹2,450.00', messages: '~12,250 messages' },
                totalConversations: {
                    value: totalConversations.toLocaleString(),
                    comparison: '',
                    trend: '+14.1%',
                    trendUp: true,
                },
                activeUsers: {
                    value: activeUserCount.toString(),
                    comparison: '',
                    trend: '+14.8%',
                    trendUp: true,
                },
                costPerConversation: {
                    value: `$${costPerConv.toFixed(4)}`,
                    trend: '↓12.5%',
                    trendUp: false,
                },
                avgResponseTime: {
                    value: avgResponseTime.value,
                    trend: '↓8.2%',
                    trendUp: true,
                },
                conversationVolumeData,
                hourlyActivityData,
                recentConversations,
            });

        } catch (err) {
            console.error('Dashboard data fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return { data, loading, error, refetch: fetchDashboardData };
}

function formatTimeAgo(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export default useDashboardData;
