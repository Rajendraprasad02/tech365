// Chart configuration constants for recharts
export const chartColors = {
    primary: '#0082FB',
    primaryLight: '#60a5fa',
    success: '#10b981',
    warning: '#fbbf24',
    error: '#ef4444',
    gray: '#6b7280',
    gridLine: '#e5e7eb',
    lightGridLine: '#f3f4f6',
};

export const tooltipStyle = {
    contentStyle: {
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    labelStyle: { color: '#111827', fontWeight: 600 },
    cursor: { fill: 'rgba(0, 130, 251, 0.1)' },
};

export const axisStyle = {
    axisLine: false,
    tickLine: false,
    tick: { fill: '#6b7280', fontSize: 12 },
};

export const barChartConfig = {
    barGap: 4,
    maxBarSize: 40,
    radius: [4, 4, 0, 0],
    animationDuration: 1000,
    animationEasing: 'ease-out',
};

export const areaChartConfig = {
    animationDuration: 1500,
    animationEasing: 'ease-out',
    strokeWidth: 2,
    dot: { r: 4, fill: '#0082FB', strokeWidth: 0 },
    activeDot: { r: 6, fill: '#0082FB', stroke: 'white', strokeWidth: 2 },
};

export const pieChartConfig = {
    innerRadius: 60,
    outerRadius: 85,
    paddingAngle: 2,
    animationDuration: 1000,
    animationEasing: 'ease-out',
};

// Icon background color mappings
export const iconBgColors = {
    purple: 'bg-violet-100 text-violet-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-amber-100 text-amber-600',
    teal: 'bg-teal-100 text-teal-600',
};

// Status badge color mappings
export const statusColors = {
    active: 'bg-green-100 text-green-600',
    pending: 'bg-amber-100 text-amber-600',
    resolved: 'bg-gray-100 text-gray-500',
};
