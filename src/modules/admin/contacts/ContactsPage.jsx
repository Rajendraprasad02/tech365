import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Users, Upload, FolderOpen, Clock, AlertCircle, Search,
    Phone, Globe, Calendar, MoreHorizontal, Trash2, Plus,
    FileText, CheckCircle, XCircle, Download, Edit3, X, UserCheck,
    ChevronDown, Filter, Tag, ArrowUpDown, Settings, Check,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { CircleFlag } from 'react-circle-flags';
import parsePhoneNumber from 'libphonenumber-js';
import api, { createContact } from '@/services/api';
import CustomSelect from './CustomSelect';
import Pagination from '@/components/ui/Pagination';

// API base URL - still kept just in case of fallback, but api.js handles it
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ContactsPage() {
    const [activeTab, setActiveTab] = useState('all-contacts');

    const tabs = [
        { id: 'all-contacts', label: 'All Contacts', icon: Users },
        { id: 'leads', label: 'Leads', icon: UserCheck },
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
                {activeTab === 'all-contacts' && <AllContactsTab key="all-contacts" />}
                {activeTab === 'leads' && <AllContactsTab key="leads" sourceFilterProp="lead" />}
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
function AllContactsTab({ sourceFilterProp = 'all' }) {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [productFilter, setProductFilter] = useState('all');
    const [productOptions, setProductOptions] = useState([{ value: 'all', label: 'All Products' }]);
    const [sortBy, setSortBy] = useState('desc'); // 'desc' | 'asc' | 'name_asc' | 'name_desc'

    // Fetch unique products for filter
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Fetch a batch of contacts to extract available products
                // Using a larger limit to ensure we get a good representation of products
                const data = await api.getContacts(0, 100, '', 'all', 'desc', 'all', 'all');
                if (data && data.contacts) {
                    const uniqueProducts = [...new Set(data.contacts.map(c => c.product).filter(p => p))];
                    const options = [
                        { value: 'all', label: 'All Products' },
                        ...uniqueProducts.map(p => ({ value: p, label: p }))
                    ];
                    setProductOptions(options);
                }
            } catch (error) {
                console.error('Error fetching products for filter:', error);
            }
        };
        fetchProducts();
    }, []);
    const [stats, setStats] = useState({ total: 0, valid: 0, invalid: 0, blocked: 0 });
    const [showAddModal, setShowAddModal] = useState(false);
    const [newContact, setNewContact] = useState({ phone_number: '', name: '' });
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [showPageSizeMenu, setShowPageSizeMenu] = useState(false);

    const fetchContacts = useCallback(async () => {
        try {
            setLoading(true);
            setLoading(true);
            console.log("Fetching contacts with params:", { page, pageSize, searchQuery, statusFilter, sortBy, sourceFilterProp, productFilter });
            const data = await api.getContacts(page * pageSize, pageSize, searchQuery, statusFilter, sortBy, sourceFilterProp, productFilter);
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
    }, [searchQuery, statusFilter, sortBy, page, sourceFilterProp, productFilter]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    // Reset to first page when filters or page size change
    useEffect(() => {
        setPage(0);
    }, [searchQuery, statusFilter, sortBy, sourceFilterProp, productFilter, pageSize]);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [contactToDelete, setContactToDelete] = useState(null);

    const confirmDelete = (contact) => {
        setContactToDelete(contact);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!contactToDelete) return;
        try {
            await api.deleteContact(contactToDelete.id);
            fetchContacts();
            setShowDeleteModal(false);
            setContactToDelete(null);
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
        if (!newContact.phone_number) return;
        if (!isValidPhoneNumber(newContact.phone_number)) {
            alert("Valid phone number with country code is required (e.g. +1234567890)");
            return;
        }
        try {
            // Use JSON payload instead of FormData
            const payload = {
                phone_number: newContact.phone_number,
                name: newContact.name || ''
            };
            console.log(payload);

            await createContact(payload);
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
            blocked: 'bg-orange-100 text-orange-700',
            reported: 'bg-yellow-100 text-yellow-800'
        };
        return (
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${styles[status] || 'bg-gray-100'}`}>
                {status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="loader-wrapper bg-gray-50/50">
                <span className="loader mb-4"></span>
                <p className="mt-4 text-sm font-bold text-gray-500 uppercase tracking-widest animate-pulse">Loading contacts...</p>
            </div>
        );
    }

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
                <CustomSelect
                    value={statusFilter}
                    onChange={setStatusFilter}
                    icon={Filter}
                    options={[
                        { value: 'all', label: 'All Status' },
                        { value: 'valid', label: 'Valid' },
                        { value: 'invalid', label: 'Invalid' },
                        { value: 'reported', label: 'Reported' },
                        { value: 'blocked', label: 'Blocked' }
                    ]}
                />
                <CustomSelect
                    value={productFilter}
                    onChange={setProductFilter}
                    icon={Tag}
                    options={productOptions}
                />
                {/* <CustomSelect
                    value={sortBy}
                    onChange={setSortBy}
                    icon={ArrowUpDown}
                    options={[
                        { value: 'desc', label: 'Newest First' },
                        { value: 'asc', label: 'Oldest First' },
                        { value: 'name_asc', label: 'Name A-Z' },
                        { value: 'name_desc', label: 'Name Z-A' }
                    ]}
                /> */}
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
            <div className="flex-1 overflow-auto min-h-[530px] custom-scrollbar">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                            <th className="px-6 py-3 text-left">Phone Number</th>
                            <th className="px-6 py-3 text-left">Name</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3 text-center">Source</th>
                            <th className="px-6 py-3 text-center">Product</th>
                            <th className="px-6 py-3 text-center">Created</th>
                            <th className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {contacts.length > 0 ? contacts.map((contact) => {
                            // Derive country code (ISO alpha-2) from phone number for CircleFlag
                            const getCountryCode = (phoneNumber) => {
                                try {
                                    const parsed = parsePhoneNumber(phoneNumber);
                                    if (parsed && parsed.country) return parsed.country.toLowerCase();
                                } catch (e) { /* ignore */ }
                                return null;
                            };
                            const countryIso = getCountryCode(contact.phone_number);
                            return (
                                <tr key={contact.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs font-medium text-gray-600">
                                                <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                                                    {countryIso ? (
                                                        <CircleFlag countryCode={countryIso} height={16} />
                                                    ) : (
                                                        <Globe size={16} className="text-gray-400" />
                                                    )}
                                                </div>
                                                {contact.country_code && <span>{contact.country_code}</span>}
                                            </div>
                                            <span className="font-medium text-gray-900 font-mono tracking-tight">{contact.phone_number}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-gray-600 font-medium text-left">{contact.name || '-'}</td>
                                    <td className="px-6 py-3 text-center">
                                        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${contact.status === 'valid' ? 'bg-green-100 text-green-700' :
                                            contact.status === 'invalid' ? 'bg-red-100 text-red-700' :
                                                contact.status === 'reported' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-orange-100 text-orange-700'
                                            }`}>
                                            {contact.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${(contact.source && contact.source.toLowerCase().includes('lead'))
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-500 bg-gray-50'
                                            }`}>
                                            <FileText size={12} />
                                            {contact.source || 'Manual'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-center text-gray-600 font-medium">
                                        {contact.product || '-'}
                                    </td>
                                    <td className="px-6 py-3 text-gray-500 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Calendar size={13} />
                                            {formatDate(contact.created_at)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <button
                                            onClick={() => confirmDelete(contact)}
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
            </div>

            {/* Pagination Component - Enterprise Grade */}
            <Pagination
                page={page}
                pageSize={pageSize}
                total={stats.total}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(0);
                }}
            />

            {/* Add Contact Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-[440px] shadow-2xl shadow-black/20 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Add New Contact</h3>
                                <p className="text-sm text-gray-400 mt-0.5">Enter phone number with country code</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
                                <PhoneInput
                                    defaultCountry="in"
                                    value={newContact.phone_number}
                                    onChange={(value) => setNewContact({ ...newContact, phone_number: value })}
                                    placeholder="+1 234 567 890"
                                    className="flex items-center h-10 w-full rounded-lg border border-slate-200 bg-white px-2 py-0 text-sm ring-offset-white focus-within:ring-2 focus-within:ring-violet-500 focus-within:ring-offset-2"
                                    inputStyle={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', boxShadow: 'none' }}
                                    buttonStyle={{ border: 'none', background: 'transparent' }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name (Optional)</label>
                                <input type="text" placeholder="John Doe"
                                    value={newContact.name}
                                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => { setShowAddModal(false); setNewContact({ phone_number: '', name: '' }); }}
                                className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium">Cancel</button>
                            <button onClick={handleAddContact}
                                className="px-5 py-2.5 bg-violet-500 text-white rounded-lg hover:bg-violet-600 text-sm font-medium shadow-sm">Add Contact</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-96 max-w-[90%] shadow-lg transform transition-all">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
                                <Trash2 size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Contact?</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Are you sure you want to delete <span className="font-medium text-gray-700">{contactToDelete?.name || contactToDelete?.phone_number}</span>?
                                This action will soft delete the contact.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setContactToDelete(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
                                >
                                    Delete
                                </button>
                            </div>
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
    const [duplicateStrategy, setDuplicateStrategy] = useState('skip');
    const [error, setError] = useState(null);

    const steps = [
        { num: 1, label: 'Upload File' },
        { num: 2, label: 'Settings' },
        { num: 3, label: 'Validation' },
        { num: 4, label: 'Confirm' },
    ];

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        validateAndSetFile(droppedFile);
    };
    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        validateAndSetFile(selectedFile);
    };

    const validateAndSetFile = (selectedFile) => {
        if (!selectedFile) return;

        setError(null);
        const fileName = selectedFile.name.toLowerCase();

        // 1. File Type Validation
        if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx')) {
            setError("Only .csv and .xlsx files are allowed.");
            return;
        }

        // 2. File Size Validation (5MB)
        if (selectedFile.size > 5 * 1024 * 1024) {
            setError("File size exceeds 5MB limit.");
            return;
        }

        setFile(selectedFile);
        setCurrentStep(2);
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('duplicate_strategy', duplicateStrategy);

            const userName = localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'admin';
            formData.append('uploaded_by', userName);

            const result = await api.bulkImportContacts(formData);

            if (result.success === false) {
                setError(result.message);
                setCurrentStep(3); // Stay/Go back to validation step to show error
            } else {
                setUploadResult(result);
                setCurrentStep(4);
            }
        } catch (error) {
            console.error('Upload error:', error);
            setError(error.message || "Failed to upload file");
        } finally {
            setIsUploading(false);
        }
    };

    const resetUpload = () => {
        setFile(null);
        setCurrentStep(1);
        setUploadResult(null);
        setError(null);
    };

    const handleDownloadErrorReport = () => {
        if (!uploadResult?.import_id) return;
        const baseUrl = (import.meta.env.VITE_DATA_API_URL || '').replace(/\/+$/, '');
        window.location.href = `${baseUrl}/contacts/import-history/${uploadResult.import_id}/download`;
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">Upload Contacts</h2>
                    <p className="text-gray-500">Bulk upload phone numbers via CSV or Excel files</p>
                </div>
                {currentStep === 1 && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => api.downloadContactTemplate('csv')}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <Download size={14} /> Download CSV Template
                        </button>
                        <button
                            onClick={() => api.downloadContactTemplate('xlsx')}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <Download size={14} /> Download Excel Template
                        </button>
                    </div>
                )}
            </div>

            {/* Steps Indicator */}
            <div className="flex items-start mb-8 px-4 max-w-2xl mx-auto">
                {steps.map((step, idx) => (
                    <div key={step.num} className="flex-1 flex flex-col">
                        <div className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors ${currentStep >= step.num
                                    ? 'bg-violet-600 text-white'
                                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                                    }`}
                            >
                                {step.num}
                            </div>
                            {idx < steps.length - 1 && (
                                <div
                                    className={`flex-1 ml-2 shrink-0 h-[2px] ${currentStep > step.num ? 'bg-violet-600' : 'bg-gray-100'
                                        }`}
                                />
                            )}
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider mt-2 font-bold ${currentStep >= step.num ? 'text-violet-600' : 'text-gray-400'
                            }`}>
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>

            {currentStep === 1 && (
                <div
                    className="bg-white rounded-2xl p-10 mx-auto"
                    style={{ border: '1px solid #f1f3f5', maxWidth: '600px', boxShadow: '0 10px 30px -15px rgba(0,0,0,0.05)' }}
                >
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Upload Your File</h3>
                        <p className="text-gray-400 text-sm italic">Please use our system template for successful import</p>
                    </div>

                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-upload').click()}
                        className={`rounded-2xl transition-all cursor-pointer group flex flex-col items-center justify-center text-center p-12 ${isDragging ? 'bg-violet-50 border-violet-400 scale-[0.99]' : 'bg-gray-50/50 border-gray-200 hover:bg-gray-50 hover:border-violet-300'
                            }`}
                        style={{ border: '2px dashed #e2e8f0' }}
                    >
                        <input id="file-upload" type="file" accept=".csv,.xlsx" onChange={handleFileSelect} className="hidden" />
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors ${isDragging ? 'bg-violet-200 text-violet-700' : 'bg-white text-gray-400 group-hover:text-violet-500 shadow-sm'}`}>
                            <Upload size={32} strokeWidth={1.5} />
                        </div>
                        <p className="text-lg font-bold text-gray-700 mb-1">Click to browse or drop file here</p>
                        <p className="text-gray-400 text-sm mb-6 max-w-[240px]">Support CSV and XLSX files. Max file size 5MB.</p>

                        <div className="flex items-center gap-8 py-3 px-6 bg-white rounded-full shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                <div className="w-2 h-2 rounded-full bg-green-400"></div> .CSV
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                <div className="w-2 h-2 rounded-full bg-blue-400"></div> .XLSX
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={18} className="shrink-0" />
                            <p className="font-medium">{error}</p>
                        </div>
                    )}
                </div>
            )}

            {currentStep === 2 && (
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm text-violet-500">
                                <FileText size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{file?.name}</p>
                                <p className="text-sm text-gray-500 font-medium">{(file?.size / 1024).toFixed(1)} KB • {file?.name.split('.').pop().toUpperCase()}</p>
                            </div>
                        </div>
                        <button onClick={resetUpload} className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors">Discard</button>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-gray-100 space-y-6">
                        <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Settings size={20} className="text-violet-500" /> Import Settings
                        </h4>

                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-sm font-bold text-gray-700 block mb-2">Duplicate Handling Strategy</span>
                                <div className="grid grid-cols-3 gap-3">
                                    {['skip', 'update', 'reject'].map(strategy => (
                                        <button
                                            key={strategy}
                                            onClick={() => setDuplicateStrategy(strategy)}
                                            className={`py-3 px-4 rounded-xl border text-sm font-bold capitalize transition-all ${duplicateStrategy === strategy
                                                ? 'bg-violet-50 border-violet-500 text-violet-600'
                                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                        >
                                            {strategy}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-400 mt-3 italic">
                                    {duplicateStrategy === 'skip' && '• Ignore existing contacts and only import new ones.'}
                                    {duplicateStrategy === 'update' && '• Update existing contact details if phone number matches.'}
                                    {duplicateStrategy === 'reject' && '• Reject the entire row if contact already exists.'}
                                </p>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={resetUpload} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                        <button
                            onClick={async () => {
                                setIsUploading(true);
                                setError(null);
                                try {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    formData.append('duplicate_strategy', duplicateStrategy);
                                    formData.append('dry_run', 'true');

                                    const result = await api.bulkImportContacts(formData);
                                    if (result.success && result.failed_count === 0) {
                                        setCurrentStep(3);
                                    } else if (result.success && result.failed_count > 0) {
                                        setError(`File contains ${result.failed_count} invalid records. Please fix them.`);
                                        setUploadResult(result);
                                        setCurrentStep(3);
                                    } else {
                                        setError(result.message || "Template validation failed");
                                        setCurrentStep(3);
                                    }
                                } catch (err) {
                                    setError(err.message || "Connection error during validation");
                                    setCurrentStep(3);
                                } finally {
                                    setIsUploading(false);
                                }
                            }}
                            disabled={isUploading}
                            className="px-8 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 shadow-lg shadow-violet-200 transition-all active:scale-95 flex items-center gap-2"
                        >
                            {isUploading && <span className="loader-sm"></span>}
                            {isUploading ? 'Validating...' : 'Continue'}
                        </button>
                    </div>
                </div>
            )}

            {currentStep === 3 && (
                <div className="max-w-2xl mx-auto space-y-6">
                    {error ? (
                        <div className="p-8 bg-red-50 border border-red-200 rounded-3xl text-center space-y-4 animate-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-red-800">Validation Failed</h3>
                            <p className="text-red-600 font-medium">{error}</p>

                            {uploadResult?.errors && uploadResult.errors.length > 0 && (
                                <div className="mt-4 p-4 bg-white/50 rounded-xl text-left border border-red-100 max-h-48 overflow-auto">
                                    <p className="text-xs font-bold text-red-800 uppercase mb-2">Detailed Errors:</p>
                                    <ul className="space-y-1">
                                        {uploadResult.errors.map((err, i) => (
                                            <li key={i} className="text-xs text-red-700">
                                                <strong>Row {err.row}:</strong> {err.error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="pt-4 flex justify-center gap-4">
                                <button onClick={() => { setError(null); setCurrentStep(1); }} className="px-6 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors">Re-upload File</button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 bg-green-50 border border-green-200 rounded-3xl text-center space-y-4 animate-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-green-800">Ready to Import</h3>
                            <p className="text-green-600 font-medium">Your file has passed basic checks. Click below to start the final import process.</p>

                            <div className="flex flex-col items-center gap-2 pt-6">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Selected Mode</div>
                                <div className="px-4 py-1.5 bg-white border border-green-200 rounded-full text-sm font-black text-green-700 shadow-sm uppercase">
                                    Strategy: {duplicateStrategy}
                                </div>
                            </div>
                        </div>
                    )}

                    {!error && (
                        <div className="flex justify-end gap-3 pt-4">
                            <button onClick={() => setCurrentStep(2)} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">Back</button>
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="px-10 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 shadow-lg shadow-violet-200 transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
                            >
                                {isUploading && <span className="loader-sm"></span>}
                                {isUploading ? 'Processing...' : 'Run Import Now'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {currentStep === 4 && uploadResult && (
                <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-10 rounded-[2rem] text-white shadow-2xl shadow-violet-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-400/20 rounded-full -ml-32 -mb-32 blur-3xl"></div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-6 border border-white/30">
                                <CheckCircle size={40} className="text-white" />
                            </div>
                            <h3 className="text-3xl font-black mb-2">Import Finished!</h3>
                            <p className="text-violet-100 font-medium mb-8">Summary of your contact bulk import</p>

                            <div className="grid grid-cols-4 gap-4 w-full">
                                {[
                                    { label: 'Total', value: uploadResult.total, color: 'text-white' },
                                    { label: 'Success', value: uploadResult.success_count, color: 'text-green-300' },
                                    { label: 'Duplicates', value: uploadResult.duplicate_count, color: 'text-orange-200' },
                                    { label: 'Failed', value: uploadResult.failed_count, color: 'text-red-300' }
                                ].map(stat => (
                                    <div key={stat.label} className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                                        <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                                        <div className="text-[10px] uppercase font-bold text-white/60 tracking-widest mt-1">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-lg font-bold text-gray-800">Detailed Report</h4>
                            {uploadResult.failed_count > 0 && (
                                <button
                                    onClick={handleDownloadErrorReport}
                                    className="flex items-center gap-2 text-violet-600 font-bold text-sm hover:underline"
                                >
                                    <Download size={16} /> Download Full Error Log
                                </button>
                            )}
                        </div>

                        {uploadResult.errors && uploadResult.errors.length > 0 ? (
                            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50/50">
                                        <tr className="text-[10px] uppercase tracking-widest font-black text-gray-400">
                                            <th className="py-3 px-6">Row</th>
                                            <th className="py-3 px-6">Item</th>
                                            <th className="py-3 px-6">Reason for Failure</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {uploadResult.errors.map((err, i) => (
                                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 px-6 text-sm font-bold text-gray-400">#{err.row}</td>
                                                <td className="py-4 px-6 text-sm font-bold text-gray-700">{err.phone || err.email || 'Data'}</td>
                                                <td className="py-4 px-6 text-sm font-medium text-red-500">{err.error}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {uploadResult.failed_count > uploadResult.errors.length && (
                                    <div className="p-4 text-center bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        + {uploadResult.failed_count - uploadResult.errors.length} more errors in the full report
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-12 text-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check size={24} />
                                </div>
                                <p className="font-bold text-gray-700">Perfect Import!</p>
                                <p className="text-sm text-gray-400 max-w-[200px] mx-auto">No validation errors were found in your file.</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center pt-4">
                        <button
                            onClick={resetUpload}
                            className="px-10 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95"
                        >
                            Upload Another File
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


// ============ Lists/Groups Tab ============
// Uses: GET /contacts/lists, POST /contacts/lists, DELETE /contacts/lists/{id}
// GET /contacts/lists/{id}, PUT /contacts/lists/{id}, POST/DELETE contacts in lists
function ListsGroupsTab() {
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [newListDesc, setNewListDesc] = useState('');
    const [selectedList, setSelectedList] = useState(null);
    const [listContacts, setListContacts] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [listToDelete, setListToDelete] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editListName, setEditListName] = useState('');
    const [editListDesc, setEditListDesc] = useState('');
    const [showAddContactsModal, setShowAddContactsModal] = useState(false);
    const [allContacts, setAllContacts] = useState([]);
    const [contactSearch, setContactSearch] = useState('');
    const [selectedContactIds, setSelectedContactIds] = useState([]);
    const [addingContacts, setAddingContacts] = useState(false);

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
            await api.createContactList(newListName, newListDesc);
            setNewListName('');
            setNewListDesc('');
            setShowCreateModal(false);
            fetchLists();
        } catch (error) {
            console.error('Error creating list:', error);
        }
    };

    const confirmDeleteList = (list) => {
        setListToDelete(list);
        setShowDeleteModal(true);
    };

    const handleDeleteList = async () => {
        if (!listToDelete) return;
        try {
            await api.deleteContactList(listToDelete.id);
            setShowDeleteModal(false);
            setListToDelete(null);
            if (selectedList?.id === listToDelete.id) setSelectedList(null);
            fetchLists();
        } catch (error) {
            console.error('Error deleting list:', error);
        }
    };

    const openListDetail = async (list) => {
        setSelectedList(list);
        setListLoading(true);
        try {
            const data = await api.getContactListDetails(list.id);
            setListContacts(data.contacts || []);
        } catch (error) {
            console.error('Error fetching list details:', error);
        } finally {
            setListLoading(false);
        }
    };

    const handleEditList = async () => {
        if (!editListName.trim() || !selectedList) return;
        try {
            await api.updateContactList(selectedList.id, editListName, editListDesc);
            setShowEditModal(false);
            fetchLists();
            setSelectedList(prev => ({ ...prev, name: editListName, description: editListDesc }));
        } catch (error) {
            console.error('Error updating list:', error);
        }
    };

    const openEditModal = () => {
        setEditListName(selectedList.name);
        setEditListDesc(selectedList.description || '');
        setShowEditModal(true);
    };

    const openAddContactsModal = async () => {
        setShowAddContactsModal(true);
        setContactSearch('');
        setSelectedContactIds([]);
        try {
            const data = await api.getContacts(0, 200);
            // Filter out contacts already in this list
            const existingIds = new Set(listContacts.map(c => c.id));
            setAllContacts((data.contacts || []).filter(c => !existingIds.has(c.id)));
        } catch (error) {
            console.error('Error fetching contacts:', error);
        }
    };

    const toggleContactSelection = (id) => {
        setSelectedContactIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleAddContacts = async () => {
        if (selectedContactIds.length === 0 || !selectedList) return;
        setAddingContacts(true);
        try {
            await api.addContactsToList(selectedList.id, selectedContactIds);
            setShowAddContactsModal(false);
            setSelectedContactIds([]);
            // Refresh list details
            openListDetail(selectedList);
            fetchLists();
        } catch (error) {
            console.error('Error adding contacts:', error);
        } finally {
            setAddingContacts(false);
        }
    };

    const handleRemoveContact = async (contactId) => {
        if (!selectedList) return;
        try {
            await api.removeContactFromList(selectedList.id, contactId);
            setListContacts(prev => prev.filter(c => c.id !== contactId));
            fetchLists(); // Refresh counts
        } catch (error) {
            console.error('Error removing contact:', error);
        }
    };

    const filteredAvailableContacts = allContacts.filter(c => {
        const q = contactSearch.toLowerCase();
        return !q || (c.name && c.name.toLowerCase().includes(q)) || c.phone_number.includes(q);
    });

    // ---- List Detail View ----
    if (selectedList) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedList(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7-7 7 7 7" /></svg>
                        </button>
                        <FolderOpen size={24} className="text-violet-500" />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">{selectedList.name}</h2>
                            {selectedList.description && <p className="text-sm text-gray-500">{selectedList.description}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={openAddContactsModal} className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 text-sm">
                            <Plus size={16} /> Add Contacts
                        </button>
                        <button onClick={openEditModal} className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm">
                            <Edit3 size={14} /> Edit
                        </button>
                        <button onClick={() => confirmDeleteList(selectedList)} className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 text-sm">
                            <Trash2 size={14} /> Delete
                        </button>
                    </div>
                </div>

                {/* Stats bar */}
                <div className="flex items-center gap-6 mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users size={14} /> <span className="font-medium text-gray-900">{listContacts.length}</span> contacts
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar size={14} /> Created {selectedList.created_at ? new Date(selectedList.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                </div>

                {/* Contacts Table */}
                {listLoading ? (
                    <div className="loader-wrapper"><span className="loader"></span></div>
                ) : listContacts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                    <th className="pb-3 px-3">Name</th>
                                    <th className="pb-3 px-3">Phone</th>
                                    <th className="pb-3 px-3">Status</th>
                                    <th className="pb-3 px-3">Source</th>
                                    <th className="pb-3 px-3">Added</th>
                                    <th className="pb-3 px-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listContacts.map((contact) => {
                                    const parsedCountry = (() => {
                                        try {
                                            const p = parsePhoneNumber(contact.phone_number);
                                            return p && p.country ? p.country.toLowerCase() : null;
                                        } catch (e) { return null; }
                                    })();
                                    return (
                                        <tr key={contact.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="py-3 px-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-medium text-xs">
                                                        {(contact.name || 'U')[0].toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-gray-900 text-sm">{contact.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 text-sm text-gray-600 font-mono">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                                                        {parsedCountry ? (
                                                            <CircleFlag countryCode={parsedCountry} height={16} />
                                                        ) : (
                                                            <Globe size={16} className="text-gray-400" />
                                                        )}
                                                    </div>
                                                    {contact.phone_number}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${contact.status === 'valid' ? 'bg-green-100 text-green-700' :
                                                    contact.status === 'invalid' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {contact.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-sm text-gray-500 capitalize">{contact.source}</td>
                                            <td className="py-3 px-3 text-sm text-gray-400">{contact.created_at ? new Date(contact.created_at).toLocaleDateString() : '-'}</td>
                                            <td className="py-3 px-3 text-right">
                                                <button onClick={() => handleRemoveContact(contact.id)} className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50" title="Remove from list">
                                                    <X size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <Users size={48} className="mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No contacts in this list</p>
                        <p className="text-sm mt-1">Click "Add Contacts" to populate this list</p>
                    </div>
                )}

                {/* Edit Modal */}
                {showEditModal && (
                    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
                            <h3 className="text-lg font-semibold mb-4">Edit List</h3>
                            <input type="text" placeholder="List name..." value={editListName} onChange={(e) => setEditListName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                            <textarea placeholder="Description (optional)..." value={editListDesc} onChange={(e) => setEditListDesc(e.target.value)} rows={2}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none" />
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Cancel</button>
                                <button onClick={handleEditList} className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600">Save</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Contacts Modal */}
                {showAddContactsModal && (
                    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-[520px] max-h-[80vh] flex flex-col shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Add Contacts to "{selectedList.name}"</h3>
                                <button onClick={() => setShowAddContactsModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                            </div>
                            {/* Search */}
                            <div className="relative mb-4">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" placeholder="Search by name or phone..." value={contactSearch} onChange={(e) => setContactSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                            </div>
                            {/* Selected count */}
                            {selectedContactIds.length > 0 && (
                                <div className="mb-3 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-sm font-medium">
                                    {selectedContactIds.length} contact{selectedContactIds.length > 1 ? 's' : ''} selected
                                </div>
                            )}
                            {/* Contact List */}
                            <div className="flex-1 overflow-y-auto max-h-[360px] border border-gray-100 rounded-lg">
                                {filteredAvailableContacts.length > 0 ? filteredAvailableContacts.map(c => {
                                    const parsedCountry = (() => {
                                        try {
                                            const p = parsePhoneNumber(c.phone_number);
                                            return p && p.country ? p.country.toLowerCase() : null;
                                        } catch (e) { return null; }
                                    })();
                                    return (
                                        <label key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                                            <input type="checkbox" checked={selectedContactIds.includes(c.id)} onChange={() => toggleContactSelection(c.id)}
                                                className="rounded border-gray-300 text-violet-500 focus:ring-violet-500" />
                                            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-medium text-xs flex-shrink-0">
                                                {(c.name || 'U')[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm text-gray-900 truncate">{c.name || 'Unknown'}</div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <div className="w-3.5 h-3.5 rounded-full overflow-hidden flex-shrink-0">
                                                        {parsedCountry ? (
                                                            <CircleFlag countryCode={parsedCountry} height={14} />
                                                        ) : (
                                                            <Globe size={14} className="text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-mono">{c.phone_number}</div>
                                                </div>
                                            </div>
                                        </label>
                                    )
                                }) : (
                                    <div className="text-center py-8 text-gray-400 text-sm">No contacts available to add</div>
                                )}
                            </div>
                            {/* Actions */}
                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                                <button onClick={() => setShowAddContactsModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Cancel</button>
                                <button onClick={handleAddContacts} disabled={selectedContactIds.length === 0 || addingContacts}
                                    className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {addingContacts ? 'Adding...' : `Add ${selectedContactIds.length} Contact${selectedContactIds.length !== 1 ? 's' : ''}`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && listToDelete && (
                    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><Trash2 size={18} className="text-red-500" /></div>
                                <h3 className="text-lg font-semibold">Delete List</h3>
                            </div>
                            <p className="text-gray-600 mb-1">Are you sure you want to delete <strong>"{listToDelete.name}"</strong>?</p>
                            <p className="text-sm text-gray-400 mb-4">Contacts in this list will be unassigned, not deleted.</p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => { setShowDeleteModal(false); setListToDelete(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Cancel</button>
                                <button onClick={handleDeleteList} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="loader-wrapper bg-gray-50/50">
                <span className="loader mb-4"></span>
                <p className="mt-4 text-sm font-bold text-gray-500 uppercase tracking-widest animate-pulse">Loading lists...</p>
            </div>
        );
    }

    // ---- List Grid View (default) ----
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

            {lists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lists.map((list) => (
                        <div key={list.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
                            onClick={() => openListDetail(list)}>
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <FolderOpen size={20} className="text-violet-500" />
                                    <h3 className="font-semibold text-gray-900">{list.name}</h3>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); confirmDeleteList(list); }} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            {list.description && <p className="text-sm text-gray-400 mb-3 line-clamp-2">{list.description}</p>}
                            <div className="flex items-center justify-between text-sm text-gray-400 mt-3 pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-1"><Users size={14} /> {list.contact_count} contacts</div>
                                <div className="flex items-center gap-1"><Calendar size={14} /> {list.created_at ? new Date(list.created_at).toLocaleDateString() : '-'}</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-400"><FolderOpen size={48} className="mx-auto mb-3 opacity-50" /><p>No lists created yet</p></div>
            )}

            {/* Create List Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
                        <h3 className="text-lg font-semibold mb-4">Create New List</h3>
                        <input type="text" placeholder="List name..." value={newListName} onChange={(e) => setNewListName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                        <textarea placeholder="Description (optional)..." value={newListDesc} onChange={(e) => setNewListDesc(e.target.value)} rows={2}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none" />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => { setShowCreateModal(false); setNewListName(''); setNewListDesc(''); }} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Cancel</button>
                            <button onClick={handleCreateList} className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600">Create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && listToDelete && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><Trash2 size={18} className="text-red-500" /></div>
                            <h3 className="text-lg font-semibold">Delete List</h3>
                        </div>
                        <p className="text-gray-600 mb-1">Are you sure you want to delete <strong>"{listToDelete.name}"</strong>?</p>
                        <p className="text-sm text-gray-400 mb-4">Contacts in this list will be unassigned, not deleted.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => { setShowDeleteModal(false); setListToDelete(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Cancel</button>
                            <button onClick={handleDeleteList} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
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
    const [showClearModal, setShowClearModal] = useState(false);

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

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleClearHistory = async () => {
        try {
            await api.clearImportHistory();
            setHistory([]);
            setShowClearModal(false);
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    };

    const handleDownload = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const dataApiUrl = import.meta.env.VITE_DATA_API_URL || 'http://localhost:8000';
            const response = await fetch(`${dataApiUrl}/contacts/import-history/${id}/download`, {
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
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">Import History</h2>
                    <p className="text-gray-500">Track and audit all your contact uploads</p>
                </div>
                {history.length > 0 && (
                    <button
                        onClick={() => setShowClearModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                        <Trash2 size={16} />
                        Clear History
                    </button>
                )}
            </div>

            {/* Clear History Confirmation Modal */}
            {showClearModal && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-96 max-w-[90%] shadow-lg">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
                                <Trash2 size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Clear Import History?</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                This will permanently remove all <span className="font-medium text-gray-700">{history.length}</span> import history records. This action cannot be undone.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowClearModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleClearHistory}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="loader-wrapper"><span className="loader"></span></div>
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
                <div className="loader-wrapper"><span className="loader"></span></div>
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
