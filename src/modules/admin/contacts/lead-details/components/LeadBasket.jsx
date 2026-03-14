import React from 'react';
import { Package, Tag, Layers, CheckCircle2, Info, ChevronRight } from 'lucide-react';

export default function LeadBasket({ lead }) {
    if (!lead) return null;

    const parseJSON = (val) => {
        if (!val) return {};
        if (typeof val === 'object') return val;
        try { return JSON.parse(val); } catch(e) { return {}; }
    };

    const flowData = parseJSON(lead.flow_data);
    const productDetails = parseJSON(lead.product_details);
    const dataSource = { ...flowData, ...productDetails };

    // Products to display
    let basket = [];

    // Helper to add product if it doesn't exist
    const addDistinctProduct = (name, type = 'addon') => {
        if (!name || typeof name !== 'string') return;
        const normalizedName = name.trim();
        if (!normalizedName || normalizedName === '-') return;

        // Skip if this looks like a generic value
        if (['yes', 'no', 'none', 'true', 'false'].includes(normalizedName.toLowerCase())) return;

        const exists = basket.some(p => p.name.toLowerCase() === normalizedName.toLowerCase());
        if (!exists) {
            basket.push({
                id: normalizedName.toLowerCase().replace(/\s+/g, '-'),
                name: normalizedName,
                type: type,
                attributes: []
            });
        }
    };

    // 1. MASTER DISCOVERY: Scan product_interest (The synced column)
    if (lead.product_interest) {
        const interests = lead.product_interest.split(/[,\n]/).map(s => s.trim());
        interests.forEach((item, idx) => {
            // Usually the first one is considered Primary, others as Addons
            addDistinctProduct(item, idx === 0 ? 'primary' : 'addon');
        });
    }

    // 2. BACKUP DISCOVERY: Scan dataSource for any fields that might contain product names
    // This helps if the column synchronization had a slight delay or issue
    const PRODUCT_FIELDS = ['Selected Add-on Products', 'Product Interest', 'products', 'product_interest'];
    PRODUCT_FIELDS.forEach(field => {
        const val = dataSource[field];
        if (val) {
            if (typeof val === 'string') {
                val.split(/[,\n]/).forEach(item => addDistinctProduct(item, 'addon'));
            } else if (Array.isArray(val)) {
                val.forEach(item => addDistinctProduct(String(item), 'addon'));
            }
        }
    });

    // 2. Map attributes to products based on keywords
    const PRODUCT_KEYWORDS = {
        'Cloud': ['Cloud', 'AZURE', 'AWS', 'GCP'],
        'M365': ['M365', 'Microsoft', 'Email Host Provider (M365)', 'Email Migration Needed (M365)'],
        'Google Workspace': ['Google', 'G-Suite', 'Email Host Provider (Google)', 'Email Migration Needed (Google)'],
        'Desktops': ['Desktop', 'Make', 'Model', 'Memory', 'Storage/SSD'],
        'Laptops': ['Laptop', 'Make', 'Model', 'Memory', 'Storage/SSD', 'Touch Screen'],
        'Server': ['Server', 'CPU', 'GPU', 'Internal Storage'],
        'Storage': ['Storage', 'Capacity'],
        'Switches': ['Switches', 'Ports'],
        'Accessories': ['Accessories', 'Keyboard', 'Mouse', 'Dock', 'WebCam', 'Privacy Screen'],
        'Monitor': ['Monitor', 'Size']
    };

    const cleanLabel = (label) => {
        if (!label || typeof label !== 'string') return label;
        return label
            .replace(/^screen_\d+_/, '')
            .replace(/_\d+$/, '')
            .replace(/_/g, ' ')
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const cleanValue = (val) => {
        if (!val || typeof val !== 'string') return val;
        return val.replace(/^\d+_/, '');
    };

    Object.entries(dataSource).forEach(([key, value]) => {
        if (!value || value === '-') return;
        
        const cleanedLabel = cleanLabel(key);
        const cleanedValue = cleanValue(String(value));
        
        // Find which product this attribute belongs to
        let assigned = false;
        for (const [prodName, keywords] of Object.entries(PRODUCT_KEYWORDS)) {
            const matches = keywords.some(k => 
                cleanedLabel.toLowerCase().includes(k.toLowerCase()) || 
                prodName.toLowerCase() === cleanedLabel.toLowerCase() ||
                key.toLowerCase().includes(k.toLowerCase())
            );

            if (matches) {
                const product = basket.find(p => p.name.toLowerCase().includes(prodName.toLowerCase()));
                if (product) {
                    product.attributes.push({ label: cleanedLabel, value: cleanedValue });
                    assigned = true;
                    break;
                }
            }
        }
        
        // If not assigned to a specific product, and it's not personal info, add to first product or generic
        const personal = ['First Name', 'Last Name', 'Phone', 'Email', 'Company Name', 'Lead ID', 'Product Interest', 'Selected Add-on Products'];
        if (!assigned && !personal.includes(key) && basket.length > 0) {
            basket[0].attributes.push({ label: cleanedLabel, value: cleanedValue });
        }
    });

    if (basket.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 animate-in fade-in zoom-in duration-700">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6 border border-gray-50 shadow-inner">
                    <Package size={48} />
                </div>
                <h3 className="text-2xl font-black text-gray-300 tracking-tight">Empty Basket</h3>
                <p className="text-gray-400 mt-2 font-medium">No products have been associated with this lead yet.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {basket.map((product, index) => (
                <div key={product.id || index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group border-l-4 border-l-[#1e293b]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#fff7ed] text-[#f97316] flex items-center justify-center shrink-0">
                            <Tag size={22} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Product Interest</p>
                            <p className="text-gray-900 font-bold capitalize truncate">{product.name}</p>
                        </div>
                    </div>
                    
                    {/* If there are specific attributes, show them in a subtle way below */}
                    {product.attributes.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                            {product.attributes.map((attr, i) => (
                                <div key={i} className="flex justify-between items-center text-[11px]">
                                    <span className="text-gray-400 font-medium">{attr.label}</span>
                                    <span className="text-gray-700 font-bold">{attr.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

