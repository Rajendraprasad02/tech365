import { useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, Clock, Send, Bot, User, DollarSign } from 'lucide-react';
import { getSessions } from '../../services/api';

export default function ConversationsPage() {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [messageInput, setMessageInput] = useState('');
    const messagesEndRef = useRef(null);

    // Fetch conversations from API
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const sessions = await getSessions();
                const sessionList = Array.isArray(sessions) ? sessions : [];

                // Transform sessions to conversation format
                const convos = sessionList.map((session, index) => {
                    // Use total_conversation_cost_usd from backend, but show $0.00 if no messages
                    const messageCount = session.conversation_count || session.conversation?.length || 0;
                    const totalCost = messageCount > 0 ? (session.total_conversation_cost_usd || 0) : 0;

                    return {
                        id: session.id || index,
                        title: session.name || session.whatsapp || session.email || `Conversation #${index + 1}`,
                        preview: session.conversation?.[0]?.text?.substring(0, 50) || 'No messages',
                        status: session.conversation?.length > 0 ? 'active' : 'resolved',
                        time: formatTimeAgo(session.updated_at || session.created_at),
                        unread: session.conversation?.length > 5,
                        cost: totalCost.toFixed(4),
                        messages: session.conversation?.map(msg => ({
                            text: msg.text,
                            direction: msg.direction,
                            time: formatTime(msg.timestamp),
                            cost: msg.whatsapp_cost || 0,
                        })) || [],
                    };
                });

                setConversations(convos);
                if (convos.length > 0) {
                    setSelectedConversation(convos[0]);
                }
            } catch (error) {
                console.error('Error fetching conversations:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchConversations();
    }, []);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedConversation?.messages]);

    // Filter conversations by search
    const filteredConversations = conversations.filter(conv =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.preview.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get status badge styling
    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-700';
            case 'pending':
                return 'bg-amber-100 text-amber-700';
            case 'resolved':
                return 'bg-gray-100 text-gray-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Page Header */}
            <div className="px-8 py-6 bg-white border-b border-gray-100">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Conversations</h1>
                <p className="text-gray-500 text-sm">Manage and review all conversations</p>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden p-6 gap-4">
                {/* Left Panel - Conversation List */}
                <div className="w-80 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
                    {/* Search */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg">
                            <Search size={16} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
                            />
                        </div>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                            </div>
                        ) : filteredConversations.length > 0 ? (
                            filteredConversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    onClick={() => setSelectedConversation(conv)}
                                    className={`flex items-start gap-3 p-4 cursor-pointer border-b border-gray-50 transition-colors ${selectedConversation?.id === conv.id
                                        ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                        : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white font-semibold text-sm">
                                            {conv.title.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                                            <Bot size={10} className="text-violet-500" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-semibold text-gray-900 text-sm truncate">
                                                {conv.title}
                                            </span>
                                            {conv.unread && (
                                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{conv.preview}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getStatusBadge(conv.status)}`}>
                                                {conv.status}
                                            </span>
                                            <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                                <Clock size={10} />
                                                {conv.time}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <MessageSquare size={32} className="mb-2" />
                                <p className="text-sm">No conversations found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Chat View */}
                <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-6 py-4 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-semibold text-gray-900">{selectedConversation.title}</h2>
                                    {/* Cost Badge */}
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full">
                                        <DollarSign size={14} />
                                        <span className="text-sm font-semibold">${selectedConversation.cost}</span>
                                    </div>
                                </div>
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${getStatusBadge(selectedConversation.status)}`}>
                                    {selectedConversation.status === 'active' ? 'Active conversation' : selectedConversation.status}
                                </span>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                                {selectedConversation.messages.length > 0 ? (
                                    selectedConversation.messages.map((msg, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-end gap-2 ${msg.direction === 'in' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {/* Bot Avatar */}
                                            {msg.direction === 'out' && (
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                                    <Bot size={16} className="text-gray-600" />
                                                </div>
                                            )}

                                            {/* Message Bubble */}
                                            <div
                                                className={`max-w-md px-4 py-3 rounded-2xl ${msg.direction === 'in'
                                                    ? 'bg-blue-500 text-white rounded-br-sm'
                                                    : 'bg-white text-gray-900 border border-gray-100 rounded-bl-sm shadow-sm'
                                                    }`}
                                            >
                                                <p className="text-sm leading-relaxed">{msg.text}</p>
                                                <p className={`text-[10px] mt-1.5 ${msg.direction === 'in' ? 'text-blue-100' : 'text-gray-400'}`}>
                                                    {msg.time}
                                                </p>
                                            </div>

                                            {/* User Avatar */}
                                            {msg.direction === 'in' && (
                                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                                    <User size={16} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        <p className="text-sm">No messages in this conversation</p>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="px-6 py-4 border-t border-gray-100 bg-white">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        placeholder="Type your message..."
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        className="flex-1 px-4 py-3 bg-gray-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                    />
                                    <button className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <MessageSquare size={48} className="mx-auto mb-3 text-gray-300" />
                                <p className="text-sm">Select a conversation to view messages</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper functions
function formatTimeAgo(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
