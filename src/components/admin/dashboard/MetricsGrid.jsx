import { Users, DollarSign, CheckCircle, Bot, Clock } from 'lucide-react';
import MetricCard from './MetricCard';



export default function MetricsGrid({ activeUsers, costPerConversation, avgResponseTime, deliveryStats }) {
    // Define structure but initialize with NRTD or API data
    const metrics = [
        {
            label: 'Active Users',
            value: activeUsers?.value || '0',
            comparison: activeUsers?.comparison || '',
            trend: activeUsers?.trend || '+0%',
            trendUp: activeUsers?.trendUp ?? true,
            icon: Users,
            iconBg: 'purple',
            sparkline: activeUsers?.value ? 'M0,28 L10,26 L30,20 L50,18 L70,10 L100,5' : null
        },
        {
            label: 'Cost per Conversation',
            value: costPerConversation?.value || '$0.00',
            comparison: '',
            trend: costPerConversation?.trend || '+0%',
            trendUp: costPerConversation?.trendUp ?? false,
            icon: DollarSign,
            iconBg: 'green',
            sparkline: null
        },
        {
            label: 'Delivery Success',
            value: deliveryStats?.delivered?.rate || 'NRTD',
            comparison: '',
            trend: '',
            trendUp: true,
            icon: CheckCircle,
            iconBg: 'green',
            sparkline: null
        },
        {
            label: 'AI Resolution Rate',
            value: 'NRTD', // Not currently available from API
            comparison: '',
            trend: '',
            trendUp: true,
            icon: Bot,
            iconBg: 'purple',
            highlight: true,
            sparkline: null
        },
        {
            label: 'Avg Response Time',
            value: avgResponseTime?.value || '0s',
            comparison: '',
            trend: avgResponseTime?.trend || '+0%',
            trendUp: avgResponseTime?.trendUp ?? true,
            icon: Clock,
            iconBg: 'teal',
            sparkline: null
        },
    ];

    return (
        <div className="grid grid-cols-5 gap-4 mb-6">
            {metrics.map((metric, index) => (
                <MetricCard key={index} metric={metric} />
            ))}
        </div>
    );
}
