import { useState, useEffect } from 'react';
import { Search, Filter, Check, Clock, MessageSquare, X, User, FileText, Bot } from 'lucide-react';
import { getPendingSessions, assignSessionToAgent, getLeads, getLeadByPhone } from '../../../services/api';
import LeadDetailsModal from '../conversations/LeadDetailsModal';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../../store/slices/authSlice';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

export default function PendingConversationsPage() {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [approvingId, setApprovingId] = useState(null);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [conversationToApprove, setConversationToApprove] = useState(null);

    // Product Filter State
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('all');

    // Lead Details Modal State
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);

    const handleShowLeadDetails = async (e, phone) => {
        e.stopPropagation(); 
        try {
            const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
            if (!cleanPhone) {
                alert("No phone number available for this contact.");
                return;
            }
            const leadData = await getLeadByPhone(cleanPhone);
            setSelectedLead(leadData);
            setShowLeadModal(true);
        } catch (error) {
            console.error("Failed to fetch lead details:", error);
            alert("Could not fetch lead details. Lead might not exist.");
        }
    };

    // Auth context for current user ID
    const { user } = useSelector(selectAuth);

    useEffect(() => {
        fetchPendingConversations();
        // const intervalId = setInterval(fetchPendingConversations, 5000);
        // return () => clearInterval(intervalId);
    }, []);

    const fetchPendingConversations = async () => {
        try {
            const sessions = await getPendingSessions();
            const sessionList = Array.isArray(sessions) ? sessions : [];

            // Fetch leads for filtering and naming (Shared Logic)
            let leadsMap = {};
            try { 
                const leadsData = await getLeads(0, 100);
                const leads = Array.isArray(leadsData) ? leadsData : [];
                
                // Extract unique products
                const uniqueProducts = [...new Set(leads.map(l => l.product_interest).filter(Boolean))];
                setProducts(uniqueProducts);

                leads.forEach(l => {
                    if (l.phone_number) {
                        const p = l.phone_number.replace(/\D/g, '');
                        leadsMap[p] = l;
                    }
                });
            } catch (e) {
                console.error("Error fetching leads for pending filter:", e);
            }

            // Filter sessions: Only show if phone number exists in leads
            const filteredSessions = sessionList.filter(s => {
                if (!s.whatsapp && !s.wa_id) return false;
                const waId = (s.whatsapp || s.wa_id).replace(/\D/g, '');
                return leadsMap[waId] !== undefined;
            });

            const convos = filteredSessions.map((session, index) => {
                const messageCount = session.conversation_count || session.conversation?.length || 0;
                const lastMessage = session.conversation?.[session.conversation?.length - 1];
                const waId = session.whatsapp || session.wa_id;
                
                // Resolve Name: Lead Name > Session Name > WA ID
                const cleanWaId = waId ? waId.replace(/\D/g, '') : '';
                const lead = leadsMap[cleanWaId];
                const displayName = lead?.name || session.name || waId || session.email || `Contact #${index + 1}`;

                return {
                    id: session.id || index,
                    wa_id: waId,
                    name: displayName,
                    preview: lastMessage?.text?.substring(0, 80) || lastMessage?.user?.substring(0, 80) || 'No messages',
                    fullMessage: lastMessage?.text || lastMessage?.user || 'No messages available',
                    time: formatTimeAgo(session.updated_at || session.created_at),
                    rawValue: session.updated_at || session.created_at,
                    unread: messageCount,
                    contactId: waId ? `+${waId}` : `#${session.id}`,
                    // Mocking 'online' status based on recency (e.g. < 5 mins)
                    isOnline: isRecentlyActive(session.updated_at || session.created_at),
                    productInterest: lead?.product_interest, // Store for filtering
                    messages: (session.conversation || []).flatMap((msg, idx, arr) => {
                        // Handle Turn-based structures (user prompt + bot response)
                        if (msg.bot || msg.user) {
                            const turns = [];
                            
                            // Check if this 'user' prompt is a duplicate of a previously handled message
                            const prevMsg = idx > 0 ? arr[idx - 1] : null;
                            const isDuplicateUser = msg.user && prevMsg && (
                                (prevMsg.text === msg.user) || 
                                (prevMsg.role === 'user' && prevMsg.text === msg.user)
                            );

                            if (msg.user && !isDuplicateUser) {
                                turns.push({
                                    text: msg.user,
                                    direction: 'in',
                                    time: formatTime(msg.userTimestamp || msg.timestamp),
                                });
                            }
                            
                            if (msg.bot) {
                                turns.push({
                                    text: msg.bot,
                                    direction: 'out',
                                    time: formatTime(msg.botTimestamp || msg.timestamp),
                                });
                            }
                            return turns;
                        }

                        // Handle standard message structure
                        if (msg.text && msg.direction) {
                            return [{
                                text: msg.text,
                                direction: msg.direction,
                                time: formatTime(msg.timestamp),
                            }];
                        }

                        // Handle role-based structure (AI/User single messages)
                        if (msg.role && msg.text) {
                            return [{
                                text: msg.text,
                                direction: msg.role === 'user' ? 'in' : 'out',
                                time: formatTime(msg.timestamp),
                            }];
                        }

                        return [];
                    })
                };
            });

            setConversations(convos);
        } catch (error) {
            console.error('Error fetching pending conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const isRecentlyActive = (dateString) => {
        if (!dateString) return false;
        const diff = new Date() - new Date(dateString);
        return diff < 5 * 60 * 1000; // 5 minutes
    };

    const filteredConversations = conversations.filter(conv => {
        const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            conv.preview.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesProduct = selectedProduct === 'all' || conv.productInterest === selectedProduct;

        return matchesSearch && matchesProduct;
    });

    const handleApproveClick = (conv) => {
        setConversationToApprove(conv);
        setShowConfirmModal(true);
    };

    const handleConfirmApprove = async () => {
        if (!conversationToApprove) return;
        
        const conv = conversationToApprove;
        const currentUser = user || JSON.parse(localStorage.getItem('user'));
        const userId = currentUser?.id || currentUser?.userId;

        if (!userId) {
            console.error('No user ID found - cannot assign conversation. User state:', currentUser);
            alert('User identification failed. Please refresh the page or login again.');
            return;
        }

        setApprovingId(conv.id);
        try {
            await assignSessionToAgent(conv.id, userId);

            // Optimistic update: Remove from list immediately
            setConversations(prev => prev.filter(c => c.id !== conv.id));

            // Close modal if open
            if (selectedConversation?.id === conv.id) {
                setSelectedConversation(null);
            }

            setShowConfirmModal(false);
            setConversationToApprove(null);
        } catch (error) {
            console.error('Error approving conversation:', error);
            alert(`Failed to approve: ${error.message}`);
        } finally {
            setApprovingId(null);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-[#1E1B4B]">Pending Conversations</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {filteredConversations.length} conversations require attention
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-1 focus:ring-[#1E1B4B]"
                            />
                        </div>

                        
                        {/* Product Filter Dropdown */}
                        <div className="relative">
                           <select
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                                className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-8 rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#1E1B4B] cursor-pointer hover:bg-gray-50"
                            >
                                <option value="all">All Products</option>
                                {products.map((p, i) => (
                                    <option key={i} value={p}>{p}</option>
                                ))}
                            </select>
                             <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E1B4B]" />
                    </div>
                ) : filteredConversations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredConversations.map((conv) => (
                            <div key={conv.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative">
                                {/* Unread Badge */}
                                {conv.unread > 0 && (
                                    <div className="absolute top-5 right-5 h-6 min-w-[24px] px-1.5 bg-[#1E1B4B] text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {conv.unread}
                                    </div>
                                )}

                                {/* Profile & Content */}
                                <div className="mb-4">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-semibold mb-3">
                                        {getInitials(conv.name)}
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-1 truncate pr-8">{conv.name}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-2">
                                        {conv.preview}
                                    </p>
                                    <p className="text-xs text-gray-400 font-medium">
                                        {conv.time}
                                    </p>
                                </div>
                                
                                <button
                                    onClick={(e) => handleShowLeadDetails(e, conv.wa_id)}
                                    className="absolute top-5 right-14 text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50"
                                    title="View Lead Details"
                                >
                                    <FileText size={18} />
                                </button>

                                {/* Actions */}
                                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleApproveClick(conv)}
                                        disabled={approvingId === conv.id || (!user && !localStorage.getItem('user'))}
                                        title={!user ? "Loading user data..." : "Accept"}
                                        className="flex-1 flex items-center justify-center gap-2 bg-[#1E1B4B] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#2e2a6b] disabled:opacity-70 transition-colors"
                                    >
                                        <Check size={16} />
                                        {approvingId === conv.id ? '...' : 'Accept'}
                                    </button>
                                    <button
                                        onClick={() => setSelectedConversation(conv)}
                                        className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        <MessageSquare size={16} className="text-gray-500" />
                                        View Chats
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <Check size={24} className="text-green-600" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">All caught up!</h2>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            Great job! There are no pending conversations requiring attention.
                        </p>
                    </div>
                )}
            </div>

            {/* Footer Status Bar */}
            <div className="bg-white border-t border-gray-200 px-8 py-3 flex justify-between items-center text-xs text-gray-500">
                <div>
                    Showing {filteredConversations.length} conversations
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-[#1E1B4B]" />
                        <span>{filteredConversations.length} Pending</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>{filteredConversations.filter(c => c.isOnline).length} Online</span>
                    </div>
                </div>
            </div>

            {/* View Modal */}
            {selectedConversation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-4 flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-lg font-semibold text-gray-700">
                                        {getInitials(selectedConversation.name)}
                                    </div>
                                    {selectedConversation.isOnline && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-gray-900 text-lg">{selectedConversation.name}</h3>
                                        {selectedConversation.isOnline && (
                                            <div className="w-2 h-2 bg-green-500 rounded-full" title="Online" />
                                        )}
                                    </div>
                                    <p className="text-gray-500 text-sm">
                                        {selectedConversation.isOnline ? 'Online' : 'Offline'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedConversation(null)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Unread Tag */}
                        {selectedConversation.unread > 0 && (
                            <div className="px-6 pb-2">
                                <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                                    {selectedConversation.unread} unread messages
                                </span>
                            </div>
                        )}

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 max-h-[60vh]">
                            {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                                selectedConversation.messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-end gap-2 ${msg.direction === 'in' ? 'justify-start' : 'justify-end'}`}
                                    >
                                        {/* User Avatar (Left for 'in') */}
                                        {msg.direction === 'in' && (
                                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                                <User size={16} className="text-white" />
                                            </div>
                                        )}

                                        {/* Message Bubble */}
                                        <div
                                            className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${msg.direction === 'in'
                                                ? 'bg-white text-gray-900 border border-gray-100 rounded-bl-sm shadow-sm'
                                                : 'bg-[#1E1B4B] text-white rounded-br-sm'
                                                }`}
                                        >
                                            <div className="leading-relaxed">{renderMessageContent(msg.text)}</div>
                                            <p className={`text-[10px] mt-1 ${msg.direction === 'in' ? 'text-gray-400' : 'text-blue-200'}`}>
                                                {msg.time}
                                            </p>
                                        </div>

                                        {/* Bot Avatar (Right for 'out') */}
                                        {msg.direction === 'out' && (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                                <Bot size={16} className="text-gray-600" />
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                    <MessageSquare size={32} className="mb-2 opacity-50" />
                                    <p className="text-sm">No messages found</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 pt-4 flex gap-3">
                            <button
                                onClick={() => handleApproveClick(selectedConversation)}
                                disabled={approvingId === selectedConversation.id || (!user && !localStorage.getItem('user'))}
                                title={(!user && !localStorage.getItem('user')) ? "Loading user data..." : "Accept"}
                                className="flex-1 bg-[#1E1B4B] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2e2a6b] disabled:opacity-70 transition-colors flex items-center justify-center gap-2"
                            >
                                <Check size={18} />
                                {approvingId === selectedConversation.id ? 'Approving...' : 'Accept'}
                            </button>
                            <button
                                onClick={() => setSelectedConversation(null)}
                                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => {
                    setShowConfirmModal(false);
                    setConversationToApprove(null);
                }}
                onConfirm={handleConfirmApprove}
                title="Accept Conversation"
                message={`Are you sure you want to approve the conversation with ${conversationToApprove?.name}? This will assign the session to you.`}
                confirmText="Accept"
                type="info"
                loading={approvingId === conversationToApprove?.id}
            />

            {/* Lead Details Modal */}
            {showLeadModal && (
                <LeadDetailsModal 
                    lead={selectedLead} 
                    onClose={() => setShowLeadModal(false)} 
                />
            )}
        </div>
    );
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    if (!timestamp) return '';
    // Treat as UTC if missing timezone info
    const date = new Date(timestamp.endsWith('Z') || /[+\-]\d{2}:?\d{2}/.test(timestamp) ? timestamp : timestamp + 'Z');
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatTimeAgo(dateString) {
    if (!dateString) return 'Unknown';
    // Treat as UTC if missing timezone info
    const date = new Date(dateString.endsWith('Z') || /[+\-]\d{2}:?\d{2}/.test(dateString) ? dateString : dateString + 'Z');
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
}

// Helper to safely parse and format JSON-like strings
function renderMessageContent(text) {
    if (!text) return '';
    
    // Check if it's a lead capture message
    if (typeof text === 'string' && text.startsWith('[LEAD_CAPTURE]')) {
        try {
            // Extract the JSON-like part
            const jsonPart = text.replace('[LEAD_CAPTURE]', '').trim();
            
            // Attempt to make it valid JSON (replace single quotes with double quotes)
            // Note: This is a simple heuristic and might fail on complex strings containing escaped quotes
            const validJson = jsonPart.replace(/'/g, '"');
            const data = JSON.parse(validJson);
            
            return (
                <div className="mt-1 space-y-1">
                    <div className="text-xs font-semibold opacity-75 mb-2 border-b border-white/20 pb-1">Lead Captured</div>
                    {Object.entries(data).map(([key, value]) => {
                        if (key === 'flow_token') return null;
                        // Clean keys: screen_0_First_0 -> First
                        const label = key.replace(/screen_\d+_/, '').replace(/_\d+$/, '').replace(/_/g, ' ');
                        return (
                            <div key={key} className="flex flex-col">
                                <span className="text-[10px] opacity-70 uppercase tracking-wide">{label}</span>
                                <span className="text-sm font-medium">{value}</span>
                            </div>
                        );
                    })}
                </div>
            );
        } catch (e) {
            console.warn('Failed to parse LEAD_CAPTURE message:', e);
            // Fallback to raw text if parsing fails
            return text;
        }
    }
    
    // Regular text
    return text;
}
