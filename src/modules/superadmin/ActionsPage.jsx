import { useState, useEffect } from 'react';
import {
    Activity, Plus, Edit2, Trash2, X, Search, Info, ShieldCheck
} from 'lucide-react';
import {
    getActions,
    createAction,
    updateAction,
    deleteAction
} from '../../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/context/ToastContext';
import { Loader2 } from 'lucide-react';

export default function ActionsPage() {
    const { toast } = useToast();

    // State
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingAction, setEditingAction] = useState(null);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    // Fetch Data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getActions();
            setActions(data || []);
        } catch (error) {
            console.error("Failed to fetch actions:", error);
            toast({ title: "Error", description: "Failed to fetch actions", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name) {
            toast({ title: "Validation Error", description: "Action name is required", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            if (editingAction) {
                await updateAction(editingAction.id, formData);
                toast({ title: "Success", description: "Action updated successfully", variant: "success" });
            } else {
                await createAction(formData);
                toast({ title: "Success", description: "Action created successfully", variant: "success" });
            }
            setModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Error saving action:", error);
            toast({ title: "Error", description: "Failed to save action", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (actionId) => {
        const action = actions.find(a => a.id === actionId);
        if (action?.isSystemAction || action?.is_system_action) {
            toast({ title: "Forbidden", description: "System actions cannot be deleted.", variant: "destructive" });
            return;
        }
        if (!confirm("Are you sure you want to delete this action?")) return;
        try {
            await deleteAction(actionId);
            toast({ title: "Success", description: "Action deleted successfully", variant: "success" });
            fetchData();
        } catch (error) {
            console.error("Error deleting action:", error);
            toast({ title: "Error", description: "Failed to delete action", variant: "destructive" });
        }
    };

    const filteredActions = actions.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col bg-gray-50 h-[calc(100vh-64px)] overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between shadow-sm z-10">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">System Actions</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage granular actions available for screen permissions</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={() => {
                            setEditingAction(null);
                            setFormData({ name: '', description: '' });
                            setModalOpen(true);
                        }}
                        className="bg-primary hover:bg-primary-600 text-white gap-2 shadow-lg shadow-primary/20"
                    >
                        <Plus size={18} />
                        Add Action
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8">
                {/* Search Bar */}
                <div className="mb-6 relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        placeholder="Search actions..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white border-gray-200 rounded-xl"
                    />
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredActions.map(action => (
                            <div key={action.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                                {(action.isSystemAction || action.is_system_action) && (
                                    <div className="absolute top-0 right-0">
                                        <div className="bg-blue-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-sm">
                                            <ShieldCheck size={10} />
                                            System
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                        <Activity size={24} />
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="sm" onClick={() => {
                                            setEditingAction(action);
                                            setFormData({ name: action.name, description: action.description || '' });
                                            setModalOpen(true);
                                        }} className="rounded-lg h-8 w-8 p-0">
                                            <Edit2 size={14} />
                                        </Button>
                                        {!(action.isSystemAction || action.is_system_action) && (
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(action.id)} className="rounded-lg h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50">
                                                <Trash2 size={14} />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg mb-1">{action.name}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">{action.description || 'No description provided.'}</p>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action Key:</span>
                                    <code className="text-[11px] bg-gray-50 px-2 py-0.5 rounded border border-gray-200 text-gray-700">{action.name.toLowerCase()}</code>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold">{editingAction ? 'Edit Action' : 'Create New Action'}</h2>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Action Name</label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., approve"
                                    disabled={editingAction?.isSystemAction || editingAction?.is_system_action}
                                />
                                {(editingAction?.isSystemAction || editingAction?.is_system_action) && (
                                    <p className="text-[10px] text-blue-600 font-bold mt-1 uppercase italic">System actions cannot be renamed</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="What this action represents..."
                                    className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    rows={4}
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50/50 rounded-b-2xl">
                            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-primary hover:bg-primary-600 text-white min-w-[100px]"
                            >
                                {saving ? <Loader2 className="animate-spin w-4 h-4" /> : 'Save'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
