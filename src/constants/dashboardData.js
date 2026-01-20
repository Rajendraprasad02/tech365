// Bar chart data for conversation volume
export const barChartData = [
    { name: 'Mon', thisWeek: 180, lastWeek: 150 },
    { name: 'Tue', thisWeek: 245, lastWeek: 200 },
    { name: 'Wed', thisWeek: 290, lastWeek: 280 },
    { name: 'Thu', thisWeek: 340, lastWeek: 260 },
    { name: 'Fri', thisWeek: 285, lastWeek: 270 },
    { name: 'Sat', thisWeek: 150, lastWeek: 130 },
    { name: 'Sun', thisWeek: 120, lastWeek: 100 },
];

// Recent conversations data
export const conversations = [
    {
        name: 'Alex Johnson',
        status: 'active',
        message: 'How do I upgrade my subscription plan?',
        time: '7 min ago',
        count: '5 messages',
        color: '#10b981'
    },
    {
        name: 'Maria Garcia',
        status: 'pending',
        message: 'I need help with payment issues',
        time: '15 min ago',
        count: '8 messages',
        color: '#f59e0b'
    },
    {
        name: 'James Wilson',
        status: 'resolved',
        message: 'Can you explain the pricing tiers?',
        time: '32 min ago',
        count: '3 messages',
        color: '#6366f1'
    },
    {
        name: 'Emily Brown',
        status: 'pending',
        message: 'I want to cancel my subscription',
        time: '1 hr ago',
        count: '12 messages',
        color: '#ec4899'
    },
];

// Template performance data
export const templates = [
    {
        name: 'Welcome Message',
        type: 'Marketing',
        sent: 5420,
        delivery: 95.8,
        read: 75.7,
        click: 11.9
    },
    {
        name: 'Order Confirmation',
        type: 'Utility',
        sent: 3280,
        delivery: 98.9,
        read: 89.1,
        click: 30.8
    },
    {
        name: 'Payment Reminder',
        type: 'Utility',
        sent: 2150,
        delivery: 97.5,
        read: 82.4,
        click: 25.3
    },
];

// Hourly activity chart data
export const hourlyActivityData = [
    { time: '6AM', messages: 20 },
    { time: '8AM', messages: 45 },
    { time: '10AM', messages: 80 },
    { time: '12PM', messages: 120 },
    { time: '2PM', messages: 160 },
    { time: '4PM', messages: 100 },
    { time: '6PM', messages: 70 },
    { time: '8PM', messages: 50 },
    { time: '10PM', messages: 30 },
];

// Resolution breakdown data for pie chart
export const resolutionData = [
    { name: 'AI Resolved', value: 68, color: '#0082FB' },
    { name: 'Human Handled', value: 24, color: '#60a5fa' },
    { name: 'Escalated', value: 8, color: '#fbbf24' },
];

// Delivery overview stats
export const deliveryStats = {
    sent: { value: '12,450', rate: '100%' },
    delivered: { value: '11,820', rate: '95%' },
    read: { value: '8,475', rate: '68%' },
    failed: { value: '630', rate: '5%' },
};

// Workspaces data
export const workspaces = [
    { id: 1, name: 'Acme Inc', icon: '🏢' },
    { id: 2, name: 'Acme Labs', icon: '🔬' },
];

// Notifications data
export const notifications = [
    { id: 1, type: 'warning', title: 'Low wallet balance', description: 'Recharge recommended within 48 hours', time: '2 min ago' },
    { id: 2, type: 'success', title: 'Campaign completed', description: '"Holiday Sale" reached 25,000 users', time: '1 hour ago' },
    { id: 3, type: 'info', title: 'New AI insight available', description: 'Check your AI recommendations', time: '3 hours ago' },
];

// User data
export const currentUser = {
    name: 'Sarah Chen',
    initials: 'SC',
    role: 'Admin',
};
