import React, { useState, useEffect } from 'react';
import DynamicForm from '@/components/DynamicForm';
import { Button } from '@/components/ui/button';
import { useDispatch } from 'react-redux';
import { resetForm } from '@/store/slices/formSlice';
import api from '@/services/api';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const FormsPage = () => {
    const [useSample, setUseSample] = useState(true); // Toggle between Form and JSON view
    const [schema, setSchema] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const dispatch = useDispatch();

    useEffect(() => {
        fetchFormSchema();
    }, []);

    const fetchFormSchema = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch Form 101
            const data = await api.getFormSchema(101);
            setSchema(data);
        } catch (err) {
            console.error("Failed to fetch form schema:", err);
            setError("Failed to load form. Please ensure the backend is running and Form 101 is seeded.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSchema = () => {
        dispatch(resetForm());
        setUseSample(!useSample);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (error || !schema) {
        return (
            <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
                <Alert variant="destructive" className="max-w-md bg-white shadow-lg">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription className="mt-2">
                        {error || "Form not found."}
                        <div className="mt-4">
                            <Button onClick={fetchFormSchema} variant="outline" size="sm">
                                Retry
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 md:py-12">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Form Engine Demo</h1>
                        <p className="text-slate-500 mt-2">Testing the dynamic WhatsApp-style form implementation</p>
                    </div>
                    <Button variant="outline" onClick={handleToggleSchema}>
                        {useSample ? 'Schema View' : 'Form View'}
                    </Button>
                </div>

                {useSample ? (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                        <div className="p-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                        <div className="p-0 border-b border-slate-100 flex items-center justify-between px-6 py-4 bg-slate-50/50">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">W</div>
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-900 leading-none">WhatsApp Bot</h2>
                                    <span className="text-[10px] text-emerald-600 font-medium">Online</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 md:p-8">
                            <DynamicForm schema={schema} />
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-900 rounded-2xl p-6 overflow-auto max-h-[600px] shadow-2xl">
                        <pre className="text-emerald-400 text-sm font-mono leading-relaxed">
                            {JSON.stringify(schema, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormsPage;

