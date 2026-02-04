// API configuration
// Auth/RBAC APIs go to NestJS backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
// Business data APIs go to Python backend
const DATA_API_BASE_URL = import.meta.env.VITE_DATA_API_URL;

// Helper to get headers with token
const getHeaders = (customHeaders = {}) => {
    const token = localStorage.getItem('token');
    // console.log('[API] Using Token:', token ? `${token.substring(0, 10)}...` : 'None');
    const headers = {
        'Content-Type': 'application/json',
        ...customHeaders,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

// Helper to handle API errors consistently
const handleResponse = async (response, isNestJS = false) => {
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('token');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
            throw new Error('Unauthorized - logging out');
        }

        if (response.status === 403) {
            throw new Error('FORBIDDEN');
        }

        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        try {
            const errorData = await response.json();
            if (errorData.detail) {
                errorMessage = errorData.detail;
            } else if (errorData.message) {
                errorMessage = errorData.message;
            }
        } catch (e) {
            // Could not parse JSON, use default error message
        }
        throw new Error(errorMessage);
    }

    const resData = await response.json();

    // NestJS response wrapper handling
    if (isNestJS && resData && resData.success === true && resData.data) {
        return resData.data;
    }

    return resData;
};

// Generic fetch wrapper for NestJS Auth/RBAC APIs
async function fetchApi(endpoint, options = {}) {
    try {
        // Merge headers properly - getHeaders provides token, options.headers can add more
        const mergedHeaders = {
            ...getHeaders(),
            ...(options.headers || {}),
        };

        // Debug log for troubleshooting auth issues
        console.log(`[fetchApi] ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`, {
            hasToken: !!mergedHeaders['Authorization']
        });

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: mergedHeaders,
        });
        return handleResponse(response, true);
    } catch (error) {
        console.error(`API Error for ${endpoint}:`, error);
        throw error;
    }
}

// Fetch wrapper for Python Data APIs with token propagation and error handling
async function fetchDataApi(endpoint, options = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000); // 10s timeout

    // Ensure Base URL doesn't have trailing slash when concatenating
    // REMOVED HARDCODED DEFAULT as per user request
    const baseUrl = (DATA_API_BASE_URL || '').replace(/\/+$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    try {
        // console.log(`Calling Python API: ${baseUrl}${cleanEndpoint}`);
        const response = await fetch(`${baseUrl}${cleanEndpoint}`, {
            headers: getHeaders(options.headers),
            signal: controller.signal,
            ...options,
        });
        clearTimeout(id);

        // Handle 401 specifically for data APIs (don't auto-logout instantly, let component handle or debug)
        if (response.status === 401) {
            console.warn(`[Data API] 401 Unauthorized for ${endpoint}. Token might be invalid for Python backend.`);
            // You might want to throw here to let the caller handle it, but strictly following handleResponse:
        }

        return handleResponse(response, false);
    } catch (error) {
        clearTimeout(id);
        console.error(`Data API Error for ${endpoint}:`, error);
        throw error;
    }
}

// ============ Chat/Session APIs ============

// Get all chat sessions with conversation history
export async function getSessions() {
    return fetchDataApi('/sessions');
}

// Get a specific chat session by ID
export async function getSessionById(sessionId) {
    return fetchDataApi(`/session/${sessionId}`);
}

// Get pending sessions awaiting agent assignment (unassigned)
export async function getPendingSessions() {
    return fetchDataApi('/sessions?pending=true');
}

