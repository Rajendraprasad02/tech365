import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getSessions, getWhatsAppConversations, getWhatsAppDashboardStats, getUsers, getContacts } from '../services/api';
import { calculateCostFromMessages, WHATSAPP_COSTS } from '../config/whatsappCosts';

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

// Helper to calculate average conversation time (from assignment to closure)
function calculateAvgResponseTime(sessions) {
    if (!Array.isArray(sessions) || sessions.length === 0) {
        return { value: '0s', seconds: 0 };
    }

    let totalDuration = 0;
    let closedCount = 0;

    sessions.forEach(session => {
        // Use assigned_at and closed_at as per user request
        if (session.assigned_at && (session.closed_at || session.status === 'closed' || session.status === 'resolved')) {
            const startTime = new Date(session.assigned_at);
            const endTime = session.closed_at ? new Date(session.closed_at) : new Date(); // Fallback if not strictly closed_at but status is closed
            
            const diffMs = endTime - startTime;

            // Only count valid positive differences
            if (diffMs > 0) {
                totalDuration += diffMs;
                closedCount++;
            }
        }
    });

    if (closedCount === 0) {
        return { value: '0s', seconds: 0 };
    }

    const avgMs = totalDuration / closedCount;
    const avgSeconds = avgMs / 1000;

    if (avgSeconds < 60) {
        return { value: `${avgSeconds.toFixed(1)}s`, seconds: avgSeconds };
    } else if (avgSeconds < 3600) {
        const minutes = Math.floor(avgSeconds / 60);
        const secs = Math.round(avgSeconds % 60);
        return { value: `${minutes}m ${secs}s`, seconds: avgSeconds };
    } else {
        const hours = Math.floor(avgSeconds / 3600);
        const minutes = Math.floor((avgSeconds % 3600) / 60);
        return { value: `${hours}h ${minutes}m`, seconds: avgSeconds };
    }
}

