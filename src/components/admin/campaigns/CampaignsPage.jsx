import { useState, useEffect } from 'react';
import {
    Send, Plus, Search, Filter, ArrowUpDown, Trash2, Eye, Loader2,
    CheckCircle, Clock, AlertCircle, XCircle, Users, Mail,
    X, Phone
} from 'lucide-react';
import {
    getCampaigns,
    getCampaignById,
    createCampaign,
    deleteCampaign,
    addCampaignRecipients,
    sendCampaign,
    quickSendCampaign,
    getWhatsAppTemplates,
    getContacts
} from '../../../services/api';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Status badge component
const StatusBadge = ({ status }) => {
    const styles = {
        draft: 'bg-gray-100 text-gray-600',
        sent: 'bg-blue-100 text-blue-700',
        sending: 'bg-yellow-100 text-yellow-700',
        completed: 'bg-green-100 text-green-700',
        failed: 'bg-red-100 text-red-600',
    };
    const icons = {
        draft: Clock,
        sent: Send,
        sending: Loader2,
        completed: CheckCircle,
        failed: XCircle,
    };
    const Icon = icons[status] || Clock;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || styles.draft}`}>
            <Icon size={10} className={status === 'sending' ? 'animate-spin' : ''} />
            {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Draft'}
        </span>
    );
};

// Contact Selection Panel (Server-side pagination)
const ContactSelectionPanel = ({ selectedIds, onToggle, onDone, onCancel }) => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [stats, setStats] = useState({ total: 0 });
    const limit = 20; // Smaller limit for popup

    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('desc'); // 'desc' | 'asc' | 'name_asc' | 'name_desc'

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('skip', page * limit);
            params.append('limit', limit);
            if (searchQuery) params.append('search', searchQuery);
            if (statusFilter !== 'all') params.append('status', statusFilter);
            params.append('sort_by', sortBy);

            const response = await fetch(`${API_BASE_URL}/contacts?${params}`);
            const data = await response.json();
            setContacts(data.contacts || []);
            setStats({ total: data.total || 0 });
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, [page, searchQuery, statusFilter, sortBy]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setPage(0);
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-white sticky top-0 z-10">
                <h2 className="text-xl font-bold text-gray-900">Select Contacts</h2>
                <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <X size={20} className="text-gray-500" />
                </button>
            </div>

            {/* Filters and Search */}
            <div className="p-4 border-b bg-gray-50 flex flex-col gap-3">
                {/* Search Row */}
                <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-2 text-sm">
                    <Search size={16} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="flex-1 bg-transparent outline-none"
                    />
                </div>

                {/* Filters Row */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        {/* Status Filter */}
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                                className="appearance-none pl-3 pr-8 py-2 bg-white rounded-lg border text-sm outline-none cursor-pointer hover:border-violet-300 transition-colors"
                            >
                                <option value="all">All Status</option>
                                <option value="valid">Valid</option>
                                <option value="invalid">Invalid</option>
                                <option value="blocked">Blocked</option>
                            </select>
                            <Filter size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Sort Filter */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => { setSortBy(e.target.value); setPage(0); }}
                                className="appearance-none pl-3 pr-8 py-2 bg-white rounded-lg border text-sm outline-none cursor-pointer hover:border-violet-300 transition-colors"
                            >
                                <option value="desc">Newest First</option>
                                <option value="asc">Oldest First</option>
                                <option value="name_asc">Name A-Z</option>
                                <option value="name_desc">Name Z-A</option>
                            </select>
                            <ArrowUpDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="text-sm text-gray-600 font-medium">
                        {selectedIds.size} selected
                    </div>
                </div>
            </div>

            {/* Contacts Table */}
            <div className="flex-1 overflow-y-auto p-0">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-violet-500" size={24} />
                    </div>
                ) : contacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Users size={32} className="mb-2 opacity-50" />
                        <p className="text-sm">No contacts found</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left w-12">
                                    {/* Checkbox */}
                                </th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500">Name</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500">Mobile Number</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                                <th className="px-6 py-3 text-right font-medium text-gray-500"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {contacts.map(contact => {
                                const isSelected = selectedIds.has(contact.id);
                                return (
                                    <tr
                                        key={contact.id}
                                        className={`hover:bg-violet-50 cursor-pointer transition-colors ${isSelected ? 'bg-violet-50' : ''}`}
                                        onClick={() => onToggle(contact.id)}
                                    >
                                        <td className="px-6 py-3">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => { }} // Controlled by row click
                                                className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-3">
                                            <p className="font-medium text-gray-900">{contact.name || '-'}</p>
                                        </td>
                                        <td className="px-6 py-3">
                                            <p className="text-gray-600 font-mono">{contact.phone_number}</p>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${contact.status === 'valid' ? 'bg-green-100 text-green-700' :
                                                contact.status === 'invalid' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {contact.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            {isSelected && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                                    <CheckCircle size={12} />
                                                    Selected
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer / Pagination */}
            <div className="p-4 border-t bg-gray-50 flex items-center justify-between sticky bottom-0 z-10">
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-3 py-1.5 border rounded-lg text-xs font-medium bg-white disabled:opacity-50 hover:bg-gray-50"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={(page + 1) * limit >= stats.total}
                        className="px-3 py-1.5 border rounded-lg text-xs font-medium bg-white disabled:opacity-50 hover:bg-gray-50"
                    >
                        Next
                    </button>
                </div>
                <button
                    onClick={onDone}
                    className="px-6 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg"
                >
                    Done
                </button>
            </div>
        </div>
    );
};

// Inline Create Campaign Card (renders inside parent container)
const CreateCampaignCard = ({ isOpen, onClose, onCreated }) => {
    const [view, setView] = useState('form'); // 'form' | 'contacts'
    const [selectedContacts, setSelectedContacts] = useState(new Set());
    const [name, setName] = useState('');
    const [messageType, setMessageType] = useState('custom');
    const [customMessage, setCustomMessage] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [category, setCategory] = useState('marketing');
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [fetchingTemplates, setFetchingTemplates] = useState(false);

    useEffect(() => {
        if (isOpen && messageType === 'template') {
            setFetchingTemplates(true);
            getWhatsAppTemplates()
                .then(data => setTemplates(data.templates || data || []))
                .catch(console.error)
                .finally(() => setFetchingTemplates(false));
        }
    }, [isOpen, messageType]);

    const validateForm = () => {
        if (!name.trim()) {
            alert('Campaign name is required');
            return false;
        }
        if (messageType === 'custom' && !customMessage.trim()) {
            alert('Message content is required');
            return false;
        }
        if (messageType === 'template' && !selectedTemplate) {
            alert('Please select a template');
            return false;
        }
        return true;
    };

    const getCampaignData = () => ({
        name: name.trim(),
        message_type: messageType,
        message_content: messageType === 'custom' ? customMessage : null,
        template_id: messageType === 'template' ? selectedTemplate : null,
        category,
    });

    // Save as Draft only
    const handleSaveDraft = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const result = await createCampaign(getCampaignData());
            onCreated(result);
            onClose();
            resetForm();
        } catch (error) {
            console.error('Error creating campaign:', error);
            alert('Failed to create campaign');
        } finally {
            setLoading(false);
        }
    };

    // Save & Send Now - Uses single quick-send endpoint
    const handleSaveAndSend = async () => {
        if (!validateForm()) return;

        if (selectedContacts.size === 0) {
            alert('Please select at least one contact from the right panel');
            return;
        }

        setSending(true);
        try {
            // Single endpoint that creates, adds recipients, and sends
            const result = await quickSendCampaign({
                ...getCampaignData(),
                contact_ids: Array.from(selectedContacts),
            });

            // Success - show stats and refresh
            const stats = result.stats || {};
            alert(`Campaign sent! ${stats.sent || selectedContacts.size} messages queued.`);
            onCreated(result.campaign || result);
            onClose();
            resetForm();
        } catch (error) {
            console.error('Error sending campaign:', error);
            alert('Failed to send campaign: ' + (error.message || 'Unknown error'));
        } finally {
            setSending(false);
        }
    };

    const resetForm = () => {
        setView('form');
        setName('');
        setMessageType('custom');
        setCustomMessage('');
        setSelectedTemplate('');
        setCategory('marketing');
    };


    if (!isOpen) return null;

    if (view === 'contacts') {


        return (
            <ContactSelectionPanel
                selectedIds={selectedContacts}
                onToggle={(id) => {
                    const newSelected = new Set(selectedContacts);
                    if (newSelected.has(id)) {
                        newSelected.delete(id);
                    } else {
                        newSelected.add(id);
                    }
                    setSelectedContacts(newSelected);
                }}
                onDone={() => setView('form')}
                onCancel={() => setView('form')}
            />
        );
    }

    const hasSelectedContacts = selectedContacts.size > 0;

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-white sticky top-0 z-10">
                <h2 className="text-xl font-bold text-gray-900">Create Campaign</h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <X size={20} className="text-gray-500" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Contacts Selection */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Recipients *</label>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setView('contacts')}
                            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-colors flex items-center gap-2 border border-gray-200"
                        >
                            <Users size={16} />
                            Select Contacts
                        </button>
                        {hasSelectedContacts && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 text-violet-700 rounded-lg border border-violet-100 text-sm font-medium animate-in fade-in slide-in-from-left-2">
                                <CheckCircle size={14} />
                                {selectedContacts.size} Selected
                            </div>
                        )}
                    </div>
                    {!hasSelectedContacts && (
                        <p className="text-xs text-gray-500 mt-2">You must select at least one contact to send immediately.</p>
                    )}
                </div>

                {/* Campaign Name */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Campaign Name *</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Summer Promo 2024"
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                </div>

                {/* Message Type Toggle */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Message Type</label>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setMessageType('custom')}
                            className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${messageType === 'custom'
                                ? 'bg-violet-500 text-white border-violet-500 shadow-sm'
                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            Custom Message
                        </button>
                        <button
                            onClick={() => setMessageType('template')}
                            className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${messageType === 'template'
                                ? 'bg-violet-500 text-white border-violet-500 shadow-sm'
                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            Template
                        </button>
                    </div>
                </div>

                {/* Custom Message or Template */}
                {messageType === 'custom' ? (
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
                        <textarea
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            placeholder="Enter your message..."
                            rows={6}
                            className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-y min-h-[120px]"
                        />
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Template *</label>
                        {fetchingTemplates ? (
                            <div className="flex items-center gap-2 text-gray-500 py-3 px-4 bg-gray-50 rounded-lg border border-dashed">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-sm">Loading templates...</span>
                            </div>
                        ) : (
                            <select
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                            >
                                <option value="">Select a template...</option>
                                {templates.map((t) => (
                                    <option key={t.id || t.name} value={t.id || t.name}>{t.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                )}

                {/* Category */}
                {messageType === 'template' && (
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        >
                            <option value="marketing">Marketing</option>
                            <option value="utility">Utility</option>
                            <option value="authentication">Authentication</option>
                        </select>
                    </div>
                )}


            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 sticky bottom-0 z-10">
                <button
                    onClick={onClose}
                    className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSaveDraft}
                    disabled={loading || sending}
                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg disabled:opacity-50 flex items-center gap-2 shadow-sm transition-colors"
                >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    Save as Draft
                </button>
                <button
                    onClick={handleSaveAndSend}
                    disabled={loading || sending || !hasSelectedContacts}
                    className={`px-4 py-2.5 text-sm font-medium rounded-lg disabled:opacity-50 flex items-center gap-2 shadow-sm transition-colors ${hasSelectedContacts
                        ? 'text-white bg-violet-500 hover:bg-violet-600'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                        }`}
                    title={!hasSelectedContacts ? 'Select contacts from the campaigns page first' : ''}
                >
                    {sending && <Loader2 size={16} className="animate-spin" />}
                    {!sending && <CheckCircle size={16} />}
                    Save & Send Now
                </button>
            </div>
        </div>
    );
};



// Campaign Detail Modal with Recipients
const CampaignDetailModal = ({ campaign, isOpen, onClose, onSend, onRefresh }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (isOpen && campaign) {
            setLoading(true);
            getCampaignById(campaign.id)
                .then(setDetails)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [isOpen, campaign]);

    const handleSend = async () => {
        if (!confirm('Send this campaign now? This action cannot be undone.')) return;
        setSending(true);
        try {
            await sendCampaign(campaign.id);
            onSend();
            onClose();
        } catch (error) {
            console.error('Error sending campaign:', error);
            alert('Failed to send campaign');
        } finally {
            setSending(false);
        }
    };

    const recipientStatusStyles = {
        pending: 'bg-gray-100 text-gray-600',
        sent: 'bg-blue-100 text-blue-600',
        delivered: 'bg-green-100 text-green-600',
        read: 'bg-purple-100 text-purple-600',
        failed: 'bg-red-100 text-red-600',
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900">{campaign?.name}</h2>
                        <StatusBadge status={campaign?.status} />
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-violet-500" size={24} />
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-2 p-4 bg-gray-50 border-b text-center">
                            <div>
                                <p className="text-lg font-bold text-gray-900">{details?.recipients_count || 0}</p>
                                <p className="text-xs text-gray-500">Recipients</p>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-blue-600">{details?.sent_count || 0}</p>
                                <p className="text-xs text-gray-500">Sent</p>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-green-600">{details?.delivered_count || 0}</p>
                                <p className="text-xs text-gray-500">Delivered</p>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-red-600">{details?.failed_count || 0}</p>
                                <p className="text-xs text-gray-500">Failed</p>
                            </div>
                        </div>

                        {/* Recipients List */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Recipients</h3>
                            {details?.recipients?.length > 0 ? (
                                <div className="space-y-1">
                                    {details.recipients.map((r, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Phone size={14} className="text-gray-400" />
                                                <span className="text-sm font-medium text-gray-900">{r.name || r.phone}</span>
                                                <span className="text-xs text-gray-400">{r.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${recipientStatusStyles[r.status] || recipientStatusStyles.pending}`}>
                                                    {r.status?.charAt(0).toUpperCase() + r.status?.slice(1) || 'Pending'}
                                                </span>
                                                {r.error && <AlertCircle size={12} className="text-red-500" title={r.error} />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-400 text-sm py-8">No recipients added</p>
                            )}
                        </div>

                        {/* Footer */}
                        {campaign?.status === 'draft' && (
                            <div className="flex justify-end gap-2 px-4 py-3 border-t bg-gray-50">
                                <button
                                    onClick={handleSend}
                                    disabled={sending || !details?.recipients_count}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg disabled:opacity-50 flex items-center gap-2"
                                >
                                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                    Send Campaign
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// Main CampaignsPage with integrated contacts
export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);

    // Fetch campaigns
    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const data = await getCampaigns(statusFilter || null);
            setCampaigns(data.campaigns || data || []);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch contacts


    useEffect(() => {
        fetchCampaigns();
    }, [statusFilter]);

    const handleCampaignCreated = (campaign) => {
        fetchCampaigns();
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this campaign?')) return;
        try {
            await deleteCampaign(id);
            setCampaigns(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error('Error deleting campaign:', error);
            alert('Failed to delete campaign');
        }
    };

    const handleViewDetails = (campaign) => {
        setSelectedCampaign(campaign);
        setShowDetail(true);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN', {
            month: 'short', day: 'numeric'
        });
    };

    // Filter and sort campaigns
    const filteredCampaigns = campaigns.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
        if (sortOrder === 'newest') return new Date(b.created_at) - new Date(a.created_at);
        return new Date(a.created_at) - new Date(b.created_at);
    });

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-violet-100 rounded-lg">
                            <Send size={20} className="text-violet-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
                            <p className="text-gray-500 text-sm">Bulk WhatsApp messaging</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm font-medium"
                    >
                        <Plus size={16} />
                        Create Campaign
                    </button>
                </div>
            </div>

            {/* Main Content - Full Width */}
            <div className="flex-1 flex overflow-hidden">
                {/* Campaigns List (Full Width) */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden">
                    {/* Filters */}
                    <div className="p-3 border-b flex gap-2">
                        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border text-sm">
                            <Search size={14} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search campaigns..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent outline-none text-sm"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-2 py-1.5 bg-gray-50 rounded-lg border text-sm"
                        >
                            <option value="">All</option>
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="sending">Sending</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>

                    {/* Campaigns Table or Create Form */}
                    <div className="flex-1 overflow-y-auto">

                        {showCreateModal ? (
                            <CreateCampaignCard
                                isOpen={showCreateModal}
                                onClose={() => setShowCreateModal(false)}
                                onCreated={handleCampaignCreated}
                            />
                        ) : loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="animate-spin text-violet-500" size={24} />
                            </div>
                        ) : sortedCampaigns.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Mail size={32} className="mb-2 opacity-50" />
                                <p className="text-sm font-medium">No campaigns</p>
                                <p className="text-xs mt-1">Click "Create Campaign" to get started</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b sticky top-0">
                                    <tr>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recip.</th>
                                        <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sent</th>
                                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {sortedCampaigns.map(campaign => (
                                        <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3">
                                                <p className="font-medium text-gray-900">{campaign.name}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{formatDate(campaign.created_at)}</p>
                                            </td>
                                            <td className="px-6 py-3">
                                                <StatusBadge status={campaign.status} />
                                            </td>
                                            <td className="px-6 py-3 text-center text-gray-600">
                                                {campaign.recipients_count || campaign.recipient_count || campaign.total_recipients || 0}
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <span className="text-green-600 font-medium">{campaign.delivered_count || campaign.delivered || 0}</span>
                                                <span className="text-gray-300 mx-1">/</span>
                                                <span className="text-gray-600">{campaign.sent_count || campaign.sent || campaign.total_sent || campaign.recipients_count || campaign.recipient_count || 0}</span>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleViewDetails(campaign)}
                                                        className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(campaign.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CampaignDetailModal
                campaign={selectedCampaign}
                isOpen={showDetail}
                onClose={() => setShowDetail(false)}
                onSend={fetchCampaigns}
                onRefresh={fetchCampaigns}
            />
        </div>
    );
}
