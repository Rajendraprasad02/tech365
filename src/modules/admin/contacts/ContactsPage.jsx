import { useState, useEffect, useCallback } from 'react';
import {
    Users, Upload, FolderOpen, Clock, AlertCircle, Search,
    Phone, Globe, Calendar, MoreHorizontal, Trash2, Plus,
    FileText, CheckCircle, XCircle, Download, Edit3, X
} from 'lucide-react';
import api from '@/services/api';

// API base URL - still kept just in case of fallback, but api.js handles it
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ContactsPage() {
    const [activeTab, setActiveTab] = useState('all-contacts');

    const tabs = [
        { id: 'all-contacts', label: 'All Contacts', icon: Users },
        { id: 'upload', label: 'Upload', icon: Upload },
        { id: 'lists-groups', label: 'Lists / Groups', icon: FolderOpen },
        { id: 'import-history', label: 'Import History', icon: Clock },
        { id: 'invalid-failed', label: 'Invalid / Failed', icon: AlertCircle },
    ];

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
            {/* Page Header */}
            <div className="px-8 py-6 bg-white border-b border-gray-100">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Contacts</h1>
                <p className="text-gray-500 text-sm">Manage your contacts, upload files, and organize lists</p>
            </div>

            {/* Tabs */}
            <div className="px-8 pt-4 bg-white border-b border-gray-100">
                <div className="flex gap-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? 'bg-violet-500 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden p-6">
                {activeTab === 'all-contacts' && <AllContactsTab />}
                {activeTab === 'upload' && <UploadTab />}
                {activeTab === 'lists-groups' && <ListsGroupsTab />}
                {activeTab === 'import-history' && <ImportHistoryTab />}
                {activeTab === 'invalid-failed' && <InvalidFailedTab />}
            </div>
        </div>
    );
}


