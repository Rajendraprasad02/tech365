import { useState, useEffect } from 'react';
import {
    Search, Database, Globe, FileText, Trash2, ExternalLink,
    Filter, Cloud, Shield, HardDrive, BookOpen, Loader2, ArrowUpDown, Calendar,
    Plus, X, AlertCircle, Info, Pencil, AlertTriangle
} from 'lucide-react';
import {
    getKnowledgeGroups,
    deleteKnowledgeGroup,
    addManualKnowledge,
    updateKnowledgeGroup
} from '../../../services/api';
import KnowledgeDrawer from './KnowledgeDrawer';

export default function KnowledgeBasePage() {
    // State
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [totalGroups, setTotalGroups] = useState(0);
    const [sortOrder, setSortOrder] = useState('newest');

    // Drawer state
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Add Entry Modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState({ title: '', content: '', category: '', priority: 5 });
    const [addError, setAddError] = useState('');
    const [addLoading, setAddLoading] = useState(false);

    // Edit Entry Modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ id: '', title: '', content: '', category: '', priority: 5 });
    const [editError, setEditError] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    // Delete Confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, title: '' });
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Category config
    const categoryConfig = {
        'Cloud': { color: 'bg-blue-500', lightBg: 'bg-blue-50', textColor: 'text-blue-600', icon: Cloud },
        'Security': { color: 'bg-green-500', lightBg: 'bg-green-50', textColor: 'text-green-600', icon: Shield },
        'Backup': { color: 'bg-purple-500', lightBg: 'bg-purple-50', textColor: 'text-purple-600', icon: HardDrive },
        'Docs': { color: 'bg-orange-500', lightBg: 'bg-orange-50', textColor: 'text-orange-600', icon: BookOpen },
    };

    // Fetch data
    const fetchGroups = async () => {
        try {
            setLoading(true);
            const data = await getKnowledgeGroups(0, 100, selectedCategory || null);
            setGroups(data.groups || []);
            setTotalGroups(data.total_groups || 0);

            // Extract unique categories
            const uniqueCategories = [...new Set(data.groups?.map(g => g.category).filter(Boolean))];
            setCategories(uniqueCategories);
        } catch (error) {
            console.error('Error fetching knowledge items:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, [selectedCategory]);

    // Filter by search
    const filteredGroups = groups.filter(group =>
        group.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.content_preview?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.url?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort
    const sortedGroups = [...filteredGroups].sort((a, b) => {
        if (sortOrder === 'newest') {
            return new Date(b.created_at) - new Date(a.created_at);
        } else if (sortOrder === 'oldest') {
            return new Date(a.created_at) - new Date(b.created_at);
        } else if (sortOrder === 'priority_asc') {
            return (a.priority ?? 5) - (b.priority ?? 5);
        } else if (sortOrder === 'priority_desc') {
            return (b.priority ?? 5) - (a.priority ?? 5);
        }
        return 0;
    });

    // Show delete confirmation
    const handleDeleteClick = (item) => {
        setDeleteConfirm({ show: true, id: item.group_id, title: item.title || 'Untitled' });
    };

    // Confirm delete handler
    const handleDeleteConfirm = async () => {
        const id = deleteConfirm.id;
        if (!id) return;

        // Optimistic update
        const previousGroups = [...groups];
        setGroups(prev => prev.filter(g => g.group_id !== id));
        setTotalGroups(prev => prev - 1);
        setDeleteConfirm({ show: false, id: null, title: '' });

        try {
            setDeleteLoading(true);
            await deleteKnowledgeGroup(id);
        } catch (error) {
            console.error('Error deleting item:', error);
            // Rollback
            setGroups(previousGroups);
            setTotalGroups(prev => prev + 1);
        } finally {
            setDeleteLoading(false);
        }
    };

    // Add Entry handler
    const handleAddEntry = async () => {
        setAddError('');

        if (!addForm.title.trim()) {
            setAddError('Title is required');
            return;
        }
        if (!addForm.content.trim()) {
            setAddError('Content is required');
            return;
        }

        const priority = parseInt(addForm.priority) || 5;
        if (priority < 1 || priority > 5) {
            setAddError('Priority must be between 1 and 5');
            return;
        }

        try {
            setAddLoading(true);
            await addManualKnowledge({
                title: addForm.title.trim(),
                content: addForm.content.trim(),
                category: addForm.category.trim() || null,
                priority
            });
            setShowAddModal(false);
            setAddForm({ title: '', content: '', category: '', priority: 5 });
            fetchGroups(); // Refresh list
        } catch (error) {
            console.error('Error adding entry:', error);
            setAddError(error.message || 'Failed to add entry');
        } finally {
            setAddLoading(false);
        }
    };

    // Open Edit Modal
    const handleEditClick = (item) => {
        setEditForm({
            id: item.group_id,
            title: item.title || '',
            content: item.content_full || item.content_preview || '',
            category: item.category || '',
            priority: item.priority ?? 5
        });
        setEditError('');
        setShowEditModal(true);
    };

    // Edit Entry handler
    const handleEditEntry = async () => {
        setEditError('');

        if (!editForm.title.trim()) {
            setEditError('Title is required');
            return;
        }
        if (!editForm.content.trim()) {
            setEditError('Content is required');
            return;
        }

        const priority = parseInt(editForm.priority) || 5;
        if (priority < 1 || priority > 5) {
            setEditError('Priority must be between 1 and 5');
            return;
        }

        try {
            setEditLoading(true);
            await updateKnowledgeGroup(editForm.id, {
                title: editForm.title.trim(),
                content: editForm.content.trim(),
                category: editForm.category.trim() || null,
                priority
            });
            setShowEditModal(false);
            setEditForm({ id: '', title: '', content: '', category: '', priority: 5 });
            fetchGroups(); // Refresh list
        } catch (error) {
            console.error('Error updating entry:', error);
            setEditError(error.message || 'Failed to update entry');
        } finally {
            setEditLoading(false);
        }
    };

    // Open drawer
    const handleCardClick = (item) => {
        setSelectedEntry(item);
        setDrawerOpen(true);
    };

    // Helpers
    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const getHostname = (url) => {
        try { return new URL(url).hostname; } catch { return url; }
    };

    const getCategoryStyle = (category) => {
        return categoryConfig[category] || {
            color: 'bg-gray-500', lightBg: 'bg-gray-50', textColor: 'text-gray-600', icon: FileText
        };
    };

    // Priority badge helper
    const getPriorityBadge = (priority) => {
        const p = priority ?? 5;
        let colorClass = '';
        if (p <= 3) {
            colorClass = 'bg-red-100 text-red-700 border-red-200';
        } else if (p <= 7) {
            colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
        } else {
            colorClass = 'bg-gray-100 text-gray-500 border-gray-200';
        }
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${colorClass}`}>
                P{p}
            </span>
        );
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
            {/* Header */}
            <div className="px-8 py-6 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-100 rounded-lg">
                            <Database size={24} className="text-violet-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
                            <p className="text-gray-500 text-sm">Manage content chunks</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors text-sm font-medium shadow-sm"
                    >
                        <Plus size={18} />
                        Add Entry
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden p-6">
                <div className="flex flex-col h-full">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 mb-6">
                        {/* Search */}
                        <div className="flex-1 min-w-[300px] flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg border border-gray-200 shadow-sm focus-within:border-violet-500 transition-colors">
                            <Search size={18} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search content..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
                            />
                        </div>

                        {/* Category */}
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <Filter size={16} className="text-gray-400" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="bg-transparent text-sm outline-none text-gray-700 cursor-pointer"
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sort */}
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <ArrowUpDown size={16} className="text-gray-400" />
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="bg-transparent text-sm outline-none text-gray-700 cursor-pointer"
                            >
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                                <option value="priority_asc">Priority (High → Low)</option>
                                <option value="priority_desc">Priority (Low → High)</option>
                            </select>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mb-4 text-sm text-gray-500 font-medium">
                        Showing {sortedGroups.length} items
                    </div>

                    {/* Grid Layout */}
                    <div className="flex-1 overflow-y-auto pr-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="animate-spin h-8 w-8 text-violet-500" />
                                <span className="ml-3 text-gray-500">Loading content...</span>
                            </div>
                        ) : sortedGroups.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                                {sortedGroups.map((item) => {
                                    const catStyle = getCategoryStyle(item.category);
                                    const CatIcon = catStyle.icon;

                                    return (
                                        <div
                                            key={item.group_id}
                                            className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-violet-200 transition-all flex flex-col h-full cursor-pointer"
                                            onClick={() => handleCardClick(item)}
                                        >
                                            <div className="p-5 flex flex-col h-full">
                                                {/* Card Top: Category, Priority, Date, Delete */}
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {item.category && (
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${catStyle.lightBg} ${catStyle.textColor}`}>
                                                                <CatIcon size={12} />
                                                                {item.category}
                                                            </span>
                                                        )}
                                                        {getPriorityBadge(item.priority)}
                                                        <span className="flex items-center gap-1 text-xs text-gray-400">
                                                            <Calendar size={12} />
                                                            {formatDate(item.created_at)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                                                            className="text-gray-400 hover:text-violet-600 p-1 rounded-md hover:bg-violet-50 transition-colors"
                                                            title="Edit Item"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}
                                                            className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                                                            title="Delete Item"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* URL */}
                                                {item.url && (
                                                    <a
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-violet-600 mb-2 truncate transition-colors w-fit"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Globe size={12} />
                                                        <span className="truncate max-w-[200px]">{getHostname(item.url)}</span>
                                                        <ExternalLink size={10} />
                                                    </a>
                                                )}

                                                {/* Title */}
                                                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2" title={item.title}>
                                                    {item.title || 'Untitled'}
                                                </h3>

                                                {/* Content Preview */}
                                                <p className="text-sm text-gray-500 leading-relaxed line-clamp-4 flex-1">
                                                    {item.content_preview}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <Database size={48} className="mb-4 opacity-50" />
                                <p className="text-lg font-medium">No content found</p>
                                <p className="text-sm">Try adjusting your search or filters</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Entry Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-[520px] max-h-[90vh] overflow-y-auto shadow-xl">
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Add Knowledge Entry</h3>
                                <p className="text-sm text-gray-400 mt-0.5">Add manual content to the knowledge base</p>
                            </div>
                            <button
                                onClick={() => { setShowAddModal(false); setAddError(''); }}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {addError && (
                            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                <AlertCircle size={16} />
                                {addError}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Return Policy FAQ"
                                    value={addForm.title}
                                    onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. FAQ, Policy, Products"
                                    value={addForm.category}
                                    onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                                />
                            </div>

                            {/* Content */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Content *</label>
                                <textarea
                                    placeholder="Enter the knowledge content..."
                                    value={addForm.content}
                                    onChange={(e) => setAddForm({ ...addForm, content: e.target.value })}
                                    rows={6}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm resize-none"
                                />
                            </div>

                            {/* Priority */}
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                                    <div className="relative group">
                                        <Info size={14} className="text-gray-400 cursor-help" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-lg">
                                            Lower value = higher priority. Example: Priority 1 overrides Priority 5.
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={addForm.priority}
                                        onChange={(e) => setAddForm({ ...addForm, priority: parseInt(e.target.value) })}
                                        className="w-28 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm bg-white cursor-pointer"
                                    >
                                        <option value={1}>1 - Highest</option>
                                        <option value={2}>2 - High</option>
                                        <option value={3}>3 - Medium</option>
                                        <option value={4}>4 - Low</option>
                                        <option value={5}>5 - Lowest</option>
                                    </select>
                                    <span className="text-xs text-gray-400">1 (highest) to 5 (lowest)</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => { setShowAddModal(false); setAddError(''); setAddForm({ title: '', content: '', category: '', priority: 5 }); }}
                                className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddEntry}
                                disabled={addLoading}
                                className="px-5 py-2.5 bg-violet-500 text-white rounded-lg hover:bg-violet-600 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {addLoading && <Loader2 size={16} className="animate-spin" />}
                                {addLoading ? 'Adding...' : 'Save Entry'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Entry Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-[520px] max-h-[90vh] overflow-y-auto shadow-xl">
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Edit Knowledge Entry</h3>
                                <p className="text-sm text-gray-400 mt-0.5">Update existing content in the knowledge base</p>
                            </div>
                            <button
                                onClick={() => { setShowEditModal(false); setEditError(''); }}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {editError && (
                            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                <AlertCircle size={16} />
                                {editError}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Return Policy FAQ"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. FAQ, Policy, Products"
                                    value={editForm.category}
                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                                />
                            </div>

                            {/* Content */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Content *</label>
                                <textarea
                                    placeholder="Enter the knowledge content..."
                                    value={editForm.content}
                                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                                    rows={6}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm resize-none"
                                />
                            </div>

                            {/* Priority */}
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                                    <div className="relative group">
                                        <Info size={14} className="text-gray-400 cursor-help" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-lg">
                                            Lower value = higher priority. Example: Priority 1 overrides Priority 5.
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={editForm.priority}
                                        onChange={(e) => setEditForm({ ...editForm, priority: parseInt(e.target.value) })}
                                        className="w-28 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm bg-white cursor-pointer"
                                    >
                                        <option value={1}>1 - Highest</option>
                                        <option value={2}>2 - High</option>
                                        <option value={3}>3 - Medium</option>
                                        <option value={4}>4 - Low</option>
                                        <option value={5}>5 - Lowest</option>
                                    </select>
                                    <span className="text-xs text-gray-400">1 (highest) to 5 (lowest)</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => { setShowEditModal(false); setEditError(''); setEditForm({ id: '', title: '', content: '', category: '', priority: 5 }); }}
                                className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditEntry}
                                disabled={editLoading}
                                className="px-5 py-2.5 bg-violet-500 text-white rounded-lg hover:bg-violet-600 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {editLoading && <Loader2 size={16} className="animate-spin" />}
                                {editLoading ? 'Updating...' : 'Update Entry'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-[420px] shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle size={20} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Delete Entry</h3>
                                <p className="text-sm text-gray-500">This action cannot be undone</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 mb-5">
                            <p className="text-sm text-gray-700">
                                Are you sure you want to delete <span className="font-semibold">"{deleteConfirm.title}"</span>?
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm({ show: false, id: null, title: '' })}
                                className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={deleteLoading}
                                className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                            >
                                {deleteLoading && <Loader2 size={16} className="animate-spin" />}
                                {deleteLoading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Knowledge Drawer */}
            <KnowledgeDrawer
                entry={selectedEntry}
                isOpen={drawerOpen}
                onClose={() => { setDrawerOpen(false); setSelectedEntry(null); }}
            />
        </div>
    );
}
