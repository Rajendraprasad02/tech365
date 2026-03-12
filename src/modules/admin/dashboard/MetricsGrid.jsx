import { Users, DollarSign, CheckCircle, Bot, Clock, Headphones, IndianRupee, MessageCircle } from 'lucide-react';
import MetricCard from './MetricCard';
import { useNavigate } from 'react-router-dom';

const DollarSymbol = () => <span className="text-xl font-bold font-sans">$</span>;

export default function MetricsGrid({ activeUsers, costPerConversation, avgResponseTime, responseRate, deliveryStats, humanHandledConversations }) {
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
            icon: IndianRupee,
            iconBg: 'green',
            sparkline: null
        },
        {
            label: 'Campaign Response Rate',
            value: responseRate?.value || '0%',
            comparison: responseRate?.comparison || '',
            trend: responseRate?.trend || '0%',
            trendUp: responseRate?.trendUp ?? true,
            icon: MessageCircle,
            iconBg: 'orange',
            sparkline: null
        },
        {
            label: 'Human-Handled',
            value: humanHandledConversations?.value || '0',
            comparison: humanHandledConversations?.comparison || '',
            trend: humanHandledConversations?.trend || '+0%',
            trendUp: humanHandledConversations?.trendUp ?? true,
            icon: Headphones,
            iconBg: 'blue',
            sparkline: null
        },
        {
            label: 'Avg Conv. Time',
            value: avgResponseTime?.value || '0s',
            comparison: avgResponseTime?.comparison || '',
            trend: avgResponseTime?.trend || '+0%',
            trendUp: avgResponseTime?.trendUp ?? true,
            icon: Clock,
            iconBg: 'teal',
            sparkline: null
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {metrics.map((metric, index) => (
                <MetricCard key={index} metric={metric} />
            ))}
        </div>
    );
}
