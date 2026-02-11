import { useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, Clock, ArrowLeft, Send, Bot, User, DollarSign, Plus, X, Headset, CheckCircle, AlertCircle, Info, FileText, ChevronDown } from 'lucide-react';
import { getSessions, getAgentSessions, sendWhatsAppMessage, sendSessionMessage, getWhatsAppTemplates, sendWhatsAppTemplate, getLeadByPhone, getLeads, getUserDetails, endSession, closeConversation, getUsers, notifyAgentTyping } from '../../../services/api';
import LeadDetailsModal from './LeadDetailsModal';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import CloseChatModal from './CloseChatModal';
import NotesHistoryModal from './NotesHistoryModal';
import { useSelector } from 'react-redux';
import { selectAuth, selectIsAgent } from '../../../store/slices/authSlice';

export default function ConversationsPage() {
    const { role, user } = useSelector(selectAuth);
    const isAgent = useSelector(selectIsAgent);
    
    // Check localStorage for roleId as fallback for agent detection
    const storedRoleId = localStorage.getItem('roleId');
    const isAgentEffective = isAgent || storedRoleId === '3';

    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [messageInput, setMessageInput] = useState('');
    const [statusFilter, setStatusFilter] = useState(isAgentEffective ? 'assigned' : 'all'); // 'all', 'pending', 'approved'
    
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
    // const [isTemplateMode, setIsTemplateMode] = useState(false);
    // const [templates, setTemplates] = useState([]);
    // const [selectedTemplate, setSelectedTemplate] = useState('');
    // const [templateLoading, setTemplateLoading] = useState(false);

    // Lead Details Modal State
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [assignedAgent, setAssignedAgent] = useState(null);
    const [showAgentModal, setShowAgentModal] = useState(false);
    const [showEndChatConfirm, setShowEndChatConfirm] = useState(false);
    
    // Error Handling Modal
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [showCloseChatModal, setShowCloseChatModal] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [activeReportTooltipId, setActiveReportTooltipId] = useState(null);
    // Notes are stored in selectedConversation.contact_info.agent_notes

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

                // If Admin, populate the specific agent filter list
                if (!isAgentEffective) {
                    const agentList = usersList.filter(u => 
                        u.role?.name === 'Agent' || 
                        u.role_id === 3 || 
                        (u.role && typeof u.role === 'string' && u.role.toLowerCase().includes('agent'))
                    );
                    setAgents(agentList);
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
             // Also close tooltip if clicking outside
             if (reportTooltipRef.current && !reportTooltipRef.current.contains(event.target)) {
                 setActiveReportTooltipId(null);
             }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ✅ WebSocket: Real-Time Updates
    useEffect(() => {
        // Robust user ID retrieval matching fetchConversations logic
        const currentUser = user || JSON.parse(localStorage.getItem('user'));
        const userId = currentUser?.id || currentUser?.userId;

        // Generate a random client ID or use user ID
        const clientId = userId ? `agent_${userId}` : `session_${Date.now()}`;
        
        // Use environment variable for WebSocket URL
        const apiUrl = import.meta.env.VITE_DATA_API_URL || 'http://localhost:8000';
        console.log("🔍 [DEBUG] Env VITE_DATA_API_URL:", import.meta.env.VITE_DATA_API_URL);
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
                console.log("📩 [WS] Raw Data Received:", rawData);
                console.log("📩 [WS] Parsed Data:", data);

                if (data.type === "new_message" && data.message) {
                    const incomingMsg = data.message;
                    console.log("📩 [WS] Processing Incoming Message:", incomingMsg);
                    
                    // Format message to match UI structure
                    const formattedMsg = {
                         text: incomingMsg.text,
                         direction: incomingMsg.direction,
                         time: formatTime(incomingMsg.timestamp),
                         cost: 0, // Simplified for realtime
                         // Role attribution if present
                         isAgent: !!incomingMsg.agent_id,
                         isBot: !incomingMsg.agent_id && incomingMsg.direction === 'out',
                         ...(incomingMsg.direction === 'in' ? { role: 'user' } : { role: 'assistant' })
                    };

                    setConversations(prev => {
                        console.log("📩 [WS] Current Conversations Count:", prev.length);
                        return prev.map(conv => {
                            // Match by WA_ID (Phone Number)
                            // Remove non-digit chars for comparison
                            const convWaId = conv.wa_id ? conv.wa_id.replace(/\D/g, '') : '';
                            const msgWaId = incomingMsg.wa_id ? incomingMsg.wa_id.replace(/\D/g, '') : '';

                            console.log(`📩 [WS] Comparing: ConvID=${conv.id} WA=${convWaId} vs MsgWA=${msgWaId}`);

                            if (convWaId && msgWaId && convWaId === msgWaId) {
                                console.log("✅ [WS] Match Found! Updating conversation:", conv.id);
                                // 1. Add message to conversation
                                const updatedMessages = [...(conv.messages || []), formattedMsg];
                                
                                // 2. Determine if chat is active (selected)
                                const isActive = selectedConversation?.id === conv.id;
                                
                                return {
                                    ...conv,
                                    messages: updatedMessages,
                                    preview: formattedMsg.text.substring(0, 50),
                                    time: "Just now",
                                    unread: !isActive, 
                                    unreadCount: isActive ? 0 : (conv.unreadCount || 0) + 1
                                };
                            }
                            return conv;
                        });
                    });
                    
                    // Also update selectedConversation if it matches
                    setSelectedConversation(prev => {
                         if (!prev) return null;
                         const convWaId = prev.wa_id?.replace(/\D/g, '');
                         const msgWaId = incomingMsg.wa_id?.replace(/\D/g, '');
                         
                         if (convWaId && msgWaId && convWaId === msgWaId) {
                             return {
                                 ...prev,
                                 messages: [...(prev.messages || []), formattedMsg],
                                 time: "Just now"
                             };
                         }
                         return prev;
                    });
                }
            } catch (err) {
                console.error("❌ [WS] Error processing message:", err);
            }
        };

        ws.onclose = () => console.log("⚠️ [WS] Disconnected");
        ws.onerror = (error) => console.log("❌ [WS] Error:", error);

        return () => ws.close();
    }, [user, selectedConversation]); // Re-run if selected conversation changes

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

            // 3. Filter out IDs we already have in allUsers
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

    const handleShowLeadDetails = async (e, phone) => {
        e.stopPropagation(); // Prevent conversation selection
        try {
            // Clean phone number (remove + if present, keep digits)
            // Assuming API expects pure digits or specific format. 
            // Based on user input example "919384000439" seems to be the ID format
            const cleanPhone = phone.replace(/\D/g, ''); 
            const leadData = await getLeadByPhone(cleanPhone);
            setSelectedLead(leadData);
            setShowLeadModal(true);
        } catch (error) {
            console.error("Failed to fetch lead details:", error);
            alert("Could not fetch lead details. Lead might not exist.");
        }
    };

    // Fetch conversations from API
    const fetchConversations = async (targetId = null) => {
        try {
            // For agents, only fetch their assigned conversations
            // For admins, fetch all conversations
            // For agents, only fetch their assigned conversations
            // For admins, fetch all conversations
            let sessions = [];

            // Robust user ID retrieval
            // Check localStorage for roleId is already done at component level
            const currentUser = user || JSON.parse(localStorage.getItem('user'));
            const userId = currentUser?.id || currentUser?.userId;

            // Treat as Agent if isAgent is true OR if storedRoleId is '3' (Agent role ID)
            // Uses component-level isAgentEffective
            
            if (isAgentEffective) { 
                if (userId) {
                    const response = await getAgentSessions(userId);
                    // Handle new response structure: { agent_id: ..., sessions: [...] }
                    if (response && Array.isArray(response.sessions)) {
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
                // Not an agent (Admin/Super Admin) -> Show all
                sessions = await getSessions();
            }

            const sessionList = Array.isArray(sessions) ? sessions : [];

            // Fetch leads for filtering and naming
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
                console.error("Error fetching leads for filtering:", e);
            }

            // Filter sessions: Only show if phone number exists in leads
            const filteredSessions = sessionList.filter(s => {
                if (!s.whatsapp) return false;
                const waId = s.whatsapp.replace(/\D/g, '');
                return leadsMap[waId] !== undefined;
            });

            // Transform sessions to conversation format
            const convos = filteredSessions.map((session, index) => {
                const messageCount = session.conversation_count || session.conversation?.length || 0;
                // Use total_conversation_cost_inr if available, otherwise fallback to converted USD or 0
                // Assuming 1 USD = 83 INR approx if conversion needed on frontend, but better to use backend value
                const totalCost = messageCount > 0 ? (session.total_conversation_cost_inr || (session.total_conversation_cost_usd || 0) * 85) : 0;
                
                // Resolve display name: Lead Name > Session Name > WhatsApp > Email
                const waId = session.whatsapp ? session.whatsapp.replace(/\D/g, '') : '';
                const lead = leadsMap[waId];
                const displayName = lead?.name || session.name || session.whatsapp || session.email || `Conversation #${index + 1}`;

                const lastMsg = session.conversation?.[session.conversation.length - 1];

                // Determine effective agent ID (check both session and lead data)
                const effectiveAgentId = session.assigned_agent_id || lead?.assigned_agent_id;

                const isClosed = session.status === 'closed' || session.status === 'resolved' || !!session.closed_at;

                // Reported Logic
                const isReported = lead?.is_reported || false;
                const reportReason = lead?.report_reason;
                const agentNotes = lead?.agent_notes || [];
                const lastNote = agentNotes.length > 0 ? agentNotes[agentNotes.length - 1] : null;
                
                // Store raw ID and Name for render-time resolution vs agents list
                const reportedAgentId = isReported ? lastNote?.agent_id : null;
                const reportedAgentName = isReported ? lastNote?.agent_name : null;
                
                const reportFeedback = isReported ? (lastNote?.note || 'No additional details.') : null;

                if (index === 0) {
                     console.log('DEBUG SESSION:', session);
                     console.log('DEBUG LEAD:', lead);
                     console.log('Effective Agent ID:', effectiveAgentId);
                }

                return {
                    id: session.id || index,
                    wa_id: session.whatsapp, // Add this for API calls
                    title: displayName,
                    preview: lastMsg?.text?.substring(0, 50) || lastMsg?.user?.substring(0, 50) || 'No messages',
                    startStatus: lead?.status, // Specifically expose lead status for input disabling logic
                    status: isClosed ? 'resolved' : (lead?.status || (session.status !== 'active' ? session.status : 'active')),
                    time: formatTimeAgo(session.updated_at || session.created_at),
                    unread: false, // Legacy Support
                    unreadCount: 0, // New Counter
                    cost: totalCost.toFixed(2),
                    // Reported Props
                    isReported,
                    reportReason,
                    reportedAgentId,     // Store ID
                    reportedAgentName,   // Store raw name fallback
                    reportFeedback,
                    // Use backend assigned_agent_id for approval status
                    assigned_agent_id: effectiveAgentId,
                    assigned_at: session.assigned_at,
                    closed_by: session.closed_by || null, 
                    contact_info: session.contact_info || null, // Store contact info/notes
                    approvalStatus: isClosed 
                        ? 'closed'
                        : (effectiveAgentId 
                            ? 'assigned' 
                            : (lead?.status === 'transfer_to_agent' ? 'pending' : 'active')),
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
                const sessionA = filteredSessions.find(s => (s.id || s.index) === a.id);
                const sessionB = filteredSessions.find(s => (s.id || s.index) === b.id);
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
    }, [isAgent, user?.id]); // Re-fetch only when agent status or user ID changes

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

    // Role-based filtering:
    // - Agents: Only see their assigned conversations (already filtered by backend)
    // - Admin/Super Admin: See all, with optional filter
    let displayedConversations;
    if (isAgentEffective) {
        // Agents see only their assigned conversations (already returned from getAgentSessions)
        // But now they want to filter by Assigned vs Closed
        if (statusFilter === 'closed' || statusFilter === 'resolved') {
             displayedConversations = conversations.filter(conv => conv.approvalStatus === 'closed' || conv.status === 'resolved');
        } else {
             // Default view: Assigned/Active (hide closed)
             displayedConversations = conversations.filter(conv => conv.approvalStatus !== 'closed' && conv.status !== 'resolved');
        }
    } else {
        // Admins see all, with optional status filter
        if (statusFilter === 'pending') {
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

        // Apply Agent Filter (if selected and not 'all')
        if (selectedAgentFilter !== 'all') {
            displayedConversations = displayedConversations.filter(conv => 
                // Check against assigned_agent_id which we stored in fetchConversations
                // Ensure type safety (string vs int)
                conv.assigned_agent_id && String(conv.assigned_agent_id) === String(selectedAgentFilter)
            );
        }
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
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.preview.toLowerCase().includes(searchQuery.toLowerCase())
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

    // Handle Send Message
    const handleSendMessage = async () => {
        if (!selectedConversation || !messageInput.trim()) return;

        const message = messageInput;
        // const waId = selectedConversation.wa_id; // No longer needed for this endpoint

        setMessageInput(''); // Clear input immediately for better UX
        try {
            await sendSessionMessage(selectedConversation.id, message);
            // Re-fetch to see the new message
            await fetchConversations(selectedConversation.id);
        } catch (error) {
            console.error("Failed to send message:", error);
            
            if (error.response && error.response.status === 400) {
                const detail = error.response.data?.detail || "The 24-hour service window has expired.";
                setErrorMessage(detail);
                setShowErrorModal(true);
            } else {
                const genericMsg = error.response?.data?.detail || error.message || "An unexpected error occurred.";
                alert(`Failed to send message: ${genericMsg}`);
            }
            
            setMessageInput(message); // Restore input on failure
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
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
            
            // Clear selection and refresh list
            setSelectedConversation(null);
            setShowCloseChatModal(false);
            await fetchConversations();
            
        } catch (error) {
            console.error("Failed to close conversation:", error);
            const msg = error.response?.data?.detail || error.message || "Failed to close conversation";
            alert(msg);
        } finally {
            setIsClosing(false);
        }
    };

    // Confirm End Session (API Call) - KEEPING FOR BACKWARD COMPATIBILITY OR ADMIN OVERRIDE IF NEEDED
    // BUT UI NOW USES handleCloseChatSubmit
    const confirmEndSession = async () => {
        try {
            const currentUser = user || JSON.parse(localStorage.getItem('user'));
            const userId = currentUser?.id || currentUser?.userId;
            
            await endSession(selectedConversation.id, userId); 
            
            // Clear selection and refresh list
            setSelectedConversation(null);
            fetchConversations();
            setShowEndChatConfirm(false);
        } catch (error) {
            console.error("Failed to end session:", error);
            alert(`Failed to end session: ${error.message}`);
            setShowEndChatConfirm(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden h-[calc(100vh-64px)] lg:h-auto">
            {/* Page Header */}
            <div className={`p-4 lg:p-6 bg-white border-b border-gray-100 ${selectedConversation ? 'hidden lg:block' : 'block'}`}>
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
                <div className="flex items-center gap-2 lg:gap-3 mt-4 overflow-x-auto scrollbar-hide whitespace-nowrap pb-2 lg:pb-0">
                    {!isAgentEffective && (
                        <>
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${statusFilter === 'all'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                                    }`}
                            >
                                All ({statsConversations.length})
                            </button>
                            <button
                                onClick={() => setStatusFilter('active')}
                                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${statusFilter === 'active'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-blue-600 hover:bg-blue-50'
                                    }`}
                            >
                                <Info size={15} />
                                Active ({activeCount})
                            </button>
                            <button
                                onClick={() => setStatusFilter('pending')}
                                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${statusFilter === 'pending'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-white text-amber-600 hover:bg-amber-50'
                                    }`}
                            >
                                <Clock size={15} />
                                Pending ({pendingCount})
                            </button>

                            
                        </>
                    )}

                    {/* Assigned Filter - Default for Agents */}
                    <button
                        onClick={() => setStatusFilter('assigned')}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${statusFilter === 'assigned'
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-green-600 hover:bg-green-50'
                            }`}
                    >
                        <CheckCircle size={15} />
                        Assigned ({isAgentEffective ? displayedConversations.length : assignedCount})
                    </button>

                    {/* Closed Filter - For Everyone */}
                    <button
                        onClick={() => setStatusFilter('closed')}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${statusFilter === 'closed'
                            ? 'bg-red-600 text-white'
                            : 'bg-white text-red-600 hover:bg-red-50'
                            }`}
                    >
                        <CheckCircle size={15} />
                        Closed ({closedCount})
                    </button>

                    <button
                                onClick={() => setStatusFilter('reported')}
                                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${statusFilter === 'reported'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white text-red-600 hover:bg-red-50'
                                    }`}
                            >
                                <AlertCircle size={15} />
                                Reported ({reportedCount})
                            </button>
                </div>

                {/* Agent Filter - Admin Only */}
                {!isAgentEffective && (
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider text-[11px]">Filter by Agent:</span>
                        <div className="relative" ref={agentMenuRef}>
                            <button
                                onClick={() => setIsAgentMenuOpen(!isAgentMenuOpen)}
                                className={`flex items-center gap-2 px-4 py-2 bg-white border rounded-xl shadow-sm transition-all duration-200 hover:shadow-md ${
                                    isAgentMenuOpen ? 'border-violet-500 ring-2 ring-violet-50/50' : 'border-gray-200 hover:border-violet-300'
                                }`}
                            >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    selectedAgentFilter === 'all' ? 'bg-gray-100 text-gray-500' : 'bg-violet-100 text-violet-600'
                                }`}>
                                    {selectedAgentFilter === 'all' ? <Headset size={12} /> : ((() => {
                                        const a = agents.find(a => String(a.id) === String(selectedAgentFilter));
                                        return (a?.full_name || a?.username || 'A')[0].toUpperCase();
                                    })())}
                                </div>
                                <span className="text-sm font-medium text-gray-700">
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
                                                    {agent.full_name?.[0] || 'A'}
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
            <div className={`flex-1 flex overflow-hidden ${selectedConversation ? 'p-0 h-full' : 'p-2'} lg:p-2 gap-0 lg:gap-4 relative lg:h-auto`}>
                {/* Left Panel - Conversation List */}
                <div className={`w-full lg:w-80 bg-white lg:rounded-xl border lg:border-gray-200 flex flex-col overflow-hidden h-full lg:h-[80vh] ${selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
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
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                                            conv.approvalStatus === 'assigned' ? 'bg-green-500' : 
                                            conv.approvalStatus === 'active' ? 'bg-blue-500' : 'bg-amber-500'
                                            }`}>
                                            {conv.title.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </div>
                                        {/* Approval Status Icon */}
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border shadow-sm ${
                                            conv.approvalStatus === 'assigned' ? 'bg-green-100 border-green-200' :
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
                                        <div className="flex items-center justify-between gap-2 ">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="font-semibold text-gray-900 text-sm truncate">
                                                    {conv.title}
                                                </span>
                                                <button
                                                    onClick={(e) => handleShowLeadDetails(e, conv.wa_id || conv.title)}
                                                    className="text-gray-400 hover:text-blue-600 transition-colors p-0.5 rounded-full hover:bg-blue-50"
                                                    title="View Lead Details"
                                                >
                                                    <FileText size={14} />
                                                </button>
                                            </div>
                                            {(conv.unreadCount > 0) && (
                                                <span className="min-w-[20px] h-5 px-1.5 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                                                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{conv.preview}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            {/* Approval Status Badge - Show for Admin */}
                                            {!isAgent && (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                                    conv.approvalStatus === 'assigned' ? 'bg-green-100 text-green-700' :
                                                    conv.approvalStatus === 'active' ? 'bg-blue-100 text-blue-700' :
                                                    conv.approvalStatus === 'closed' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {conv.approvalStatus === 'assigned' ? 'Assigned' : 
                                                     conv.approvalStatus === 'active' ? 'Active' : 
                                                     conv.approvalStatus === 'closed' ? 'Closed' : 'Pending'}
                                                </span>
                                            )}

                                            {/* Reported Tag with Tooltip */}
                                            {/* Reported Tag - Simplified for List (Tag Only) */}
                                            {conv.isReported && (
                                                <div className="">
                                                    <div className="bg-red-50 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-medium border border-red-100 inline-flex items-center gap-1.5">
                                                        <AlertCircle size={10} />
                                                        <span className="truncate max-w-[120px]">Reported by {resolveAgentName(conv.reportedAgentId, conv.reportedAgentName)}</span>
                                                    </div>
                                                </div>
                                            )}

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
                <div className={`flex-1 bg-white lg:rounded-xl border lg:border-gray-200 flex flex-col overflow-hidden h-full lg:h-[80vh] ${!selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
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
                                        <h2 className="font-semibold text-gray-900 truncate">{selectedConversation.title}</h2>
                                        <button
                                            onClick={(e) => handleShowLeadDetails(e, selectedConversation.wa_id || selectedConversation.title)}
                                            className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg bg-gray-50 hover:bg-blue-50"
                                            title="View Lead Details"
                                        >
                                            <FileText size={16} />
                                        </button>
                                        
                                        {/* Assigned Agent Button (Admin Only) */}
                                        {/* Assigned Agent Button (Admin Only) */}
                                        {!isAgentEffective && selectedConversation.assigned_agent_id && (
                                            <button
                                                onClick={() => setShowAgentModal(true)}
                                                className="flex items-center gap-2 pl-1 pr-3 py-1 bg-violet-50 hover:bg-violet-100 border border-violet-100 rounded-full transition-all group"
                                                title="View Assigned Agent"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-violet-200 text-violet-700 flex items-center justify-center text-xs font-bold ring-2 ring-white">
                                                    {assignedAgent?.full_name?.[0]?.toUpperCase() || assignedAgent?.username?.[0]?.toUpperCase() || 'A'}
                                                </div>
                                                <span className="text-xs font-medium text-violet-700 group-hover:text-violet-800">
                                                    {assignedAgent?.full_name || assignedAgent?.username || 'Assigned Agent'}
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                    
                                     {/* Reported Status in Header (Full Details View) */}
                                     {selectedConversation.isReported && (
                                        <div className="flex items-center gap-2 relative">
                                            <div className="bg-red-50 text-red-600 text-xs px-2.5 py-1 rounded-full font-semibold border border-red-100 flex items-center gap-1.5 whitespace-nowrap overflow-hidden">
                                                <AlertCircle size={12} className="flex-shrink-0" />
                                                <span className="truncate hidden sm:inline">Reported by {resolveAgentName(selectedConversation.reportedAgentId, selectedConversation.reportedAgentName)}</span>
                                                <span className="truncate sm:hidden">Reported</span>
                                            </div>
                                            
                                            <div className="relative" ref={reportTooltipRef}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveReportTooltipId(activeReportTooltipId === selectedConversation.id ? null : selectedConversation.id);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
                                                    title="View Report Details"
                                                >
                                                    <Info size={16} />
                                                </button>

                                                {/* Header Tooltip Model */}
                                                {activeReportTooltipId === selectedConversation.id && (
                                                    <div 
                                                        className="absolute top-full right-0 mt-2 w-64 bg-white shadow-xl border border-gray-200 rounded-xl overflow-hidden z-[50] animate-in fade-in zoom-in-95 duration-200"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="px-4 py-3 border-b border-gray-100 bg-red-50">
                                                            <h5 className="font-bold text-red-700 text-sm flex items-center gap-2">
                                                                <AlertCircle size={14} />
                                                                {selectedConversation.reportReason || 'Reported'}
                                                            </h5>
                                                        </div>
                                                        <div className="p-4">
                                                            <p className="text-sm text-gray-700 leading-relaxed italic">
                                                                "{selectedConversation.reportFeedback}"
                                                            </p>
                                                            <div className="mt-3 text-xs text-gray-400 font-medium text-right border-t border-gray-50 pt-2">
                                                                Reported by <span className="text-gray-600">{resolveAgentName(selectedConversation.reportedAgentId, selectedConversation.reportedAgentName)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                     )}
                                    
                                     {/* Assigned Agent Details - REMOVED */}


                                    <div className="flex  items-center gap-3">
                                        {/* End Chat Button (Agent Only) */}
                                        {isAgentEffective && selectedConversation.approvalStatus !== 'closed' && (
                                            <button 
                                                onClick={handleEndChat}
                                                className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors"
                                                title="End this conversation"
                                            >
                                                <span className="hidden sm:inline">Close / Report</span>
                                                <span className="sm:hidden">Close</span>
                                            </button>
                                        )}

                                        {/* Cost Badge */}
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full">
                                            {/* <DollarSign size={14} /> */}
                                            <span className="text-sm font-semibold">₹{" "}{selectedConversation.cost}</span>
                                        </div>

                                        {/* Show Notes Button (New) */}
                                        {selectedConversation.contact_info?.agent_notes?.length > 0 && (
                                            <button
                                                onClick={() => setShowNotesModal(true)}
                                                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-2"
                                                title="View Agent Notes"
                                            >
                                                <FileText size={18} />
                                                <span className="text-sm font-medium hidden sm:inline">Notes</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                                    selectedConversation.approvalStatus === 'assigned' ? 'bg-green-100 text-green-700' :
                                    selectedConversation.approvalStatus === 'active' ? 'bg-blue-100 text-blue-700' :
                                    selectedConversation.approvalStatus === 'closed' ? 'bg-gray-100 text-gray-700' :
                                    'bg-amber-100 text-amber-700'
                                }`}>
                                    {selectedConversation.approvalStatus === 'assigned' ? 'Assigned' : 
                                     selectedConversation.approvalStatus === 'active' ? 'Active' : 
                                     selectedConversation.approvalStatus === 'closed' ? 'Closed' : 'Pending'}
                                </span>
                            </div>

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
                                                                <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 shadow-sm ${
                                                                    msg.isAgent ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-gray-100'
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

                            {/* Message Input */ }
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
                            ) : (
                                <div className="px-4 lg:px-6 py-4 border-t border-gray-100 bg-white">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            placeholder="Type your message..."
                                            value={messageInput}
                                            onChange={(e) => {
                                                setMessageInput(e.target.value);
                                                handleTyping();
                                            }}
                                            onKeyDown={handleKeyPress}
                                            className="flex-1 px-4 py-3 bg-gray-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!messageInput.trim()}
                                            className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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


            {/* Lead Details Modal */}
            {showLeadModal && (
                <LeadDetailsModal 
                    lead={selectedLead} 
                    onClose={() => setShowLeadModal(false)} 
                />
            )}

            {/* Agent Details Modal */}
            {showAgentModal && assignedAgent && (
                <div className="absolute inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-semibold text-gray-900">Assigned Agent</h3>
                            <button 
                                onClick={() => setShowAgentModal(false)} 
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-col items-center mb-6">
                                <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 mb-3">
                                    <User size={32} />
                                </div>
                                <h4 className="text-xl font-bold text-gray-900 text-center">
                                    {assignedAgent.full_name || assignedAgent.username || assignedAgent.email || 'Agent'}
                                </h4>
                                <span className="text-sm text-gray-500 uppercase tracking-wide font-medium mt-1">
                                    {assignedAgent.role?.name || assignedAgent.role || 'Agent'}
                                </span>
                            </div>
                            
                            <div className="space-y-3">
                                {/* <div className="p-3 bg-gray-50 rounded-lg">
                                    <span className="text-xs text-gray-400 uppercase tracking-wide block mb-0.5">ID</span>
                                    <p className="font-medium text-gray-900 text-sm truncate">{assignedAgent.id}</p>
                                </div> */}
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <span className="text-xs text-gray-400 uppercase tracking-wide block mb-0.5">Email</span>
                                    <p className="font-medium text-gray-900 text-sm truncate">{assignedAgent.email || 'N/A'}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <span className="text-xs text-gray-400 uppercase tracking-wide block mb-0.5">Phone</span>
                                    <p className="font-medium text-gray-900 text-sm truncate">{assignedAgent.mobile || assignedAgent.phone_number || assignedAgent.phone || 'N/A'}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowAgentModal(false)}
                                className="w-full mt-6 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* End Chat Confirmation Modal */}


            {/* End Chat Confirmation Modal */}
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

            {/* Error Alert Modal */}
            <ConfirmationModal
                isOpen={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                onConfirm={() => setShowErrorModal(false)}
                title="Message Failed"
                message={errorMessage}
                confirmText="OK"
                cancelText={null}
                type="warning"
            />

            {/* Close Chat Modal */}
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
        </div>
    );
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
