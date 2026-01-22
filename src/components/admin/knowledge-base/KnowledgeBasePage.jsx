import { useState, useEffect } from 'react';
import {
    Search, Database, Globe, FileText, Trash2, ExternalLink,
    Filter, Cloud, Shield, HardDrive, BookOpen, Loader2, ArrowUpDown, Calendar
} from 'lucide-react';
import {
    getKnowledgeGroups,
    deleteKnowledgeGroup
} from '../../../services/api';

export default function KnowledgeBasePage() {
    // State
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [totalGroups, setTotalGroups] = useState(0);
    const [sortOrder, setSortOrder] = useState('newest');

    // Category config
    const categoryConfig = {
        'Cloud': { color: 'bg-blue-500', lightBg: 'bg-blue-50', textColor: 'text-blue-600', icon: Cloud },
        'Security': { color: 'bg-green-500', lightBg: 'bg-green-50', textColor: 'text-green-600', icon: Shield },
        'Backup': { color: 'bg-purple-500', lightBg: 'bg-purple-50', textColor: 'text-purple-600', icon: HardDrive },
        'Docs': { color: 'bg-orange-500', lightBg: 'bg-orange-50', textColor: 'text-orange-600', icon: BookOpen },
    };

    // Fetch data
    useEffect(() => {
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
        } else {
            return new Date(a.created_at) - new Date(b.created_at);
        }
    });

    // Delete handler
    const handleDelete = async (id) => {
        if (!confirm('Delete this item?')) return;

        // Optimistic update
        const previousGroups = [...groups];
        setGroups(prev => prev.filter(g => g.group_id !== id));
        setTotalGroups(prev => prev - 1);

        try {
            await deleteKnowledgeGroup(id);
        } catch (error) {
            console.error('Error deleting item:', error);
            // Rollback
            setGroups(previousGroups);
            setTotalGroups(prev => prev + 1);
            alert('Failed to delete item.');
        }
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

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
            {/* Header */}
            <div className="px-8 py-6 bg-white border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-100 rounded-lg">
                        <Database size={24} className="text-violet-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
                        <p className="text-gray-500 text-sm">Manage content chunks</p>
                    </div>
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
                                        <div key={item.group_id} className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-violet-200 transition-all flex flex-col h-full">
                                            <div className="p-5 flex flex-col h-full">
                                                {/* Card Top: Category, Date, Delete */}
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        {item.category && (
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${catStyle.lightBg} ${catStyle.textColor}`}>
                                                                <CatIcon size={12} />
                                                                {item.category}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1 text-xs text-gray-400">
                                                            <Calendar size={12} />
                                                            {formatDate(item.created_at)}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDelete(item.group_id)}
                                                        className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Delete Item"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                {/* URL */}
                                                {item.url && (
                                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-violet-600 mb-2 truncate transition-colors w-fit">
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
        </div>
    );
}
