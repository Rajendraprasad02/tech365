import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFormMetadata, resetBuilder, saveForm, publishForm } from '@/store/slices/formBuilderSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import FieldPalette from './builder/FieldPalette';
import FormCanvas from './builder/FormCanvas';
import FieldConfigPanel from './builder/FieldConfigPanel';
import DynamicForm from '@/components/DynamicForm';
import { Save, Eye, RotateCcw } from 'lucide-react';

const FormBuilderPage = () => {
    const dispatch = useDispatch();
    const {
        title,
        description,
        screens,
        formId,
        saving,
        error,
        publishing,
        published,
        publishError
    } = useSelector(state => state.formBuilder);

    const [previewOpen, setPreviewOpen] = useState(false);

    const handleSave = () => {
        dispatch(saveForm());
    };

    const handleReset = () => {
        if (confirm('Are you sure you want to clear the form?')) {
            dispatch(resetBuilder());
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden">
            {/* Header Toolbar */}
            <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <span className="text-xl">🛠️</span>
                    </div>
                    <div className="flex flex-col gap-1 w-1/3">
                        <Input
                            value={title}
                            onChange={(e) => dispatch(setFormMetadata({ title: e.target.value }))}
                            className="h-8 font-semibold text-lg border-transparent hover:border-slate-200 px-2 -ml-2"
                            placeholder="Form Title"
                        />
                        <Input
                            value={description}
                            onChange={(e) => dispatch(setFormMetadata({ description: e.target.value }))}
                            className="h-6 text-sm text-slate-500 border-transparent hover:border-slate-200 px-2 -ml-2"
                            placeholder="Description"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleReset} className="text-slate-500 hover:text-red-500">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                    </Button>

                    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                Preview
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border-slate-200 shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-center font-normal text-slate-800">
                                    Preview Flow
                                </DialogTitle>
                                <DialogDescription className="text-center text-xs text-slate-400">
                                    Simulating WhatsApp User Experience
                                </DialogDescription>
                            </DialogHeader>
                            <div className="p-0 bg-slate-50 min-h-[500px] flex flex-col relative">
                                {/* WhatsApp-like Header simulation */}
                                <div className="bg-[#075E54] h-12 flex items-center px-4 shrink-0">
                                    <div className="w-6 h-6 rounded-full bg-slate-200/20 mr-3"></div>
                                    <div className="text-white text-sm font-medium">WhatsApp Business</div>
                                </div>

                                <div className="p-4 flex-1 overflow-y-auto bg-[#e5ddd5]">
                                    <div className="bg-white rounded-lg shadow-sm p-1">
                                        <DynamicForm
                                            schema={{
                                                title,
                                                description,
                                                screens // Pass structure for Wizard Mode
                                            }}
                                            onCancel={() => setPreviewOpen(false)}
                                            isPreview={true}
                                        />
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900">
                                <code className="text-xs mr-2">{'{}'}</code>
                                Schema
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Form Schema</DialogTitle>
                                <DialogDescription>
                                    Current JSON configuration for this form.
                                </DialogDescription>
                            </DialogHeader>
                            <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg text-xs font-mono overflow-auto">
                                {JSON.stringify({
                                    title,
                                    description,
                                    screens
                                }, null, 2)}
                            </pre>
                        </DialogContent>
                    </Dialog>

                    <Button size="sm" onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                        {saving ? (
                            <>
                                <span className="animate-spin mr-2">⏳</span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Form
                            </>
                        )}
                    </Button>

                    <div className="h-6 w-px bg-slate-300 mx-2"></div>

                    <Button
                        size="sm"
                        onClick={() => dispatch(publishForm())}
                        disabled={!formId || saving || publishing}
                        className={`${published ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white min-w-[140px]`}
                    >
                        {publishing ? (
                            <>
                                <span className="animate-spin mr-2">⏳</span>
                                Publishing...
                            </>
                        ) : published ? (
                            <>
                                <span>✅ Published</span>
                            </>
                        ) : (
                            <>
                                <span>🚀 Publish to WhatsApp</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Error / Success Messages */}
            {(error || publishError || published) && (
                <div className={`px-6 py-2 text-sm font-medium flex items-center justify-between ${publishError || error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                    }`}>
                    <span>
                        {error && `Error saving: ${typeof error === 'object' ? JSON.stringify(error) : error}`}
                        {publishError && `Error publishing: ${typeof publishError === 'object' ? JSON.stringify(publishError) : publishError}`}
                        {published && !publishError && "Successfully published to WhatsApp!"}
                    </span>
                </div>
            )}


            {/* Builder Layout */}
            <div className="flex flex-1 overflow-hidden">
                <FieldPalette />
                <FormCanvas />
                <FieldConfigPanel />
            </div>
        </div>
    );
};

export default FormBuilderPage;
