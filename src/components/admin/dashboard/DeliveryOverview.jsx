import { Send, CheckCheck, Eye, XCircle } from 'lucide-react';

const deliveryCards = [
    { key: 'sent', label: 'Sent', icon: Send, iconBg: 'bg-violet-100 text-violet-600', rateColor: 'text-violet-500' },
    { key: 'delivered', label: 'Delivered', icon: CheckCheck, iconBg: 'bg-blue-100 text-blue-600', rateColor: 'text-green-500' },
    { key: 'read', label: 'Read', icon: Eye, iconBg: 'bg-green-100 text-green-600', rateColor: 'text-green-500' },
    { key: 'failed', label: 'Failed', icon: XCircle, iconBg: 'bg-red-100 text-red-500', rateColor: 'text-red-500' },
];

// Default fallback stats
const defaultStats = {
    sent: { value: '0', rate: '0%' },
    delivered: { value: '0', rate: '0%' },
    read: { value: '0', rate: '0%' },
    failed: { value: '0', rate: '0%' },
};

export default function DeliveryOverview({ deliveryStats = defaultStats }) {
    return (
        <div className="mb-6 animate-fade-in">
            <div className="mb-3">
                <div className="text-sm font-semibold text-gray-900">Message Delivery Overview</div>
                <div className="text-xs text-gray-500">Track your message delivery performance</div>
            </div>
            <div className="mb-3 text-xs font-semibold text-gray-700">
                Broadcast Messages
            </div>
            <div className="grid grid-cols-4 gap-4">
                {deliveryCards.map(({ key, label, icon: Icon, iconBg, rateColor }) => (
                    <div key={key} className="bg-white rounded-xl p-4 border border-gray-100 hover:border-violet-300 hover:shadow-md transition-all duration-300">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${iconBg}`}>
                            <Icon size={16} />
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-0.5">{deliveryStats[key]?.value || '0'}</div>
                        <div className="text-xs text-gray-500 mb-1">{label}</div>
                        <div className={`text-xs font-medium ${rateColor}`}>{deliveryStats[key]?.rate || '0%'}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
