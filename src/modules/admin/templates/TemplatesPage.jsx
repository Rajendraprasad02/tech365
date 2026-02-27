import { useState, useEffect, useMemo } from 'react';
import {
    getWhatsAppTemplates
} from '../../../services/api';
import {
    Search, Filter, RefreshCw, MessageSquare, CheckCircle, XCircle,
    Clock, Globe, Tag, Smartphone, ExternalLink, Image as ImageIcon,
    FileText, Video, Phone, ChevronLeft, ChevronRight
} from 'lucide-react';
import Pagination from '@/components/ui/Pagination';

// Status badge component
const StatusBadge = ({ status }) => {
    const styles = {
        APPROVED: 'bg-green-100 text-green-700 border-green-200',
        REJECTED: 'bg-red-100 text-red-700 border-red-200',
        PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    };
    const icons = {
        APPROVED: CheckCircle,
        REJECTED: XCircle,
        PENDING: Clock,
    };
    const Icon = icons[status] || Clock;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${styles[status] || styles.PENDING}`}>
            <Icon size={12} className={status === 'PENDING' ? 'animate-pulse' : ''} />
            {status}
        </span>
    );
};

// WhatsApp Bubble Component
const WhatsAppPreview = ({ template }) => {
    const header = template.components?.find(c => c.type === 'HEADER');
    const body = template.components?.find(c => c.type === 'BODY');
    const footer = template.components?.find(c => c.type === 'FOOTER');
    const buttons = template.components?.find(c => c.type === 'BUTTONS');

    return (
        <div className="bg-[#e5ddd5] p-3 rounded-xl border border-gray-200 relative overflow-hidden">
            {/* Background Pattern (Subtle) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}></div>

            <div className="relative z-10 w-full max-w-[280px]">
                <div className="bg-white rounded-lg rounded-tl-none p-2.5 shadow-sm text-sm text-gray-800">
                    {/* Header */}
                    {header && (
                        <div className="mb-2 border-b border-gray-100 pb-2">
                            {header.format === 'IMAGE' && (
                                <div className="bg-gray-100 rounded aspect-video flex flex-col items-center justify-center text-gray-400 gap-1 overflow-hidden">
                                    <ImageIcon size={24} />
                                    <span className="text-[10px] uppercase font-bold tracking-widest">Image Header</span>
                                </div>
                            )}
                            {header.format === 'VIDEO' && (
                                <div className="bg-gray-100 rounded aspect-video flex flex-col items-center justify-center text-gray-400 gap-1 overflow-hidden relative">
                                    <Video size={24} />
                                    <span className="text-[10px] uppercase font-bold tracking-widest">Video Header</span>
                                    <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[9px] px-1 rounded">0:15</div>
                                </div>
                            )}
                            {header.format === 'DOCUMENT' && (
                                <div className="bg-gray-50 border border-gray-100 rounded p-2 flex items-center gap-2">
                                    <div className="w-8 h-8 bg-red-100 text-red-600 rounded flex items-center justify-center shadow-inner">
                                        <FileText size={16} />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="text-[10px] font-bold text-gray-700 truncate uppercase">document.pdf</div>
                                        <div className="text-[8px] text-gray-400 uppercase tracking-tighter">PDF • 1.2 MB</div>
                                    </div>
                                </div>
                            )}
                            {header.format === 'TEXT' && (
                                <div className="font-bold text-gray-900 border-l-4 border-green-500 pl-2 py-0.5 leading-tight">
                                    {header.text}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Body */}
                    <div className="whitespace-pre-wrap leading-relaxed text-[13px]">
                        {body?.text}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div className="mt-2 text-[11px] text-black/45">
                            {footer.text}
                        </div>
                    )}

                    {/* Timestamp */}
                    <div className="flex justify-end mt-1">
                        <span className="text-[10px] text-black/30 font-medium">10:45 AM</span>
                    </div>
                </div>

                {/* Buttons */}
                {buttons?.buttons && (
                    <div className="mt-1 space-y-1">
                        {buttons.buttons.map((btn, bIdx) => (
                            <div key={bIdx} className="bg-white rounded-lg shadow-sm py-2 px-3 text-center text-blue-500 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors hover:bg-gray-50 cursor-pointer">
                                {btn.type === 'URL' && <ExternalLink size={12} />}
                                {btn.type === 'PHONE_NUMBER' && <Phone size={12} />}
                                {btn.type === 'QUICK_REPLY' && <MessageSquare size={12} />}
                                {btn.type === 'FLOW' && <Smartphone size={12} />}
                                <span>{btn.text}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function TemplatesPage() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, categoryFilter]);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await getWhatsAppTemplates();
            if (response && response.templates) {
                setTemplates(response.templates);
            } else {
                setTemplates([]);
            }
        } catch (err) {
            console.error("Failed to fetch templates:", err);
            setError("Failed to load templates.");
        } finally {
            setLoading(false);
        }
    };

    const categories = useMemo(() => {
        const cats = new Set(templates.map(t => t.category));
        return ['ALL', ...Array.from(cats)];
    }, [templates]);

    const filteredTemplates = useMemo(() => {
        return templates.filter(t => {
            const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [templates, searchQuery, categoryFilter]);

    const totalPages = Math.ceil(filteredTemplates.length / pageSize);
    const paginatedTemplates = filteredTemplates.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    if (loading) {
        return (
            <div className="loader-wrapper bg-gray-50/50">
                <span className="loader mb-4"></span>
                <p className="mt-4 text-sm font-bold text-gray-500 uppercase tracking-widest animate-pulse">Syncing with Meta...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-red-50/30">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                    <XCircle size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Failed to Connect</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-md text-center">{error}</p>
                <button
                    onClick={fetchTemplates}
                    className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-xl font-bold shadow-lg shadow-violet-100 hover:bg-violet-700 active:scale-95 transition-all text-sm"
                >
                    <RefreshCw size={16} /> Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f8f9fc]">
            {/* Header Section */}
            <div className="px-8 py-8 bg-white border-b border-gray-100 shadow-sm relative z-20">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-green-100 text-green-600 rounded-2xl shadow-inner">
                                <ImageIcon size={24} />
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Template Library</h1>
                        </div>
                        <p className="text-gray-400 font-medium text-sm flex items-center gap-2">
                            <Globe size={14} className="text-violet-500" />
                            Managed WhatsApp message templates from Meta Dashboard
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 md:flex-none md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search template name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:bg-white outline-none transition-all placeholder:text-gray-300"
                            />
                        </div>

                        <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl p-1 gap-1">
                            {categories.slice(0, 4).map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${categoryFilter === cat ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {cat.replace('_', ' ')}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={fetchTemplates}
                            className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-all active:scale-95 shadow-sm"
                            title="Refresh Sync"
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                {filteredTemplates.length > 0 ? (
                    <div className="flex flex-col h-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-8 flex-1">
                            {paginatedTemplates.map((template) => (
                                <div
                                    key={template.name}
                                    className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4"
                                >
                                    {/* Card Header */}
                                    <div className="px-6 py-5 border-b border-gray-50 bg-white group-hover:bg-gray-50/30 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <StatusBadge status={template.status} />
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-500">
                                                <Globe size={11} />
                                                {template.language?.code || template.language}
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 group-hover:text-violet-600 transition-colors truncate mb-1" title={template.name}>
                                            {template.name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            <Tag size={10} className="text-violet-400" />
                                            {template.category}
                                        </div>
                                    </div>

                                    {/* Preview Section */}
                                    <div className="flex-1 p-6 bg-gray-50/50 flex items-center justify-center min-h-[300px]">
                                        <WhatsAppPreview template={template} />
                                    </div>


                                </div>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {filteredTemplates.length > 0 && (
                            <Pagination
                                page={currentPage - 1}
                                pageSize={pageSize}
                                total={filteredTemplates.length}
                                onPageChange={(p) => setCurrentPage(p + 1)}
                                onPageSizeChange={(s) => {
                                    setPageSize(s);
                                    setCurrentPage(1);
                                }}
                                pageSizeOptions={[12, 24, 48, 96]}
                                className="mt-8 pt-4"
                            />
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-24 h-24 bg-white rounded-3xl border border-dashed border-gray-300 flex items-center justify-center mb-6 shadow-sm">
                            <Search size={40} className="text-gray-200" />
                        </div>
                        <h3 className="text-xl font-extrabold text-gray-900 mb-2">No Templates Found</h3>
                        <p className="text-gray-400 text-sm max-w-sm font-medium">
                            We couldn't find any templates matching "{searchQuery}". Try selecting a different category or refining your search.
                        </p>
                    </div>
                )}
            </div>

            {/* Styles for custom scrollbar */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}
