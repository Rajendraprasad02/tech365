import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { barChartData as defaultData } from '../../../constants';
import { tooltipStyle, axisStyle, barChartConfig, chartColors } from '../../../config';

export default function ConversationVolumeChart({ data }) {
    const chartData = data?.length > 0 ? data : defaultData;

    return (
        <div className="bg-white rounded-xl p-5 border border-gray-200 animate-fade-in h-full min-h-[280px]">
            <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900 mb-0.5">Conversation Volume</h3>
                <p className="text-xs text-gray-500">This week vs last week</p>
            </div>

            <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={barChartConfig.barGap}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.gridLine} />
                        <XAxis
                            dataKey="name"
                            {...axisStyle}
                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                        />
                        <YAxis
                            {...axisStyle}
                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                        />
                        <Tooltip {...tooltipStyle} />
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
