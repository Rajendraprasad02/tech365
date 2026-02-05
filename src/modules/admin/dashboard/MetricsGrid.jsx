import { Users, DollarSign, CheckCircle, Bot, Clock, Headphones } from 'lucide-react';
import MetricCard from './MetricCard';
import { useNavigate } from 'react-router-dom';

const DollarSymbol = () => <span className="text-xl font-bold font-sans">$</span>;

export default function MetricsGrid({ activeUsers, costPerConversation, avgResponseTime, deliveryStats, humanHandledConversations }) {
    const navigate = useNavigate();

    // Define structure but initialize with NRTD or API data
    const metrics = [
        {
            label: 'Total Contacts',
            value: activeUsers?.value || '0',
            comparison: activeUsers?.comparison || '',
            trend: activeUsers?.trend || '+0%',
            trendUp: activeUsers?.trendUp ?? true,
            breakdown: activeUsers?.breakdown,
            icon: Users,
            iconBg: 'purple',
            sparkline: activeUsers?.value ? 'M0,28 L10,26 L30,20 L50,18 L70,10 L100,5' : null,
            onClick: () => navigate('/conversations'),
            clickable: true
        },
        {
            label: 'Avg Cost per Conversation',
            value: costPerConversation?.value || '₹0.00',
            comparison: '',
            trend: costPerConversation?.trend || '+0%',
            trendUp: costPerConversation?.trendUp ?? false,
            icon: DollarSign,
            iconBg: 'green',
            sparkline: null
        },
        {
            label: 'Human-Handled Conversations',
            value: humanHandledConversations?.value || '0',
            comparison: '',
            trend: humanHandledConversations?.trend || '+0%',
            trendUp: humanHandledConversations?.trendUp ?? true,
            icon: Headphones,
            iconBg: 'blue',
            sparkline: null
        },
        {
            label: 'Avg Conversation Time',
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
        <div className="grid grid-cols-4 gap-4 mb-6">
            {metrics.map((metric, index) => (
                <MetricCard key={index} metric={metric} />
            ))}
        </div>
    );
}
