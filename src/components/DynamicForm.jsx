import React, { useState, useMemo } from 'react';
import FormField from './FormField';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Send, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DynamicForm({ schema, initialValues = {}, onSubmit, onCancel, isPreview = false }) {
    const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
    const [responses, setResponses] = useState(() => {
        // Merge initial values with default values from schema if any
        const initial = { ...initialValues };

        // Auto-detect phone fields if they are missing in initialValues
        if (schema?.screens) {
            schema.screens.forEach(screen => {
                screen.fields.forEach(field => {
                    if (!initial[field.id]) {
                        // If it's a phone field and we have a phone in initialValues (aliased as 'phone' or 'wa_id')
                        if (field.type === 'phone' || field.id.toLowerCase().includes('phone')) {
                            const phoneVal = initialValues.phone || initialValues.wa_id || initialValues.phoneNumber;
                            if (phoneVal) initial[field.id] = phoneVal;
                        }
                    }
                });
            });
        }
        return initial;
    });
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const screens = schema?.screens || [];
    const currentScreen = screens[currentScreenIndex];

    // Create a flat map of all fields for easier lookup during logic evaluation
    const allFieldsMap = useMemo(() => {
        const map = {};
        screens.forEach(s => s.fields.forEach(f => { map[f.id] = f; }));
        return map;
    }, [screens]);

    // Recursive logic evaluation
    const isFieldVisible = (field, currentResponses, visited = new Set()) => {
        if (visited.has(field.id)) return true; // Avoid infinite loops
        const newVisited = new Set(visited);
        newVisited.add(field.id);

        const logic = field.conditional_logic;
        if (!logic || !logic.conditions || logic.conditions.length === 0) return true;

        const matchType = logic.matchType || 'all';
        const method = matchType === 'any' ? 'some' : 'every';

        return logic.conditions[method](condition => {
            const depField = allFieldsMap[condition.field_id];
            if (!depField) return true;

            // Dependency must also be visible
            if (!isFieldVisible(depField, currentResponses, newVisited)) return false;

            const val = currentResponses[condition.field_id];
            const target = condition.value;

            switch (condition.operator) {
                case 'equals': return String(val) === String(target);
                case 'not_equals': return String(val) !== String(target);
                case 'contains': return String(val).includes(String(target));
                case 'greater_than': return Number(val) > Number(target);
                case 'less_than': return Number(val) < Number(target);
                case 'not_empty': return !!val;
                default: return true;
            }
        });
    };

    const handleFieldChange = (fieldId, value) => {
        setResponses(prev => ({ ...prev, [fieldId]: value }));
        if (errors[fieldId]) {
            const newErrors = { ...errors };
            delete newErrors[fieldId];
            setErrors(newErrors);
        }
    };

    const validateScreen = () => {
        const newErrors = {};
        currentScreen.fields.forEach(field => {
            if (isFieldVisible(field, responses)) {
                if (field.validation_rules?.required && !responses[field.id]) {
                    newErrors[field.id] = field.validation_rules?.error_message || 'This field is required';
                }
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateScreen()) {
            if (currentScreenIndex < screens.length - 1) {
                setCurrentScreenIndex(prev => prev + 1);
            } else {
                handleSubmit();
            }
        }
    };

    const handleSubmit = async () => {
        if (isPreview) {
            setSubmitted(true);
            return;
        }
        if (onSubmit) onSubmit(responses);
    };

    if (submitted) {
        return (
            <div className="p-12 text-center flex flex-col items-center justify-center animate-fade-in">
                <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-6 shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 leading-tight">Response Sent!</h3>
                <p className="text-gray-500 mt-2 text-sm max-w-xs">
                    Thank you for your response. Your data has been recorded successfully.
                </p>
                <Button
                    variant="outline"
                    onClick={() => { setSubmitted(false); setResponses({}); setCurrentScreenIndex(0); }}
                    className="mt-8 rounded-2xl px-8 h-12 font-bold uppercase tracking-widest text-xs border-gray-100"
                >
                    Submit Again
                </Button>
            </div>
        );
    }

    if (!currentScreen) return null;

    return (
        <div className="space-y-8 animate-fade-in px-2 py-4">
            <div className="space-y-1">
                <h2 className="text-xl font-black text-[#14137F] leading-tight">
                    {currentScreen.title || schema.title}
                </h2>
                <p className="text-gray-400 text-xs font-medium">
                    Step {currentScreenIndex + 1} of {screens.length}
                </p>
            </div>

            <div className="space-y-6">
                {currentScreen.fields.map(field => {
                    if (!isFieldVisible(field, responses)) return null;
                    return (
                        <FormField
                            key={field.id}
                            field={field}
                            value={responses[field.id]}
                            onChange={(val) => handleFieldChange(field.id, val)}
                            error={errors[field.id]}
                        />
                    );
                })}
            </div>

            <div className="pt-8 flex flex-col gap-3">
                <Button
                    onClick={handleNext}
                    className="w-full bg-[#14137F] hover:bg-[#14137F]/90 text-white h-14 rounded-2xl shadow-xl shadow-blue-900/10 font-bold uppercase tracking-widest text-xs group"
                >
                    {currentScreenIndex < screens.length - 1 ? (
                        <>
                            Next Step
                            <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    ) : (
                        <>
                            Complete Submission
                            <Send size={16} className="ml-2" />
                        </>
                    )}
                </Button>

                {currentScreenIndex > 0 && (
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentScreenIndex(prev => prev - 1)}
                        className="w-full h-12 rounded-2xl text-gray-400 font-bold uppercase tracking-widest text-[10px] hover:bg-gray-50"
                    >
                        <ChevronLeft size={14} className="mr-2" />
                        Previous Step
                    </Button>
                )}

                {onCancel && (
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        className="w-full h-10 text-gray-300 font-bold uppercase tracking-widest text-[9px] hover:text-red-400"
                    >
                        Dismiss
                    </Button>
                )}
            </div>
        </div>
    );
}
