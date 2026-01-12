import { MessageCircle, Users, DollarSign, CheckCircle, Bot, Clock } from 'lucide-react';
import MetricCard from './MetricCard';

// Default metrics (used as fallback and for unmapped data)
const defaultMetrics = [
    {
        label: 'Total Conversations',
        value: '0',
        comparison: '',
        trend: '+0%',
        trendUp: true,
        icon: MessageCircle,
        iconBg: 'purple',
        sparkline: 'M0,30 L10,28 L20,25 L30,22 L40,24 L50,18 L60,15 L70,12 L80,8 L90,5 L100,2'
    },
    {
        label: 'Active Users',
        value: '0',
        comparison: '',
        trend: '+0%',
        trendUp: true,
        icon: Users,
        iconBg: 'purple',
        sparkline: 'M0,28 L10,26 L20,24 L30,20 L40,22 L50,18 L60,14 L70,10 L80,8 L90,6 L100,3'
    },
    {
        label: 'Cost per Conversation',
        value: '$0.00',
        comparison: '',
        trend: '↓0%',
        trendUp: false,
        icon: DollarSign,
        iconBg: 'green',
        sparkline: 'M0,5 L10,8 L20,12 L30,15 L40,18 L50,20 L60,22 L70,25 L80,28 L90,30 L100,28'
    },
    {
        label: 'Delivery Success',
        value: '98.7%',
        comparison: '',
        trend: '+0.8%',
        trendUp: true,
        icon: CheckCircle,
        iconBg: 'green',
        sparkline: 'M0,20 L10,18 L20,16 L30,14 L40,12 L50,10 L60,9 L70,8 L80,7 L90,6 L100,5'
    },
    {
        label: 'AI Resolution Rate',
        value: '72.4%',
        comparison: '',
        trend: '+6.3%',
        trendUp: true,
        icon: Bot,
        iconBg: 'purple',
        highlight: true,
        sparkline: 'M0,25 L10,23 L20,20 L30,18 L40,20 L50,16 L60,14 L70,12 L80,10 L90,8 L100,5'
    },
    {
        label: 'Avg Response Time',
        value: '1.2s',
        comparison: '',
        trend: '-33.3%',
        trendUp: true,
        icon: Clock,
        iconBg: 'teal',
        sparkline: 'M0,25 L10,22 L20,20 L30,18 L40,15 L50,12 L60,10 L70,8 L80,7 L90,6 L100,5'
    },
];

export default function MetricsGrid({ totalConversations, activeUsers, costPerConversation, avgResponseTime }) {
    // Merge API data with default metrics
    const metrics = defaultMetrics.map(metric => {
        switch (metric.label) {
            case 'Total Conversations':
                return {
                    ...metric,
                    value: totalConversations?.value || metric.value,
                    comparison: totalConversations?.comparison || metric.comparison,
                    trend: totalConversations?.trend || metric.trend,
                    trendUp: totalConversations?.trendUp ?? metric.trendUp,
                };
            case 'Active Users':
                return {
                    ...metric,
                    value: activeUsers?.value || metric.value,
                    comparison: activeUsers?.comparison || metric.comparison,
                    trend: activeUsers?.trend || metric.trend,
                    trendUp: activeUsers?.trendUp ?? metric.trendUp,
                };
            case 'Cost per Conversation':
                return {
                    ...metric,
                    value: costPerConversation?.value || metric.value,
                    trend: costPerConversation?.trend || metric.trend,
                    trendUp: costPerConversation?.trendUp ?? metric.trendUp,
                };
            case 'Avg Response Time':
                return {
                    ...metric,
                    value: avgResponseTime?.value || metric.value,
                    trend: avgResponseTime?.trend || metric.trend,
                    trendUp: avgResponseTime?.trendUp ?? metric.trendUp,
                };
            default:
                return metric; // Keep mock data for unmapped metrics
        }
    });

    return (
        <div className="grid grid-cols-6 gap-4 mb-6">
            {metrics.map((metric, index) => (
                <MetricCard key={index} metric={metric} />
            ))}
        </div>
    );
}
