import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// Removed static data import
const chartColors = {
    primary: '#0082FB',
    lightGridLine: '#f3f4f6',
};

const areaChartConfig = {
    animationDuration: 1500,
    animationEasing: 'ease-out',
    strokeWidth: 2,
    dot: { r: 4, fill: '#0082FB', strokeWidth: 0 },
    activeDot: { r: 6, fill: '#0082FB', stroke: 'white', strokeWidth: 2 },
};

export default function HourlyActivityChart({ data }) {
    const hasData = data && data.length > 0;

    if (!hasData) {
        return (
            <div className="bg-white rounded-xl p-5 border border-gray-200 animate-fade-in min-h-[240px] flex flex-col items-center justify-center text-gray-400">
                <div className="mb-2 font-semibold">Hourly Activity</div>
                <div className="text-2xl font-bold text-gray-300">NRTD</div>
                <div className="text-xs">Not Real-Time Data</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl p-5 border border-gray-200 animate-fade-in min-h-[240px]">
            <div className="mb-3">
                <div className="text-sm font-semibold text-gray-900">Hourly Activity</div>
                <div className="text-xs text-gray-500">Messages per hour today</div>
            </div>

            <div className="h-44" style={{ minWidth: 0, minHeight: 176 }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={170}>
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.lightGridLine} vertical={false} />
                        <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                fontSize: '12px'
                            }}
                            formatter={(value) => [`${value} messages`, '']}
                            labelFormatter={(label) => label}
                        />
                        <Area
                            type="monotone"
                            dataKey="messages"
                            stroke={chartColors.primary}
                            strokeWidth={areaChartConfig.strokeWidth}
                            fillOpacity={1}
                            fill="url(#colorMessages)"
                            animationDuration={areaChartConfig.animationDuration}
                            animationEasing={areaChartConfig.animationEasing}
                            dot={areaChartConfig.dot}
                            activeDot={areaChartConfig.activeDot}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
