import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    updateResponse,
    setErrors,
    submitFormResponse,
    resetForm
} from '../store/slices/formSlice';
import FormField from './FormField';
import { Button } from './ui/button';

/**
 * Evaluate field visibility based on conditional logic
 * This is a PURE FUNCTION - no hooks, no memoization
 * Called INLINE during render to ensure reactivity
 */
/**
 * Evaluate field visibility based on conditional logic
 * This is a PURE FUNCTION - no hooks, no memoization
 * Called INLINE during render to ensure reactivity
 * RECURSIVE: Checks if dependent fields are themselves visible
 */
const evaluateFieldVisibility = (field, responses, allFieldsMap = {}, visited = new Set()) => {
    // 1. Cycle Detection
    if (visited.has(field.id)) {
        // Break cycle: Assume visible (or hidden? safe choice is visible to avoid stuck UI)
        return true;
    }
    const newVisited = new Set(visited);
    newVisited.add(field.id);

    const logic = field.conditional_logic || {};
    const conditions = logic.conditions || field.conditions;

    // No conditions = always visible
    if (!conditions || conditions.length === 0) {
        return true;
    }

    // Check if conditions are met based on matchType (all/any)
    const matchType = logic.matchType || 'all'; // Default to AND
    const method = matchType === 'any' ? 'some' : 'every';

    const conditionsMet = conditions[method](condition => {
        const dependentFieldId = condition.field_id || condition.field;

        // 2. RECURSIVE CHECK: Is the dependent field itself visible?
        // If dependent field is hidden, its value is "invalid"/"stale", so condition should fail.
        if (allFieldsMap && allFieldsMap[dependentFieldId]) {
            const isDependentVisible = evaluateFieldVisibility(allFieldsMap[dependentFieldId], responses, allFieldsMap, newVisited);
            if (!isDependentVisible) {
                return false;
            }
        }

        const currentValue = responses[dependentFieldId];
        const targetValue = condition.value;

        let result = false;
        switch (condition.operator) {
            case 'equals':
                result = currentValue == targetValue; // Loose equality
                break;
            case 'not_equals':
                result = currentValue != targetValue;
                break;
            case 'contains':
                result = Array.isArray(currentValue) && currentValue.includes(targetValue);
                break;
            case 'in':
                result = Array.isArray(targetValue) && targetValue.includes(currentValue);
                break;
            case 'greater_than':
                result = Number(currentValue) > Number(targetValue);
                break;
            case 'less_than':
                result = Number(currentValue) < Number(targetValue);
                break;
            case 'not_empty':
                result = currentValue !== undefined && currentValue !== null && currentValue !== '';
                break;
            default:
                result = false;
        }
        return result;
    });

    // Handle "show" vs "hide" action
    const isVisible = logic.action === 'hide' ? !conditionsMet : conditionsMet;

    return isVisible;
};

/**
 * DynamicForm - Schema-driven form component with conditional visibility
 */
