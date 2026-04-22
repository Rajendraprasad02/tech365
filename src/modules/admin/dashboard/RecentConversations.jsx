import { useState } from 'react';
import { MessageCircle, Bot, Clock, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusColors = {
    active: 'bg-green-100 text-green-600',
    pending: 'bg-amber-100 text-amber-600',
    resolved: 'bg-gray-100 text-gray-500',
};

const ITEMS_PER_PAGE = 5;

export default function RecentConversations({ conversations }) {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    
    const hasData = conversations && conversations.length > 0;

    if (!hasData) {
        return (
            <div className="bg-white rounded-xl p-5 border border-gray-200 flex flex-col animate-fade-in h-[400px]">
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
                </div>
                <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                    <div className="text-2xl font-bold text-gray-300">No Data</div>
                    <div className="text-xs mt-1">No recent conversations found</div>
                </div>
            </div>
        );
    }

    const totalPages = Math.ceil(conversations.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentConversations = conversations.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    return (
        <div className="bg-white rounded-xl p-5 border border-gray-200 flex flex-col animate-fade-in h-full">
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
                <button
                    onClick={() => navigate('/conversations')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-violet-500 hover:text-white hover:border-violet-500 transition-all duration-200"
                >
                    View All
                    <ExternalLink size={12} />
                </button>
            </div>
            
            <div className="flex flex-col gap-2 flex-1 min-h-0">
                {currentConversations.map((conv, index) => (
                    <div
                        key={startIndex + index}
                        onClick={() => navigate('/conversations')}
                        className="flex items-center p-3 bg-white rounded-lg border border-gray-100 cursor-pointer transition-all duration-300 hover:border-violet-500 hover:shadow-md hover:shadow-violet-50"
                    >
                        {/* Avatar with bot badge */}
                        <div className="relative mr-3">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center bg-violet-500 text-white font-semibold text-sm"
                            >
                                {(conv.name?.startsWith('+') ? conv.name.substring(1) : conv.name).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
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
                        <div className="text-right ml-2 lg:block hidden">
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <span className="text-[11px] text-gray-400 font-medium tracking-wide">
                        Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, conversations.length)} of {conversations.length}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className="p-1 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="flex items-center gap-1 px-2">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${currentPage === i + 1 ? 'w-4 bg-violet-600' : 'bg-gray-200'}`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="p-1 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
