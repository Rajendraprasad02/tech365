import { useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, Clock, Send, Bot, User, DollarSign, Sparkles, Plus, X, Headset } from 'lucide-react';
import { getSessions, triggerManualAI, sendWhatsAppMessage, getWhatsAppTemplates, sendWhatsAppTemplate } from '../../../services/api';

export default function ConversationsPage() {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [messageInput, setMessageInput] = useState('');
    const messagesEndRef = useRef(null);

    // Fetch conversations from API
    // New Conversation Modal State
    const [showNewConvModal, setShowNewConvModal] = useState(false);
    const [newConvPhone, setNewConvPhone] = useState('');
    const [newConvMessage, setNewConvMessage] = useState('');
    const [startingConv, setStartingConv] = useState(false);

    // Template Message State
    // const [isTemplateMode, setIsTemplateMode] = useState(false);
    // const [templates, setTemplates] = useState([]);
    // const [selectedTemplate, setSelectedTemplate] = useState('');
    // const [templateLoading, setTemplateLoading] = useState(false);

    // Fetch conversations from API
    const fetchConversations = async (targetId = null) => {
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
                    wa_id: session.whatsapp, // Add this for API calls
                    title: session.name || session.whatsapp || session.email || `Conversation #${index + 1}`,
                    preview: session.conversation?.[0]?.text?.substring(0, 50) || session.conversation?.[0]?.user?.substring(0, 50) || 'No messages',
                    status: session.conversation?.length > 0 ? 'active' : 'resolved',
                    time: formatTimeAgo(session.updated_at || session.created_at),
                    unread: session.conversation?.length > 5,
                    cost: totalCost.toFixed(4),
                    messages: session.conversation?.flatMap(msg => {
                        // Handle standard message structure
                        if (msg.text && msg.direction) {
                            return [{
                                text: msg.text,
                                direction: msg.direction,
                                time: formatTime(msg.timestamp),
                                cost: msg.whatsapp_cost || 0,
                            }];
                        }

                        // Handle role-based structure (AI/User single messages)
                        if (msg.role && msg.text) {
                            return [{
                                text: msg.text,
                                direction: msg.role === 'user' ? 'in' : 'out',
                                time: formatTime(msg.timestamp),
                                cost: msg.cost || 0
                            }];
                        }

                        // Handle turn-based structure (user/bot pair)
                        const turns = [];
                        if (msg.user) {
                            turns.push({
                                text: msg.user,
                                direction: 'in',
                                time: formatTime(msg.userTimestamp || msg.timestamp),
                                cost: 0
                            });
                        }
                        if (msg.bot) {
                            turns.push({
                                text: msg.bot,
                                direction: 'out',
                                time: formatTime(msg.botTimestamp || msg.timestamp),
                                cost: msg.cost || 0
                            });
                        }
                        return turns;
                    }) || [],
                };
            });

            setConversations(convos);

            // If a specific target ID is provided (e.g., after AI trigger), select it
            if (targetId) {
                const refreshedConv = convos.find(c => c.id === targetId);
                if (refreshedConv) {
                    setSelectedConversation(refreshedConv);
                }
            } else if (convos.length > 0 && !selectedConversation) {
                // Initial load: select first
                setSelectedConversation(convos[0]);
            } else if (selectedConversation) {
                // Refresh: keep current selection updated
                const refreshedConv = convos.find(c => c.id === selectedConversation.id);
                if (refreshedConv) {
                    setSelectedConversation(refreshedConv);
                }
            }

        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
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

    // Handle manual AI trigger
    const handleTriggerAI = async () => {
        if (!selectedConversation || !messageInput.trim()) return;

        try {
            const currentInput = messageInput;
            const waId = selectedConversation.wa_id;
            const currentConvId = selectedConversation.id;

            if (!waId) {
                alert("Cannot identify WhatsApp ID for this conversation.");
                return;
            }

            setMessageInput(''); // Clear immediately

            await triggerManualAI(waId, currentInput);

            // Refetch conversations and keep the current one selected
            await fetchConversations(currentConvId);

        } catch (error) {
            console.error("Failed to trigger AI:", error);
            alert("Failed to trigger AI. Check console.");
        }
    };

    // Handle Start New Conversation
    const handleStartConversation = async () => {
        if (!newConvPhone || !newConvMessage) {
            alert("Please enter both phone number and message.");
            return;
        }

        setStartingConv(true);
        try {
            // Send direct message (human initiated) without triggering AI
            await sendWhatsAppMessage(newConvPhone, newConvMessage);

            // Close modal and reset form
            setShowNewConvModal(false);
            setNewConvPhone('');
            setNewConvMessage('');

            // Refetch to see the new conversation
            await fetchConversations();

        } catch (error) {
            console.error("Failed to start conversation:", error);
            alert(`Failed to start conversation: ${error.message}`);
        } finally {
            setStartingConv(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Page Header */}
            <div className="px-8 py-6 bg-white border-b border-gray-100 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Conversations</h1>
                    <p className="text-gray-500 text-sm">Manage and review all conversations</p>
                </div>
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium border border-red-100"
                    onClick={() => alert("Agent Takeover Initiated")}
                >
                    <Headset size={18} />
                    Agent Takeover
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden p-6 gap-4">
                {/* Left Panel - Conversation List */}
                <div className="w-80 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
                    {/* Search and New Button */}
                    <div className="p-4 border-b border-gray-100 flex gap-2">
                        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg">
                            <Search size={16} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400 w-full min-w-0"
                            />
                        </div>
                        <button
                            onClick={() => setShowNewConvModal(true)}
                            className="w-10 h-10 bg-violet-500 hover:bg-violet-600 text-white rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                            title="Start New Conversation"
                        >
                            <Plus size={20} />
                        </button>
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
                                    <button
                                        onClick={handleTriggerAI}
                                        title="Trigger AI Response (Manual)"
                                        className="w-10 h-10 bg-purple-600 text-white rounded-lg flex items-center justify-center hover:bg-purple-700 transition-colors"
                                    >
                                        <Sparkles size={18} />
                                    </button>
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
            {/* New Conversation Modal */}
            {showNewConvModal && (
                <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-semibold text-gray-900">Start Conversation</h3>
                            <button
                                onClick={() => setShowNewConvModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (WhatsApp ID)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                                    placeholder="e.g. 919876543210"
                                    value={newConvPhone}
                                    onChange={(e) => setNewConvPhone(e.target.value)}
                                />
                            </div>

                            {/* Message Type Toggle */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Message</label>
                                <textarea
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500 transition-all h-24 resize-none"
                                    placeholder="Type the user's first message..."
                                    value={newConvMessage}
                                    onChange={(e) => setNewConvMessage(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    onClick={() => setShowNewConvModal(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleStartConversation}
                                    disabled={startingConv || !newConvPhone.trim() || !newConvMessage.trim()}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {startingConv ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            Send Message
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
