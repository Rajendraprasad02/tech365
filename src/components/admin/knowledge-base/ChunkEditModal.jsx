import { useState, useEffect } from 'react';
import { X, Save, Loader2, Layers, FileText, AlertCircle } from 'lucide-react';

/**
 * ChunkEditModal - Modal for editing individual chunk content
 * Shows read-only group context and allows content editing with re-embedding
 */
export default function ChunkEditModal({
    chunk,
    groupInfo,
    isOpen,
    onClose,
    onSave,
    isLoading
}) {
    const [content, setContent] = useState('');
    const [error, setError] = useState(null);

    // Initialize content when chunk changes
    useEffect(() => {
        if (chunk) {
            setContent(chunk.content || '');
            setError(null);
        }
    }, [chunk]);

    if (!isOpen || !chunk) return null;

    const handleSave = async () => {
        if (!content.trim()) {
            setError('Content cannot be empty');
            return;
        }
        setError(null);
        await onSave(chunk.id, content);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                onClick={onClose}
                onKeyDown={handleKeyDown}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-100 rounded-lg">
                                <FileText size={20} className="text-violet-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Edit Chunk</h2>
                                <p className="text-sm text-gray-500">Modify content • Auto re-embeds on save</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Group Context (Read-only) */}
                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Layers size={16} className="text-violet-500" />
                                <span className="font-medium">Group:</span>
                                <span className="text-gray-800">{groupInfo?.title || 'Unknown Group'}</span>
                            </div>
                            {groupInfo?.relatedCount && (
                                <div className="flex items-center gap-1 text-gray-500">
                                    <span>•</span>
                                    <span>{groupInfo.relatedCount} related chunks</span>
                                </div>
                            )}
                            {chunk.chunk_order && (
                                <div className="flex items-center gap-1 text-gray-500">
                                    <span>•</span>
                                    <span>Position #{chunk.chunk_order}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content Editor */}
                    <div className="flex-1 p-6 overflow-hidden">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chunk Content
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={isLoading}
                            className="w-full h-64 px-4 py-3 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:bg-gray-50 disabled:opacity-75"
                            placeholder="Enter chunk content..."
                        />

                        {/* Error message */}
                        {error && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                                <AlertCircle size={14} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Info note */}
                        <p className="mt-3 text-xs text-gray-500">
                            💡 Saving will regenerate the embedding and may trigger re-clustering of related chunks.
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isLoading || !content.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Re-embedding...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    <span>Save & Re-embed</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
