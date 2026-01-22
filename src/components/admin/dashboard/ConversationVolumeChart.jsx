import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
// Removed static data import
const chartColors = {
    primary: '#0082FB',
    primaryLight: '#60a5fa',
    gridLine: '#e5e7eb',
};

const barChartConfig = {
    barGap: 4,
    radius: [4, 4, 0, 0],
    animationDuration: 1000,
    animationEasing: 'ease-out',
};

export default function ConversationVolumeChart({ data }) {
    const hasData = data && data.length > 0;

    if (!hasData) {
        return (
            <div className="bg-white rounded-xl p-5 border border-gray-200 animate-fade-in h-full min-h-[280px] flex flex-col items-center justify-center text-gray-400">
                <div className="mb-2 font-semibold">Conversation Volume</div>
                <div className="text-2xl font-bold text-gray-300">NRTD</div>
                <div className="text-xs">Not Real-Time Data</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl p-5 border border-gray-200 animate-fade-in h-full min-h-[280px]">
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Conversation Volume</h3>
                <p className="text-xs text-gray-500">This week vs last week</p>
            </div>

            <div className="h-52" style={{ minWidth: 0, minHeight: 208 }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                    <BarChart data={data} barGap={barChartConfig.barGap}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.gridLine} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            }}
                            labelStyle={{ color: '#111827', fontWeight: 600 }}
                            cursor={{ fill: 'rgba(0, 130, 251, 0.1)' }}
                        />
                        <Legend
                            verticalAlign="top"
                            align="right"
                            wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                            iconSize={8}
                        />
                        <Bar
                            dataKey="thisWeek"
                            name="This Week"
                            fill={chartColors.primary}
                            radius={barChartConfig.radius}
                            maxBarSize={32}
                            animationDuration={barChartConfig.animationDuration}
                            animationEasing={barChartConfig.animationEasing}
                        />
                        <Bar
                            dataKey="lastWeek"
                            name="Last Week"
                            fill={chartColors.primaryLight}
                            radius={barChartConfig.radius}
                            maxBarSize={32}
                            animationDuration={barChartConfig.animationDuration}
                            animationEasing={barChartConfig.animationEasing}
                            animationBegin={200}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
