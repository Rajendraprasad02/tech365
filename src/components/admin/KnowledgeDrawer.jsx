import { useState } from 'react';
import { X, Globe, ExternalLink, ChevronDown, ChevronUp, FileText, Tag, Lightbulb, BookOpen } from 'lucide-react';

/**
 * KnowledgeDrawer - Right-side sliding drawer for detailed knowledge content
 */
export default function KnowledgeDrawer({ entry, isOpen, onClose }) {
    const [isRawContentExpanded, setIsRawContentExpanded] = useState(false);

    if (!entry) return null;

    // Auto-generate overview from first 2-3 sentences
    const generateOverview = (content) => {
        if (!content) return 'No content available.';
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        return sentences.slice(0, 3).join('. ').trim() + '.';
    };

    // Extract key topics from content (simple keyword extraction)
    const extractKeyTopics = (content) => {
        if (!content) return [];
        // Extract capitalized words/phrases and common technical terms
        const words = content.match(/\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?\b/g) || [];
        const uniqueTopics = [...new Set(words)].slice(0, 8);
        return uniqueTopics.length > 0 ? uniqueTopics : ['General Information'];
    };

    // Extract services/concepts mentioned
    const extractServices = (content) => {
        if (!content) return [];
        const servicePatterns = [
            /(?:service|platform|solution|tool|system|software|application|API|framework)\s*(?:for|of|:)?\s*([A-Za-z\s]+)/gi,
        ];
        const services = [];
        servicePatterns.forEach(pattern => {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                if (match[1] && match[1].trim().length > 2) {
                    services.push(match[1].trim());
                }
            }
        });
        return [...new Set(services)].slice(0, 6);
    };

    // Get category color
    const getCategoryColor = (category) => {
        const colors = {
            'Cloud': 'bg-blue-500',
            'Security': 'bg-green-500',
            'Backup': 'bg-purple-500',
            'Docs': 'bg-orange-500',
            'default': 'bg-gray-500'
        };
        return colors[category] || colors.default;
    };

    const overview = generateOverview(entry.content_full || entry.content);
    const keyTopics = extractKeyTopics(entry.content_full || entry.content);
    const services = extractServices(entry.content_full || entry.content);

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity z-40 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 bg-violet-500">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2 mb-2">
                                {entry.category && (
                                    <span className={`px-2 py-0.5 text-xs font-medium text-white rounded ${getCategoryColor(entry.category)}`}>
                                        {entry.category}
                                    </span>
                                )}
                                {entry.is_vectorized ? (
                                    <span
                                        className="px-2 py-0.5 text-xs font-medium text-emerald-400 bg-emerald-500/20 rounded cursor-help"
                                        title="Embedded using sentence-transformers/all-MiniLM-L6-v2 (384 dims)"
                                    >
                                        ● Vectorized
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 text-xs font-medium text-orange-400 bg-orange-500/20 rounded">
                                        ○ Pending
                                    </span>
                                )}
                            </div>
                            <h2 className="text-lg font-semibold text-white truncate">
                                {entry.title || 'Untitled Entry'}
                            </h2>
                            {entry.url && (
                                <a
                                    href={entry.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 mt-2 text-sm text-slate-300 hover:text-white transition-colors"
                                >
                                    <Globe size={14} />
                                    <span className="truncate max-w-[300px]">{new URL(entry.url).hostname}</span>
                                    <ExternalLink size={12} />
                                </a>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ maxHeight: 'calc(100vh - 140px)' }}>
                    {/* Overview Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <FileText size={18} className="text-violet-500" />
                            <h3 className="font-semibold text-gray-900">Overview</h3>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-4">
                            {overview}
                        </p>
                    </section>

                    {/* Key Topics Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <Tag size={18} className="text-blue-500" />
                            <h3 className="font-semibold text-gray-900">Key Topics</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {keyTopics.map((topic, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-full"
                                >
                                    {topic}
                                </span>
                            ))}
                        </div>
                    </section>

                    {/* Services / Concepts Section */}
                    {services.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <Lightbulb size={18} className="text-amber-500" />
                                <h3 className="font-semibold text-gray-900">Services / Concepts</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {services.map((service, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1.5 bg-amber-50 text-amber-700 text-sm rounded-full"
                                    >
                                        {service}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Raw Source Content Section - Collapsed by default */}
                    <section className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setIsRawContentExpanded(!isRawContentExpanded)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <BookOpen size={18} className="text-gray-500" />
                                <h3 className="font-semibold text-gray-900">Raw Source Content</h3>
                            </div>
                            {isRawContentExpanded ? (
                                <ChevronUp size={18} className="text-gray-500" />
                            ) : (
                                <ChevronDown size={18} className="text-gray-500" />
                            )}
                        </button>
                        {isRawContentExpanded && (
                            <div className="p-4 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                                {entry.content_full || entry.content || 'No content available.'}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
