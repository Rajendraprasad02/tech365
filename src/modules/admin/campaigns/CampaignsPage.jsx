import { useState, useEffect, useCallback, useRef } from 'react';
import {
    CheckCircle, Clock, AlertCircle, XCircle, Users, Mail,
    X, Phone, ExternalLink, MessageSquare, Smartphone,
    Send, Loader2, Search, Filter, ArrowUpDown, Plus, Trash2, Eye, FileText,
    ChevronDown, ChevronRight, Tag, User, Calendar, Globe
} from 'lucide-react';
import CustomSelect from '../contacts/CustomSelect';
import { CircleFlag } from 'react-circle-flags';
import Pagination from '@/components/ui/Pagination';
import parsePhoneNumber from 'libphonenumber-js';
import {
    getCampaigns,
    getCampaignById,
    createCampaign,
    deleteCampaign,
    addCampaignRecipients,
    sendCampaign,
    quickSendByPhone,
    scheduleCampaign,
    rescheduleCampaign,
    getWhatsAppTemplates,
    getContacts,
    uploadMedia
} from '../../../services/api';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Status badge component
const StatusBadge = ({ status }) => {
    const styles = {
        draft: 'bg-gray-100 text-gray-600',
        scheduled: 'bg-purple-100 text-purple-700',
        sent: 'bg-blue-100 text-blue-700',
        sending: 'bg-yellow-100 text-yellow-700',
        completed: 'bg-green-100 text-green-700',
        failed: 'bg-red-100 text-red-600',
    };
    const icons = {
        draft: Clock,
        scheduled: Calendar,
        sent: Send,
        sending: Loader2,
        completed: CheckCircle,
        failed: XCircle,
    };
    const Icon = icons[status] || Clock;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || styles.draft}`}>
            {status === 'sending' ? <span className="loader-xs mr-1"></span> : <Icon size={10} />}
            {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Draft'}
        </span>
    );
};

// Custom Field Picker for Variables
const FieldPicker = ({ onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    const fields = [
        { label: 'Full Name', value: '{{contact.name}}', icon: User },
        { label: 'Phone Number', value: '{{contact.phone_number}}', icon: Phone },
        { label: 'Source', value: '{{contact.source}}', icon: Search },
        { label: 'Product', value: '{{contact.product}}', icon: Tag },
        { label: 'Status', value: '{{contact.status}}', icon: CheckCircle },
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 h-full px-3 py-2 bg-gray-50 border border-l-0 rounded-r-lg text-[11px] font-bold text-gray-600 transition-all hover:bg-gray-100 hover:text-violet-600 ${isOpen ? 'bg-violet-50 text-violet-700' : ''}`}
            >
                <Plus size={14} className={isOpen ? 'text-violet-500' : 'text-gray-400'} />
                <span>Field</span>
                <ChevronDown size={12} className={`opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b mb-1">Insert Dynamic Field</p>
                    {fields.map((field) => (
                        <div
                            key={field.value}
                            onClick={() => {
                                onSelect(field.value);
                                setIsOpen(false);
                            }}
                            className="px-4 py-2.5 text-sm text-gray-700 cursor-pointer hover:bg-violet-50 hover:text-violet-700 flex items-center gap-3 transition-colors group"
                        >
                            <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-violet-100">
                                <field.icon size={13} className="text-gray-400 group-hover:text-violet-600" />
                            </div>
                            <span className="font-medium">{field.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Sort Options
const SORT_OPTIONS = [
    { value: 'desc', label: 'Newest First' },
    { value: 'asc', label: 'Oldest First' },
    { value: 'name_asc', label: 'Name A-Z' },
    { value: 'name_desc', label: 'Name Z-A' }
];

// Contact Selection Panel (Server-side pagination)
const ContactSelectionPanel = ({ selectedIds, onToggle, onDone, onCancel }) => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);
    const [stats, setStats] = useState({ total: 0 });

    const [statusFilter, setStatusFilter] = useState('all');
    const [statusOptions, setStatusOptions] = useState([{ value: 'all', label: 'All Status' }]);
    const [sourceFilter, setSourceFilter] = useState('all');
    const [sourceOptions, setSourceOptions] = useState([{ value: 'all', label: 'All Sources' }]);

    const [sortBy, setSortBy] = useState('desc');

    // Fetch dynamic status/source options on mount
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const response = await getContacts(0, 100);
                if (response && response.contacts) {
                    const uniqueStatuses = [...new Set(response.contacts.map(c => c.status).filter(Boolean))];
                    setStatusOptions([
                        { value: 'all', label: 'All Status' },
                        ...uniqueStatuses.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))
                    ]);

                    const uniqueSources = [...new Set(response.contacts.map(c => c.source).filter(Boolean))];
                    setSourceOptions([
                        { value: 'all', label: 'All Sources' },
                        ...uniqueSources.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))
                    ]);
                }
            } catch (error) {
                console.error("Error fetching options", error);
            }
        };
        fetchOptions();
    }, []);

    const fetchContacts = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getContacts(page * limit, limit, searchQuery, statusFilter, sortBy, sourceFilter);
            setContacts(data.contacts || []);
            setStats({ total: data.total || 0 });
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            setLoading(false);
        }
    }, [page, limit, searchQuery, statusFilter, sortBy, sourceFilter]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

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
                <div className="flex items-center justify-between gap-2 overflow-visible pb-2 z-20 relative">
                    <div className="flex items-center gap-2">
                        {/* Status Filter */}
                        <CustomSelect
                            value={statusFilter}
                            onChange={(val) => { setStatusFilter(val); setPage(0); }}
                            icon={Filter}
                            placeholder="Status"
                            options={statusOptions}
                        />

                        {/* Source Filter */}
                        <CustomSelect
                            value={sourceFilter}
                            onChange={(val) => { setSourceFilter(val); setPage(0); }}
                            icon={FileText}
                            placeholder="Source"
                            options={sourceOptions}
                        />

                        {/* Sort Filter */}
                        {/* <CustomSelect
                            value={sortBy}
                            onChange={(val) => { setSortBy(val); setPage(0); }}
                            icon={ArrowUpDown}
                            placeholder="Sort"
                            options={SORT_OPTIONS}
                        /> */}
                    </div>

                    <div className="text-sm text-gray-600 font-medium">
                        {selectedIds.size} selected
                    </div>
                </div>
            </div>

            {/* Contacts Table */}
            <div className="flex-1 overflow-y-auto p-0">
                {loading ? (
                    <div className="loader-wrapper">
                        <span className="loader"></span>
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
                                <th className="px-6 py-3 text-left font-medium text-gray-500">Source</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                                <th className="px-6 py-3 text-right font-medium text-gray-500"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {contacts.map(contact => {
                                const isSelected = selectedIds.has(contact.id);
                                const parsedCountry = (() => {
                                    try {
                                        const p = parsePhoneNumber(contact.phone_number);
                                        return p && p.country ? p.country.toLowerCase() : null;
                                    } catch (e) { return null; }
                                })();

                                return (
                                    <tr
                                        key={contact.id}
                                        className={`hover:bg-violet-50 cursor-pointer transition-colors ${isSelected ? 'bg-violet-50' : ''}`}
                                        onClick={() => onToggle(contact)}
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
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                                                    {parsedCountry ? (
                                                        <CircleFlag countryCode={parsedCountry} height={16} />
                                                    ) : (
                                                        <Globe size={16} className="text-gray-400" />
                                                    )}
                                                </div>
                                                <span className="font-medium text-gray-900 font-mono tracking-tight text-sm">{contact.phone_number}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 capitalize">
                                                <FileText size={10} />
                                                {contact.source || 'Manual'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${contact.status === 'valid' ? 'bg-green-100 text-green-700' :
                                                contact.status === 'invalid' ? 'bg-red-100 text-red-700' :
                                                    contact.status === 'reported' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-orange-100 text-orange-700'
                                                }`}>
                                                {contact.status}
                                            </div>
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

                    <div className="ml-2">
                        <CustomSelect
                            value={limit.toString()}
                            onChange={(val) => { setLimit(Number(val)); setPage(0); }}
                            className="px-3 py-1.5 rounded-lg text-xs w-[110px]"
                            options={[
                                { value: '5', label: '5 / page' },
                                { value: '10', label: '10 / page' },
                                { value: '50', label: '50 / page' },
                                { value: '100', label: '100 / page' },
                            ]}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-500 mr-2">
                        Page {page + 1} of {Math.ceil(stats.total / limit)}
                    </div>
                    <button
                        onClick={onDone}
                        className="px-6 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

