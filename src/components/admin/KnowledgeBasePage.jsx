import { useState, useEffect } from 'react';
import {
    Search, Database, Globe, FileText, Calendar, Trash2, ExternalLink,
    Filter, Cloud, Shield, HardDrive, BookOpen, Check, Clock, ArrowUpDown
} from 'lucide-react';
import { getKnowledgeBase, deleteKnowledgeEntry } from '../../services/api';
import KnowledgeDrawer from './KnowledgeDrawer';

export default function KnowledgeBasePage() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [total, setTotal] = useState(0);
    const [vectorizedCount, setVectorizedCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [sortOrder, setSortOrder] = useState('newest');

    // Drawer state
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Category config with colors and icons
    const categoryConfig = {
        'Cloud': { color: 'bg-blue-500', lightBg: 'bg-blue-50', textColor: 'text-blue-600', icon: Cloud },
        'Security': { color: 'bg-green-500', lightBg: 'bg-green-50', textColor: 'text-green-600', icon: Shield },
        'Backup': { color: 'bg-purple-500', lightBg: 'bg-purple-50', textColor: 'text-purple-600', icon: HardDrive },
        'Docs': { color: 'bg-orange-500', lightBg: 'bg-orange-50', textColor: 'text-orange-600', icon: BookOpen },
    };

    // Fetch knowledge base entries
    useEffect(() => {
        const fetchEntries = async () => {
            try {
                setLoading(true);
                const data = await getKnowledgeBase(0, 100, selectedCategory || null);
                setEntries(data.entries || []);
                setTotal(data.total || 0);
                setVectorizedCount(data.vectorized_count || 0);
                setPendingCount(data.pending_count || 0);

                // Extract unique categories
                const uniqueCategories = [...new Set(data.entries?.map(e => e.category).filter(Boolean))];
                setCategories(uniqueCategories);
            } catch (error) {
                console.error('Error fetching knowledge base:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEntries();
    }, [selectedCategory]);

    // Filter entries by search
    const filteredEntries = entries.filter(entry =>
        entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.url?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort entries
    const sortedEntries = [...filteredEntries].sort((a, b) => {
        if (sortOrder === 'newest') {
            return new Date(b.created_at) - new Date(a.created_at);
        } else {
            return new Date(a.created_at) - new Date(b.created_at);
        }
    });

    // Open drawer with selected entry
    const handleCardClick = (entry) => {
        setSelectedEntry(entry);
        setIsDrawerOpen(true);
    };

    // Close drawer
    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setTimeout(() => setSelectedEntry(null), 300); // Clear after animation
    };

    // Delete an entry
    const handleDelete = async (e, id) => {
        e.stopPropagation(); // Prevent card click
        if (!confirm('Are you sure you want to delete this knowledge entry?')) return;
        try {
            await deleteKnowledgeEntry(id);
            setEntries(prev => prev.filter(e => e.id !== id));
            setTotal(prev => prev - 1);
        } catch (error) {
            console.error('Error deleting entry:', error);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get hostname from URL
    const getHostname = (url) => {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    };

    // Get category styling
    const getCategoryStyle = (category) => {
        return categoryConfig[category] || {
            color: 'bg-gray-500',
            lightBg: 'bg-gray-50',
            textColor: 'text-gray-600',
            icon: FileText
        };
    };

    // Count entries by category
    const getCategoryCounts = () => {
        const counts = {};
        entries.forEach(entry => {
            if (entry.category) {
                counts[entry.category] = (counts[entry.category] || 0) + 1;
            }
        });
        return counts;
    };

    const categoryCounts = getCategoryCounts();

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
            {/* Page Header - Purple Gradient */}
            <div className="px-8 py-6 bg-gradient-to-r from-violet-600 to-purple-600">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-white/10 rounded-lg">
                        <Database size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
                        <p className="text-slate-300 text-sm">Semantic knowledge repository</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden p-6">
                <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col shadow-sm">
                    {/* Search & Filters Bar */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex gap-4 mb-4">
                            {/* Search */}
                            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                                <Search size={18} className="text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search knowledge base..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
                                />
                            </div>

                            {/* Category Filter */}
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 min-w-[180px]">
                                <Filter size={16} className="text-gray-400" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="flex-1 bg-transparent text-sm outline-none text-gray-700"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Sort */}
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 min-w-[140px]">
                                <ArrowUpDown size={16} className="text-gray-400" />
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value)}
                                    className="flex-1 bg-transparent text-sm outline-none text-gray-700"
                                >
                                    <option value="newest">Newest...</option>
                                    <option value="oldest">Oldest...</option>
                                </select>
                            </div>
                        </div>

                        {/* Stats Bar */}
                        <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                                <FileText size={16} />
                                <span>Total: <strong>{total}</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600">
                                <Check size={16} />
                                <span>Vectorized: <strong>{vectorizedCount}</strong> / {total}</span>
                            </div>
                            <div className="flex items-center gap-2 text-orange-500">
                                <Clock size={16} />
                                <span>Pending: <strong>{pendingCount}</strong></span>
                            </div>

                            <div className="h-4 w-px bg-gray-300 mx-2" />

                            {/* Category counts with icons */}
                            {Object.entries(categoryCounts).map(([cat, count]) => {
                                const style = getCategoryStyle(cat);
                                const Icon = style.icon;
                                return (
                                    <div key={cat} className={`flex items-center gap-1.5 ${style.textColor}`}>
                                        <Icon size={16} />
                                        <span><strong>{count}</strong></span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Card Grid */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
                                <span className="ml-3 text-gray-500">Loading knowledge base...</span>
                            </div>
                        ) : sortedEntries.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sortedEntries.map((entry) => {
                                    const catStyle = getCategoryStyle(entry.category);
                                    const CatIcon = catStyle.icon;

                                    return (
                                        <div
                                            key={entry.id}
                                            onClick={() => handleCardClick(entry)}
                                            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer group"
                                        >
                                            {/* Card Header */}
                                            <div className="flex items-start justify-between mb-3">
                                                {entry.category && (
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${catStyle.lightBg} ${catStyle.textColor}`}>
                                                        <CatIcon size={12} />
                                                        {entry.category}
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-400">
                                                    {formatDate(entry.created_at)}
                                                </span>
                                            </div>

                                            {/* Source URL */}
                                            {entry.url && (
                                                <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-400">
                                                    <Globe size={12} />
                                                    <span className="truncate">{getHostname(entry.url)}</span>
                                                    <ExternalLink size={10} />
                                                </div>
                                            )}

                                            {/* Title */}
                                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-violet-600 transition-colors">
                                                {entry.title || 'Untitled Entry'}
                                            </h3>

                                            {/* Content Preview */}
                                            <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-4">
                                                {entry.content}
                                            </p>

                                            {/* Footer - Status Badges */}
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                <div className="flex items-center gap-2">
                                                    {entry.is_vectorized ? (
                                                        <>
                                                            <span
                                                                className="text-xs text-emerald-600 font-medium cursor-help"
                                                                title="Embedded using sentence-transformers/all-MiniLM-L6-v2 (384 dims)"
                                                            >
                                                                ● Vectorized
                                                            </span>
                                                            <span className="text-xs text-gray-400">
                                                                ● Source Verified
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-orange-500 font-medium">
                                                            ○ Pending
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e) => handleDelete(e, entry.id)}
                                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Delete entry"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                <Database size={48} className="mb-4 opacity-50" />
                                <p className="text-lg font-medium mb-1">No knowledge entries found</p>
                                <p className="text-sm">Add content by scraping websites or manual entry</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Knowledge Drawer */}
            <KnowledgeDrawer
                entry={selectedEntry}
                isOpen={isDrawerOpen}
                onClose={handleCloseDrawer}
            />
        </div>
    );
}
