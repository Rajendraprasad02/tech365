// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
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

export default {
    getSessions,
    getSessionById,
    getWhatsAppConversations,
    getWhatsAppConversation,
    getWhatsAppCosts,
    searchKnowledge,
    getFaqs,
    searchFaqs,
};