// Assign session to agent
export async function assignSessionToAgent(sessionId, agentId) {
    return fetchDataApi(`/session/${sessionId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ agent_id: agentId })
    });
}

// Send message to a session
export async function sendSessionMessage(sessionId, message) {
    return fetchDataApi(`/conversations/${sessionId}/message`, {
        method: 'POST',
        body: JSON.stringify({ message: message })
    });
}

// End a session
export async function endSession(sessionId, userId) {
    return fetchDataApi(`/session/${sessionId}/end`, {
        method: 'POST',
        body: JSON.stringify({ closed_by: userId })
    });
}

// ============ WhatsApp APIs ============

// Get all WhatsApp conversations grouped by user
export async function getWhatsAppConversations() {
    return fetchDataApi('/whatsapp/conversations');
}

// Get conversation for specific WhatsApp user
export async function getWhatsAppConversation(waId) {
    return fetchDataApi(`/whatsapp/conversation/${waId}`);
}

// Get conversations assigned to a specific agent
export async function getAgentSessions(agentId) {
    return fetchDataApi(`/whatsapp/agent-sessions/${agentId}`);
}

// Get WhatsApp conversation costs with optional date filters
export async function getWhatsAppCosts(startDate, endDate) {
    let endpoint = '/whatsapp/costs';
    const params = new URLSearchParams();

    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    if (params.toString()) {
        endpoint += `?${params.toString()}`;
    }

    return fetchDataApi(endpoint);
}

// Manually trigger AI for testing
export async function triggerManualAI(waId, message) {
    return fetchDataApi(`/whatsapp/ai/trigger/${waId}`, {
        method: 'POST',
        body: JSON.stringify({ message }),
    });
}

// Send direct message (human agent, bypass AI)
export async function sendWhatsAppMessage(waId, message) {
    return fetchDataApi('/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({ wa_id: waId, message }),
    });
}

// ============ Knowledge Base APIs ============

// Search knowledge base
export async function searchKnowledge(query) {
    return fetchDataApi(`/knowledge/search-local?query=${encodeURIComponent(query)}`);
}

// ============ FAQ APIs ============

// Get all FAQs
export async function getFaqs() {
    return fetchDataApi('/faqs/');
}

// Search FAQs
export async function searchFaqs(keyword) {
    return fetchDataApi(`/faqs/search?keyword=${encodeURIComponent(keyword)}`);
}

// ============ Knowledge Base APIs ============

// Get all knowledge base entries
export async function getKnowledgeBase(skip = 0, limit = 100, category = null) {
    let endpoint = `/knowledge/all?skip=${skip}&limit=${limit}`;
    if (category) {
        endpoint += `&category=${encodeURIComponent(category)}`;
    }
    return fetchDataApi(endpoint);
}

// Delete a knowledge base entry
export async function deleteKnowledgeEntry(entryId) {
    return fetchDataApi(`/knowledge/${entryId}`, { method: 'DELETE' });
}

// ============ Knowledge Groups APIs (Semantic Clustering) ============

// Get all knowledge groups (representative chunks)
export async function getKnowledgeGroups(skip = 0, limit = 100, category = null) {
    let endpoint = `/knowledge/groups?skip=${skip}&limit=${limit}`;
    if (category) {
        endpoint += `&category=${encodeURIComponent(category)}`;
    }
    return fetchDataApi(endpoint);
}

// Get related chunks for a specific group
export async function getGroupChunks(groupId) {
    return fetchDataApi(`/knowledge/groups/${groupId}/chunks`);
}

// Delete an entire knowledge group and all its chunks
export async function deleteKnowledgeGroup(groupId) {
    return fetchDataApi(`/knowledge/groups/${groupId}`, { method: 'DELETE' });
}

// Update a chunk's content (with optional re-embedding)
export async function updateChunk(chunkId, content, reEmbed = true) {
    return fetchDataApi(`/knowledge/chunks/${chunkId}`, {
        method: 'PUT',
        body: JSON.stringify({ content, re_embed: reEmbed }),
    });
}

// Delete a single chunk
export async function deleteChunk(chunkId) {
    return fetchDataApi(`/knowledge/chunks/${chunkId}`, { method: 'DELETE' });
}

// Trigger manual re-clustering
export async function reclusterKnowledge() {
    return fetchDataApi('/knowledge/recluster', { method: 'POST' });
}

// ============ Campaign APIs ============

// Get all campaigns with optional status filter
export async function getCampaigns(status = null) {
    let endpoint = '/campaigns';
    if (status) {
        endpoint += `?status=${encodeURIComponent(status)}`;
    }
    return fetchDataApi(endpoint);
}

// Get campaign by ID with recipients
export async function getCampaignById(campaignId) {
    return fetchDataApi(`/campaigns/${campaignId}`);
}

// Create a new campaign (draft)
export async function createCampaign(data) {
    return fetchDataApi('/campaigns', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// Delete a campaign (soft delete)
export async function deleteCampaign(campaignId) {
    return fetchDataApi(`/campaigns/${campaignId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_deleted: true }),
    });
}

// Add recipients to a campaign
export async function addCampaignRecipients(campaignId, contactIds) {
    return fetchDataApi(`/campaigns/${campaignId}/recipients`, {
        method: 'POST',
        body: JSON.stringify({ contact_ids: contactIds }),
    });
}

// Send a campaign
export async function sendCampaign(campaignId) {
    return fetchDataApi(`/campaigns/${campaignId}/send`, { method: 'POST' });
}

