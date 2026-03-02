
import React from 'react';
import { X, User, Phone, Mail, Building, Package, Activity, Info, Calendar } from 'lucide-react';

export default function LeadDetailsModal({ lead, onClose }) {
    if (!lead) return null;

    // Helper to safely parse JSON if it's a string, otherwise return as is
    const safeParse = (data) => {
        if (typeof data === 'string') {
            try {
                return JSON.parse(data);
            } catch (e) {
                return {};
            }
        }
        return data || {};
    };

    const productDetails = safeParse(lead.product_details);
    const flowData = safeParse(lead.flow_data);

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                            <User size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 leading-tight">{lead.name || 'Unknown Candidate'}</h3>
                            <p className="text-xs text-gray-500 font-medium">Lead Details</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">

                    {/* Primary Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <InfoCard icon={Mail} label="Email" value={lead.email} />
                        <InfoCard icon={Phone} label="Phone" value={lead.phone_number ? '+' + String(lead.phone_number).replace(/^\+/, '') : ''} />
                        <InfoCard icon={Building} label="Company" value={lead.company_name} />
                        <InfoCard icon={Activity} label="Status" value={lead.status} badge />
                    </div>

                    {/* Product Interest Section */}
                    {lead.product_interest && (
                        <div className="mb-6 bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                            <div className="flex items-center gap-2 mb-3">
                                <Package size={18} className="text-blue-600" />
                                <h4 className="font-semibold text-gray-900">Product Interest</h4>
                            </div>
                            <div className="text-lg font-medium text-blue-800">
                                {lead.product_interest}
                            </div>
                        </div>
                    )}

                    {/* Detailed Product Specs */}
                    {Object.keys(productDetails).length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Product Specifications</h4>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 grid grid-cols-2 gap-4">
                                {Object.entries(productDetails).map(([key, value]) => {
                                    if (key === 'flow_token') return null; // Skip internal fields
                                    // Clean up key name (e.g., "screen_0_Make_0" -> "Make")
                                    const label = key.replace(/screen_\d+_/, '').replace(/_\d+$/, '').replace(/_/g, ' ');
                                    return (
                                        <div key={key}>
                                            <span className="text-xs text-gray-500 block mb-1">{label}</span>
                                            <span className="font-medium text-gray-900">{value}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-6 pt-4 border-t border-gray-100 text-xs text-gray-400">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={12} />
                            <span>Created: {formatDate(lead.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar size={12} />
                            <span>Updated: {formatDate(lead.updated_at)}</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function InfoCard({ icon: Icon, label, value, badge }) {
    if (!value) return null;

    return (
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 flex-shrink-0">
                <Icon size={16} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">{label}</p>
                {badge ? (
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 mt-0.5">
                        {value}
                    </span>
                ) : (
                    <p className="text-sm font-medium text-gray-900 truncate" title={value}>{value}</p>
                )}
            </div>
        </div>
    );
}