// Inline Create Campaign Card (renders inside parent container)
const CreateCampaignCard = ({ isOpen, onClose, onCreated }) => {
    const [view, setView] = useState('form'); // 'form' | 'contacts'
    const [selectedContacts, setSelectedContacts] = useState(new Map()); // Map<id, contact>
    const [name, setName] = useState('');

    // Scheduling State
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledAt, setScheduledAt] = useState('');

    // Template & Message State
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templateSearch, setTemplateSearch] = useState('');
    const [variableValues, setVariableValues] = useState({});
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const [headerMediaId, setHeaderMediaId] = useState('');
    const [mediaPreviewUrl, setMediaPreviewUrl] = useState('');

    // Auto-fill {{1}} with dynamic name logic
    useEffect(() => {
        if (selectedTemplate) {
            // Check if {{1}} exists in body
            const bodyComp = selectedTemplate.components.find(c => c.type === 'BODY');
            if (bodyComp && bodyComp.text.includes('{{1}}')) {
                // Set default value for preview only, user can override if they want a static name
                if (!variableValues['1']) {
                    setVariableValues(prev => ({ ...prev, '1': '[Contact Name]' }));
                }
            }
        }
    }, [selectedTemplate]);

    // UI State
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [fetchingTemplates, setFetchingTemplates] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Alert Modal State
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    const triggerAlert = (title, message, type = 'info') => {
        setAlertConfig({ isOpen: true, title, message, type });
    };

    useEffect(() => {
        if (isOpen) {
            setFetchingTemplates(true);
            getWhatsAppTemplates()
                .then(data => setTemplates(data.templates || data || []))
                .catch(console.error)
                .finally(() => setFetchingTemplates(false));
        }
    }, [isOpen]);

    const validateForm = () => {
        // Name validation removed for Quick Send flexibility
        // if (!name.trim()) {
        //     triggerAlert('Validation Error', 'Campaign name is required', 'warning');
        //     return false;
        // }
        if (!selectedTemplate) {
            triggerAlert('Validation Error', 'Please select a template', 'warning');
            return false;
        }

        // Validate all required template variables (body + header)
        const requiredVars = getTemplateVariables(selectedTemplate);
        for (const v of requiredVars) {
            const val = variableValues[v.key];
            if (!val || !String(val).trim()) {
                triggerAlert('Validation Error', `Please provide a value for ${v.label}`, 'warning');
                return false;
            }
        }

        if (isScheduled) {
            if (!scheduledAt) {
                triggerAlert('Validation Error', 'Please select a date and time for scheduling', 'warning');
                return false;
            }
            if (new Date(scheduledAt) <= new Date()) {
                triggerAlert('Validation Error', 'Scheduled time must be in the future', 'warning');
                return false;
            }
        }

        return true;
    };

    // Helper to extract variables from template components
    const getTemplateVariables = (template) => {
        const vars = [];
        if (!template || !template.components) return vars;

        template.components.forEach(comp => {
            if (comp.type === 'BODY') {
                const matches = comp.text.match(/{{(\d+)}}/g);
                if (matches) {
                    matches.forEach(m => {
                        const num = m.replace(/{{|}}/g, '');
                        if (!vars.find(v => v.key === num)) {
                            const isNameVar = num === '1';
                            vars.push({
                                key: num,
                                type: 'body',
                                label: isNameVar ? `Variable {{${num}}} (Name)` : `Variable {{${num}}}`,
                                placeholder: isNameVar ? 'Will use Contact Name' : 'Enter value'
                            });
                        }
                    });
                }
            }
            if (comp.type === 'HEADER') {
                if (comp.format === 'IMAGE' || comp.format === 'VIDEO' || comp.format === 'DOCUMENT') {
                    vars.push({
                        key: 'header_url',
                        type: 'header',
                        format: comp.format,
                        label: `Header ${comp.format} (URL or Upload)`
                    });
                }
                if (comp.format === 'TEXT' && comp.text && comp.text.includes('{{1}}')) {
                    vars.push({ key: 'header_name', type: 'header_text', label: 'Header Variable' });
                }
            }
        });
        return vars;
    };

    const handleMediaUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Generate preview URL
        const previewUrl = URL.createObjectURL(file);
        setMediaPreviewUrl(previewUrl);

        setUploadingMedia(true);
        try {
            const result = await uploadMedia(file);
            if (result && result.id) {
                setHeaderMediaId(result.id);
                // Also update variableValues if we want to show a placeholder or filename
                handleVariableChange('header_url', result.filename || file.name);
            }
        } catch (error) {
            console.error('Media upload failed:', error);
            triggerAlert('Upload Failed', error.message || 'Unknown error', 'danger');
            setMediaPreviewUrl(''); // Clear preview on failure
        } finally {
            setUploadingMedia(false);
        }
    };

    const handleVariableChange = (key, value) => {
        setVariableValues(prev => ({ ...prev, [key]: value }));
    };

    const getPreviewText = (template) => {
        if (!template) return '';
        let body = template.components.find(c => c.type === 'BODY')?.text || '';
        Object.keys(variableValues).forEach(key => {
            if (key !== 'header_url' && key !== 'header_name') {
                // If the value is [Contact Name], we keep it as is for preview
                body = body.replace(new RegExp(`{{${key}}}`, 'g'), variableValues[key] || `{{${key}}}`);
            }
        });
        return body;
    };

    const renderButtons = (template) => {
        const buttonsComp = template?.components.find(c => c.type === 'BUTTONS');
        if (!buttonsComp || !buttonsComp.buttons) return null;

        return (
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-dashed border-green-200">
                {buttonsComp.buttons.map((btn, idx) => (
                    <div key={idx} className="bg-white text-blue-500 text-center py-2 rounded shadow-sm text-sm font-medium flex items-center justify-center gap-2">
                        {btn.type === 'URL' && <ExternalLink size={14} />}
                        {btn.type === 'PHONE_NUMBER' && <Smartphone size={14} />}
                        {(btn.type === 'QUICK_REPLY' || btn.type === 'FLOW') && <MessageSquare size={14} />}
                        {btn.text}
                    </div>
                ))}
            </div>
        );
    };


    // Save & Send Now - Uses new quick-send-by-phone endpoint with personalization
    const handleSendNow = async () => {
        if (!validateForm()) return;

        setSending(true);
        try {
            // Check if template has a FLOW button
            const hasFlow = selectedTemplate.components.some(c =>
                c.type === 'BUTTONS' && c.buttons && c.buttons.some(b => b.type === 'FLOW')
            );

            // 1. Build Recipients Array with Personalization
            const recipients = Array.from(selectedContacts.values()).map(contact => {
                const recipientVars = {};

                // Generic Dynamic Variable Resolution
                Object.entries(variableValues).forEach(([key, value]) => {
                    if (typeof value === 'string') {
                        // Check for {{contact.field}} pattern
                        const match = value.match(/{{contact\.(.*?)}}/);
                        if (match) {
                            const field = match[1];
                            recipientVars[key] = contact[field] || '';
                        } else if (key === '1' && value === '[Contact Name]') {
                            // Legacy/Default fallback
                            recipientVars[key] = contact.name || 'Valued Customer';
                        }
                    }
                });

                // Add Flow Token if template is a Flow
                if (hasFlow) {
                    recipientVars['flow_token'] = contact.id || 'unknown_id';
                }

                return {
                    phone_number: contact.phone_number,
                    variables: recipientVars
                };
            });

            // 2. Build Global Template Variables (Shared/Fallback)
            const globalVars = { ...variableValues };

            // Remove dynamic keys from global so we don't send unparsed tokens
            Object.keys(globalVars).forEach(key => {
                if (typeof globalVars[key] === 'string' && globalVars[key].includes('{{contact.')) {
                    delete globalVars[key];
                }
                // Remove legacy default if handled
                if (key === '1' && globalVars[key] === '[Contact Name]') {
                    delete globalVars[key];
                }
            });

            // Check for header type and add to global vars
            const headerComp = selectedTemplate.components.find(c => c.type === 'HEADER');
            if (headerComp && (headerComp.format === 'IMAGE' || headerComp.format === 'VIDEO' || headerComp.format === 'DOCUMENT')) {
                globalVars.header_type = headerComp.format.toLowerCase();

                // If we have a media ID from upload, use it instead of the URL
                if (headerMediaId) {
                    globalVars.header_media_id = headerMediaId;
                    delete globalVars.header_url;
                }
            }

            // 3. Construct Payload
            const payload = {
                name: name || `Quick Campaign ${new Date().toLocaleString()}`,
                recipients: recipients,
                contact_ids: Array.from(selectedContacts.keys()),
                template_name: selectedTemplate.name,
                category: selectedTemplate.category || 'utility',
                template_variables: globalVars,
                scheduled_at: isScheduled && scheduledAt ? new Date(scheduledAt).toISOString() : null
            };

            console.log('Sending Personalized Payload:', payload);

            const result = await quickSendByPhone(payload);

            const count = result.stats ? result.stats.sent : recipients.length;
            const successMsg = isScheduled
                ? `Message has been scheduled at ${new Date(scheduledAt).toLocaleString()}`
                : `Campaign sent! ${count} messages queued.`;

            triggerAlert('Success', successMsg, 'success');
            onCreated(result);

        } catch (error) {
            console.error('Error sending campaign:', error);
            triggerAlert('Error', 'Failed to send campaign: ' + (error.message || 'Unknown error'), 'danger');
        } finally {
            setSending(false);
            setShowConfirm(false);
        }
    };

    // Filter templates
    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(templateSearch.toLowerCase())
    );

    if (!isOpen) return null;

    if (view === 'contacts') {
        return (
            <ContactSelectionPanel
                selectedIds={new Set(selectedContacts.keys())}
                onToggle={(contact) => {
                    const newSelected = new Map(selectedContacts);
                    if (newSelected.has(contact.id)) {
                        newSelected.delete(contact.id);
                    } else {
                        newSelected.set(contact.id, contact);
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
        <div className="flex flex-col h-full bg-white relative">
            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg">Confirm Send</h3>
                            <button onClick={() => setShowConfirm(false)}><X size={20} /></button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1">
                            <div className="mb-4">
                                <p className="text-sm text-gray-500 mb-1">Recipients</p>
                                <p className="font-bold text-lg">{selectedContacts.size} Contacts</p>
                                <div className="text-xs text-gray-400 mt-1 max-h-20 overflow-y-auto">
                                    {Array.from(selectedContacts.values()).slice(0, 10).map(c => c.name || c.phone_number).join(', ')}
                                    {selectedContacts.size > 10 && ` +${selectedContacts.size - 10} more`}
                                </div>
                            </div>

                            {isScheduled && (
                                <div className="mb-4 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                                    <p className="text-xs text-purple-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                                        <Calendar size={12} /> Scheduled For
                                    </p>
                                    <p className="text-sm font-bold text-purple-700">
                                        {new Date(scheduledAt).toLocaleString('en-IN', {
                                            day: '2-digit', month: 'short', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            )}

                            <div className="mb-4">
                                <p className="text-sm text-gray-500 mb-1">Template</p>
                                <div className="border rounded-lg p-3 bg-gray-50">
                                    <p className="font-medium text-sm mb-2">{selectedTemplate?.name}</p>
                                    {/* Preview */}
                                    <div className="bg-[#dcf8c6] p-3 rounded-lg text-sm text-gray-800 shadow-sm inline-block max-w-full">
                                        {/* Header Preview */}
                                        {selectedTemplate?.components.find(c => c.type === 'HEADER' && c.format === 'IMAGE') && (
                                            <div className="mb-2 h-32 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                                                {mediaPreviewUrl || variableValues.header_url ? (
                                                    <img src={mediaPreviewUrl || variableValues.header_url} alt="Header" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xs text-gray-500">Image Header</span>
                                                )}
                                            </div>
                                        )}
                                        {selectedTemplate?.components.find(c => c.type === 'HEADER' && c.format === 'DOCUMENT') && (
                                            <div className="mb-2 w-full h-12 bg-gray-200 rounded flex items-center justify-center gap-2 border border-black/5">
                                                <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center"><div className="text-[10px] font-bold text-red-500">PDF</div></div>
                                                <span className="text-[10px] text-gray-600 truncate">{variableValues.header_url || 'Document.pdf'}</span>
                                            </div>
                                        )}
                                        <div className="whitespace-pre-wrap">{getPreviewText(selectedTemplate)}</div>
                                        {renderButtons(selectedTemplate)}
                                        <div className="text-[10px] text-gray-500 text-right mt-1">12:00 PM</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t flex gap-2 justify-end">
                            <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={handleSendNow} disabled={sending} className="px-4 py-2 text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-lg flex items-center gap-2">
                                {sending && <span className="loader-sm"></span>}
                                {isScheduled ? 'Confirm & Schedule' : 'Confirm & Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between px-6 py-4 border-b bg-white sticky top-0 z-10">
                <h2 className="text-xl font-bold text-gray-900">Create Campaign</h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <X size={20} className="text-gray-500" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Contacts Selection */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-semibold text-gray-700">Recipients *</label>
                        {hasSelectedContacts && <span className="text-xs text-violet-600 font-medium">{selectedContacts.size} Selected</span>}
                    </div>
                    <button
                        type="button"
                        onClick={() => setView('contacts')}
                        className="w-full px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl text-sm transition-all flex items-center justify-between border border-gray-200 shadow-sm"
                    >
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-violet-100 text-violet-600 rounded-lg">
                                <Users size={18} />
                            </div>
                            <span>Select Contacts</span>
                        </div>
                        <ArrowUpDown size={16} className="text-gray-400 rotate-90" />
                    </button>

                    {/* Selected Contacts Capsules */}
                    {hasSelectedContacts && (
                        <div className="mt-3 flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                            {Array.from(selectedContacts.values()).map((contact) => (
                                <div
                                    key={contact.id}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-full text-xs font-medium group transition-all hover:bg-violet-100"
                                >
                                    <span>{contact.name || contact.phone_number}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newSelected = new Map(selectedContacts);
                                            newSelected.delete(contact.id);
                                            setSelectedContacts(newSelected);
                                        }}
                                        className="p-0.5 hover:bg-violet-200 rounded-full transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            {selectedContacts.size > 0 && (
                                <button
                                    onClick={() => setSelectedContacts(new Map())}
                                    className="text-[10px] text-gray-400 hover:text-red-500 uppercase tracking-wider font-bold ml-1 transition-colors"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
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

                {/* Scheduling Toggle */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock size={18} className="text-violet-600" />
                            <span className="text-sm font-semibold text-gray-700">Schedule message</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isScheduled}
                                onChange={(e) => setIsScheduled(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                        </label>
                    </div>
                    {isScheduled && (
                        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Delivery Date & Time</label>
                            <input
                                type="datetime-local"
                                value={scheduledAt}
                                onChange={(e) => setScheduledAt(e.target.value)}
                                min={new Date().toISOString().slice(0, 16)}
                                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none"
                            />
                            <p className="text-[10px] text-gray-400 mt-2 italic">
                                Campaigns will be queued and sent automatically at the selected time.
                            </p>
                        </div>
                    )}
                </div>

                {/* Template Selection */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Template *</label>

                    {fetchingTemplates ? (
                        <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg border border-dashed">
                            <span className="loader-sm border-gray-400"></span>
                        </div>
                    ) : (
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                            {/* Search */}
                            <div className="p-2 border-b bg-gray-50 flex items-center gap-2">
                                <Search size={16} className="text-gray-400 ml-2" />
                                <input
                                    type="text"
                                    placeholder="Search templates..."
                                    value={templateSearch}
                                    onChange={(e) => setTemplateSearch(e.target.value)}
                                    className="flex-1 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-gray-400"
                                />
                            </div>

                            {/* List */}
                            <div className="max-h-48 overflow-y-auto bg-white">
                                {filteredTemplates.length === 0 ? (
                                    <p className="text-center text-xs text-gray-400 py-4">No templates found</p>
                                ) : (
                                    filteredTemplates.map(t => (
                                        <div
                                            key={t.name}
                                            onClick={() => {
                                                setSelectedTemplate(t);
                                                setVariableValues({}); // Reset vars
                                                setHeaderMediaId(''); // Reset media upload
                                                setMediaPreviewUrl(''); // Reset preview
                                            }}
                                            className={`px-4 py-3 cursor-pointer text-sm flex items-center justify-between transition-colors ${selectedTemplate?.name === t.name ? 'bg-violet-50 text-violet-700' : 'hover:bg-gray-50 text-gray-700'}`}
                                        >
                                            <span className="font-medium">{t.name}</span>
                                            <span className="text-xs text-gray-400 capitalize">{t.category}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Template Preview and Variables */}
                {selectedTemplate && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Message Preview</label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Variables Inputs */}
                            <div className="space-y-4">
                                {getTemplateVariables(selectedTemplate).length > 0 ? (
                                    getTemplateVariables(selectedTemplate).map(variable => (
                                        <div key={variable.key}>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">{variable.label}</label>

                                            {variable.type === 'header' ? (
                                                <div className="space-y-2">
                                                    <div className="flex h-10 shadow-sm">
                                                        <input
                                                            type="text"
                                                            value={variableValues[variable.key] || ''}
                                                            onChange={(e) => {
                                                                handleVariableChange(variable.key, e.target.value);
                                                                if (headerMediaId) setHeaderMediaId(''); // Clear ID if user types a URL
                                                                if (mediaPreviewUrl) setMediaPreviewUrl(''); // Clear local preview if user types a URL
                                                            }}
                                                            placeholder={`Enter ${variable.format} URL...`}
                                                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-l-lg focus:ring-1 focus:ring-violet-500 outline-none focus:border-violet-500"
                                                        />
                                                        <label className={`px-4 py-2 border border-l-0 rounded-r-lg bg-gray-50 text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center gap-1.5 transition-colors text-[11px] font-bold ${uploadingMedia ? 'opacity-50 pointer-events-none' : ''}`}>
                                                            {uploadingMedia ? <span className="loader-sm border-gray-400"></span> : <Plus size={14} className="text-gray-400" />}
                                                            <span>UPLOAD</span>
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                onChange={handleMediaUpload}
                                                                accept={variable.format === 'IMAGE' ? "image/*" : variable.format === 'VIDEO' ? "video/*" : ".pdf,.doc,.docx"}
                                                            />
                                                        </label>
                                                    </div>
                                                    {headerMediaId && (
                                                        <p className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                                                            <CheckCircle size={10} />
                                                            Uploaded successfully: {variableValues[variable.key]}
                                                        </p>
                                                    )}
                                                    <p className="text-[10px] text-gray-400 pl-1">
                                                        Enter a direct URL or upload a file from your computer.
                                                    </p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex h-10 shadow-sm">
                                                        <input
                                                            type="text"
                                                            value={variableValues[variable.key] || ''}
                                                            onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                                                            placeholder={`Enter value or select field...`}
                                                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-l-lg focus:ring-1 focus:ring-violet-500 outline-none focus:border-violet-500"
                                                        />
                                                        <FieldPicker onSelect={(val) => handleVariableChange(variable.key, val)} />
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 mt-1.5 pl-1 italic">
                                                        Dynamic fields like <span className="text-violet-500 font-medium">{'{{contact.name}}'}</span> will be replaced per recipient.
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 italic py-2">No variables in this template.</p>
                                )}
                                <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-lg mt-4">
                                    <strong>Note:</strong> <code>{'{{contact.name}}'}</code> will be replaced with the actual contact's name for each message.
                                </div>
                            </div>

                            {/* Preview Card */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-gray-100 rounded-xl transform rotate-1"></div>
                                <div className="relative bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3 border-b pb-2">
                                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">WA</div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">WhatsApp Business</p>
                                            <p className="text-[10px] text-gray-500">Preview</p>
                                        </div>
                                    </div>

                                    <div className="bg-[#e7fce3] p-3 rounded-lg rounded-tl-none inline-block max-w-full text-sm text-gray-800 relative">
                                        {selectedTemplate.components.some(c => c.type === 'HEADER' && c.format === 'IMAGE') && (
                                            <div className="mb-2 w-full h-32 bg-gray-300 rounded overflow-hidden flex items-center justify-center">
                                                {mediaPreviewUrl || variableValues.header_url ? (
                                                    <img src={mediaPreviewUrl || variableValues.header_url} className="w-full h-full object-cover" alt="header" />
                                                ) : (
                                                    <span className="text-xs text-gray-500">Image</span>
                                                )}
                                            </div>
                                        )}
                                        {selectedTemplate.components.some(c => c.type === 'HEADER' && c.format === 'DOCUMENT') && (
                                            <div className="mb-2 w-full h-12 bg-gray-200 rounded flex items-center justify-center gap-2">
                                                <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center"><div className="text-[10px] font-bold text-red-500">PDF</div></div>
                                                <span className="text-xs text-gray-600 truncate">{variableValues.header_url || 'Document.pdf'}</span>
                                            </div>
                                        )}


                                        <p className="whitespace-pre-wrap leading-relaxed">{getPreviewText(selectedTemplate)}</p>

                                        {renderButtons(selectedTemplate)}

                                        <div className="flex justify-end mt-1">
                                            <span className="text-[10px] text-gray-500">12:30 PM</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
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
                    onClick={() => {
                        if (validateForm()) {
                            if (selectedContacts.size === 0) {
                                triggerAlert('Selection Required', 'Please select recipients', 'warning');
                                return;
                            }
                            setShowConfirm(true);
                        }
                    }}
                    disabled={loading || sending || !hasSelectedContacts}
                    className={`px-6 py-2.5 text-sm font-medium rounded-lg disabled:opacity-50 flex items-center gap-2 shadow-sm transition-colors ${hasSelectedContacts
                        ? 'text-white bg-violet-600 hover:bg-violet-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                        }`}
                >
                    <Send size={16} />
                    {isScheduled ? 'Schedule Campaign' : 'Send Campaign'}
                </button>
            </div>

            {/* Alert Modal */}
            <ConfirmationModal
                isOpen={alertConfig.isOpen}
                onClose={() => {
                    setAlertConfig(prev => ({ ...prev, isOpen: false }));
                    if (alertConfig.type === 'success') onClose();
                }}
                onConfirm={() => {
                    setAlertConfig(prev => ({ ...prev, isOpen: false }));
                    if (alertConfig.type === 'success') onClose();
                }}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                confirmText="OK"
                cancelText={null}
            />
        </div>
    );
};



// Recipient Row with Accordion for Details
const RecipientRow = ({ recipient, statusStyles }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const r = recipient;

    const parseFlowResponse = (response) => {
        if (!response) return null;
        try {
            const data = typeof response === 'string' ? JSON.parse(response) : response;
            return Object.entries(data).filter(([key]) => key !== 'flow_token');
        } catch (e) {
            return null;
        }
    };

    const flowData = parseFlowResponse(r.flow_response);
    const hasDetails = r.error_message || (flowData && flowData.length > 0);

    return (
        <div className="border-b border-gray-50 last:border-0">
            <div
                className={`flex items-center justify-between p-4 transition-colors group ${hasDetails ? 'cursor-pointer hover:bg-gray-50/80' : ''}`}
                onClick={() => hasDetails && setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-violet-100">
                        {(r.name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 group-hover:text-violet-600 transition-colors">
                            {r.name || 'Private Contact'}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                            <Phone size={10} /> {r.phone_number || r.phone}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border shadow-sm ${statusStyles[r.status] || statusStyles.pending}`}>
                            {r.status || 'Pending'}
                        </span>
                        {r.sent_at && (
                            <span className="text-[10px] text-gray-400 font-medium">
                                {new Date(r.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>
                    {hasDetails && (
                        <div className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                            <ChevronRight size={18} />
                        </div>
                    )}
                </div>
            </div>

            {/* Expandable Details Panel */}
            {isExpanded && hasDetails && (
                <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                    <div className="ml-0 sm:ml-14 bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-3">
                        {/* Error Message */}
                        {r.error_message && (
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <AlertCircle size={12} /> Delivery Error
                                </p>
                                <p className="text-xs text-red-600 font-medium bg-red-50/50 p-2 rounded-lg border border-red-100/50">
                                    {r.error_message}
                                </p>
                            </div>
                        )}

                        {/* Flow Response Data */}
                        {flowData && flowData.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <MessageSquare size={12} /> Flow Interactions
                                </p>
                                <div className="grid grid-cols-1 gap-2">
                                    {flowData.map(([key, value]) => {
                                        // Clean up key: screen_1_Purchase_0 -> Purchase
                                        const cleanKey = key.split('_').filter(s => isNaN(s) && s !== 'screen').join(' ');
                                        // Clean up value: 0_Excellent -> Excellent
                                        const cleanValue = typeof value === 'string' ? value.split('_').slice(1).join('_') || value : value;

                                        return (
                                            <div key={key} className="flex flex-col gap-0.5 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{cleanKey}</span>
                                                <span className="text-xs font-semibold text-gray-700">{cleanValue}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {!r.error_message && (!flowData || flowData.length === 0) && (
                            <div className="py-2 text-center">
                                <p className="text-xs text-gray-400 italic">No additional details available</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Campaign Detail Modal with Recipients
const CampaignDetailModal = ({ campaign, isOpen, onClose, onSend, onRefresh }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: null
    });

    useEffect(() => {
        if (isOpen && campaign) {
            setLoading(true);
            getCampaignById(campaign.id)
                .then(setDetails)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [isOpen, campaign]);

    const handleSendAction = async () => {
        setSending(true);
        try {
            await sendCampaign(campaign.id);
            onSend();
            setModalConfig({
                isOpen: true,
                title: 'Success',
                message: 'Campaign sent successfully!',
                type: 'success',
                onConfirm: onClose
            });
        } catch (error) {
            console.error('Error sending campaign:', error);
            setModalConfig({
                isOpen: true,
                title: 'Error',
                message: 'Failed to send campaign',
                type: 'danger'
            });
        } finally {
            setSending(false);
        }
    };

    const handleSend = () => {
        const headerUrl = details?.template_variables?.header_url;
        setModalConfig({
            isOpen: true,
            title: 'Confirm Send',
            message: 'Send this campaign now? This action cannot be undone.',
            type: 'warning',
            confirmText: 'Send Now',
            onConfirm: handleSendAction,
            image: headerUrl
        });
    };

    const recipientStatusStyles = {
        pending: 'bg-gray-100 text-gray-600 border-gray-200',
        sent: 'bg-blue-50 text-blue-600 border-blue-100',
        delivered: 'bg-green-50 text-green-600 border-green-100',
        read: 'bg-purple-50 text-purple-600 border-purple-100',
        failed: 'bg-red-50 text-red-600 border-red-100',
    };

    if (!isOpen) return null;

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-white/20">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b bg-white relative">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">{campaign?.name}</h2>
                            <StatusBadge status={campaign?.status} />
                        </div>
                        <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                            <FileText size={12} />
                            Template: <span className="text-violet-600 uppercase tracking-wider">{details?.template_name || campaign?.template_name}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-all group active:scale-95"
                    >
                        <X size={20} className="text-gray-400 group-hover:text-gray-600" />
                    </button>
                </div>

                {loading ? (
                    <div className="loader-wrapper py-20 gap-4">
                        <div className="relative">
                            <span className="loader"></span>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <MessageSquare size={16} className="text-violet-600" />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-gray-500 animate-pulse">Loading campaign details...</p>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {/* Stats Dashboard */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                                        <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mb-3">
                                            <Users size={20} />
                                        </div>
                                        <p className="text-2xl font-black text-gray-900 leading-none mb-1">{details?.stats?.total || details?.recipients_count || 0}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                                    </div>
                                    <div className="bg-blue-50/30 rounded-2xl p-4 border border-blue-100 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3">
                                            <Send size={18} />
                                        </div>
                                        <p className="text-2xl font-black text-blue-700 leading-none mb-1">{details?.stats?.sent || details?.sent_count || 0}</p>
                                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Sent</p>
                                    </div>
                                    <div className="bg-red-50/30 rounded-2xl p-4 border border-red-100 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow sm:col-span-1">
                                        <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-3">
                                            <AlertCircle size={20} />
                                        </div>
                                        <p className="text-2xl font-black text-red-700 leading-none mb-1">{details?.stats?.failed || details?.failed_count || 0}</p>
                                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Failed</p>
                                    </div>
                                </div>
                            </div>

                            {/* Details & Info */}
                            <div className="px-6 py-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b pb-2 flex items-center gap-2">
                                        <Clock size={14} /> Campaign Lifecycle
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 font-medium">Created On</span>
                                            <span className="text-gray-900 font-semibold">{formatDate(details?.created_at)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 font-medium">Completed On</span>
                                            <span className="text-gray-900 font-semibold">{formatDate(details?.completed_at)}</span>
                                        </div>
                                        {details?.scheduled_at && (
                                            <div className="flex items-center justify-between text-sm pt-1 border-t border-dashed border-gray-100">
                                                <span className="text-gray-500 font-medium">Scheduled For</span>
                                                <span className="text-purple-600 font-bold">
                                                    {formatDate(details?.scheduled_at)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between text-sm pt-1 border-t border-dashed border-gray-100">
                                            <span className="text-gray-500 font-medium">Template Category</span>
                                            <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-bold uppercase tracking-tight text-gray-600">
                                                {details?.category || 'Utility'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b pb-2 flex items-center gap-2">
                                        <MessageSquare size={14} /> WhatsApp ID
                                    </h3>
                                    <div className="p-4 bg-violet-50/50 rounded-xl border border-violet-100/50">
                                        <code className="text-[10px] text-violet-700 font-mono break-all leading-relaxed">
                                            {details?.id || 'CAMPAIGN_ID_PENDING'}
                                        </code>
                                    </div>
                                </div>
                            </div>

                            {/* Recipients List */}
                            <div className="p-6">
                                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                                    <span>Recipients Performance</span>
                                    <span className="px-2 py-0.5 bg-white border border-gray-200 rounded-full text-[10px] font-bold text-gray-500 shadow-sm">
                                        {details?.recipients?.length || 0} Total
                                    </span>
                                </h3>

                                <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                                    {details?.recipients?.length > 0 ? (
                                        <div>
                                            {details.recipients.map((r, idx) => (
                                                <RecipientRow
                                                    key={idx}
                                                    recipient={r}
                                                    statusStyles={recipientStatusStyles}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-300">
                                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center border border-dashed border-gray-200">
                                                <Users size={24} className="opacity-20" />
                                            </div>
                                            <p className="text-sm font-medium">No recipient data available for this campaign</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        {campaign?.status === 'draft' && (
                            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 items-center">
                                <p className="text-[11px] text-gray-400 font-medium flex-1">
                                    <AlertCircle size={12} className="inline mr-1" /> Ready to broadcast to {details?.recipients_count} contacts
                                </p>
                                <button
                                    onClick={handleSend}
                                    disabled={sending || !details?.recipients_count}
                                    className="px-6 py-2.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 active:scale-95 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-100 transition-all w-full sm:w-auto"
                                >
                                    {sending ? <span className="loader-sm"></span> : <Send size={16} />}
                                    Launch Campaign
                                </button>
                            </div>
                        )}
                        {campaign?.status === 'completed' && (
                            <div className="px-6 py-4 border-t bg-gray-50 text-right">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 active:scale-95 rounded-xl transition-all shadow-sm"
                                >
                                    Close Details
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
            {/* Confirmation/Alert Modal */}
            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => {
                    if (typeof modalConfig.onConfirm === 'function') {
                        modalConfig.onConfirm();
                    }
                    setModalConfig(prev => ({ ...prev, isOpen: false }));
                }}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                confirmText={modalConfig.confirmText || 'OK'}
                cancelText={modalConfig.onConfirm ? 'Cancel' : null}
            />
        </div>
    );
};


// Reschedule Modal Component
const RescheduleModal = ({ isOpen, onClose, onReschedule, campaign }) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && campaign?.scheduled_at) {
            // Format for datetime-local: YYYY-MM-DDTHH:mm using local time
            const date = new Date(campaign.scheduled_at);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const formatted = `${year}-${month}-${day}T${hours}:${minutes}`;
            setSelectedDate(formatted);
        } else {
            setSelectedDate('');
        }
    }, [isOpen, campaign]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!selectedDate) return;
        setLoading(true);
        try {
            await onReschedule(campaign.id, new Date(selectedDate));
            onClose();
        } catch (error) {
            console.error('Error rescheduling:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden border border-white/20">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Calendar size={18} className="text-violet-600" />
                        Reschedule Campaign
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-500">
                        Choose a new date and time for <span className="font-bold text-gray-700">{campaign?.name}</span> to be sent.
                    </p>
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Scheduled Date & Time</label>
                        <input
                            type="datetime-local"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all font-medium"
                            min={new Date().toISOString().slice(0, 16)}
                        />
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading || !selectedDate}
                        className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-violet-100 disabled:opacity-50 flex items-center gap-2 transition-all"
                    >
                        {loading ? <span className="loader-sm"></span> : <Calendar size={16} />}
                        Save Schedule
                    </button>
                </div>
            </div>
        </div>
    );
};


// Main CampaignsPage with integrated contacts
export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: null
    });
    const [statusFilter, setStatusFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [showReschedule, setShowReschedule] = useState(false);
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
        setModalConfig({
            isOpen: true,
            title: 'Delete Campaign',
            message: 'Are you sure you want to delete this campaign? This action cannot be undone.',
            type: 'danger',
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    await deleteCampaign(id);
                    setCampaigns(prev => prev.filter(c => c.id !== id));
                    setModalConfig({
                        isOpen: true,
                        title: 'Success',
                        message: 'Campaign deleted successfully',
                        type: 'success'
                    });
                } catch (error) {
                    console.error('Error deleting campaign:', error);
                    setModalConfig({
                        isOpen: true,
                        title: 'Error',
                        message: 'Failed to delete campaign',
                        type: 'danger'
                    });
                }
            }
        });
    };

    const handleViewDetails = (campaign) => {
        setSelectedCampaign(campaign);
        setShowDetail(true);
    };

    const handleReschedule = (campaign) => {
        setSelectedCampaign(campaign);
        setShowReschedule(true);
    };

    const onRescheduleConfirm = async (id, newDate) => {
        try {
            await rescheduleCampaign(id, newDate.toISOString());
            await fetchCampaigns();
            setModalConfig({
                isOpen: true,
                title: 'Success',
                message: 'Campaign rescheduled successfully',
                type: 'success'
            });
        } catch (error) {
            console.error('Error rescheduling:', error);
            setModalConfig({
                isOpen: true,
                title: 'Error',
                message: error.message || 'Failed to reschedule campaign',
                type: 'danger'
            });
        }
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

    const paginatedCampaigns = sortedCampaigns.slice(page * pageSize, (page + 1) * pageSize);
    const totalPages = Math.ceil(sortedCampaigns.length / pageSize);

    // Reset to first page when filters change
    useEffect(() => {
        setPage(0);
    }, [searchQuery, statusFilter, sortOrder, pageSize]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 bg-white border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-violet-100 rounded-lg">
                            <Send size={20} className="text-violet-600" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Campaigns</h1>
                            <p className="text-gray-500 text-xs sm:sm">Bulk WhatsApp messaging</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm font-medium w-full sm:w-auto transition-all"
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
                    <div className="p-3 border-b flex flex-col sm:flex-row gap-2">
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
                        <CustomSelect
                            value={statusFilter}
                            onChange={(val) => setStatusFilter(val)}
                            className="w-full sm:w-36 px-3 py-1.5 rounded-lg text-sm"
                            options={[
                                { value: '', label: 'All Status' },
                                { value: 'scheduled', label: 'Scheduled' },
                                { value: 'sent', label: 'Sent' },
                                { value: 'sending', label: 'Sending' },
                                { value: 'completed', label: 'Completed' },
                                { value: 'failed', label: 'Failed' },
                            ]}
                            placeholder="All Status"
                        />
                    </div>

                    {/* Campaigns Table or Create Form */}
                    <div className="flex-1 overflow-y-auto min-h-[530px] custom-scrollbar">

                        {showCreateModal ? (
                            <CreateCampaignCard
                                isOpen={showCreateModal}
                                onClose={() => setShowCreateModal(false)}
                                onCreated={handleCampaignCreated}
                            />
                        ) : sortedCampaigns.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Mail size={32} className="mb-2 opacity-50" />
                                <p className="text-sm font-medium">No campaigns</p>
                                <p className="text-xs mt-1">Click "Create Campaign" to get started</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-[600px] sm:min-w-0">
                                    <thead className="bg-gray-50 border-b sticky top-0">
                                        <tr>
                                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recip.</th>
                                            {/* <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sent</th> */}
                                            <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedCampaigns.map(campaign => (
                                            <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-3">
                                                    <p className="font-medium text-gray-900">{campaign.name}</p>
                                                    <div className="flex flex-col gap-0.5 mt-1">
                                                        {campaign.scheduled_at && (
                                                            <p className="text-[10px] text-purple-600 font-bold flex items-center gap-1">
                                                                <Calendar size={10} /> Scheduled at: {new Date(campaign.scheduled_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        )}
                                                        {campaign.status === 'completed' && campaign.completed_at ? (
                                                            <p className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                                                                <CheckCircle size={10} /> Completed at: {new Date(campaign.completed_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        ) : !campaign.scheduled_at && (
                                                            <p className="text-[10px] text-gray-400 font-medium">{formatDate(campaign.created_at)}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <StatusBadge status={campaign.status} />
                                                </td>
                                                <td className="px-6 py-3 text-center text-gray-600">
                                                    {campaign.recipients_count || campaign.recipient_count || campaign.total_recipients || 0}
                                                </td>
                                                {/* <td className="px-6 py-3 text-center">
                                                <span className="text-green-600 font-medium">{campaign.delivered_count || campaign.delivered || 0}</span>
                                                <span className="text-gray-300 mx-1">/</span>
                                                <span className="text-gray-600">{campaign.sent_count || campaign.sent || campaign.total_sent || campaign.recipients_count || campaign.recipient_count || 0}</span>
                                            </td> */}
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleViewDetails(campaign)}
                                                            className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                                            title="View"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                                                            <button
                                                                onClick={() => handleReschedule(campaign)}
                                                                className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                                title="Reschedule"
                                                            >
                                                                <Calendar size={16} />
                                                            </button>
                                                        )}
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
                            </div>
                        )}
                    </div>

                    {/* Pagination Footer */}
                    {!showCreateModal && !loading && sortedCampaigns.length > 0 && (
                        <Pagination
                            page={page}
                            pageSize={pageSize}
                            total={sortedCampaigns.length}
                            onPageChange={setPage}
                            onPageSizeChange={setPageSize}
                            pageSizeOptions={[5, 10, 20, 50, 100]}
                            className="border-none"
                        />
                    )}
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

            <RescheduleModal
                isOpen={showReschedule}
                onClose={() => setShowReschedule(false)}
                onReschedule={onRescheduleConfirm}
                campaign={selectedCampaign}
            />

            {/* Confirmation/Alert Modal */}
            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => {
                    if (typeof modalConfig.onConfirm === 'function') {
                        modalConfig.onConfirm();
                    }
                    setModalConfig(prev => ({ ...prev, isOpen: false }));
                }}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                confirmText={modalConfig.confirmText || 'OK'}
                cancelText={modalConfig.onConfirm ? 'Cancel' : null}
            />
        </div>
    );
}