// ============ All Contacts Tab ============
// Uses: api.getContacts, api.createContact, api.deleteContact, api.updateContactStatus
function AllContactsTab() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('desc'); // 'desc' | 'asc' | 'name_asc' | 'name_desc'
    const [stats, setStats] = useState({ total: 0, valid: 0, invalid: 0, blocked: 0 });
    const [showAddModal, setShowAddModal] = useState(false);
    const [newContact, setNewContact] = useState({ phone_number: '', name: '' });
    const [page, setPage] = useState(0);
    const limit = 20;

    const fetchContacts = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.getContacts(page * limit, limit, searchQuery, statusFilter, sortBy);
            const contactsList = data.contacts || [];
            setContacts(contactsList);

            // Calculate stats from contacts list (or use data.stats if backend provides it)
            // Ideally backend should provide stats, but for now filtering frontend list
            // Note: This only stats the *fetched* page if backend paginates. 
            // For true totals, we rely on data.total for total count.
            // Status counts would need a separate API or backend update to be accurate global stats.
            const validCount = contactsList.filter(c => c.status === 'valid').length;
            const invalidCount = contactsList.filter(c => c.status === 'invalid').length;
            const blockedCount = contactsList.filter(c => c.status === 'blocked').length;

            setStats({
                total: data.total || contactsList.length,
                valid: validCount, // Approximate (page only)
                invalid: invalidCount, // Approximate (page only)
                blocked: blockedCount // Approximate (page only)
            });
        } catch (error) {
            console.error('Error fetching contacts:', error);
            setContacts([]);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, statusFilter, sortBy, page]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    const handleDelete = async (id) => {
        if (!confirm('Delete this contact?')) return;
        try {
            await api.deleteContact(id);
            fetchContacts();
        } catch (error) {
            console.error('Error deleting contact:', error);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await api.updateContactStatus(id, newStatus);
            fetchContacts();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleAddContact = async () => {
        if (!newContact.phone_number.trim()) return;
        try {
            const formData = new FormData();
            formData.append('phone_number', newContact.phone_number);
            if (newContact.name) formData.append('name', newContact.name);

            await api.createContact(formData);
            setNewContact({ phone_number: '', name: '' });
            setShowAddModal(false);
            fetchContacts();
        } catch (error) {
            console.error('Error adding contact:', error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'numeric', day: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const styles = {
            valid: 'bg-green-100 text-green-700',
            invalid: 'bg-red-100 text-red-700',
            blocked: 'bg-orange-100 text-orange-700'
        };
        return (
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${styles[status] || 'bg-gray-100'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col">
            {/* Search & Filters */}
            <div className="p-4 border-b border-gray-100 flex gap-4 items-center">
                <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                    <Search size={18} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by phone or name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none"
                    />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                    <option value="all">All Status</option>
                    <option value="valid">Valid</option>
                    <option value="invalid">Invalid</option>
                    <option value="blocked">Blocked</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                    <option value="name_asc">Name A-Z</option>
                    <option value="name_desc">Name Z-A</option>
                </select>
                <button onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-violet-500 text-white rounded-lg hover:bg-violet-600">
                    <Plus size={16} /> Add Contact
                </button>
            </div>

            {/* Stats Bar */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex gap-6 text-sm">
                <span className="text-gray-600">Total: <strong>{stats.total}</strong></span>
                <span className="text-green-600">Valid: <strong>{stats.valid}</strong></span>
                <span className="text-red-600">Invalid: <strong>{stats.invalid}</strong></span>
                <span className="text-orange-600">Blocked: <strong>{stats.blocked}</strong></span>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                                <th className="px-6 py-3 text-left">Phone Number</th>
                                <th className="px-6 py-3 text-left">Name</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-center">Source</th>
                                <th className="px-6 py-3 text-center">Created</th>
                                <th className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {contacts.length > 0 ? contacts.map((contact) => {
                                // Simple helper for flags (can be moved to constants)
                                const getFlag = (code) => {
                                    const flags = { '91': '🇮🇳', '1': '🇺🇸', '44': '🇬🇧', '971': '🇦🇪' };
                                    return flags[code] || '🌐';
                                };
                                return (
                                    <tr key={contact.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                {/* Simulated Shadcn Country Dropdown Trigger */}
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded-md shadow-sm text-xs font-medium text-gray-700 cursor-default">
                                                    <span>{getFlag(contact.country_code)}</span>
                                                    <span className="text-gray-400">▼</span>
                                                </div>
                                                <span className="font-medium text-gray-900 font-mono tracking-tight">{contact.phone_number}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-gray-600 font-medium text-left">{contact.name || '-'}</td>
                                        <td className="px-6 py-3 text-center">
                                            <select
                                                value={contact.status}
                                                onChange={(e) => handleStatusChange(contact.id, e.target.value)}
                                                className={`text-xs font-medium rounded-full px-2 py-1 border-0 outline-none cursor-pointer appearance-none ${contact.status === 'valid' ? 'bg-green-100 text-green-700' :
                                                    contact.status === 'invalid' ? 'bg-red-100 text-red-700' :
                                                        'bg-orange-100 text-orange-700'
                                                    }`}
                                            >
                                                <option value="valid">Valid</option>
                                                <option value="invalid">Invalid</option>
                                                <option value="blocked">Blocked</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-3 text-gray-500 capitalize text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <FileText size={13} />
                                                {contact.source || 'Manual'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-gray-500 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Calendar size={13} />
                                                {formatDate(contact.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <button
                                                onClick={() => handleDelete(contact.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
                                                title="Delete Contact"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        No contacts found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            <div className="px-6 py-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm text-gray-500">Page {page + 1}</span>
                <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                        className="px-3 py-1.5 text-sm border rounded disabled:opacity-50">Previous</button>
                    <button onClick={() => setPage(p => p + 1)} disabled={contacts.length < limit}
                        className="px-3 py-1.5 text-sm border rounded disabled:opacity-50">Next</button>
                </div>
            </div>

            {/* Add Contact Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-96">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Add New Contact</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Phone Number *</label>
                                <input type="text" placeholder="+1234567890"
                                    value={newContact.phone_number}
                                    onChange={(e) => setNewContact({ ...newContact, phone_number: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Name (Optional)</label>
                                <input type="text" placeholder="John Doe"
                                    value={newContact.name}
                                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                            <button onClick={handleAddContact} className="px-4 py-2 bg-violet-500 text-white rounded-lg">Add</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


// ============ Upload Tab ============
// Uses: POST /contacts/bulk-import
function UploadTab() {
    const [currentStep, setCurrentStep] = useState(1);
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);

    const steps = [
        { num: 1, label: 'Upload File' },
        { num: 2, label: 'Map Columns' },
        { num: 3, label: 'Validation' },
        { num: 4, label: 'Confirm' },
    ];

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx'))) {
            setFile(droppedFile);
            setCurrentStep(2);
        }
    };
    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) { setFile(selectedFile); setCurrentStep(2); }
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            // formData.append('uploaded_by', 'admin@system'); // API can infer from token or use default
            const result = await api.bulkImportContacts(formData);
            setUploadResult(result);
            setCurrentStep(4);
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const resetUpload = () => { setFile(null); setCurrentStep(1); setUploadResult(null); };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Upload Contacts</h2>
            <p className="text-gray-500 mb-8">Bulk upload phone numbers via CSV or Excel files</p>

            {/* Steps Indicator */}
            <div className="flex items-start mb-8 px-4">
                {steps.map((step, idx) => (
                    <div key={step.num} className="flex-1 flex flex-col">
                        <div className="flex items-center">
                            {/* Circle */}
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${currentStep >= step.num
                                    ? 'bg-violet-100 text-violet-600 border-2 border-violet-300'
                                    : 'bg-white text-gray-400 border-2 border-gray-200'
                                    }`}
                            >
                                {step.num}
                            </div>
                            {/* Line (except for last step) */}
                            {idx < steps.length - 1 && (
                                <div
                                    className={`flex-1 ml-2 shrink-0 ${currentStep > step.num ? 'bg-violet-300' : 'bg-gray-200'
                                        }`}
                                    style={{ height: '1px', minWidth: '20px' }}
                                />
                            )}
                        </div>
                        {/* Label */}
                        <span className={`text-xs mt-2 font-medium ${currentStep >= step.num ? 'text-gray-700' : 'text-gray-400'
                            }`}>
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>

            {currentStep === 1 && (
                <div
                    className="bg-white rounded-xl p-8 mx-auto"
                    style={{ border: '1px solid #e5e7eb', maxWidth: '550px' }}
                >
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Upload Your File</h3>
                    <p className="text-gray-400 text-sm mb-8">Drag and drop or click to select a CSV or Excel file</p>
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`rounded-lg transition-colors cursor-pointer ${isDragging ? 'bg-violet-50' : 'bg-white'
                            }`}
                        style={{
                            border: isDragging ? '2px dashed #a78bfa' : '2px dashed #d1d5db',
                            borderRadius: '8px',
                            padding: '48px 24px'
                        }}
                    >
                        <div className="flex flex-col items-center justify-center text-center">
                            <Upload size={36} className="text-gray-400 mb-5" strokeWidth={1.5} />
                            <p className="text-lg font-bold text-gray-700 mb-2">Drop your file here</p>
                            <p className="text-gray-400 text-sm mb-6">
                                or <label className="text-violet-500 cursor-pointer hover:underline">
                                    click to browse
                                    <input type="file" accept=".csv,.xlsx" onChange={handleFileSelect} className="hidden" />
                                </label>
                            </p>
                            <div className="flex items-center gap-6 text-sm text-gray-400">
                                <div className="flex items-center gap-2">
                                    <FileText size={16} /> CSV
                                </div>
                                <div className="flex items-center gap-2">
                                    <FileText size={16} /> XLSX
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {currentStep === 2 && (
                <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileText size={24} className="text-gray-400" />
                            <div><p className="font-medium">{file?.name}</p><p className="text-sm text-gray-500">{(file?.size / 1024).toFixed(1)} KB</p></div>
                        </div>
                        <button onClick={resetUpload} className="text-red-500 text-sm">Remove</button>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-medium mb-3">Column Mapping</h4>
                        <p className="text-sm text-gray-500 mb-4">Auto-detects columns named "phone", "phone_number", "name", etc.</p>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={resetUpload} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button onClick={() => setCurrentStep(3)} className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600">Continue</button>
                    </div>
                </div>
            )}

            {currentStep === 3 && (
                <div className="space-y-6">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700"><CheckCircle size={20} /><p className="font-medium">File validated successfully</p></div>
                        <p className="text-sm text-green-600 mt-1">Ready to import contacts from {file?.name}</p>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setCurrentStep(2)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Back</button>
                        <button onClick={handleUpload} disabled={isUploading} className="px-6 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50">
                            {isUploading ? 'Importing...' : 'Start Import'}
                        </button>
                    </div>
                </div>
            )}

            {currentStep === 4 && uploadResult && (
                <div className="space-y-6">
                    <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                        <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                        <h3 className="text-xl font-semibold text-green-700 mb-2">Import Completed!</h3>
                        <div className="flex items-center justify-center gap-6 text-sm">
                            <div className="text-green-600">✓ {uploadResult.success} imported</div>
                            <div className="text-orange-500">⚠ {uploadResult.duplicates} duplicates</div>
                            <div className="text-red-500">✗ {uploadResult.invalid} failed</div>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <button onClick={resetUpload} className="px-6 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600">Upload Another</button>
                    </div>
                </div>
            )}
        </div>
    );
}


// ============ Lists/Groups Tab ============
// Uses: GET /contacts/lists, POST /contacts/lists, DELETE /contacts/lists/{id}
function ListsGroupsTab() {
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newListName, setNewListName] = useState('');

    const fetchLists = async () => {
        try {
            setLoading(true);
            const data = await api.getContactLists();
            setLists(data.lists || []);
        } catch (error) {
            console.error('Error fetching lists:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLists(); }, []);

    const handleCreateList = async () => {
        if (!newListName.trim()) return;
        try {
            await api.createContactList(newListName);
            setNewListName('');
            setShowCreateModal(false);
            fetchLists();
        } catch (error) {
            console.error('Error creating list:', error);
        }
    };

    const handleDeleteList = async (id) => {
        if (!confirm('Delete this list?')) return;
        try {
            await api.deleteContactList(id);
            fetchLists();
        } catch (error) {
            console.error('Error deleting list:', error);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Lists / Groups</h2>
                    <p className="text-gray-500">Organize contacts into logical groups for campaigns</p>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600">
                    <Plus size={16} /> Create List
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div></div>
            ) : lists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lists.map((list) => (
                        <div key={list.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <FolderOpen size={20} className="text-violet-500" />
                                    <h3 className="font-semibold">{list.name}</h3>
                                </div>
                                <button onClick={() => handleDeleteList(list.id)} className="text-gray-400 hover:text-red-500">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-400">
                                <div className="flex items-center gap-1"><Users size={14} /> {list.contact_count} contacts</div>
                                <div className="flex items-center gap-1"><Calendar size={14} /> {new Date(list.created_at).toLocaleDateString()}</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-400"><FolderOpen size={48} className="mx-auto mb-3 opacity-50" /><p>No lists created yet</p></div>
            )}

            {showCreateModal && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-96">
                        <h3 className="text-lg font-semibold mb-4">Create New List</h3>
                        <input type="text" placeholder="List name..." value={newListName} onChange={(e) => setNewListName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-4" />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                            <button onClick={handleCreateList} className="px-4 py-2 bg-violet-500 text-white rounded-lg">Create</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


// ============ Import History Tab ============
// Uses: api.getImportHistory
function ImportHistoryTab() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const data = await api.getImportHistory();
                setHistory(data.history || []);
            } catch (error) {
                console.error('Error fetching history:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const handleDownload = async (id) => {
        try {
            // Should probably add specific download API to api.js, but streaming binary 
            // is often easier with direct fetch or window.open if auth allows.
            // For now, if we need auth, we must use fetch with token.
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/contacts/import-history/${id}/download`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `import_report_${id}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading report:', error);
        }
    };

    const getStatusBadge = (status) => {
        const styles = { completed: 'bg-green-100 text-green-700', processing: 'bg-orange-100 text-orange-700', failed: 'bg-red-100 text-red-700', pending: 'bg-gray-100 text-gray-700' };
        return <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${styles[status] || 'bg-gray-100'}`}>{status}</span>;
    };

    const getSuccessRate = (r) => r.records_count ? Math.round((r.success_count / r.records_count) * 100) : 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Import History</h2>
            <p className="text-gray-500 mb-6">Track and audit all your contact uploads</p>

            {loading ? (
                <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div></div>
            ) : (
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                            <th className="px-6 py-3 text-left">File</th>
                            <th className="px-6 py-3 text-left">Uploaded By</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3 text-left">Results</th>
                            <th className="px-6 py-3 text-center">Date</th>
                            <th className="px-6 py-3 text-center">Download</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {history.length > 0 ? history.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <FileText size={20} className="text-gray-400" />
                                        <div><p className="font-medium">{r.filename}</p><p className="text-xs text-gray-500">{r.records_count} records</p></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600 text-left">{r.uploaded_by}</td>
                                <td className="px-6 py-4 text-center">{getStatusBadge(r.status)}</td>
                                <td className="px-6 py-4 text-left">
                                    {r.status === 'completed' ? (
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-gray-500">Success rate</span>
                                                <span className="text-xs font-medium">{getSuccessRate(r)}%</span>
                                            </div>
                                            <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-violet-500 rounded-full" style={{ width: `${getSuccessRate(r)}%` }} />
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs">
                                                <span className="text-green-600">✓ {r.success_count}</span>
                                                <span className="text-orange-500">⚠ {r.duplicate_count}</span>
                                                <span className="text-red-500">✗ {r.failed_count}</span>
                                            </div>
                                        </div>
                                    ) : <span className="text-gray-400">Processing...</span>}
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-sm text-center">
                                    <div className="flex items-center justify-center gap-1.5"><Clock size={14} />{new Date(r.created_at).toLocaleDateString()}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => handleDownload(r.id)} className="p-1.5 text-gray-400 hover:text-violet-600" title="Download Report">
                                        <Download size={16} />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No import history yet</td></tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
}


// ============ Invalid/Failed Tab ============
// Uses: api.getInvalidContacts
function InvalidFailedTab() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvalid = async () => {
            try {
                setLoading(true);
                const data = await api.getInvalidContacts();
                setContacts(data.contacts || []);
            } catch (error) {
                console.error('Error fetching invalid contacts:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchInvalid();
    }, []);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Invalid / Failed Contacts</h2>
            <p className="text-gray-500 mb-6">Review and manage contacts that failed validation</p>

            {loading ? (
                <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div></div>
            ) : contacts.length > 0 ? (
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                            <th className="px-6 py-3">Phone Number</th>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3 text-center">Source</th>
                            <th className="px-6 py-3 text-center">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {contacts.map((c) => (
                            <tr key={c.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2"><XCircle size={14} className="text-red-400" /><span>{c.phone_number}</span></div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{c.name || '-'}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${c.status === 'blocked' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{c.status}</span>
                                </td>
                                <td className="px-6 py-4 text-gray-500 capitalize text-center">{c.source}</td>
                                <td className="px-6 py-4 text-gray-500 text-sm text-center">{new Date(c.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="text-center py-12 text-gray-400"><CheckCircle size={48} className="mx-auto mb-3 text-green-400" /><p>No invalid or failed contacts</p></div>
            )}
        </div>
    );
}
