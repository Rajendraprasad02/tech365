import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { resolutionData } from '../../../constants';
import { tooltipStyle, pieChartConfig } from '../../../config';

export default function ResolutionBreakdownChart() {
    return (
        <div className="bg-white rounded-xl p-5 border border-gray-200 animate-fade-in h-full flex flex-col min-h-[280px]">
            <div className="mb-2">
                <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Resolution Breakdown</h3>
                <p className="text-xs text-gray-500">How conversations are handled</p>
            </div>
            <div className="flex flex-col items-center justify-center flex-1">
                <div className="w-40 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={resolutionData}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={65}
                                paddingAngle={pieChartConfig.paddingAngle}
                                dataKey="value"
                                animationDuration={pieChartConfig.animationDuration}
                                animationEasing={pieChartConfig.animationEasing}
                            >
                                {resolutionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={tooltipStyle.contentStyle}
                                formatter={(value) => [`${value}%`, '']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex gap-4 mt-3 flex-wrap justify-center">
                    {resolutionData.map((item, index) => (
                        <div key={index} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span>{item.name} <span className="font-semibold text-gray-900">{item.value}%</span></span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
