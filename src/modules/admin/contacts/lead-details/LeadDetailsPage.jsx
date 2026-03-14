import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    ChevronLeft, User, Phone, Briefcase, 
    LayoutDashboard, Package, ShoppingBasket,
    Info, ExternalLink
} from 'lucide-react';
import api from '@/services/api';
import LeadOverview from './components/LeadOverview';
import LeadBasket from './components/LeadBasket';

export default function LeadDetailsPage() {
    const { leadId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Determine initial tab from query parameter
    const queryParams = new URLSearchParams(location.search);
    const initialTab = queryParams.get('tab') || 'overview';
    
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(initialTab);

    // Update active tab when query param changes
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tab = queryParams.get('tab');
        if (tab) {
            setActiveTab(tab);
        }
    }, [location.search]);

    useEffect(() => {
        const fetchLeadDetails = async () => {
            try {
                setLoading(true);
                const data = await api.getLeadById(leadId);
                setLead(data);
            } catch (error) {
                console.error("Error fetching lead details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (leadId) fetchLeadDetails();
    }, [leadId]);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
                <div className="loader mb-4"></div>
                <p className="text-gray-500 font-bold uppercase tracking-widest animate-pulse">Fetching lead insights...</p>
            </div>
        );
    }

    if (!lead) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <Info size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Lead Not Found</h2>
                <p className="text-gray-500 mb-8 max-w-sm text-center">We couldn't find the lead details you're looking for. It may have been deleted or the ID is invalid.</p>
                <button 
                    onClick={() => navigate('/contacts')}
                    className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-2xl font-bold hover:bg-violet-700 transition-all active:scale-95"
                >
                    <ChevronLeft size={20} /> Back to Contacts
                </button>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'basket', label: 'Basket', icon: ShoppingBasket }
    ];

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-100 shadow-sm relative z-20">
                <div className="px-8 py-6 max-w-[1600px] mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <button 
                            onClick={() => navigate('/contacts')}
                            className="p-2.5 rounded-xl border border-gray-100 text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all group"
                        >
                            <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="h-10 w-[1px] bg-gray-100" />
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">{lead.name || 'Anonymous Lead'}</h1>
                                <span className="px-2.5 py-1 bg-violet-500/10 text-violet-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                                    Lead Profile
                                </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 font-medium">
                                <span className="flex items-center gap-1.5 font-mono">
                                    <Phone size={14} className="text-violet-500" /> {lead.phone_number}
                                </span>
                                {lead.company_name && (
                                    <span className="flex items-center gap-1.5">
                                        <Briefcase size={14} className="text-violet-500" /> {lead.company_name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-2 p-1 bg-gray-50/80 rounded-2xl w-fit">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all relative ${
                                        isActive 
                                            ? 'bg-white text-violet-600 shadow-sm ring-1 ring-black/5' 
                                            : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                                    }`}
                                >
                                    <Icon size={18} className={isActive ? 'text-violet-600' : 'text-gray-400'} />
                                    {tab.label}
                                    {isActive && (
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-violet-600 rounded-full" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto custom-scrollbar p-8">
                <div className="max-w-[1600px] mx-auto h-full">
                    {activeTab === 'overview' && <LeadOverview lead={lead} />}
                    {activeTab === 'basket' && <LeadBasket lead={lead} />}
                </div>
            </div>
        </div>
    );
}
