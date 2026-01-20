import { MessageCircle, Bot, Clock, ExternalLink } from 'lucide-react';
import { conversations as defaultConversations } from '../../../constants';
import { statusColors } from '../../../config';

export default function RecentConversations({ conversations }) {
    const data = conversations?.length > 0 ? conversations : defaultConversations;

    return (
        <div className="bg-white rounded-xl p-5 border border-gray-200 flex flex-col animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                        <MessageCircle size={14} className="text-gray-500" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-gray-900">Recent Conversations</div>
                        <div className="text-xs text-gray-500">Latest chat interactions</div>
                    </div>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-violet-500 hover:text-white hover:border-violet-500 transition-all duration-200">
                    View All
                    <ExternalLink size={12} />
                </button>
            </div>
            <div className="flex flex-col gap-2 flex-1">
                {data.map((conv, index) => (
                    <div
                        key={index}
                        className="flex items-center p-3 bg-white rounded-lg border border-gray-100 cursor-pointer transition-all duration-300 hover:border-violet-500 hover:shadow-md hover:shadow-violet-50"
                    >
                        {/* Avatar with bot badge */}
                        <div className="relative mr-3">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center bg-violet-500 text-white font-semibold text-sm"
                            >
                                {conv.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center border-2 border-white">
                                <Bot size={8} className="text-white" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-semibold text-gray-900 text-sm truncate">{conv.name}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[conv.status] || 'bg-gray-100 text-gray-500'}`}>
                                    {conv.status}
                                </span>
                            </div>
                            <div className="text-xs text-gray-500 truncate">{conv.message}</div>
                        </div>

                        {/* Meta */}
                        <div className="text-right ml-2">
                            <div className="flex items-center gap-1 text-[11px] text-gray-500 mb-0.5">
                                <Clock size={10} />
                                {conv.time}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                <MessageCircle size={10} />
                                {conv.count}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
