import { useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, Clock, ArrowLeft, Send, Bot, User, DollarSign, Plus, X, Headset, CheckCircle, AlertCircle, Info, FileText, ChevronDown, CornerUpLeft } from 'lucide-react';
import { getSessions, getAgentSessions, sendWhatsAppMessage, sendSessionMessage, getWhatsAppTemplates, sendWhatsAppTemplate, getUserDetails, endSession, closeConversation, reopenConversation, unspamUser, getUsers, notifyAgentTyping, assignSessionToAgent, getLeadByPhone, getLeads } from '../../../services/api';
import LeadDetailsModal from './LeadDetailsModal';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import CloseChatModal from './CloseChatModal';
import NotesHistoryModal from './NotesHistoryModal';
import { useSelector } from 'react-redux';
import { selectAuth, selectIsAgent } from '../../../store/slices/authSlice';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { useToast } from '../../../context/ToastContext';

export default function ConversationsPage() {
    const { toast } = useToast();
    const { user, permissions } = useSelector(selectAuth);

    const isAgent = useSelector(selectIsAgent);
    const conversationPerms = permissions?.['conversations'] || {};
    const isAgentEffective = isAgent && !conversationPerms.manage && !conversationPerms.configure;


    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [messageInput, setMessageInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved'

    // Synchronize default filter when permissions/role are loaded
    useEffect(() => {
        if (isAgentEffective) {
            setStatusFilter('assigned');
        } else {
            setStatusFilter('all');
        }
    }, [isAgentEffective]);

    // Agent Filter State for Admins
    const [agents, setAgents] = useState([]);
    const [allUsers, setAllUsers] = useState([]); // Store all users for name resolution
    const [selectedAgentFilter, setSelectedAgentFilter] = useState('all');
    const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
    const agentMenuRef = useRef(null);
    const reportTooltipRef = useRef(null);

    const messagesEndRef = useRef(null);
    const lastConversationId = useRef(null);

    // Fetch conversations from API
    // New Conversation Modal State
    const [showNewConvModal, setShowNewConvModal] = useState(false);
    const [newConvPhone, setNewConvPhone] = useState('');
    const [newConvMessage, setNewConvMessage] = useState('');
    const [startingConv, setStartingConv] = useState(false);

    // Typing Indicator Logic
    const lastTypingTime = useRef(0);
    const handleTyping = () => {
        if (!selectedConversation?.wa_id) return;

        const now = Date.now();
        // Throttle: Send every 8 seconds while typing
        if (now - lastTypingTime.current > 8000) {
            lastTypingTime.current = now;
            notifyAgentTyping(selectedConversation.wa_id).catch(err => {
                console.warn("[Typing] Indicator failed:", err.message);
            });
        }
    };

    // Template Message State
    const [isTemplateMode, setIsTemplateMode] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [templateLoading, setTemplateLoading] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    // Typing Sessions (State to track who is typing)
    // Key: wa_id, Value: boolean
    const [typingSessions, setTypingSessions] = useState({});
    const typingTimeouts = useRef({});

    // Lead Details Modal State
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [assignedAgent, setAssignedAgent] = useState(null);
    const [showAgentModal, setShowAgentModal] = useState(false);
    const [showEndChatConfirm, setShowEndChatConfirm] = useState(false);

    // Assign Pending Chat State
    const [approvingId, setApprovingId] = useState(null);
    const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false);
    const [conversationToApprove, setConversationToApprove] = useState(null);
    const [approveConfirmMessage, setApproveConfirmMessage] = useState('');

    // Error Handling Modal
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [showCloseChatModal, setShowCloseChatModal] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [activeReportTooltipId, setActiveReportTooltipId] = useState(null);
    // Notes are stored in selectedConversation.contact_info.agent_notes

    // Reopen Chat Modal State
    const [showReopenModal, setShowReopenModal] = useState(false);
    const [reopenReason, setReopenReason] = useState('');
    const [isReopening, setIsReopening] = useState(false);
    const [isUnspamming, setIsUnspamming] = useState(false);

    // Fetch Users (Agents + Admins) for Resolution & Filtering
    useEffect(() => {
        const fetchUsersData = async () => {
            try {
                const response = await getUsers();
                let usersList = [];
                if (Array.isArray(response)) {
                    usersList = response;
                } else if (response && response.users && Array.isArray(response.users)) {
                    usersList = response.users;
                }

                // Store ALL users for name resolution (reported by, notes, etc.)
                setAllUsers(usersList);

                // If not an agent (has permissions to see all), populate filter list
                if (!isAgentEffective) {
                    setAgents(usersList);
                }
            } catch (err) {
                console.error("Failed to fetch users data:", err);
            }
        };

        fetchUsersData();
    }, [isAgentEffective]);

    // Close custom agent menu on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (agentMenuRef.current && !agentMenuRef.current.contains(event.target)) {
                setIsAgentMenuOpen(false);
            }
            if (reportTooltipRef.current && !reportTooltipRef.current.contains(event.target)) {
                setActiveReportTooltipId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch Templates
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const response = await getWhatsAppTemplates();
                const list = (response?.templates || response || []).filter(t => t.status === 'APPROVED');
                setTemplates(list);
            } catch (error) {
                console.warn("Failed to fetch templates:", error);
            }
        };
        fetchTemplates();
    }, []);
    useEffect(() => {
        // Robust user ID retrieval matching fetchConversations logic
        const currentUser = user || JSON.parse(localStorage.getItem('user'));
        const userId = currentUser?.id || currentUser?.userId;

        // Generate a random client ID or use user ID
        const clientId = userId ? `agent_${userId}` : `session_${Date.now()}`;

        // Use environment variable for WebSocket URL
        const apiUrl = import.meta.env.VITE_DATA_API_URL || 'http://localhost:8000';
        console.log("🔍 [DEBUG] Resolved WebSocket API URL:", apiUrl);

        const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
        const wsHost = apiUrl.replace(/^https?:\/\//, '');
        const wsUrl = `${wsProtocol}://${wsHost}/ws/${clientId}`;

        console.log("✅ [WS] Connecting to:", wsUrl);
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("✅ [WS] Connected to WebSocket:", wsUrl);
        };

        ws.onmessage = (event) => {
            try {
                const rawData = event.data;
                const data = JSON.parse(rawData);
                console.log("📩 [WS] Received:", data);

                // 1. Handle New Message
                if (data.type === "new_message" && data.message) {
                    const incomingMsg = data.message;
                    const formattedMsg = {
                        text: incomingMsg.text,
                        direction: incomingMsg.direction,
                        time: formatTime(incomingMsg.timestamp),
                        cost: 0,
                        isAgent: !!incomingMsg.agent_id,
                        isBot: !incomingMsg.agent_id && incomingMsg.direction === 'out',
                        ...(incomingMsg.direction === 'in' ? { role: 'user' } : { role: 'assistant' })
                    };

                    setConversations(prev => {
                        const waIdNorm = incomingMsg.wa_id?.replace(/\D/g, '');
                        const exists = prev.some(c => c.wa_id?.replace(/\D/g, '') === waIdNorm);

                        if (!exists) {
                            fetchConversations(null, true);
                            return prev;
                        }

                        return prev.map(conv => {
                            const convWaId = conv.wa_id?.replace(/\D/g, '');
                            if (convWaId === waIdNorm) {
                                // Deduplicate by checking content and recent timestamp
                                const isDuplicate = conv.messages?.some(m =>
                                    m.text === formattedMsg.text &&
                                    Math.abs(new Date().getTime() - new Date(incomingMsg.timestamp).getTime()) < 5000
                                );
                                if (isDuplicate) return conv;

                                const isActive = selectedConversation?.id === conv.id;
                                return {
                                    ...conv,
                                    messages: [...(conv.messages || []), formattedMsg],
                                    preview: formattedMsg.text.substring(0, 50),
                                    time: "Just now",
                                    unread: !isActive,
                                    unreadCount: isActive ? 0 : (conv.unreadCount || 0) + 1
                                };
                            }
                            return conv;
                        });
                    });

                    setSelectedConversation(prev => {
                        if (!prev) return null;
                        const prevWaId = prev.wa_id?.replace(/\D/g, '');
                        const msgWaId = incomingMsg.wa_id?.replace(/\D/g, '');

                        if (prevWaId === msgWaId) {
                            // Deduplicate
                            const isDuplicate = prev.messages?.some(m =>
                                m.text === formattedMsg.text &&
                                Math.abs(new Date().getTime() - new Date(incomingMsg.timestamp).getTime()) < 5000
                            );
                            if (isDuplicate) return prev;

                            return {
                                ...prev,
                                messages: [...(prev.messages || []), formattedMsg],
                                time: "Just now"
                            };
                        }
                        return prev;
                    });
                }

                // 2. Handle New Conversation
                if (data.type === "new_conversation") {
                    fetchConversations(null, true);
                }

                // 3. Handle Assignment/Status Changes
                if (["conversation_assigned", "conversation_released", "conversation_closed", "conversation_reopened", "user_unspammed"].includes(data.type)) {
                    console.log(`📩 [WS] State Change detected: ${data.type}. Refreshing list silently.`);
                    fetchConversations(selectedConversation?.id, true);
                }

                // 4. Handle Typing Status (Incoming)
                if (data.type === "typing") {
                    const waId = data.wa_id?.replace(/\D/g, '');
                    if (waId) {
                        setTypingSessions(prev => ({
                            ...prev,
                            [waId]: data.typing
                        }));

                        // Auto-clear if typing: False or after 10s of no updates
                        if (typingTimeouts.current[waId]) {
                            clearTimeout(typingTimeouts.current[waId]);
                        }

                        if (data.typing) {
                            typingTimeouts.current[waId] = setTimeout(() => {
                                setTypingSessions(prev => ({
                                    ...prev,
                                    [waId]: false
                                }));
                            }, 10000);
                        }
                    }
                }

                // 5. Handle Status Updates (Message Delivered/Read)
                if (data.type === "message_status_update") {
                    // Update specific message in list
                }

            } catch (err) {
                console.error("❌ [WS] Error processing message:", err);
            }
        };

        ws.onclose = () => console.log("⚠️ [WS] Disconnected");
        ws.onerror = (error) => console.log("❌ [WS] Error:", error);

        return () => ws.close();
    }, [user?.id]); // Only reconnect if user changes

    // ✅ Fetch Missing User Details (By ID)
    // Ensures accurate names even if "getUsers" didn't return everyone (e.g. admins)
    useEffect(() => {
        const fetchMissingUsers = async () => {
            const neededIds = new Set();

            // 1. Check reported agents in conversation list
            conversations.forEach(c => {
                if (c.reportedAgentId) neededIds.add(c.reportedAgentId);
            });

            // 2. Check notes in selected conversation
            if (selectedConversation?.contact_info?.agent_notes) {
                selectedConversation.contact_info.agent_notes.forEach(n => {
                    if (n.agent_id) neededIds.add(n.agent_id);
                });
            }

            // 3. Check reopened_by in conversation list
            conversations.forEach(c => {
                if (c.reopened_by) neededIds.add(c.reopened_by);
            });

            // 4. Filter out IDs we already have in allUsers
            const existingIds = new Set(allUsers.map(u => u.id));
            const idsToFetch = [...neededIds].filter(id => !existingIds.has(id) && !existingIds.has(parseInt(id)));

            if (idsToFetch.length === 0) return;

            console.log("🔍 [Users] Fetching details for missing IDs:", idsToFetch);

            // 4. Fetch details for missing IDs
            const newUsers = await Promise.all(idsToFetch.map(async (id) => {
                try {
                    const userDetails = await getUserDetails(id);
                    return userDetails;
                } catch (e) {
                    console.warn(`Failed to fetch details for user ${id}`, e);
                    return null;
                }
            }));

            const validNewUsers = newUsers.filter(u => u && u.id);
            if (validNewUsers.length > 0) {
                setAllUsers(prev => {
                    // Double check to prevent duplicates
                    const currentIds = new Set(prev.map(u => u.id));
                    const uniqueNewUsers = validNewUsers.filter(u => !currentIds.has(u.id));
                    return [...prev, ...uniqueNewUsers];
                });
            }
        };

        if (conversations.length > 0) {
            fetchMissingUsers();
        }
    }, [conversations, selectedConversation, allUsers.length]);




    useEffect(() => {
        const fetchAgentDetails = async () => {
            // Reset agent when conversation changes or if no agent is assigned
            if (!selectedConversation?.assigned_agent_id) {
                setAssignedAgent(null);
                return;
            }

            try {
                const agent = await getUserDetails(selectedConversation.assigned_agent_id);
                setAssignedAgent(agent);
            } catch (error) {
                console.error("Failed to fetch agent details:", error);
                setAssignedAgent(null);
            }
        };
        fetchAgentDetails();
    }, [selectedConversation?.id, selectedConversation?.assigned_agent_id]);

    // Lead Details logic removed for cleanup

    // Fetch conversations from API
    const fetchConversations = async (targetId = null, silent = false) => {
        if (!silent) setLoading(true);
        try {
            let sessions = [];

            // Robust user ID retrieval
            const currentUser = user || JSON.parse(localStorage.getItem('user'));
            const userId = currentUser?.id || currentUser?.userId;

            if (isAgentEffective) {
                if (userId) {
                    const response = await getAgentSessions(userId);
                    if (response && Array.isArray(response.conversations)) {
                        sessions = response.conversations;
                    } else if (response && Array.isArray(response.sessions)) {
                        sessions = response.sessions;
                    } else if (Array.isArray(response)) {
                        sessions = response;
                    } else {
                        sessions = [];
                    }
                } else {
                    console.warn("Agent detected but no User ID found. Waiting for auth...");
                    sessions = [];
                }
            } else {
                // Not an agent (Admin) -> Show all
                const response = await getSessions();
                sessions = response?.conversations || (Array.isArray(response) ? response : []);
            }

            const sessionList = Array.isArray(sessions) ? sessions : [];

            // Fetch leads for name resolution (Shared Logic)
            let leadsMap = {};
            try {
                const leadsData = await getLeads(0, 100);
                const leads = Array.isArray(leadsData) ? leadsData : [];
                leads.forEach(l => {
                    if (l.phone_number) {
                        const p = l.phone_number.replace(/\D/g, '');
                        leadsMap[p] = l;
                    }
                });
            } catch (e) {
                console.error("Error fetching leads for name resolution:", e);
            }

            // Transform sessions to conversation format
            const convos = sessionList.map((session, index) => {
                const messageCount = session.conversation_count || session.conversation?.length || 0;
                let totalCost = parseFloat(session.total_conversation_cost_inr) || (parseFloat(session.total_conversation_cost_usd) || 0) * 85;
                if (!totalCost && session.conversation && Array.isArray(session.conversation)) {
                    totalCost = 0;
                    session.conversation.forEach(msg => {
                        if (msg.bot && msg.cost) totalCost += parseFloat(msg.cost) * 85;
                        if (msg.whatsapp_cost) totalCost += parseFloat(msg.whatsapp_cost) * 85;
                        if (msg.role !== 'user' && msg.cost && !msg.bot) totalCost += parseFloat(msg.cost) * 85;
                    });
                }

                // Resolve display name: Lead Name > Session Name > WhatsApp > Email
                const waId = session.whatsapp || session.wa_id;
                const cleanWaId = waId ? String(waId).replace(/\D/g, '') : '';
                const lead = leadsMap[cleanWaId];
                const formattedWhatsapp = waId ? '+' + String(waId).replace(/^\+/, '') : '';
                let displayName = lead?.name || session.name || formattedWhatsapp || session.email || `Conversation #${index + 1}`;
                if (/^\d{10,15}$/.test(displayName)) {
                    displayName = '+' + displayName;
                }

                const lastMsg = session.conversation?.[session.conversation.length - 1];

                const effectiveAgentId = session.assigned_agent_id;
                const isClosed = session.status === 'closed' || session.status === 'resolved' || session.status === 'CLOSED' || session.status === 'RESOLVED';

                // Reported Logic (Session native only)
                const isReported = session.contact_info?.is_reported || false;

                return {
                    id: session.id || index,
                    wa_id: session.whatsapp,
                    title: displayName,
                    preview: lastMsg?.text?.substring(0, 50) || lastMsg?.user?.substring(0, 50) || 'No messages',
                    status: isClosed ? 'resolved' : (session.status !== 'active' ? session.status : 'active'),
                    time: formatTimeAgo(session.updated_at || session.created_at),
                    unread: false,
                    unreadCount: 0,
                    cost: totalCost.toFixed(2),
                    isReported,
                    assigned_agent_id: effectiveAgentId,
                    assigned_at: session.assigned_at,
                    closed_by: session.closed_by || null,
                    approvalStatus: isClosed
                        ? 'closed'
                        : (effectiveAgentId)
                            ? 'assigned'
                            : 'pending',
                    messages: session.conversation?.flatMap((msg, idx, arr) => {
                        // Handle Turn-based structures (user prompt + bot response)
                        // This usually comes after a standard message entry, leading to duplicates.
                        if (msg.bot || msg.user) {
                            const turns = [];

                            // Check if this 'user' prompt is a duplicate of a previously handled message
                            // We compare with the immediately preceding message in the backend array
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
                                    timestamp: msg.userTimestamp || msg.timestamp,
                                    cost: 0
                                });
                            }

                            if (msg.bot) {
                                const isHuman = msg.botSenderType === 'HUMAN';
                                // If not human, it's a bot/system message
                                const isBot = !isHuman;

                                turns.push({
                                    text: msg.bot,
                                    direction: 'out',
                                    time: formatTime(msg.botTimestamp || msg.timestamp),
                                    timestamp: msg.botTimestamp || msg.timestamp,
                                    cost: msg.cost || 0,
                                    isBot: isBot,
                                    isAgent: isHuman,
                                    botSenderId: msg.botSenderId // Pass this through for name resolution
                                });
                            }
                            return turns;
                        }

                        // Handle standard message structure (WhatsApp/System messages)
                        if (msg.text && msg.direction) {
                            return [{
                                text: msg.text,
                                direction: msg.direction,
                                time: formatTime(msg.timestamp),
                                timestamp: msg.timestamp,
                                cost: msg.whatsapp_cost || 0,
                                isAgent: !!msg.agent_id,
                                isBot: !msg.agent_id && msg.direction === 'out'
                            }];
                        }

                        // Handle role-based structure (Simple User/AI logs)
                        if (msg.role && msg.text) {
                            return [{
                                text: msg.text,
                                direction: msg.role === 'user' ? 'in' : 'out',
                                time: formatTime(msg.timestamp),
                                timestamp: msg.timestamp,
                                cost: msg.cost || 0,
                                isAgent: !!msg.agent_id,
                                isBot: !msg.agent_id && msg.role !== 'user'
                            }];
                        }

                        return [];
                    }) || [],
                };
            });

            // Sort conversations by updated_at (newest first)
            convos.sort((a, b) => {
                const sessionA = sessionList.find(s => (s.id || s.index) === a.id);
                const sessionB = sessionList.find(s => (s.id || s.index) === b.id);
                const dateA = new Date(sessionA?.updated_at || sessionA?.created_at || 0);
                const dateB = new Date(sessionB?.updated_at || sessionB?.created_at || 0);
                return dateB - dateA;
            });

            setConversations(convos);

            // Selection logic - for agents, all their conversations are already assigned to them
            if (targetId) {
                const refreshedConv = convos.find(c => c.id === targetId);
                if (refreshedConv) {
                    setSelectedConversation(refreshedConv);
                }
            } else if (selectedConversation) {
                // Refresh: keep current selection updated
                const refreshedConv = convos.find(c => c.id === selectedConversation.id);
                if (refreshedConv) {
                    setSelectedConversation(refreshedConv);
                } else if (convos.length > 0) {
                    setSelectedConversation(convos[0]);
                } else {
                    setSelectedConversation(null);
                }
            } else if (convos.length > 0) {
                // Initial load: select first conversation
                setSelectedConversation(convos[0]);
            }

        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id || localStorage.getItem('user')) {
            fetchConversations();
        }
    }, [isAgentEffective, user?.id]); // Re-fetch only when agent status or user ID changes

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (!selectedConversation) return;

        const container = messagesEndRef.current?.parentElement;
        if (container) {
            // Check if user is near bottom (within 150px)
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
            const isNewConversation = lastConversationId.current !== selectedConversation.id;

            // Only scroll if we switched conversation or we are already at the bottom
            if (isNewConversation || isNearBottom) {
                messagesEndRef.current?.scrollIntoView({
                    behavior: isNewConversation ? 'auto' : 'smooth'
                });
            }
        }
        lastConversationId.current = selectedConversation.id;
    }, [selectedConversation?.id, selectedConversation?.messages?.length]);

    // Unified Status Filtering
    let displayedConversations;
    if (statusFilter === 'all') {
        displayedConversations = conversations;
    } else if (statusFilter === 'pending') {
        displayedConversations = conversations.filter(conv => conv.approvalStatus === 'pending');
    } else if (statusFilter === 'assigned') {
        displayedConversations = conversations.filter(conv => conv.approvalStatus === 'assigned');
    } else if (statusFilter === 'active') {
        displayedConversations = conversations.filter(conv => conv.approvalStatus === 'active');
    } else if (statusFilter === 'closed' || statusFilter === 'resolved') {
        displayedConversations = conversations.filter(conv => conv.approvalStatus === 'closed' || conv.status === 'resolved');
    } else if (statusFilter === 'reported') {
        displayedConversations = conversations.filter(conv => conv.isReported);
    } else {
        displayedConversations = conversations;
    }

    // Role-based extra filtering (Admins can also filter by Agent)
    if (!isAgentEffective && selectedAgentFilter !== 'all') {
        displayedConversations = displayedConversations.filter(conv =>
            conv.assigned_agent_id && String(conv.assigned_agent_id) === String(selectedAgentFilter)
        );
    }


    // Auto-select first conversation when filter changes
    useEffect(() => {
        if (displayedConversations.length > 0) {
            setSelectedConversation(displayedConversations[0]);
        } else {
            setSelectedConversation(null);
        }
    }, [statusFilter, selectedAgentFilter, displayedConversations.length]); // Depend on filters

    // Filter by search
    const filteredConversations = displayedConversations.filter(conv =>
        String(conv.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(conv.preview || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Helper to resolve agent name safely
    const resolveAgentName = (id, fallbackName) => {
        if (!id) return fallbackName || 'Agent';
        // Look up in the full users list, not just the filtered agents list
        const user = allUsers.find(u => u.id === id || u.id === parseInt(id));
        return user ? (user.full_name || user.username) : (fallbackName || 'Agent');
    };

    // Filter conversations for stats calculation based on Agent Filter
    let statsConversations = conversations;
    if (!isAgentEffective && selectedAgentFilter !== 'all') {
        statsConversations = conversations.filter(conv =>
            conv.assigned_agent_id && String(conv.assigned_agent_id) === String(selectedAgentFilter)
        );
    }

    // Stats for Admin view
    const pendingCount = statsConversations.filter(c => c.approvalStatus === 'pending').length;
    const assignedCount = statsConversations.filter(c => c.approvalStatus === 'assigned').length;
    const activeCount = statsConversations.filter(c => c.approvalStatus === 'active').length;
    const closedCount = statsConversations.filter(c => c.approvalStatus === 'closed').length;
    const reportedCount = statsConversations.filter(c => c.isReported).length;

    // Get status badge styling
    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-700';
            case 'pending':
                return 'bg-amber-100 text-amber-700';
            case 'resolved':
            case 'closed':
                return 'bg-gray-100 text-gray-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    // Lead Details logic
    const handleShowLeadDetails = async (e, phone) => {
        e.stopPropagation();
        try {
            const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
            if (!cleanPhone) {
                toast({ title: "Warning", description: "No phone number available for this contact.", variant: "destructive" });
                return;
            }
            const leadData = await getLeadByPhone(cleanPhone);
            setSelectedLead(leadData);
            setShowLeadModal(true);
        } catch (error) {
            console.error("Failed to fetch lead details:", error);
            toast({ title: "Error", description: "Could not fetch lead details. Lead might not exist.", variant: "destructive" });
        }
    };

    // Handle Start New Conversation
    const handleStartConversation = async () => {
        if (!newConvPhone || !newConvMessage) {
            toast({ title: "Validation Error", description: "Please enter both phone number and message.", variant: "destructive" });
            return;
        }

        if (!isValidPhoneNumber(newConvPhone)) {
            toast({ title: "Validation Error", description: "Please enter a valid phone number with length and country code.", variant: "destructive" });
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
            toast({ title: "Success", description: "Conversation started successfully.", variant: "success" });
        } catch (error) {
            console.error("Failed to start conversation:", error);
            toast({ title: "Error", description: `Failed to start conversation: ${error.message}`, variant: "destructive" });
        } finally {
            setStartingConv(false);
        }
    };

    if (loading) {
        return (
            <div className="loader-wrapper bg-gray-50/50">
                <span className="loader mb-4"></span>
                <p className="mt-4 text-sm font-bold text-gray-500 uppercase tracking-widest animate-pulse">Loading conversations...</p>
            </div>
        );
    }

    // Handle Send Message
    const handleSendMessage = async () => {
        if (!selectedConversation || !messageInput.trim()) return;

        const message = messageInput;
        // const waId = selectedConversation.wa_id; // No longer needed for this endpoint

        setMessageInput(''); // Clear input immediately for better UX
        try {
            await sendSessionMessage(selectedConversation.id, message);
            // Re-fetch SILENTLY to see the new message (in case WS missed it)
            await fetchConversations(selectedConversation.id, true);
        } catch (error) {
            console.error("Failed to send message:", error);

            if (error.response && error.response.status === 400) {
                const detail = error.response.data?.detail || "The 24-hour service window has expired.";
                setErrorMessage(detail);
                setShowErrorModal(true);
            } else {
                const genericMsg = error.response?.data?.detail || error.message || "An unexpected error occurred.";
                toast({ title: "Request Failed", description: `Failed to send message: ${genericMsg}`, variant: "destructive" });
            }

            setMessageInput(message); // Restore input on failure
        }
    };

    const handleSendTemplate = async (templateName) => {
        if (!selectedConversation || !templateName) return;

        setTemplateLoading(true);
        try {
            await sendWhatsAppTemplate(selectedConversation.wa_id, templateName);
            toast({ title: "Success", description: `Template '${templateName}' sent.`, variant: "success" });
            setShowTemplateModal(false);

            // Optimistically add template message to UI immediately
            const templateMsg = {
                text: `[Template: ${templateName.replace(/_/g, ' ')}]`,
                direction: 'out',
                time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                timestamp: new Date().toISOString(),
                cost: 0,
                isBot: false,
                isAgent: true,
            };

            // Update selected conversation with optimistic message
            setSelectedConversation(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    messages: [...(prev.messages || []), templateMsg],
                    preview: templateMsg.text.substring(0, 50),
                    time: 'Just now'
                };
            });

            // Update conversations list as well
            setConversations(prev => prev.map(conv =>
                conv.id === selectedConversation.id
                    ? { ...conv, messages: [...(conv.messages || []), templateMsg], preview: templateMsg.text.substring(0, 50), time: 'Just now' }
                    : conv
            ));

            // Delayed refetch to sync with backend (template processing is async)
            setTimeout(() => {
                fetchConversations(selectedConversation.id, true);
            }, 3000);
        } catch (error) {
            console.error("Failed to send template:", error);
            const msg = error.response?.data?.detail || error.message || "Failed to send template";
            toast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
            setTemplateLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleApproveClick = (conv) => {
        setConversationToApprove(conv);

        let message = `Are you sure you want to approve the conversation with ${conv.name}? This will assign the session to you.`;

        // Zero Trust: Always show default approval message

        setApproveConfirmMessage(message);
        setShowApproveConfirmModal(true);
    };

    const handleConfirmApprove = async () => {
        if (!conversationToApprove) return;

        const conv = conversationToApprove;
        const currentUser = user || JSON.parse(localStorage.getItem('user'));
        const userId = currentUser?.id || currentUser?.userId;

        if (!userId) {
            console.error('No user ID found - cannot assign conversation. User state:', currentUser);
            toast({ title: "User Error", description: 'User identification failed. Please refresh the page or login again.', variant: "destructive" });
            return;
        }

        setApprovingId(conv.id);
        try {
            await assignSessionToAgent(conv.id, userId);

            // Optimistic update: Update in list immediately
            setConversations(prev => prev.map(c =>
                c.id === conv.id ? { ...c, approvalStatus: 'assigned', assigned_agent_id: userId } : c
            ));

            if (selectedConversation?.id === conv.id) {
                setSelectedConversation(prev => ({ ...prev, approvalStatus: 'assigned', assigned_agent_id: userId }));
            }

            setShowApproveConfirmModal(false);
            setConversationToApprove(null);
            toast({ title: "Success", description: "Chat assigned to you successfully.", variant: "success" });
        } catch (error) {
            console.error('Error approving conversation:', error);
            toast({ title: "Error", description: `Failed to approve: ${error.message}`, variant: "destructive" });
        } finally {
            setApprovingId(null);
        }
    };

    // Handle End Chat
    // Handle End Chat Click
    const handleEndChat = () => {
        if (!selectedConversation) return;
        // Use new modal instead of simple confirmation
        setShowCloseChatModal(true);
    };

    // New: Submit Close Chat with Feedback
    // New: Submit Close Chat with Feedback
    const handleCloseChatSubmit = async (data) => {
        if (!selectedConversation) return;

        const currentUser = user || JSON.parse(localStorage.getItem('user'));
        const userId = currentUser?.id || currentUser?.userId;

        setIsClosing(true);
        try {
            await closeConversation(selectedConversation.id, {
                ...data,
                agent_id: userId
            });

            // Clear selection and refresh list SILENTLY
            setSelectedConversation(null);
            setShowCloseChatModal(false);
            await fetchConversations(null, true);

        } catch (error) {
            console.error("Failed to close conversation:", error);
            const msg = error.response?.data?.detail || error.message || "Failed to close conversation";
            toast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
            setIsClosing(false);
        }
    };

    // Handle Reopen Chat Submit
    const handleReopenSubmit = async () => {
        if (!selectedConversation || !reopenReason.trim()) return;

        const currentUser = user || JSON.parse(localStorage.getItem('user'));
        const userId = currentUser?.id || currentUser?.userId;

        setIsReopening(true);
        try {
            await reopenConversation(selectedConversation.id, {
                agent_id: userId,
                reason: reopenReason.trim()
            });

            toast({ title: "Success", description: "Chat reopened successfully.", variant: "success" });

            setShowReopenModal(false);
            setReopenReason('');

            // Keep selection and refresh list SILENTLY to see the reopened status
            await fetchConversations(selectedConversation.id, true);

        } catch (error) {
            console.error("Failed to reopen conversation:", error);
            const msg = error.response?.data?.detail || error.message || "Failed to reopen conversation";
            toast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
            setIsReopening(false);
        }
    };

    // Handle Unspam User
    const handleUnspamUser = async () => {
        if (!selectedConversation) return;

        const currentUser = user || JSON.parse(localStorage.getItem('user'));
        const userId = currentUser?.id || currentUser?.userId;

        setIsUnspamming(true);
        try {
            await unspamUser(selectedConversation.id);

            toast({ title: "Success", description: "User unspammed and restored successfully.", variant: "success" });

            // Refresh the current conversation SILENTLY to update its status
            await fetchConversations(selectedConversation.id, true);
        } catch (error) {
            console.error("Failed to unspam user:", error);
            const msg = error.response?.data?.detail || error.message || "Failed to unspam user";
            toast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
            setIsUnspamming(false);
        }
    };

    // Confirm End Session (API Call) - KEEPING FOR BACKWARD COMPATIBILITY OR ADMIN OVERRIDE IF NEEDED
    // BUT UI NOW USES handleCloseChatSubmit
    const confirmEndSession = async () => {
        try {
            const currentUser = user || JSON.parse(localStorage.getItem('user'));
            const userId = currentUser?.id || currentUser?.userId;

            await endSession(selectedConversation.id, userId);

            // Clear selection and refresh list SILENTLY
            setSelectedConversation(null);
            fetchConversations(null, true);
            setShowEndChatConfirm(false);
        } catch (error) {
            console.error("Failed to end session:", error);
            toast({ title: "Error", description: `Failed to end session: ${error.message}`, variant: "destructive" });
            setShowEndChatConfirm(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden h-full max-h-[calc(100vh-64px)] min-h-0">
            {/* Page Header */}
            <div className={`p-4 bg-white border-b border-gray-100 flex-shrink-0 ${selectedConversation ? 'hidden lg:block' : 'block'}`}>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 ">Conversations</h1>
                        {/* <p className="text-gray-500 text-sm">
                        {isAgentEffective
                            ? 'Manage your assigned conversations'
                            : `${filteredConversations.length} conversations • ${activeCount} active, ${pendingCount} pending`
                        }
                    </p> */}
                    </div>
                </div>

                {/* Status Filter Tabs - For Admin AND Agents */}
                <div className="flex items-center gap-2 lg:gap-4 mt-4 overflow-x-auto scrollbar-hide whitespace-nowrap pb-2 lg:pb-0">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${statusFilter === 'all'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                            : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                            }`}
                    >
                        All ({statsConversations.length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('active')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${statusFilter === 'active'
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'bg-white text-blue-500 hover:bg-blue-50'
                            }`}
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        Active ({activeCount})
                    </button>
                    <button
                        onClick={() => setStatusFilter('pending')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${statusFilter === 'pending'
                            ? 'bg-orange-50 text-orange-600 border border-orange-200'
                            : 'bg-white text-orange-500 hover:bg-orange-50'
                            }`}
                    >
                        <Clock size={14} className="text-orange-500" />
                        Pending ({pendingCount})
                    </button>
                    <button
                        onClick={() => setStatusFilter('assigned')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${statusFilter === 'assigned'
                            ? 'bg-green-50 text-green-600 border border-green-200'
                            : 'bg-white text-green-500 hover:bg-green-50'
                            }`}
                    >
                        <CheckCircle size={14} className="text-green-500" />
                        Assigned ({assignedCount})
                    </button>
                    <button
                        onClick={() => setStatusFilter('closed')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${statusFilter === 'closed'
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-white text-red-500 hover:bg-red-50'
                            }`}
                    >
                        <X size={14} className="text-red-500 border border-red-500 rounded-full p-0.5" />
                        Closed ({closedCount})
                    </button>
                    <button
                        onClick={() => setStatusFilter('reported')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${statusFilter === 'reported'
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-white text-red-500 hover:bg-red-50'
                            }`}
                    >
                        <AlertCircle size={14} className="text-red-500" />
                        Reported ({reportedCount})
                    </button>
                </div>

                {/* Agent Filter - Admin Only */}
                {!isAgentEffective && (
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">FILTER BY AGENT:</span>
                        <div className="relative" ref={agentMenuRef}>
                            <button
                                onClick={() => setIsAgentMenuOpen(!isAgentMenuOpen)}
                                className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-lg shadow-sm transition-all hover:bg-gray-50 ${isAgentMenuOpen ? 'ring-2 ring-blue-50' : ''}`}
                            >
                                <div className="text-blue-500">
                                    <Headset size={14} />
                                </div>
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">
                                    {selectedAgentFilter === 'all' ? 'All Agents' : ((() => {
                                        const a = agents.find(a => String(a.id) === String(selectedAgentFilter));
                                        return a?.full_name || a?.username || 'Agent';
                                    })())}
                                </span>
                                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isAgentMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isAgentMenuOpen && (
                                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200">
                                    <div
                                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${selectedAgentFilter === 'all' ? 'bg-violet-50 text-violet-600' : 'hover:bg-gray-50 text-gray-700'}`}
                                        onClick={() => { setSelectedAgentFilter('all'); setIsAgentMenuOpen(false); }}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedAgentFilter === 'all' ? 'bg-violet-100' : 'bg-gray-100'}`}>
                                            <Headset size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold">All Agents</div>
                                            <div className="text-[10px] opacity-70">Show conversations from everyone</div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-50 my-1 mx-2" />

                                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                        {agents.map(agent => (
                                            <div
                                                key={agent.id}
                                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${String(selectedAgentFilter) === String(agent.id) ? 'bg-violet-50 text-violet-600' : 'hover:bg-gray-50 text-gray-700'}`}
                                                onClick={() => { setSelectedAgentFilter(agent.id); setIsAgentMenuOpen(false); }}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${String(selectedAgentFilter) === String(agent.id) ? 'bg-violet-100' : 'bg-gray-100'}`}>
                                                    {(agent.full_name || agent.username || 'A').startsWith('+') ? (agent.full_name || agent.username).substring(1)[0].toUpperCase() : (agent.full_name?.[0] || agent.username?.[0] || 'A').toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold truncate">{agent.full_name || agent.username}</div>
                                                    <div className="text-[10px] opacity-70 truncate">{agent.email}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className={`flex-1 flex overflow-hidden ${selectedConversation ? 'p-0' : 'p-2'} lg:p-2 gap-0 lg:gap-4 relative min-h-0`}>
                {/* Left Panel - Conversation List */}
                <div className={`w-full lg:w-80 bg-white lg:rounded-xl border lg:border-gray-200 flex flex-col overflow-hidden ${selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                            <Search size={14} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent text-xs outline-none placeholder-gray-400 w-full min-w-0"
                            />
                        </div>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <span className="loader scale-75"></span>
                            </div>
                        ) : filteredConversations.length > 0 ? (
                            filteredConversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    onClick={() => {
                                        setSelectedConversation(conv);
                                        // Reset unread count in main list
                                        setConversations(prev => prev.map(c =>
                                            c.id === conv.id ? { ...c, unreadCount: 0, unread: false } : c
                                        ));
                                    }}
                                    className={`flex items-start gap-3 p-4 cursor-pointer border-b border-gray-50 transition-colors ${selectedConversation?.id === conv.id
                                        ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                        : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${conv.approvalStatus === 'assigned' ? 'bg-green-500' :
                                            conv.approvalStatus === 'active' ? 'bg-blue-500' : 'bg-amber-500'
                                            }`}>
                                            {(conv.title?.startsWith('+') ? conv.title.substring(1) : conv.title).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </div>
                                        {/* Approval Status Icon */}
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border shadow-sm ${conv.approvalStatus === 'assigned' ? 'bg-green-100 border-green-200' :
                                            conv.approvalStatus === 'active' ? 'bg-blue-100 border-blue-200' :
                                                conv.approvalStatus === 'closed' ? 'bg-red-100 border-red-200' :
                                                    'bg-amber-100 border-amber-200'
                                            }`}>
                                            {conv.approvalStatus === 'assigned' ? <CheckCircle size={10} className="text-green-600" /> :
                                                conv.approvalStatus === 'active' ? <Info size={10} className="text-blue-600" /> :
                                                    conv.approvalStatus === 'closed' ? <CheckCircle size={10} className="text-red-600" /> :
                                                        <AlertCircle size={10} className="text-amber-600" />
                                            }
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="font-bold text-gray-800 text-xs truncate">
                                                    {conv.title}
                                                </span>
                                                <button
                                                    onClick={(e) => handleShowLeadDetails(e, conv.wa_id || conv.title)}
                                                    className="text-gray-300 hover:text-blue-600 transition-colors p-0.5 rounded-full hover:bg-blue-50"
                                                    title="View Lead Details"
                                                >
                                                    <FileText size={12} />
                                                </button>
                                            </div>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                {conv.time}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 truncate mt-1">
                                            {typingSessions[conv.wa_id?.replace(/\D/g, '')] ? (
                                                <span className="text-blue-600 font-medium italic animate-pulse flex items-center gap-1">
                                                    <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"></span>
                                                    <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                                    <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                                    Typing...
                                                </span>
                                            ) : (
                                                conv.preview
                                            )}
                                        </p>
                                        <div className="mt-2 flex items-center gap-2">
                                            {/* Approval Status Badge - Show for Admin */}
                                            {!isAgentEffective && (
                                                <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-tight ${conv.approvalStatus === 'assigned' ? 'bg-green-100 text-green-700' :
                                                    conv.approvalStatus === 'active' ? 'bg-blue-100 text-blue-700' :
                                                        conv.approvalStatus === 'closed' ? 'bg-red-100 text-red-700' :
                                                            'bg-orange-100 text-orange-600'
                                                    }`}>
                                                    {conv.approvalStatus === 'assigned' ? 'Assigned' :
                                                        conv.approvalStatus === 'active' ? 'Active' :
                                                            conv.approvalStatus === 'closed' ? 'Closed' : 'Pending'}
                                                </span>
                                            )}

                                        {/* Status Tags and Accept Button removed to match design */}
                                        </div>
                                    </div>

                                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                        <Clock size={10} />
                                        {conv.time}
                                    </span>
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
                <div className={`flex-1 bg-white lg:rounded-xl border lg:border-gray-200 flex flex-col overflow-hidden ${!selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-4 lg:px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-20">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-2 ">
                                    <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                                        <button
                                            onClick={() => setSelectedConversation(null)}
                                            className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg flex-shrink-0"
                                        >
                                            <ArrowLeft size={20} />
                                        </button>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h2 className="font-semibold text-gray-900 truncate">{selectedConversation.title}</h2>
                                                <button
                                                    onClick={(e) => handleShowLeadDetails(e, selectedConversation.wa_id || selectedConversation.title)}
                                                    className="text-gray-400 hover:text-blue-600 transition-colors"
                                                    title="View Lead Details"
                                                >
                                                    <FileText size={16} />
                                                </button>
                                            </div>
                                            {typingSessions[selectedConversation.wa_id?.replace(/\D/g, '')] ? (
                                                <span className="text-[10px] text-blue-600 font-medium animate-pulse flex items-center gap-1 mt-0.5">
                                                    <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"></span>
                                                    <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                                    <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                                    Sending response...
                                                </span>
                                            ) : (
                                                <div className="flex items-center mt-1">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${selectedConversation.approvalStatus === 'assigned' ? 'bg-green-100 text-green-700' :
                                                        selectedConversation.approvalStatus === 'active' ? 'bg-blue-100 text-blue-700' :
                                                            selectedConversation.approvalStatus === 'closed' ? 'bg-gray-100 text-gray-700' :
                                                                'bg-amber-100 text-amber-600'
                                                        }`}>
                                                        {selectedConversation.approvalStatus === 'assigned' ? 'Assigned' :
                                                            selectedConversation.approvalStatus === 'active' ? 'Active' :
                                                                selectedConversation.approvalStatus === 'closed' ? 'Closed' : 'Pending'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 ml-auto flex-wrap justify-end">
                                        {/* Close / Reopen Button */}
                                        {(selectedConversation.approvalStatus === 'closed' || selectedConversation.status === 'resolved') ? (
                                            <button
                                                onClick={() => setShowReopenModal(true)}
                                                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                                            >
                                                <CornerUpLeft size={14} />
                                                Reopen
                                            </button>
                                        ) : selectedConversation.approvalStatus !== 'pending' && (
                                            <button
                                                onClick={() => setShowCloseChatModal(true)}
                                                className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                                            >
                                                <X size={14} />
                                                Close
                                            </button>
                                        )}

                                        {/* Spam / Unspam Button */}
                                        {(selectedConversation.isReported || selectedConversation.contact_info?.is_reported) ? (
                                            <button
                                                onClick={handleUnspamUser}
                                                disabled={isUnspamming}
                                                className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                                            >
                                                {isUnspamming ? <span className="loader-sm border-green-600"></span> : <CheckCircle size={14} />}
                                                Unspam
                                            </button>
                                        ) : selectedConversation.approvalStatus !== 'pending' && (
                                            <button
                                                onClick={() => setShowCloseChatModal(true)}
                                                className="px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                                            >
                                                <AlertCircle size={14} />
                                                Spam
                                            </button>
                                        )}

                                        {/* Cost Badge - Last */}
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-100 shadow-sm">
                                            <DollarSign size={14} className="opacity-70" />
                                            <span className="text-sm font-bold">₹ {selectedConversation.cost}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Spam Warning Banner */}
                            {(selectedConversation.isReported || selectedConversation.contact_info?.is_reported) && (
                                <div className="bg-red-50 border-b border-red-100 px-4 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300">
                                    <div className="flex items-center gap-3 text-red-700">
                                        <div className="bg-red-100 p-2 rounded-full">
                                            <AlertCircle size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">This user is currently reported as Spam. The AI is disabled.</p>
                                            <p className="text-xs opacity-80">You can restore the user to resume normal operations.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleUnspamUser}
                                        disabled={isUnspamming}
                                        className="px-4 py-2 bg-white text-green-600 hover:bg-green-50 border border-green-200 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                                    >
                                        {isUnspamming ? <span className="loader-sm border-green-600"></span> : <CheckCircle size={14} />}
                                        Unspam
                                    </button>
                                </div>
                            )}

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50 scroll-smooth">
                                {selectedConversation.messages.length > 0 ? (
                                    (() => {
                                        // Group messages by date
                                        const groups = [];
                                        selectedConversation.messages.forEach(msg => {
                                            const date = formatDateHeader(msg.timestamp);
                                            if (groups.length === 0 || groups[groups.length - 1].date !== date) {
                                                groups.push({ date, messages: [msg] });
                                            } else {
                                                groups[groups.length - 1].messages.push(msg);
                                            }
                                        });

                                        return groups.map((group, gIdx) => (
                                            <div key={gIdx} className="relative pb-4">
                                                {/* Date Header - Sticky within this group */}
                                                <div className="sticky top-0 z-10 flex justify-center w-full py-2 pointer-events-none">
                                                    <span className="bg-white/90 backdrop-blur-md text-gray-500 text-[11px] font-bold px-4 py-1.5 rounded-full shadow-sm border border-gray-100 pointer-events-auto">
                                                        {group.date}
                                                    </span>
                                                </div>

                                                <div className="space-y-4">
                                                    {group.messages.map((msg, mIdx) => (
                                                        <div key={mIdx} className={`flex items-end gap-2 ${msg.direction === 'in' ? 'justify-start' : 'justify-end'}`}>
                                                            {/* User Avatar (Now on Left for 'in') */}
                                                            {msg.direction === 'in' && (
                                                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                                    <User size={14} className="text-white" />
                                                                </div>
                                                            )}

                                                            {/* Message Bubble Wrapper (Column for Name + Bubble) */}
                                                            <div className={`flex flex-col ${msg.direction === 'in' ? 'items-start' : 'items-end'} max-w-[85%] lg:max-w-[75%]`}>
                                                                {/* Agent Name Display */}
                                                                {msg.isAgent && msg.direction === 'out' && (
                                                                    <span className="text-[10px] text-gray-500 font-medium mb-1 mr-1">
                                                                        {resolveAgentName(msg.botSenderId || msg.agent_id)}
                                                                    </span>
                                                                )}

                                                                <div
                                                                    className={`px-4 py-3 rounded-2xl shadow-sm w-full ${msg.direction === 'in'
                                                                        // User (Left): White style
                                                                        ? 'bg-white text-gray-800 border border-gray-50 rounded-bl-sm'
                                                                        // Agent (Right): Primary color style
                                                                        : 'bg-indigo-600 text-white rounded-br-sm'
                                                                        }`}
                                                                >
                                                                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{renderMessageContent(msg.text)}</div>
                                                                    <div className={`flex items-center justify-end gap-1.5 mt-1.5 ${msg.direction === 'in' ? 'text-gray-400' : 'text-indigo-100'}`}>
                                                                        <span className="text-[10px]">{msg.time}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Sender Avatar (Right side for Agent/Bot) */}
                                                            {msg.direction === 'out' && (
                                                                <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 shadow-sm ${msg.isAgent ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-gray-100'
                                                                    }`}>
                                                                    {msg.isAgent ? (
                                                                        <User size={14} className="text-indigo-600" />
                                                                    ) : (
                                                                        <Bot size={14} className="text-indigo-600" />
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ));
                                    })()
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        <p className="text-sm">No messages in this conversation</p>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            {selectedConversation.approvalStatus === 'closed' ? (
                                <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
                                    <p className="text-gray-500 font-medium flex items-center justify-center gap-2">
                                        <CheckCircle size={18} />
                                        This conversation is closed
                                    </p>
                                    {/* {!isAgentEffective && selectedConversation.closed_by && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        Closed by Agent ID: {selectedConversation.closed_by}
                                    </p>
                                )} */}
                                </div>
                            ) : (selectedConversation.approvalStatus === 'pending' || (selectedConversation.approvalStatus === 'active' && !selectedConversation.assigned_agent_id)) ? (
                                <div className="p-4 border-t border-gray-100 bg-amber-50 flex flex-col items-center justify-center gap-2 text-center">
                                    <p className="text-amber-700 font-medium flex items-center justify-center gap-2">
                                        <AlertCircle size={18} />
                                        Please assign this chat to yourself to start messaging
                                    </p>
                                    <button
                                        onClick={() => handleApproveClick(selectedConversation)}
                                        disabled={approvingId === selectedConversation.id || (!user && !localStorage.getItem('user'))}
                                        title={(!user && !localStorage.getItem('user')) ? "Loading user data..." : "Accept"}
                                        className="px-6 py-2 bg-[#1E1B4B] text-white rounded-lg text-sm font-semibold hover:bg-[#2e2a6b] transition-colors shadow-sm mt-2 disabled:opacity-70 flex items-center gap-2"
                                    >
                                        <CheckCircle size={16} />
                                        {approvingId === selectedConversation.id ? 'Assigning...' : 'Assign Chat'}
                                    </button>
                                </div>
                            ) : (
                                <div className="px-4 lg:px-6 py-4 border-t border-gray-100 bg-white">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setShowTemplateModal(true)}
                                            className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-100 transition-colors border border-indigo-100"
                                            title="Send WhatsApp Template"
                                        >
                                            <Plus size={20} />
                                        </button>
                                        <input
                                            type="text"
                                            placeholder="Type your message..."
                                            value={messageInput}
                                            onChange={(e) => {
                                                setMessageInput(e.target.value);
                                                handleTyping();
                                            }}
                                            onKeyDown={handleKeyPress}
                                            className="flex-1 px-4 py-3 bg-gray-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!messageInput.trim()}
                                            className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition-all active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
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

            {/* --- MODALS --- */}

            {/* New Conversation Modal */}
            {showNewConvModal && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">Start New Conversation</h3>
                            <button onClick={() => setShowNewConvModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 underline decoration-violet-200 underline-offset-4">Phone Number (WhatsApp ID)</label>
                                <PhoneInput
                                    defaultCountry="in"
                                    className="flex items-center w-full bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-violet-500 transition-all shadow-sm h-12"
                                    inputStyle={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', paddingLeft: '12px', fontSize: '15px' }}
                                    buttonStyle={{ border: 'none', background: 'transparent', paddingLeft: '8px' }}
                                    value={newConvPhone}
                                    onChange={(value) => setNewConvPhone(value)}
                                />
                                <p className="text-[10px] text-gray-400 mt-2 px-1 italic">* Format: +[CountryCode][Number]</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 underline decoration-violet-200 underline-offset-4">Initial Message</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 focus:bg-white transition-all h-32 resize-none shadow-sm"
                                    placeholder="Type the message you want to send..."
                                    value={newConvMessage}
                                    onChange={(e) => setNewConvMessage(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    onClick={() => setShowNewConvModal(false)}
                                    className="flex-1 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleStartConversation}
                                    disabled={startingConv || !newConvPhone.trim() || !newConvMessage.trim()}
                                    className="flex-1 px-4 py-3 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all active:scale-95 shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {startingConv ? (
                                        <><span className="loader-sm border-white"></span> Sending...</>
                                    ) : (
                                        <><Send size={18} /> Start Chat</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Template Selection Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Send WhatsApp Template</h3>
                                <p className="text-xs text-gray-500 mt-1">Select an approved template to send to the user.</p>
                            </div>
                            <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {templates.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                        <Plus size={32} />
                                    </div>
                                    <p className="text-gray-500 font-medium">No approved templates found.</p>
                                    <p className="text-xs text-gray-400 mt-1">Check your WhatsApp Manager for status.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {templates.map((template) => (
                                        <button
                                            key={template.name}
                                            onClick={() => handleSendTemplate(template.name)}
                                            disabled={templateLoading}
                                            className="p-4 border border-gray-100 rounded-xl hover:bg-violet-50 hover:border-violet-200 text-left transition-all group flex items-start gap-4 relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Send size={14} className="text-violet-400" />
                                            </div>
                                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <FileText size={20} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-gray-900 group-hover:text-indigo-600 truncate">{template.name.replace(/_/g, ' ')}</span>
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-bold uppercase tracking-tighter">
                                                        {template.category}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 line-clamp-2 italic">"{template.components?.[0]?.text || 'No preview available'}"</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button onClick={() => setShowTemplateModal(false)} className="flex-1 h-11 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors" disabled={templateLoading}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lead Details Modal */}
            {showLeadModal && (
                <LeadDetailsModal
                    lead={selectedLead}
                    onClose={() => setShowLeadModal(false)}
                />
            )}

            {/* Agent Details Modal */}
            {showAgentModal && assignedAgent && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">Assigned Agent</h3>
                            <button onClick={() => setShowAgentModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-col items-center mb-6">
                                <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 mb-4 ring-4 ring-violet-50">
                                    <User size={32} />
                                </div>
                                <h4 className="text-xl font-bold text-gray-900 text-center">
                                    {assignedAgent.full_name || assignedAgent.username || assignedAgent.email || 'Agent'}
                                </h4>
                                <span className="text-xs text-indigo-600 font-bold uppercase tracking-widest mt-2 px-3 py-1 bg-indigo-50 rounded-full">
                                    {assignedAgent.role?.name || assignedAgent.role || 'Agent'}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold mb-1">Email Address</span>
                                    <p className="font-semibold text-gray-800 text-sm truncate">{assignedAgent.email || 'N/A'}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold mb-1">Mobile Number</span>
                                    <p className="font-semibold text-gray-800 text-sm truncate">
                                        {(assignedAgent.mobile || assignedAgent.phone_number || assignedAgent.phone)
                                            ? '+' + String(assignedAgent.mobile || assignedAgent.phone_number || assignedAgent.phone).replace(/^\+/, '')
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowAgentModal(false)}
                                className="w-full mt-6 h-12 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all active:scale-95 shadow-lg"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm End Session */}
            <ConfirmationModal
                isOpen={showEndChatConfirm}
                onClose={() => setShowEndChatConfirm(false)}
                onConfirm={confirmEndSession}
                title="End Conversation"
                message="Are you sure you want to end this conversation? It will be moved to the resolved list."
                confirmText="End Chat"
                cancelText="Cancel"
                type="danger"
            />

            {/* Reopen Chat Modal */}
            {showReopenModal && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <CornerUpLeft size={18} className="text-indigo-600" />
                                Reopen Chat
                            </h3>
                            <button onClick={() => !isReopening && setShowReopenModal(false)} disabled={isReopening} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Reopening <span className="text-red-500">*</span></label>
                                <textarea
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all h-28 resize-none shadow-sm"
                                    placeholder="Please explain why this chat needs to be reopened..."
                                    value={reopenReason}
                                    onChange={(e) => setReopenReason(e.target.value)}
                                    disabled={isReopening}
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <button onClick={() => setShowReopenModal(false)} disabled={isReopening} className="flex-1 h-11 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReopenSubmit}
                                    disabled={isReopening || !reopenReason.trim()}
                                    className="flex-1 h-11 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isReopening ? <><span className="loader-sm border-white"></span> Reopening...</> : 'Confirm Reopen'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Alert Modal */}
            <ConfirmationModal
                isOpen={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                onConfirm={() => setShowErrorModal(false)}
                title="Action Failed"
                message={errorMessage}
                confirmText="Understood"
                cancelText={null}
                type="warning"
            />

            {/* Close Chat Modal (Feedback & Reporting) */}
            <CloseChatModal
                isOpen={showCloseChatModal}
                onClose={() => setShowCloseChatModal(false)}
                onConfirm={handleCloseChatSubmit}
                loading={isClosing}
            />

            {/* Notes History Modal */}
            <NotesHistoryModal
                isOpen={showNotesModal}
                onClose={() => setShowNotesModal(false)}
                notes={selectedConversation?.contact_info?.agent_notes || []}
                users={allUsers}
            />

            {/* Assign Chat Confirmation */}
            <ConfirmationModal
                isOpen={showApproveConfirmModal}
                onClose={() => {
                    setShowApproveConfirmModal(false);
                    setConversationToApprove(null);
                }}
                onConfirm={handleConfirmApprove}
                title="Take Over Conversation"
                message={approveConfirmMessage}
                confirmText={(() => {
                    const currentUser = user || JSON.parse(localStorage.getItem('user'));
                    const isAdmin = (currentUser?.role?.name || currentUser?.role || '').toLowerCase().includes('admin');
                    return isAdmin && conversationToApprove?.status !== 'transfer_to_agent' ? "Yes, Accept Anyway" : "Accept";
                })()}
                type="info"
            />
        </div>
    );
    // Helper to safely parse and format JSON-like strings
    function renderMessageContent(text) {
        if (!text) return '';

        // Check if it's a template sent message: [DESKTOP TEMPLATE SENT] or [DYNAMIC_FORM_INFO TEMPLATE SENT]
        if (typeof text === 'string' && /^\[.+TEMPLATE SENT\]$/i.test(text.trim())) {
            const templateName = text.replace(/^\[/, '').replace(/\s*TEMPLATE SENT\]$/i, '').trim();
            const displayName = templateName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            return (
                <div className="flex items-center gap-2.5 py-1">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-300">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] opacity-70 uppercase tracking-wider font-semibold">WhatsApp Template</span>
                        <span className="text-sm font-bold">{displayName}</span>
                    </div>
                </div>
            );
        }

        // Check if it's a template message stored by send_template_message: "Template: name (variables)"
        if (typeof text === 'string' && /^Template:\s+/i.test(text.trim())) {
            const templatePart = text.replace(/^Template:\s+/i, '').trim();
            // Split at optional parentheses for variables
            const parenIdx = templatePart.indexOf(' (');
            const templateName = parenIdx > -1 ? templatePart.substring(0, parenIdx) : templatePart;
            const displayName = templateName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            return (
                <div className="flex items-center gap-2.5 py-1">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-300">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] opacity-70 uppercase tracking-wider font-semibold">WhatsApp Template</span>
                        <span className="text-sm font-bold">{displayName}</span>
                    </div>
                </div>
            );
        }

        // Check for [Template: name] format (optimistic UI from handleSendTemplate)
        if (typeof text === 'string' && /^\[Template:\s+.+\]$/i.test(text.trim())) {
            const templateName = text.replace(/^\[Template:\s+/i, '').replace(/\]$/, '').trim();
            const displayName = templateName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            return (
                <div className="flex items-center gap-2.5 py-1">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-300">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] opacity-70 uppercase tracking-wider font-semibold">WhatsApp Template</span>
                        <span className="text-sm font-bold">{displayName}</span>
                    </div>
                </div>
            );
        }

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
        // Check if it's a details submission block (Meta Flow formatted string)
        if (typeof text === 'string' && text.includes('[DETAILS SUBMISSION]')) {
            const parts = text.split('[DETAILS SUBMISSION]');
            const preText = parts[0];
            const submissionText = parts[1];
            const lines = submissionText.trim().split('\n');

            return (
                <div className="space-y-2 py-1">
                    {preText && <div className="text-sm">{preText}</div>}
                    <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 space-y-1.5">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pb-1 border-b border-gray-100">Submission Details</div>
                        {lines.map((line, idx) => {
                            const colonIndex = line.indexOf(':');
                            if (colonIndex === -1) return <div key={idx} className="text-xs text-gray-500">{line}</div>;

                            let key = line.substring(0, colonIndex).trim();
                            let value = line.substring(colonIndex + 1).trim();

                            // Clean Key: screen_0_Model_1 -> Model, license_quantity -> License Quantity
                            key = key.replace(/screen_\d+_/, '').replace(/_\d+$/, '').replace(/_/g, ' ');
                            if (key.toLowerCase() === 'license_quantity') key = 'License Quantity';

                            // Clean Value: 0_Yes -> Yes
                            value = value.replace(/^\d+_/, '');

                            return (
                                <div key={idx} className="flex flex-col">
                                    <span className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold">{key}</span>
                                    <span className="text-sm font-medium text-gray-800">{value}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        // Regular text (fallback for formatting individual strings)
        if (typeof text === 'string') {
            text = text.replace(/license_quantity:/g, 'License Quantity:');
        }
        return text;
    }

    // Helper functions
    function formatTimeAgo(dateString) {
        if (!dateString) return 'Unknown';
        // Treat as UTC if missing timezone info (User confirms backend is UTC)
        const date = new Date(dateString.endsWith('Z') || /[+\-]\d{2}:?\d{2}/.test(dateString) ? dateString : dateString + 'Z');
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
        // Treat as UTC if missing timezone info
        const date = new Date(timestamp.endsWith('Z') || /[+\-]\d{2}:?\d{2}/.test(timestamp) ? timestamp : timestamp + 'Z');
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    function formatDateHeader(timestamp) {
        if (!timestamp) return '';
        // Treat as UTC if missing timezone info
        const date = new Date(timestamp.endsWith('Z') || /[+\-]\d{2}:?\d{2}/.test(timestamp) ? timestamp : timestamp + 'Z');
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        // Check if it was yesterday
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = date.toDateString() === yesterday.toDateString();

        if (isToday) return 'Today';
        if (isYesterday) return 'Yesterday';

        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
}