const DynamicForm = ({ schema, onCancel, isPreview = false }) => {
    const dispatch = useDispatch();
    const reduxForm = useSelector((state) => state.form);
    const { user } = useSelector((state) => state.auth);

    // LOCAL STATE for preview mode - ensures proper reactivity
    const [localResponses, setLocalResponses] = useState({});
    const [localErrors, setLocalErrors] = useState({});
    const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
    const [previewComplete, setPreviewComplete] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Use local state for preview, Redux for production
    const responses = isPreview ? localResponses : reduxForm.responses;
    const errors = isPreview ? localErrors : reduxForm.errors;
    const submitSuccess = isPreview ? false : reduxForm.submitSuccess;
    const isSubmitting = isPreview ? submitting : reduxForm.submitting;

    // Screens support (Wizard Mode)
    const screens = useMemo(() => {
        return schema?.screens || (schema?.fields ? [{ id: 'default', title: schema.title, fields: schema.fields }] : []);
    }, [schema]);

    const currentScreen = screens[currentScreenIndex];

    // Map of all fields for O(1) access during recursive checks
    const allFieldsMap = useMemo(() => {
        const map = {};
        if (schema?.fields) {
            schema.fields.forEach(f => map[f.id] = f);
        }
        if (schema?.screens) {
            schema.screens.forEach(s => {
                s.fields.forEach(f => map[f.id] = f);
            });
        }
        return map;
    }, [schema]);

    // Helper to check if there are any subsequent screens with visible fields
    const hasNextVisibleScreen = useMemo(() => {
        let nextIndex = currentScreenIndex + 1;
        while (nextIndex < screens.length) {
            const nextScreen = screens[nextIndex];
            // Check if any field in this screen is visible
            const hasVisibleFields = nextScreen.fields.some(field =>
                evaluateFieldVisibility(field, responses, allFieldsMap)
            );

            if (hasVisibleFields) {
                return true;
            }
            nextIndex++;
        }
        return false;
    }, [currentScreenIndex, screens, responses, allFieldsMap]);


    // "Last Screen" is getting complex. 
    // It is effectively the last screen IF there are no more visible screens ahead.
    const isLastScreen = !hasNextVisibleScreen;

    const isFirstScreen = currentScreenIndex === 0;

    // DEBUG: Render Cycle Tracing
    console.log('[DynamicForm Debug] RENDER CYCLE START');
    console.log('[DynamicForm Debug] Current Screen Index:', currentScreenIndex);
    console.log('[DynamicForm Debug] Total Screens:', screens.length);
    console.log('[DynamicForm Debug] Has Next Visible Screen?', hasNextVisibleScreen);
    console.log('[DynamicForm Debug] Is Effective Last Screen?', isLastScreen);
    console.log('[DynamicForm Debug] Current Responses:', responses);

    // Reset or Load local state when schema changes or preview opens
    useEffect(() => {
        if (isPreview) {
            const saved = localStorage.getItem(`preview_responses_${schema?.id}`);
            if (saved) {
                try {
                    setLocalResponses(JSON.parse(saved));
                } catch (e) {
                    console.error("Failed to parse saved preview responses", e);
                    setLocalResponses({});
                }
            } else {
                setLocalResponses({});
            }
            setLocalErrors({});
            setCurrentScreenIndex(0);
            setPreviewComplete(false);
        }
    }, [schema?.id, isPreview]);

    // Save responses to localStorage
    useEffect(() => {
        if (isPreview && schema?.id) {
            localStorage.setItem(`preview_responses_${schema?.id}`, JSON.stringify(localResponses));
        }
    }, [localResponses, isPreview, schema?.id]);

    // Cleanup on unmount - we typically DON'T want to clear LS here if we want persistence across re-opens
    // But we should clear Redux form state
    useEffect(() => {
        return () => dispatch(resetForm());
    }, [dispatch]);

    /**
     * Handle field value changes
     * Updates local or Redux state depending on mode
     */
    const handleFieldChange = (fieldName, value) => {
        console.log(`[DynamicForm Debug] handleFieldChange: ${fieldName} ->`, value); // DEBUG
        if (isPreview) {
            // LOCAL STATE update - triggers re-render immediately
            setLocalResponses(prev => {
                const next = { ...prev, [fieldName]: value };
                console.log('[DynamicForm Debug] New localResponses state:', next); // DEBUG
                return next;
            });
        } else {
            // Redux update for production
            dispatch(updateResponse({ fieldName, value }));
        }
    };

    /**
     * Validate current screen fields
     */
    const validateScreen = () => {
        console.log('[DynamicForm Debug] Validating screen:', currentScreenIndex); // DEBUG
        console.log('[DynamicForm Debug] localResponses for validation:', responses); // DEBUG

        // Specific check for the problematic field
        if (responses['radio_mlfu6dwa']) {
            console.log('[DynamicForm Debug] Critical Field radio_mlfu6dwa value:', responses['radio_mlfu6dwa']);
        }

        const newErrors = {};
        const fieldsToValidate = currentScreen?.fields || [];

        fieldsToValidate.forEach(field => {
            // Skip hidden fields from validation
            const isVisible = evaluateFieldVisibility(field, responses, allFieldsMap);
            if (!isVisible) {
                console.log(`[DynamicForm Debug] Field ${field.id} is HIDDEN, skipping validation.`); // DEBUG
                return;
            }

            const value = responses[field.id];
            const { required, validation, type, label } = field;

            console.log(`[DynamicForm Debug] Validating field ${field.id}:`, { value, required, type }); // DEBUG

            // Required check
            if (required && (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0))) {
                newErrors[field.id] = `${label} is required`;
                console.warn(`[DynamicForm Debug] Validation failed for ${field.id}: Required`); // DEBUG
                return;
            }

            // Skip further validation if empty and not required
            if (!value) return;

            // Regex validation
            if (validation?.regex) {
                const regex = new RegExp(validation.regex);
                if (!regex.test(value)) {
                    newErrors[field.id] = validation.errorMessage || `Invalid format for ${label}`;
                }
            }

            // Range validation
            if (type === 'number') {
                const numValue = Number(value);
                if (validation?.min !== undefined && numValue < validation.min) {
                    newErrors[field.id] = `${label} must be at least ${validation.min}`;
                }
                if (validation?.max !== undefined && numValue > validation.max) {
                    newErrors[field.id] = `${label} must be at most ${validation.max}`;
                }
            }
        });

        if (Object.keys(newErrors).length > 0) {
            console.error('[DynamicForm Debug] Validation errors found:', newErrors); // DEBUG
        } else {
            console.log('[DynamicForm Debug] Validation PASSED'); // DEBUG
        }

        if (isPreview) {
            setLocalErrors(newErrors);
        } else {
            dispatch(setErrors(newErrors));
        }

        return Object.keys(newErrors).length === 0;
    };

    const handleNext = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        console.log('[DynamicForm Debug] handleNext called'); // DEBUG

        if (validateScreen()) {
            let nextIndex = currentScreenIndex + 1;

            // Auto-skip empty screens
            while (nextIndex < screens.length) {
                const nextScreen = screens[nextIndex];
                const hasVisibleFields = nextScreen.fields.some(field =>
                    evaluateFieldVisibility(field, responses, allFieldsMap)
                );

                if (hasVisibleFields) {
                    console.log('[DynamicForm Debug] Found next screen with visible fields:', nextIndex); // DEBUG
                    break;
                }

                console.log(`[DynamicForm Debug] Screen ${nextIndex} has NO visible fields. Skipping...`); // DEBUG
                nextIndex++;
            }

            if (nextIndex < screens.length) {
                console.log('[DynamicForm Debug] Moving to next screen:', nextIndex); // DEBUG
                setCurrentScreenIndex(nextIndex);
            } else {
                // If no more screens with visible fields, treat as submit? 
                // For now, let's just go to the last screen or trigger submit
                console.log('[DynamicForm Debug] No more visible screens. Ready to submit?');
                // Optional: trigger submit if we are at the end
                // handleSubmit(e); 
            }
        } else {
            console.warn('[DynamicForm Debug] Stay on current screen due to validation errors'); // DEBUG
        }
    };

    const handleBack = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        let prevIndex = currentScreenIndex - 1;

        // Auto-skip empty screens backwards
        while (prevIndex >= 0) {
            const prevScreen = screens[prevIndex];
            const hasVisibleFields = prevScreen.fields.some(field =>
                evaluateFieldVisibility(field, responses, allFieldsMap)
            );

            if (hasVisibleFields) {
                console.log('[DynamicForm Debug] Found prev screen with visible fields:', prevIndex); // DEBUG
                break;
            }

            console.log(`[DynamicForm Debug] Screen ${prevIndex} has NO visible fields. Skipping backwards...`); // DEBUG
            prevIndex--;
        }

        if (prevIndex >= 0) {
            setCurrentScreenIndex(prevIndex);
        } else {
            console.log('[DynamicForm Debug] No more previous screens.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateScreen()) {
            // Collect only visible fields' responses (clean hidden field data)
            const visibleResponses = {};
            screens.forEach(s => {
                s.fields.forEach(field => {
                    if (evaluateFieldVisibility(field, responses, allFieldsMap)) {
                        visibleResponses[field.id] = responses[field.id];
                    }
                });
            });

            if (isPreview) {
                console.log('[Preview] Form data collected:', visibleResponses);
                setPreviewComplete(true);
                return;
            }

            const userId = user?.id || user?.phone || user?.email || 'anonymous_user';
            dispatch(submitFormResponse({
                formId: Number(schema.id),
                data: {
                    user_id: String(userId),
                    responses: visibleResponses
                }
            }));
        }
    };

    const handleReset = () => {
        if (isPreview) {
            setLocalResponses({});
            setLocalErrors({});
            setCurrentScreenIndex(0);
            setPreviewComplete(false);
            // Also clear localStorage
            if (schema?.id) {
                localStorage.removeItem(`preview_responses_${schema?.id}`);
            }
        } else {
            dispatch(resetForm());
        }
    };

    // No schema provided
    if (!schema) {
        return <div className="p-4 text-center">No form schema provided</div>;
    }

    // Preview completion display
    if (previewComplete) {
        return (
            <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-slate-100 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Preview Complete!</h2>
                <p className="text-slate-600 mb-4">Form data collected successfully. Check browser console for details.</p>
                <div className="flex gap-2 justify-center">
                    <Button onClick={handleReset} variant="secondary">
                        Test Again
                    </Button>
                    <Button onClick={onCancel} variant="outline">
                        Close Preview
                    </Button>
                </div>
            </div>
        );
    }

    // Submit success display (production mode)
    if (submitSuccess) {
        return (
            <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-slate-100 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Form Submitted!</h2>
                <p className="text-slate-600 mb-6">Your responses have been recorded successfully.</p>
                <Button onClick={handleReset} variant="secondary">
                    Fill Again
                </Button>
            </div>
        );
    }

    // CRITICAL: Evaluate visibility INLINE during render - NO memoization!
    const visibleFields = (currentScreen?.fields || []).filter(field =>
        evaluateFieldVisibility(field, responses, allFieldsMap)
    );

    console.log('[DynamicForm Debug] Visible Fields:', visibleFields.map(f => f.id)); // DEBUG

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto p-4 md:p-6 bg-white md:rounded-2xl md:shadow-md md:border md:border-slate-100">
            {/* Form Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">{schema.title}</h1>
                {schema.description && (
                    <p className="text-slate-500 mt-1">{schema.description}</p>
                )}

                {/* Progress Stepper - Visible if multiple screens OR in Preview Mode to show structure */}
                {(screens.length > 1 || isPreview) && (
                    <div className="mt-6 mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-500">
                                Step {currentScreenIndex + 1} of {screens.length}
                            </span>
                            <span className="text-xs font-medium text-slate-900">
                                {Math.round(((currentScreenIndex + 1) / screens.length) * 100)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-emerald-500 h-2 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${((currentScreenIndex + 1) / screens.length) * 100}%` }}
                            />
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-700 flex items-center justify-between">
                            <span>{currentScreen?.title || `Screen ${currentScreenIndex + 1}`}</span>
                            {isPreview && (
                                <span className="text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                                    Preview Mode
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Form Fields - FILTERED BY VISIBILITY */}
            <div className="space-y-4">
                {visibleFields.map((field) => {
                    console.log(`[DynamicForm Debug] Rendering Field Component: ${field.id}`); // DEBUG
                    return (
                        <FormField
                            key={field.id}
                            field={field}
                            value={responses[field.id]}
                            onChange={handleFieldChange}
                            error={errors[field.id]}
                            disabled={isSubmitting}
                        />
                    );
                })}

                {visibleFields.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                        No fields to display on this screen.
                        {currentScreen?.fields?.length > 0 && (
                            <p className="text-sm mt-2">
                                Some fields may appear after you make selections.
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
                {!isFirstScreen && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        disabled={isSubmitting}
                        className="h-11"
                    >
                        Back
                    </Button>
                )}

                {isLastScreen ? (
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold h-11"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Response'}
                    </Button>
                ) : (
                    <Button
                        type="button"
                        onClick={handleNext}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold h-11"
                    >
                        Next
                    </Button>
                )}

                {onCancel && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="h-11 ml-auto"
                    >
                        Cancel
                    </Button>
                )}
            </div>

            {/* Debug Panel (Preview Mode Only) */}
            {isPreview && (
                <div className="mt-8 border-t border-slate-200 pt-4">
                    <details className="text-xs text-slate-500">
                        <summary className="cursor-pointer hover:text-slate-800 font-medium mb-2">
                            Debug Info ({currentScreen?.fields?.length} fields on this screen)
                        </summary>
                        <div className="bg-slate-50 p-2 rounded border border-slate-200 space-y-2 font-mono overflow-x-auto">
                            <div>
                                <span className="font-bold">Current Screen:</span> {currentScreenIndex + 1} / {screens.length} ({currentScreen?.id})
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {screens.map((s, idx) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => setCurrentScreenIndex(idx)}
                                            className={`px-2 py-1 text-[10px] rounded border transition-colors ${currentScreenIndex === idx ? 'bg-blue-100 border-blue-300 font-bold text-blue-700' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                                        >
                                            Go to Screen {idx + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <span className="font-bold">Fields:</span>
                                <ul className="list-disc list-inside pl-2">
                                    {currentScreen?.fields?.map(f => {
                                        const isVisible = evaluateFieldVisibility(f, responses, allFieldsMap);
                                        return (
                                            <li key={f.id} className={isVisible ? "text-emerald-600" : "text-amber-600"}>
                                                <div className="font-semibold">{f.id} ({f.type}) - {isVisible ? "VISIBLE" : "HIDDEN"}</div>
                                                {f.conditional_logic?.conditions?.length > 0 && (
                                                    <div className="ml-4 text-[10px] text-slate-500 font-mono">
                                                        {f.conditional_logic.conditions.map((c, idx) => (
                                                            <div key={idx} className="flex gap-2">
                                                                <span>IF {c.field_id} {c.operator} "{c.value}"</span>
                                                                <span className={responses[c.field_id] === undefined ? "text-red-500 font-bold" : "text-purple-600"}>
                                                                    (Current: "{String(responses[c.field_id])}")
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <details className="mt-1 ml-4 cursor-pointer text-[10px] text-slate-400">
                                                    <summary>View Field Data (JSON)</summary>
                                                    <pre className="mt-1 p-1 bg-slate-100 rounded">{JSON.stringify(f, null, 2)}</pre>
                                                </details>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-bold">Current Raw Responses:</span>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="text-[10px] text-red-500 hover:underline"
                                >
                                    Clear Data
                                </button>
                            </div>
                            <pre className="mt-1">{JSON.stringify(responses, null, 2)}</pre>

                        </div>
                    </details>
                </div>
            )}
        </form>
    );
};

export default DynamicForm;
