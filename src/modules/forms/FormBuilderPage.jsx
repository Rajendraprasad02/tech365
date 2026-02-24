import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    setFormMetadata, resetBuilder, saveForm,
    publishForm, setBuilderFromSchema, loadDraft
} from '@/store/slices/formBuilderSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog, DialogContent, DialogDescription,
    DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import FieldPalette from './builder/FieldPalette';
import FormCanvas from './builder/FormCanvas';
import FieldConfigPanel from './builder/FieldConfigPanel';
import DynamicForm from '@/components/DynamicForm';
import { getFormById } from '@/services/api';
import {
    Save, RotateCcw, ArrowLeft, Sparkles,
    Smartphone, Code, CheckCircle2, AlertCircle,
    Zap, Terminal
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const FormBuilderPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const formIdParam = searchParams.get('id');

    const {
        title, description, screens, formId,
        saving, error, publishing, published, publishError
    } = useSelector(state => state.formBuilder);
    const { user } = useSelector(state => state.auth);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Initial Load: From Server (if ID) or Local Storage (if draft)
    useEffect(() => {
        if (formIdParam) {
            loadForm(formIdParam);
        } else {
            const savedDraft = localStorage.getItem('formBuilder_draft');
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    // Only load if it's a fresh session (formId is null in draft)
                    if (!parsed.formId) {
                        dispatch(loadDraft(parsed));
                    }
                } catch (e) {
                    console.warn("Failed to parse draft", e);
                }
            } else {
                dispatch(resetBuilder());
            }
        }
    }, [formIdParam]);

    // Persistence: Save to localStorage ONLY if we are in "Create" mode (no formIdParam)
    // This prevents accidental overwrites if a server load fails
    useEffect(() => {
        if (!formIdParam && screens.length > 0) {
            const draft = { title, description, screens };
            localStorage.setItem('formBuilder_draft', JSON.stringify(draft));
        }
    }, [title, description, screens, formIdParam]);

    const loadForm = async (id) => {
        setLoading(true);
        try {
            const form = await getFormById(id);
            dispatch(setBuilderFromSchema(form));
        } catch (err) {
            console.error('Error loading form:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        const result = await dispatch(saveForm());
        if (saveForm.fulfilled.match(result) && !formIdParam) {
            navigate(`/forms/builder?id=${result.payload.id}`, { replace: true });
        }
    };

    const generateMetaFlowJSON = () => {
        const sanitizeFieldName = (id) => id.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();

        const metaScreens = screens.map((screen, sIdx) => {
            // Meta strictly requires Screen IDs to contain ONLY alphabets and underscores
            // Numbers are often rejected in the routing_model keys
            const screenId = 'screen_' + (screen.title.toLowerCase().replace(/[^a-z]/g, '') || `step_${sIdx}`);

            const children = screen.fields.map(field => {
                const base = {
                    name: sanitizeFieldName(field.id),
                    label: field.label?.trim() || "Information", // Meta requires non-empty labels
                    required: field.validation_rules?.required || false,
                };

                // Map types
                if (field.type === 'select') {
                    return { ...base, type: 'Dropdown', 'data-source': field.options?.map(o => ({ id: sanitizeFieldName(o.value || o.label || 'opt'), title: o.label || "Option" })) };
                } else if (field.type === 'radio' || field.type === 'yes_no') {
                    return { ...base, type: 'RadioButtonsGroup', 'data-source': field.options?.map(o => ({ id: sanitizeFieldName(o.value || o.label || 'opt'), title: o.label || "Option" })) };
                } else if (field.type === 'checkbox') {
                    return { ...base, type: 'CheckboxGroup', 'data-source': field.options?.map(o => ({ id: sanitizeFieldName(o.value || o.label || 'opt'), title: o.label || "Option" })) };
                } else {
                    // TextInput variants
                    let inputType = 'text';
                    if (field.type === 'number') inputType = 'number';
                    if (field.type === 'email') inputType = 'email';
                    if (field.type === 'phone') inputType = 'phone';

                    return { ...base, type: 'TextInput', 'input-type': inputType };
                }
            });

            // Add Footer
            const payload = {};
            screen.fields.forEach(f => {
                const safeName = sanitizeFieldName(f.id);
                payload[safeName] = `\${form.${safeName}}`;
            });

            children.push({
                type: 'Footer',
                label: sIdx === screens.length - 1 ? 'Submit' : 'Continue',
                'on-click-action': {
                    name: 'data_exchange',
                    payload
                }
            });

            return {
                id: screenId,
                title: screen.title || "Screen",
                data: {},
                terminal: sIdx === screens.length - 1,
                layout: {
                    type: 'SingleColumnLayout',
                    children
                }
            };
        });

        // Generate Routing Model (Linear with sanitized IDs)
        const routing_model = {};
        metaScreens.forEach((mScreen, i) => {
            routing_model[mScreen.id] = i < metaScreens.length - 1 ? [metaScreens[i + 1].id] : [];
        });

        return {
            version: "6.0",
            data_api_version: "3.0",
            routing_model,
            screens: metaScreens
        };
    };

    const handleReset = () => {
        if (confirm('Are you sure you want to clear the entire form?')) {
            dispatch(resetBuilder());
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white animate-bounce shadow-xl shadow-blue-500/20">
                    <Sparkles size={32} />
                </div>
                <p className="mt-6 text-gray-500 font-bold uppercase tracking-widest text-xs">Architecting Form...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-white overflow-hidden">
            {/* Ultra-Modern Header Toolbar */}
            <div className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between shrink-0 relative z-20 shadow-[0_1px_10px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-6 flex-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/forms')}
                        className="h-10 w-10 p-0 rounded-2xl hover:bg-gray-100/50 text-gray-400 group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </Button>

                    <div className="h-10 w-px bg-gray-100" />

                    <div className="flex flex-col gap-0.5 max-w-md w-full">
                        <Input
                            value={title}
                            onChange={(e) => dispatch(setFormMetadata({ title: e.target.value }))}
                            className="h-7 font-black text-lg border-none bg-transparent hover:bg-gray-50/50 px-1 -ml-1 focus:bg-white transition-all rounded-lg focus:ring-0 placeholder:text-gray-300"
                            placeholder="Awesome Form Title"
                        />
                        <Input
                            value={description}
                            onChange={(e) => dispatch(setFormMetadata({ description: e.target.value }))}
                            className="h-5 text-sm font-medium text-gray-400 border-none bg-transparent hover:bg-gray-50/50 px-1 -ml-1 focus:bg-white transition-all rounded-lg focus:ring-0 placeholder:text-gray-200"
                            placeholder="Add a catchy description..."
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-gray-50 p-1.5 rounded-2xl mr-4 border border-gray-100">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="h-8 px-4 text-gray-400 hover:text-red-500 hover:bg-white rounded-xl text-xs font-bold transition-all"
                        >
                            <RotateCcw className="w-3.5 h-3.5 mr-2" />
                            Reset
                        </Button>
                        <div className="w-px h-4 bg-gray-200 mx-1" />

                        {/* View Schema Dialog */}
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 px-4 text-gray-500 hover:text-blue-600 hover:bg-white rounded-xl text-xs font-bold transition-all">
                                    <Code className="w-3.5 h-3.5 mr-2" />
                                    Schema
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                                <DialogHeader className="p-6 pb-2">
                                    <DialogTitle className="text-xl font-black text-[#14137F]">Form Schema JSON</DialogTitle>
                                    <DialogDescription>Raw technical representation of your interactive flow</DialogDescription>
                                </DialogHeader>
                                <div className="p-6 bg-gray-900 m-6 rounded-2xl overflow-hidden">
                                    <pre className="text-[10px] text-emerald-400 font-mono max-h-[500px] overflow-y-auto custom-scrollbar leading-relaxed">
                                        {JSON.stringify({ title, description, screens }, null, 2)}
                                    </pre>
                                </div>
                                <div className="p-6 pt-0 flex justify-end">
                                    <Button
                                        onClick={() => {
                                            navigator.clipboard.writeText(JSON.stringify({ title, description, screens }, null, 2));
                                            alert('Schema copied to clipboard!');
                                        }}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl h-10 px-6 text-xs font-bold"
                                    >
                                        Copy Schema
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <div className="w-px h-4 bg-gray-200 mx-1" />

                        {/* Meta Flow JSON Dialog */}
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 px-4 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all">
                                    <Zap className="w-3.5 h-3.5 mr-2" />
                                    Meta Flow
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                                <DialogHeader className="p-6 pb-2">
                                    <DialogTitle className="text-xl font-black text-[#14137F] flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-emerald-500" />
                                        WhatsApp Flow JSON (Meta)
                                    </DialogTitle>
                                    <DialogDescription>Copy this JSON directly into your Meta Business Suite Flow Editor</DialogDescription>
                                </DialogHeader>
                                <div className="p-6 bg-gray-900 m-6 rounded-2xl overflow-hidden relative group">
                                    <pre className="text-[10px] text-emerald-400 font-mono max-h-[600px] overflow-y-auto custom-scrollbar leading-relaxed">
                                        {JSON.stringify(generateMetaFlowJSON(), null, 2)}
                                    </pre>
                                </div>
                                <div className="p-6 pt-0 flex justify-end gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const json = JSON.stringify(generateMetaFlowJSON(), null, 2);
                                            const blob = new Blob([json], { type: 'application/json' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `flow_${formId || 'draft'}.json`;
                                            a.click();
                                        }}
                                        className="rounded-xl h-10 px-6 text-xs font-bold border-gray-100"
                                    >
                                        Download .json
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            navigator.clipboard.writeText(JSON.stringify(generateMetaFlowJSON(), null, 2));
                                            alert('Meta Flow JSON copied to clipboard!');
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-6 text-xs font-bold shadow-lg shadow-emerald-500/20"
                                    >
                                        Copy to Clipboard
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <div className="w-px h-4 bg-gray-200 mx-1" />

                        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 px-4 text-gray-500 hover:text-blue-600 hover:bg-white rounded-xl text-xs font-bold transition-all">
                                    <Smartphone className="w-3.5 h-3.5 mr-2" />
                                    Preview
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[450px] p-0 overflow-hidden bg-transparent border-none shadow-none">
                                <DialogHeader className="sr-only">
                                    <DialogTitle>Form Preview</DialogTitle>
                                    <DialogDescription>Live preview of your WhatsApp interactive flow</DialogDescription>
                                </DialogHeader>
                                <div className="bg-[#1c1c1c] p-4 rounded-[48px] shadow-2xl relative border-[8px] border-[#333]">
                                    {/* iPhone Dynamic Island simulation */}
                                    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-3xl z-50 flex items-center justify-end px-3">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                                    </div>

                                    <div className="bg-white rounded-[32px] overflow-hidden flex flex-col h-[800px] relative">
                                        {/* Phone Header */}
                                        <div className="bg-[#075E54] px-6 pt-12 pb-4 flex items-center justify-between shrink-0">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                                                    <Smartphone size={20} />
                                                </div>
                                                <div>
                                                    <div className="text-white text-sm font-bold tracking-tight">Business Assistant</div>
                                                    <div className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Always Online</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* WhatsApp Chat Area */}
                                        <div className="flex-1 overflow-y-auto bg-[#e5ddd5] p-5 custom-scrollbar">
                                            <div className="space-y-4">
                                                <div className="bg-white p-2 rounded-2xl rounded-tl-none shadow-sm max-w-[90%] animate-fade-in">
                                                    <DynamicForm
                                                        schema={{ title, description, screens }}
                                                        initialValues={{
                                                            phone: user?.phone_number || user?.phone || "+919876543210",
                                                            wa_id: user?.phone_number || user?.phone || "+919876543210"
                                                        }}
                                                        onCancel={() => setPreviewOpen(false)}
                                                        isPreview={true}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-[#14137F] hover:bg-[#14137F]/90 text-white h-11 px-8 rounded-2xl shadow-lg shadow-blue-900/10 text-xs font-bold uppercase tracking-widest transition-all"
                    >
                        {saving ? "Processing Flow..." : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Flow
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Notification Bar */}
            {(error || publishError || published) && (
                <div className={`px-8 py-2 text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 transition-all animate-fade-in ${publishError || error ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                    <div className={cn("h-2 w-2 rounded-full animate-pulse", publishError || error ? "bg-red-500" : "bg-emerald-500")} />
                    <span>
                        {error && `Synchronization Error: ${typeof error === 'object' ? 'Validation Failed' : error}`}
                        {publishError && `Launch Error: ${typeof publishError === 'object' ? 'Endpoint Unavailable' : publishError}`}
                        {published && !publishError && "Form successfully live on WhatsApp Network"}
                    </span>
                </div>
            )}

            {/* Builder Main Interface */}
            <div className="flex flex-1 overflow-hidden">
                <FieldPalette />
                <div className="flex-1 h-full shadow-inner bg-gray-50/20">
                    <FormCanvas />
                </div>
                <FieldConfigPanel />
            </div>
        </div>
    );
};

export default FormBuilderPage;