// Custom hook for dashboard data
export function useDashboardData() {
    const context = useOutletContext();
    const allowedRoutes = context?.allowedRoutes || [];

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        llmCost: { inr: '₹0.00', usd: '$0.00' },
        whatsappCost: { inr: '₹0.00', total: '$0.00' },
        walletBalance: { inr: '₹2,450.00', messages: '~12,250 messages' },
        totalConversations: { value: '0', comparison: '', trend: '+0%', trendUp: true },
        activeUsers: { value: '0', comparison: '', trend: '+0%', trendUp: true, breakdown: { leads: 0, manual: 0 } },
        humanHandledConversations: { value: '0', trend: '+0%', trendUp: true },
        costPerConversation: { value: '₹0.00', trend: '+0%', trendUp: false },
        avgResponseTime: { value: '0s', trend: '+0%', trendUp: true },
        conversationVolumeData: [],
        hourlyActivityData: [],
        recentConversations: [],
        deliveryStats: {
            sent: { value: '0', rate: '0%' },
            delivered: { value: '0', rate: '0%' },
            read: { value: '0', rate: '0%' },
            failed: { value: '0', rate: '0%' },
            response: { value: '0', rate: '0%' },
        },
        agentPerformance: {
            agentCount: 0,
            chatsTaken: 0,
            activeChats: 0,
            closedChats: 0
        },
    });

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const promises = [];
            const keys = [];


            // Always fetch sessions data
            promises.push(getSessions());
            keys.push('sessions');

            // Always fetch WhatsApp conversations and stats
            promises.push(getWhatsAppConversations());
            keys.push('conversations');

            promises.push(getWhatsAppDashboardStats());
            keys.push('stats');

            promises.push(getUsers());
            keys.push('users');

            promises.push(getContacts(0, 100));
            keys.push('contacts');

            // Timeout race to prevent eternal hanging
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), 15000)
            );

            const results = await Promise.race([
                Promise.allSettled(promises),
                timeoutPromise
            ]);


            // Map results to variables expected by processing logic
            let sessionsRes = { status: 'rejected', value: null };
            let conversationsRes = { status: 'rejected', value: null };
            let dashboardStatsRes = { status: 'rejected', value: null };
            let usersRes = { status: 'rejected', value: null };
            let contactsRes = { status: 'rejected', value: null };

            results.forEach((res, index) => {
                const key = keys[index];

                if (key === 'sessions') sessionsRes = res;
                if (key === 'conversations') conversationsRes = res;
                if (key === 'stats') dashboardStatsRes = res;
                if (key === 'users') usersRes = res;
                if (key === 'contacts') contactsRes = res;
            });

            // Surface connection errors
            if (sessionsRes.status === 'rejected') {
                console.error('Failed to fetch sessions:', sessionsRes.reason);
                setError(`Sessions API Error: ${sessionsRes.reason?.message || 'Unknown error'}`);
            }
            if (conversationsRes.status === 'rejected') {
                console.error('Failed to fetch conversations:', conversationsRes.reason);
                if (!error) setError(`Conversations API Error: ${conversationsRes.reason?.message || 'Unknown error'}`);
            }
            if (dashboardStatsRes.status === 'rejected') {
                console.error('Failed to fetch stats:', dashboardStatsRes.reason);
            }

            // Handle sessions - could be array directly or { sessions: [...] }
            let sessions = [];
            if (sessionsRes.status === 'fulfilled') {
                const sessionsData = sessionsRes.value;
                sessions = Array.isArray(sessionsData) ? sessionsData : (sessionsData?.sessions || []);
            }

            // Handle users and calculate stats
            let users = [];
            if (usersRes.status === 'fulfilled') {
                users = Array.isArray(usersRes.value) ? usersRes.value : (usersRes.value?.users || []);
            }

            // Calculate Agent Performance
            const agents = users.filter(u => u.role?.name === 'Agent' || u.role_id === 3 || (u.role && typeof u.role === 'string' && u.role.toLowerCase().includes('agent')));
            const agentCount = agents.length;
            
            // Stats for ALL agents combined
            let totalAgentChatsTaken = 0;
            let totalAgentChatsClosed = 0;
            let totalAgentChatsActive = 0;

            if (agentCount > 0) {
                 // Create a set of agent IDs for fast lookup
                 const agentIds = new Set(agents.map(a => a.id));
                 
                 sessions.forEach(session => {
                     // Check assignment
                     if (session.assigned_agent_id && agentIds.has(parseInt(session.assigned_agent_id))) {
                         totalAgentChatsTaken++;
                         
                         const isClosed = session.status === 'closed' || session.status === 'resolved' || !!session.closed_at;
                         
                         if (isClosed) {
                             totalAgentChatsClosed++;
                         } else {
                             totalAgentChatsActive++;
                         }
                     }
                 });
            }

            // Handle contacts count and breakdown
            let totalContactsCount = 0;
            let leadsCount = 0;
            let manualCount = 0;
            if (contactsRes.status === 'fulfilled' && contactsRes.value) {
                totalContactsCount = contactsRes.value.total || (Array.isArray(contactsRes.value.contacts) ? contactsRes.value.contacts.length : 0);
                
                const contactsList = contactsRes.value.contacts || [];
                contactsList.forEach(c => {
                    if (c.source && (c.source.toLowerCase().includes('lead'))) {
                        leadsCount++;
                    } else {
                        manualCount++;
                    }
                });

                // If we didn't fetch all contacts, adjust counts proportionally or just show what we have
                // For simplicity, we'll use the counts from the fetched batch
            }

            // Handle conversations - API returns { conversations: { phone: [...] }, total_users: n }
            let activeUserCount = 0;
            let allMessages = [];
            if (conversationsRes.status === 'fulfilled') {
                const convData = conversationsRes.value;
                activeUserCount = convData?.total_users || 0;

                // If total_users not provided, count keys of conversations object
                if (!activeUserCount && convData?.conversations) {
                    activeUserCount = Object.keys(convData.conversations).length;
                }

                // Flatten all messages from conversations for WhatsApp cost calculation
                if (convData?.conversations) {
                    allMessages = Object.values(convData.conversations).flat();
                }
            }

            // Calculate WhatsApp costs using category rate × exchange rate formula
            const whatsAppCostData = calculateCostFromMessages(allMessages);
            const whatsappCostUsd = parseFloat(whatsAppCostData.totalUSD);
            const whatsappCostInr = parseFloat(whatsAppCostData.totalINR);

            // Calculate LLM costs from messages
            const llmCostUsd = allMessages.reduce((sum, m) => sum + (m.llm_cost_usd || 0), 0);
            const llmCostInr = allMessages.reduce((sum, m) => sum + (m.llm_cost_inr || 0), 0);

            const totalConversations = sessions.length;

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
                    name: session.name || session.whatsapp || session.email || `Unknown`,
                    status: session.status || 'active',
                    message: session.conversation?.[session.conversation.length - 1]?.text || 'No messages',
                    time: formatTimeAgo(session.created_at),
                    count: `${session.conversation?.length || 0} messages`,
                    color: ['#10b981', '#f59e0b', '#6366f1', '#ec4899'][index % 4],
                }));

            // Process delivery stats and costs from API
            let deliveryStats = {
                sent: { value: '0', rate: '0%' },
                delivered: { value: '0', rate: '0%' },
                read: { value: '0', rate: '0%' },
                failed: { value: '0', rate: '0%' },
            };

            // Use API costs if available, otherwise use calculated costs
            let apiWhatsappCostUsd = whatsappCostUsd;
            let apiWhatsappCostInr = whatsappCostInr;
            let aiResRateVal = 0;

            if (dashboardStatsRes.status === 'fulfilled' && dashboardStatsRes.value) {
                const apiData = dashboardStatsRes.value;

                // Parse delivery status from API response
                if (apiData.delivery_status) {
                    const counts = apiData.delivery_status.counts || {};
                    const percentages = apiData.delivery_status.percentages || {};

                    deliveryStats = {
                        sent: {
                            value: (counts.sent || 0).toLocaleString(),
                            rate: `${percentages.sent?.toFixed(1) || '0'}%`
                        },
                        delivered: {
                            value: (counts.delivered || 0).toLocaleString(),
                            rate: `${percentages.delivered?.toFixed(1) || '0'}%`
                        },
                        read: {
                            value: (counts.read || 0).toLocaleString(),
                            rate: `${percentages.read?.toFixed(1) || '0'}%`
                        },
                        failed: {
                            value: (counts.failed || 0).toLocaleString(),
                            rate: `${percentages.failed?.toFixed(1) || '0'}%`
                        },
                        response: {
                            value: '0',
                            rate: '0%'
                        }
                    };
                }

                // Use costs from API if available
                if (apiData.costs) {
                    apiWhatsappCostUsd = apiData.costs.total_usd || 0;
                    apiWhatsappCostInr = apiData.costs.total_inr || 0;
                }
            }

            const totalCost = llmCostUsd + apiWhatsappCostUsd;
            const totalCostInr = llmCostInr + apiWhatsappCostInr;
            const costPerConvInr = totalConversations > 0 ? totalCostInr / totalConversations : 0;
            const costPerConv = totalConversations > 0 ? totalCost / totalConversations : 0;

            // Calculate human handled conversations
            const humanHandledCount = sessions.filter(s => s.is_human_agent_active).length;

            setData({
                llmCost: {
                    inr: `₹${llmCostInr.toFixed(2)}`,
                    usd: `$${llmCostUsd.toFixed(4)} USD`,
                },
                whatsappCost: {
                    inr: `₹${apiWhatsappCostInr.toFixed(2)}`,
                    total: `$${apiWhatsappCostUsd.toFixed(4)} USD`,
                    messageCount: allMessages.length
                },
                agentPerformance: {
                    agentCount: agentCount,
                    chatsTaken: totalAgentChatsTaken,
                    activeChats: totalAgentChatsActive,
                    closedChats: totalAgentChatsClosed
                },
                walletBalance: { inr: '₹2,450.00', messages: '~12,250 messages' },
                totalConversations: {
                    value: totalConversations.toLocaleString(),
                    comparison: '',
                    trend: '+14.1%',
                    trendUp: true,
                },
                activeUsers: {
                    value: totalContactsCount.toString(),
                    comparison: `Leads: ${leadsCount} • Imported: ${manualCount}`,
                    trend: '+14.8%',
                    trendUp: true,
                    breakdown: {
                        leads: leadsCount,
                        manual: manualCount
                    }
                },
                humanHandledConversations: {
                    value: totalAgentChatsTaken.toString(),
                    comparison: `${totalAgentChatsActive} active • ${totalAgentChatsClosed} closed`,
                    trend: '+8.4%', 
                    trendUp: true,
                },
                costPerConversation: {
                    value: `₹${costPerConvInr.toFixed(2)}`,
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
                deliveryStats,
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
