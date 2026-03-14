import React from 'react';
import { User, Phone, Mail, Building2, Calendar, Tag } from 'lucide-react';

export default function LeadOverview({ lead }) {
    if (!lead) return null;

    const parseJSON = (val) => {
        if (!val) return {};
        if (typeof val === 'object') return val;
        try { return JSON.parse(val); } catch(e) { return {}; }
    };

    const flowData = parseJSON(lead.flow_data);
    
    const details = [
        { label: 'First Name', value: flowData['First Name'] || lead.name?.split(' ')[0] || '-', icon: User },
        { label: 'Last Name', value: flowData['Last Name'] || lead.name?.split(' ').slice(1).join(' ') || '-', icon: User },
        { label: 'Phone', value: flowData['Phone'] || lead.phone_number || '-', icon: Phone },
        { label: 'Email', value: flowData['Email'] || lead.email || '-', icon: Mail },
        { label: 'Company Name', value: flowData['Company Name'] || lead.company_name || '-', icon: Building2 },
    ];



    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {details.map((item, index) => (
                <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center group-hover:bg-violet-500 group-hover:text-white transition-colors">
                            <item.icon size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                            <p className="text-gray-900 font-semibold">{item.value}</p>
                        </div>
                    </div>
                </div>
            ))}
            

            
            {/* Metadata Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group lg:col-span-full">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                        <Calendar size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Created At</p>
                        <p className="text-gray-900 font-semibold">
                            {lead.created_at ? new Date(lead.created_at).toLocaleString('en-US', {
                                dateStyle: 'long',
                                timeStyle: 'short'
                            }) : '-'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