// Quick send - single endpoint that creates, adds recipients, and sends
export async function quickSendCampaign(data) {
    return fetchDataApi('/campaigns/quick-send', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// Get WhatsApp message templates
export async function getWhatsAppTemplates() {
    return fetchDataApi('/whatsapp/templates');
}

// Send WhatsApp template message
export async function sendWhatsAppTemplate(waId, templateName, variables = {}, category = "utility") {
    return fetchDataApi('/whatsapp/send-template', {
        method: 'POST',
        body: JSON.stringify({
            wa_id: waId,
            template_name: templateName,
            variables,
            category
        }),
    });
}

// ============ Contact Management APIs ============

// Get all contacts with pagination and filters
export async function getContacts(skip = 0, limit = 20, search = '', status = 'all', sortBy = 'desc', source = 'all') {
    const params = new URLSearchParams({ skip, limit, sort_by: sortBy });
    if (search) params.append('search', search);
    if (status !== 'all') params.append('status', status);
    if (source !== 'all') params.append('source', source);
    return fetchDataApi(`/contacts?${params}`);
}

// Create a single contact
export async function createContact(data) {
    // data is FormData
    return fetchDataApi('/contacts', {
        method: 'POST',
        body: data,
        // No Content-Type header needed for FormData; browser sets it with boundary
        headers: {},
    });
}

// Delete a contact
export async function deleteContact(contactId) {
    return fetchDataApi(`/contacts/${contactId}`, { method: 'DELETE' });
}

// Update contact status
export async function updateContactStatus(contactId, status) {
    const formData = new FormData();
    formData.append('status', status);
    return fetchDataApi(`/contacts/${contactId}/status`, {
        method: 'PATCH',
        body: formData,
        headers: {},
    });
}

// Bulk Import Contacts
export async function bulkImportContacts(formData) {
    return fetchDataApi('/contacts/bulk-import', {
        method: 'POST',
        body: formData,
        headers: {},
    });
}

// Get Contact Lists
export async function getContactLists() {
    return fetchDataApi('/contacts/lists');
}

// Create Contact List
export async function createContactList(name) {
    const formData = new FormData();
    formData.append('name', name);
    return fetchDataApi('/contacts/lists', {
        method: 'POST',
        body: formData,
        headers: {},
    });
}

// Delete Contact List
export async function deleteContactList(listId) {
    return fetchDataApi(`/contacts/lists/${listId}`, { method: 'DELETE' });
}

// Get Import History
export async function getImportHistory() {
    return fetchDataApi('/contacts/import-history');
}

// Get Invalid Contacts
export async function getInvalidContacts() {
    return fetchDataApi('/contacts/invalid');
}

// ============ Dashboard Stats APIs ============

// Get WhatsApp dashboard stats (sent, delivered, read, failed)
export async function getWhatsAppDashboardStats() {
    return fetchDataApi('/whatsapp/dashboard/stats');
}

// ============ RBAC & Menu APIs ============

export async function getRoles() {
    return fetchApi('/roles');
}

// Get specific role by ID
export async function getRoleById(roleId) {
    return fetchApi(`/roles/${roleId}`);
}

// Create a new role
export async function createRole(data) {
    return fetchApi('/roles', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}
// Update an existing role
export async function updateRole(roleId, data) {
    return fetchApi(`/roles/${roleId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

// Delete a role
export async function deleteRole(roleId) {
    return fetchApi(`/roles/${roleId}`, {
        method: 'DELETE',
    });
}

// ============ User Management APIs ============

// Get all users (NestJS Backend - 3066)
export async function getUsers() {
    return fetchApi('/users');
}

// Create a new user (NestJS Backend - 3300, Public endpoint - no token)
export async function createUser(data) {
    const API_URL = import.meta.env.VITE_API_URL || '';
    try {
        const response = await fetch(`${API_URL}/auth/create-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return handleResponse(response, true);
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}

// Update user
export async function updateUser(userId, data) {
    return fetchApi(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

// Delete user
export async function deleteUser(userId) {
    return fetchApi(`/users/${userId}`, {
        method: 'DELETE',
    });
} 

// Get User Details (Python Backend)
export async function getUserDetails(userId) {
    return fetchDataApi(`/users/${userId}`);
}

// Get available roles (Use NestJS RBAC Source of Truth)
export async function getUserRoles() {
    return fetchApi('/roles');
}

// Get the full menu structure (for Menu Builder)
export async function getMenuCreator() {
    // This endpoint should be public or accessible by authenticated users
    const result = await fetchApi('/menu-creator');

    let menus = [];
    // Backend returns { menus: [...] } due to formatSuccessResponse
    if (result && result.menus && Array.isArray(result.menus)) {
        menus = result.menus;
    } else if (Array.isArray(result)) {
        menus = result;
    }

    // Map Backend Keys to Frontend Keys
    return menus.map(m => ({
        ...m,
        id: m.moduleId || m.id,
        name: m.moduleName || m.name,
        route: m.moduleRoute || m.route,
        screens: (m.screens || []).map(s => ({
            ...s,
            id: s.screenId || s.id,
            name: s.screenName || s.name,
            route: s.screenRoute || s.route,
        }))
    }));
}

// Save the full menu structure (for Menu Builder)
export async function updateMenuCreator(data) {
    return fetchApi('/menu-creator', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// Seed Database
export async function seedDatabase() {
    return fetchApi('/roles/seed', { method: 'POST' });
}

// Get Lead by Phone
export async function getLeadByPhone(phone) {
    return fetchDataApi(`/leads/phone/${phone}`);
}

// Get all leads
export async function getLeads(skip = 0, limit = 100) {
    return fetchDataApi(`/leads/?skip=${skip}&limit=${limit}`);
}

export default {
    getSessions,
    getPendingSessions, // Added
    assignSessionToAgent, // Added
    sendSessionMessage, // Added
    endSession, // Added
    getAgentSessions, // Added
    getSessionById,
    getWhatsAppConversations,
    getWhatsAppConversation,
    getWhatsAppCosts,
    triggerManualAI,
    searchKnowledge,
    getFaqs,
    searchFaqs,
    getWhatsAppDashboardStats,
    getCampaigns,
    getCampaignById,
    createCampaign,
    deleteCampaign,
    addCampaignRecipients,
    sendCampaign,
    getWhatsAppTemplates,
    getContacts,
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    getMenuCreator,
    updateMenuCreator,
    getUsers,
    createUser,
    getUserRoles,

    // Lead APIs
    getLeadByPhone,
    getLeads,
    getUserDetails,

    // --- Auth APIs ---
    loginUsername: async (username, password) => {
        const result = await fetchApi('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        if (!result || !result.accessToken) {
            throw new Error('Login failed: No access token received');
        }
        return result;
    },

    refreshToken: async (token) => {
        return fetchApi('/auth/refresh-token', {
            method: 'POST',
            body: JSON.stringify({ refreshToken: token }),
        });
    },

    getUserProfile: async () => {
        return fetchApi('/auth/profile');
    },

    createAppUser: async (data) => {
        return fetchApi('/auth/create-app-user', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getUserData: async (userId) => {
        return fetchApi(`/auth/user-data/${userId}`);
    },

    login: async (email, password) => {
        const result = await fetchApi('/auth/login-email', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!result || !result.accessToken) {
            throw new Error('Login failed: No access token received');
        }
        return result;
    },

    seedDatabase: async () => {
        // Correctly using POST /roles/seed
        return fetchApi('/roles/seed', { method: 'POST' });
    },

    getSidebarMenu: async (roleIdParam) => {
        const roleId = roleIdParam || localStorage.getItem('roleId');

        // CRITICAL: Do NOT fallback to '1' (Super Admin) if roleId is missing.
        // This was causing Agents to see Super Admin menus.
        if (!roleId) {
            console.warn('[getSidebarMenu] No roleId found in localStorage or param. Cannot fetch menu.');
            return [];
        }

        try {
            // Use fetchApi for NestJS backend (GET /menu-creator/:roleId is @Public())
            const result = await fetchApi(`/menu-creator/${roleId}`);

            if (Array.isArray(result)) {
                const menu = result.map((module, index) => ({
                    id: module.id || module.moduleId || `module-${index}`,
                    label: module.name || module.moduleName || 'Unnamed Module',
                    screens: (module.screens || []).map((screen, sIndex) => ({
                        id: screen.id || screen.screenId || `screen-${index}-${sIndex}`,
                        label: screen.name || screen.screenName,
                        path: screen.route || screen.screenRoute,
                        icon: screen.icon || 'LayoutDashboard',
                    }))
                }));

                return menu;
            }
            return [];
        } catch (error) {
            console.error("Error fetching sidebar menu:", error);
            return [];
        }
    },
};
