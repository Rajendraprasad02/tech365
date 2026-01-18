// WhatsApp conversation cost configuration
export const WHATSAPP_COSTS = {
    RATES_USD: {
        utility: 0.0014,
        marketing: 0.0118,
        authentication: 0.0014,
        service: 0.0014
    },
    EXCHANGE_RATE: 84.0
};

/**
 * Calculate total WhatsApp cost based on conversation counts per category
 * @param {Object} conversationCounts - Object with category counts
 *   e.g., { utility: 5, marketing: 2, authentication: 1, service: 10 }
 * @returns {Object} - { totalUSD: string, totalINR: string }
 */
export const calculateTotalCost = (conversationCounts) => {
    let totalUSD = 0;

    for (const [category, count] of Object.entries(conversationCounts)) {
        totalUSD += (WHATSAPP_COSTS.RATES_USD[category] || 0) * count;
    }

    return {
        totalUSD: totalUSD.toFixed(4),
        totalINR: (totalUSD * WHATSAPP_COSTS.EXCHANGE_RATE).toFixed(2)
    };
};

/**
 * Calculate cost from an array of messages by counting outgoing messages as service category
 * @param {Array} messages - Array of message objects with direction field
 * @returns {Object} - { totalUSD: string, totalINR: string, conversationCounts: Object }
 */
export const calculateCostFromMessages = (messages) => {
    // Count outgoing messages as service conversations
    const outgoingCount = messages.filter(m => m.direction === 'out').length;

    const conversationCounts = {
        service: outgoingCount
    };

    const costs = calculateTotalCost(conversationCounts);

    return {
        ...costs,
        conversationCounts
    };
};
