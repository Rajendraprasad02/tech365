import React from 'react';
import { X, User, Phone, Mail, Building, Package, Activity, Info, Calendar, Tag, CheckCircle2 } from 'lucide-react';

export default function LeadDetailsModal({ lead, onClose }) {
    if (!lead) return null;

    // Helper to safely parse JSON if it's a string, otherwise return as is
    const safeParse = (data) => {
        if (typeof data === 'string') {
            try { return JSON.parse(data); } catch (e) { return {}; }
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

    // Extract interests as badges
    const interests = lead.product_interest ? lead.product_interest.split(',').map(s => s.trim()) : [];

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] border border-white/20">

                {/* Header */}
                <div className="px-8 py-7 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-200">
                            <User size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 leading-tight">{lead.name || 'Anonymous Lead'}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lead Identification</span>
                                <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest bg-violet-50 px-2 py-0.5 rounded-full">Active</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-gray-100/50 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-all active:scale-90"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                    {/* Interaction Summary */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <InfoCard icon={Mail} label="Contact Email" value={lead.email} />
                        <InfoCard icon={Phone} label="Mobile Number" value={lead.phone_number} />
                        <InfoCard icon={Building} label="Organization" value={lead.company_name} />
                        <InfoCard icon={Activity} label="Journey Status" value={lead.status} badge />
                    </div>

                    {/* Product Portfolio */}
                    {interests.length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-6 bg-violet-600 rounded-full" />
                                <h4 className="font-black text-gray-900 uppercase tracking-tight">Basket Overview</h4>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                                {interests.map((item, i) => (
                                    <div key={i} className="group flex items-center gap-2 pl-2 pr-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50 transition-all">
                                        <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-violet-500 group-hover:scale-110 transition-transform">
                                            <Package size={16} />
                                        </div>
                                        <span className="text-sm font-bold text-gray-700 group-hover:text-violet-700">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}



                    {/* Timeline */}
                    <div className="mt-10 pt-8 border-t border-gray-100 flex justify-between items-center text-gray-400">
                        <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Lead Captured: {formatDate(lead.created_at)}</span>
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
        <div className="group bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-lg transition-all border-b-2 hover:border-b-violet-500">
            <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-violet-50 group-hover:text-violet-500 transition-all">
                <Icon size={20} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">{label}</p>
                {badge ? (
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 mt-1 border border-emerald-100">
                        {value}
                    </span>
                ) : (
                    <p className="text-sm font-bold text-gray-900 truncate mt-0.5" title={value}>{value}</p>
                )}
            </div>
        </div>
    );
}
