import React, { useState, useEffect } from 'react';
import {
    Plus, Search, FileText, MoreVertical,
    Filter, ArrowUpDown, Calendar, ChevronRight,
    Eye, Edit, Trash2, Send, Code
} from 'lucide-react';
import CustomSelect from '../contacts/CustomSelect';
import { useNavigate } from 'react-router-dom';
import { getForms } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';

export default function FormsPage() {
    const navigate = useNavigate();
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        fetchForms();
    }, []);

    const fetchForms = async () => {
        setLoading(true);
        try {
            const data = await getForms();
            setForms(data || []);
        } catch (error) {
            console.error('Error fetching forms:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredForms = forms
        .filter(form => {
            const matchesSearch = form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (form.description && form.description.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
            if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return 0;
        });

    if (loading) {
        return (
            <div className="loader-wrapper bg-gray-50/50">
                <span className="loader mb-4"></span>
                <p className="mt-4 text-sm font-bold text-gray-500 uppercase tracking-widest animate-pulse">Syncing form builder...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Forms Management</h1>
                    <p className="text-gray-500 mt-1">Create and manage interactive WhatsApp forms</p>
                </div>
                <Button
                    onClick={() => navigate('/forms/builder')}
                    className="bg-[#14137F] hover:bg-[#14137F]/90 text-white px-6 h-11 rounded-xl shadow-lg shadow-blue-900/10 flex items-center gap-2"
                >
                    <Plus size={20} />
                    Create New Form
                </Button>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        placeholder="Search forms by name or description..."
                        className="pl-10 h-11 bg-gray-50 border-transparent focus:bg-white transition-all rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <CustomSelect
                        value={statusFilter}
                        onChange={(val) => setStatusFilter(val)}
                        className="h-11 px-4 min-w-[140px] border-transparent bg-gray-50 rounded-xl"
                        options={[
                            { value: 'all', label: 'All Status' },
                            { value: 'published', label: 'Published' },
                            { value: 'draft', label: 'Drafts' },
                        ]}
                    />
                    <CustomSelect
                        value={sortBy}
                        onChange={(val) => setSortBy(val)}
                        className="h-11 px-4 min-w-[150px] border-transparent bg-gray-50 rounded-xl"
                        options={[
                            { value: 'newest', label: 'Newest First' },
                            { value: 'oldest', label: 'Oldest First' },
                            { value: 'name', label: 'Alphabetical' },
                        ]}
                    />
                </div>
            </div>

            {/* Content Section */}
            {filteredForms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredForms.map((form) => (
                        <div
                            key={form.id}
                            className="group bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 relative overflow-hidden"
                        >
                            {/* Status Indicator */}
                            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 flex items-end justify-center rotate-45 ${form.status === 'published' ? 'bg-emerald-50' : 'bg-amber-50'
                                }`}>
                                <div className={`text-[10px] font-bold uppercase tracking-widest pb-1 ${form.status === 'published' ? 'text-emerald-600' : 'text-amber-600'
                                    }`}>
                                    {form.status}
                                </div>
                            </div>

                            <div className="flex flex-col h-full">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                        <FileText size={24} />
                                    </div>
                                    <Badge variant="outline" className="bg-gray-50 border-none text-gray-500 font-medium">
                                        v{form.version || '1.0'}
                                    </Badge>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {form.name}
                                    </h3>
                                    <p className="text-gray-500 text-sm mt-2 line-clamp-2 leading-relaxed">
                                        {form.description || 'No description provided for this form.'}
                                    </p>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200">
                                                {form.schema_body?.screens?.length || 0} Screens
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {new Date(form.created_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-9 w-9 p-0 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                                            onClick={() => navigate(`/forms/builder?id=${form.id}`)}
                                            title="Edit Flow"
                                        >
                                            <Edit size={16} />
                                        </Button>

                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 w-9 p-0 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all text-gray-400"
                                                    title="View JSON Schema"
                                                >
                                                    <Code size={16} />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                                                <DialogHeader className="p-8 pb-2">
                                                    <DialogTitle className="text-xl font-black text-[#14137F] flex items-center gap-2">
                                                        <Code className="text-blue-500" />
                                                        {form.name} Schema
                                                    </DialogTitle>
                                                </DialogHeader>
                                                <div className="px-8 pb-8">
                                                    <div className="bg-gray-900 rounded-2xl p-6 mt-4">
                                                        <pre className="text-[10px] text-emerald-400 font-mono max-h-[400px] overflow-y-auto custom-scrollbar leading-relaxed">
                                                            {JSON.stringify(form.schema_body || form.schema, null, 2)}
                                                        </pre>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-9 w-9 p-0 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                                            title="External Preview"
                                        >
                                            <Eye size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border-2 border-dashed border-gray-100 p-20 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-6">
                        <FileText size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No forms found</h3>
                    <p className="text-gray-500 mt-2 max-w-sm">
                        {searchQuery ? `We couldn't find any forms matching "${searchQuery}"` : 'Get started by creating your first interactive WhatsApp form.'}
                    </p>
                    <Button
                        variant="link"
                        onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                        className="text-blue-600 mt-4"
                    >
                        Clear all filters
                    </Button>
                </div>
            )}
        </div>
    );
}
