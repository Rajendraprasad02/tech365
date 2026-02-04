import { Wallet, MessageCircle, TrendingUp, Users, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HeroCards({ walletBalance, activeConversations, whatsappCost, agentPerformance }) {
    const navigate = useNavigate();
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {/* Wallet Balance */}
            <div className="bg-violet-500 rounded-2xl p-6 text-white animate-fade-in relative overflow-hidden shadow-lg shadow-blue-500/20">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>

                <div className="flex items-center gap-2 text-white/80 text-sm mb-3">
                    <Wallet size={18} />
                    <span className="font-medium">Wallet Balance</span>
                </div>
                <div className="text-4xl font-bold mb-1">{walletBalance?.inr || '₹2,450.00'}</div>
                <div className="text-white/70 text-sm mb-5">{walletBalance?.messages || '~12,250 messages'}</div>
            </div>

            {/* Active Conversations */}
            <div 
                onClick={() => navigate('/conversations?filter=active')}
                className="bg-violet-500 rounded-2xl p-6 text-white animate-fade-in relative overflow-hidden shadow-lg shadow-blue-500/20 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>

                <div className="flex items-center gap-2 text-white/80 text-sm mb-3">
                    <MessageCircle size={18} />
                    <span className="font-medium">Active Conversations</span>
                </div>
                <div className="text-4xl font-bold mb-1">{activeConversations?.value || '0'}</div>
                <div className="flex items-center gap-1.5 text-white/70 text-sm">
                    <TrendingUp size={14} className="text-green-300" />
                    <span>{activeConversations?.trend || '+0%'} since last week</span>
                </div>
            </div>

            {/* WhatsApp Cost */}
            <div className="bg-violet-500 rounded-2xl p-6 text-white animate-fade-in relative overflow-hidden shadow-lg shadow-blue-500/20">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>

                <div className="flex items-center gap-2 text-white/80 text-sm mb-3">
                    <MessageCircle size={18} />
                    <span className="font-medium">WhatsApp Cost</span>
                </div>
                <div className="text-3xl font-bold mb-1">{whatsappCost?.inr || '₹0.00'}</div>
                {/* <div className="text-white/70 text-sm mb-4">{whatsappCost?.messageCount || '0'} Total Messages</div> */}
                <div className="text-white/60 text-xs pt-2 border-t border-white/10">
                    <span className="font-semibold">{activeConversations?.value || '0'}</span> Total Conversations
                </div>
            </div>

            {/* Agent Performance */}
            <div className="bg-violet-500 rounded-2xl p-6 text-white animate-fade-in relative overflow-hidden shadow-lg shadow-blue-500/20">
                 <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>

                 <div className="flex items-center gap-2 text-white/80 text-sm mb-3">
                     <Users size={18} />
                     <span className="font-medium">Agent Performance</span>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                    <div>
                         <div className="text-2xl font-bold">{agentPerformance?.agentCount || 0}</div>
                         <div className="text-xs text-white/70">Agents</div>
                    </div>
                     <div>
                         <div className="text-2xl font-bold">{agentPerformance?.chatsTaken || 0}</div>
                         <div className="text-xs text-white/70">Taken</div>
                    </div>
                    <div>
                         <div className="text-2xl font-bold">{agentPerformance?.closedChats || 0}</div>
                         <div className="text-xs text-white/70">Closed</div>
                    </div>
                    <div>
                         <div className="text-2xl font-bold">{agentPerformance?.activeChats || 0}</div>
                         <div className="text-xs text-white/70">Active</div>
                    </div>
                 </div>
            </div>
        </div>
    );
}
