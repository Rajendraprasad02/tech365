import React from 'react';
import { X, FileText, Clock, User } from 'lucide-react';
import { ScrollArea } from '../../../components/ui/scroll-area';

const NotesHistoryModal = ({ isOpen, onClose, notes = [], users = [] }) => {
    if (!isOpen) return null;

    // Helper to resolve agent name safely
    const resolveAgentName = (note) => {
        const id = note.agent_id;
        const fallbackName = note.agent_name;
        
        if (!id) return fallbackName || 'Agent';
        const user = users.find(u => u.id === id || u.id === parseInt(id));
        return user ? (user.full_name || user.username) : (fallbackName || 'Agent');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-hidden flex flex-col h-[70vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <FileText size={18} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Agent Notes History</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden bg-gray-50/50">
                    {notes && notes.length > 0 ? (
                        <ScrollArea className="h-full p-4">
                            <div className="space-y-4">
                                {notes.map((note, index) => {
                                    const displayName = resolveAgentName(note);
                                    return (
                                    <div key={index} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative group hover:shadow-md transition-shadow">
                                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mb-3">
                                            {note.note}
                                        </p>
                                        <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-[10px] font-bold text-violet-600">
                                                    {(displayName?.[0] || 'A').toUpperCase()}
                                                </div>
                                                <span className="text-xs font-medium text-gray-600">
                                                    {displayName}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                                <Clock size={12} />
                                                <span>
                                                    {new Date(note.timestamp).toLocaleDateString()} {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <FileText size={32} className="opacity-50" />
                            </div>
                            <p className="font-medium text-gray-500">No notes found</p>
                            <p className="text-xs mt-1">Previous agent feedback will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotesHistoryModal;
