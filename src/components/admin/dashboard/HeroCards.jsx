import { Wallet, MessageCircle, TrendingUp } from 'lucide-react';

export default function HeroCards({ walletBalance, activeConversations, whatsappCost }) {
    return (
        <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Wallet Balance */}
            <div className="bg-violet-500 rounded-2xl p-6 text-white animate-fade-in relative overflow-hidden shadow-lg shadow-blue-500/20">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>

                <div className="flex items-center gap-2 text-white/80 text-sm mb-3">
                    <Wallet size={18} />
                    <span className="font-medium">Wallet Balance</span>
                </div>
                <div className="text-4xl font-bold mb-1">{walletBalance?.inr || '₹2,450.00'}</div>
                <div className="text-white/70 text-sm mb-5">{walletBalance?.messages || '~12,250 messages'}</div>
                {/* 
                <button className="px-5 py-2.5 bg-white text-violet-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                    Add Funds
                </button> 
                */}
            </div>

            {/* Active Conversations */}
            <div className="bg-violet-500 rounded-2xl p-6 text-white animate-fade-in relative overflow-hidden shadow-lg shadow-blue-500/20">
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
                <div className="text-white/70 text-sm">{whatsappCost?.total || '$0.0000 USD'}</div>
            </div>
        </div>
    );
}
