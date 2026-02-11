import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'New Deals', value: 45, color: '#0064E0' }, // Brand Primary (violet-500)
    { name: 'In Progress Deals', value: 35, color: '#3b82f6' }, // Brand Secondary (violet-400)
    { name: 'Closed Deals', value: 20, color: '#93c5fd' },   // Brand Tertiary (violet-300)
];

const pieChartConfig = {
    innerRadius: 60,
    outerRadius: 80,
    paddingAngle: 5,
    cornerRadius: 4,
};

export default function ResolutionBreakdownChart() {
    return (
        <div className="bg-white rounded-xl p-5 border border-gray-200 animate-fade-in h-full flex flex-col min-h-[280px]">
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Deal Flow Overview</h3>
                <p className="text-xs text-gray-500">Distribution of deals across pipeline stages</p>
            </div>

            <div className="flex-1 min-h-[180px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={pieChartConfig.innerRadius}
                            outerRadius={pieChartConfig.outerRadius}
                            paddingAngle={pieChartConfig.paddingAngle}
                            dataKey="value"
                            cornerRadius={pieChartConfig.cornerRadius}
                            startAngle={90}
                            endAngle={-270}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            }}
                            itemStyle={{ color: '#374151', fontSize: '12px', fontWeight: 500 }}
                            formatter={(value) => [`${value}%`, '']}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        {/* You could add a total or main stat here if needed, but the design is clean */}
                    </div>
                </div>
            </div>

            {/* Custom Legend */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 pt-2 border-t border-gray-50">
                {data.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                        <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-gray-500 font-medium">
                            {item.name} <span className="text-gray-900 font-semibold">{item.value}%</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
