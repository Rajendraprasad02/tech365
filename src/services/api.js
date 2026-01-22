// API configuration
// In development, use /api which is proxied by Vite to avoid CORS issues
// In production, use the full URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Generic fetch wrapper with error handling
async function fetchApi(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
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

        return await response.json();
    } catch (error) {
        console.error(`API Error for ${endpoint}:`, error);
        throw error;
    }
}

// ============ Chat/Session APIs ============

// Get all chat sessions with conversation history
export async function getSessions() {
    return fetchApi('/sessions');
}

// Get a specific chat session by ID
export async function getSessionById(sessionId) {
    return fetchApi(`/session/${sessionId}`);
}

// ============ WhatsApp APIs ============

// Get all WhatsApp conversations grouped by user
export async function getWhatsAppConversations() {
    return fetchApi('/whatsapp/conversations');
}

// Get conversation for specific WhatsApp user
export async function getWhatsAppConversation(waId) {
    return fetchApi(`/whatsapp/conversation/${waId}`);
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

    return fetchApi(endpoint);
}

// Manually trigger AI for testing
export async function triggerManualAI(waId, message) {
    return fetchApi(`/whatsapp/ai/trigger/${waId}`, {
        method: 'POST',
        body: JSON.stringify({ message }),
    });
}

// Send direct message (human agent, bypass AI)
export async function sendWhatsAppMessage(waId, message) {
    return fetchApi('/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({ wa_id: waId, message }),
    });
}

// ============ Knowledge Base APIs ============

// Search knowledge base
export async function searchKnowledge(query) {
    return fetchApi(`/knowledge/search-local?query=${encodeURIComponent(query)}`);
}

// ============ FAQ APIs ============

// Get all FAQs
export async function getFaqs() {
    return fetchApi('/faqs/');
}

// Search FAQs
export async function searchFaqs(keyword) {
    return fetchApi(`/faqs/search?keyword=${encodeURIComponent(keyword)}`);
}

// ============ Knowledge Base APIs ============

// Get all knowledge base entries
export async function getKnowledgeBase(skip = 0, limit = 100, category = null) {
    let endpoint = `/knowledge/all?skip=${skip}&limit=${limit}`;
    if (category) {
        endpoint += `&category=${encodeURIComponent(category)}`;
    }
    return fetchApi(endpoint);
}

// Delete a knowledge base entry
export async function deleteKnowledgeEntry(entryId) {
    return fetchApi(`/knowledge/${entryId}`, { method: 'DELETE' });
}

// ============ Knowledge Groups APIs (Semantic Clustering) ============

// Get all knowledge groups (representative chunks)
export async function getKnowledgeGroups(skip = 0, limit = 100, category = null) {
    let endpoint = `/knowledge/groups?skip=${skip}&limit=${limit}`;
    if (category) {
        endpoint += `&category=${encodeURIComponent(category)}`;
    }
    return fetchApi(endpoint);
}

// Get related chunks for a specific group
export async function getGroupChunks(groupId) {
    return fetchApi(`/knowledge/groups/${groupId}/chunks`);
}

// Delete an entire knowledge group and all its chunks
export async function deleteKnowledgeGroup(groupId) {
    return fetchApi(`/knowledge/groups/${groupId}`, { method: 'DELETE' });
}

// Update a chunk's content (with optional re-embedding)
export async function updateChunk(chunkId, content, reEmbed = true) {
    return fetchApi(`/knowledge/chunks/${chunkId}`, {
        method: 'PUT',
        body: JSON.stringify({ content, re_embed: reEmbed }),
    });
}

// Delete a single chunk
export async function deleteChunk(chunkId) {
    return fetchApi(`/knowledge/chunks/${chunkId}`, { method: 'DELETE' });
}

// Trigger manual re-clustering
export async function reclusterKnowledge() {
    return fetchApi('/knowledge/recluster', { method: 'POST' });
}

// ============ Campaign APIs ============

// Get all campaigns with optional status filter
export async function getCampaigns(status = null) {
    let endpoint = '/campaigns';
    if (status) {
        endpoint += `?status=${encodeURIComponent(status)}`;
    }
    return fetchApi(endpoint);
}

// Get campaign by ID with recipients
export async function getCampaignById(campaignId) {
    return fetchApi(`/campaigns/${campaignId}`);
}

// Create a new campaign (draft)
export async function createCampaign(data) {
    return fetchApi('/campaigns', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// Delete a campaign (soft delete)
export async function deleteCampaign(campaignId) {
    return fetchApi(`/campaigns/${campaignId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_deleted: true }),
    });
}

// Add recipients to a campaign
export async function addCampaignRecipients(campaignId, contactIds) {
    return fetchApi(`/campaigns/${campaignId}/recipients`, {
        method: 'POST',
        body: JSON.stringify({ contact_ids: contactIds }),
    });
}

// Send a campaign
export async function sendCampaign(campaignId) {
    return fetchApi(`/campaigns/${campaignId}/send`, { method: 'POST' });
}

// Quick send - single endpoint that creates, adds recipients, and sends
export async function quickSendCampaign(data) {
    return fetchApi('/campaigns/quick-send', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// Get WhatsApp message templates
export async function getWhatsAppTemplates() {
    return fetchApi('/whatsapp/templates');
}

// Send WhatsApp template message
export async function sendWhatsAppTemplate(waId, templateName, variables = {}, category = "utility") {
    return fetchApi('/whatsapp/send-template', {
        method: 'POST',
        body: JSON.stringify({
            wa_id: waId,
            template_name: templateName,
            variables,
            category
        }),
    });
}

// Get all contacts for recipient selection
export async function getContacts() {
    return fetchApi('/contacts');
}

// ============ Dashboard Stats APIs ============

// Get WhatsApp dashboard stats (sent, delivered, read, failed)
export async function getWhatsAppDashboardStats() {
    return fetchApi('/whatsapp/dashboard/stats');
}

export default {
    getSessions,
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
};

