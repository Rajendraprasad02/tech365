import { TrendingUp } from 'lucide-react';
import { iconBgColors } from '../../../config';

export default function MetricCard({ metric }) {
    const Icon = metric.icon;

    return (
        <div
            className={`relative overflow-hidden bg-white rounded-2xl p-5 border border-gray-100 hover:border-violet-300 hover:shadow-lg transition-all duration-300 animate-fade-in ${metric.highlight ? 'border-violet-200 bg-violet-50/30' : ''}`}
        >
            {/* Green dot indicator */}
            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500" />

            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${iconBgColors[metric.iconBg] || 'bg-gray-100 text-gray-600'}`}>
                <Icon size={20} />
            </div>
            <div className="text-sm text-gray-500 mb-1">{metric.label}</div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
            {metric.comparison && (
                <div className="text-xs text-gray-400 mb-2">{metric.comparison}</div>
            )}
            <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${metric.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                <TrendingUp size={12} style={{ transform: metric.trendUp ? 'none' : 'rotate(180deg)' }} />
                {metric.trend}
            </div>

            {/* Sparkline chart at bottom right */}
            <svg
                className="absolute bottom-3 right-3 w-20 h-8"
                viewBox="0 0 100 35"
                preserveAspectRatio="none"
            >
                <path
                    d={metric.sparkline}
                    fill="none"
                    stroke={metric.trendUp ? '#10b981' : '#ef4444'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
}
