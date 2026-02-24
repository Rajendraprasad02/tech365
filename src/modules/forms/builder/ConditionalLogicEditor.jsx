import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectAllFields } from '@/store/selectors/formSelectors';

const OPERATORS = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'not_empty', label: 'Is Not Empty' },
];

/**
 * ConditionalLogicEditor - Configures visibility rules for a field
 * 
 * IMPORTANT: When the dependent field has options (select, radio, checkbox),
 * we show a dropdown of ACTUAL VALUES (not labels) to ensure the condition
 * matches what's stored in form responses.
 */
const ConditionalLogicEditor = ({ fieldId, value, onChange }) => {
    // Use memoized selector to get all fields - returns stable reference
    const allFields = useSelector(selectAllFields);

    // Filter out self to avoid cycles - memoized locally
    const availableFields = useMemo(() =>
        (allFields || []).filter(f => f.id !== fieldId),
        [allFields, fieldId]
    );

    const logic = value || { action: 'show', conditions: [] };

    const updateLogic = (newLogic) => {
        onChange(newLogic);
    };

    const addCondition = () => {
        const newConditions = [
            ...(logic.conditions || []),
            { field_id: '', operator: 'equals', value: '' }
        ];
        updateLogic({ ...logic, conditions: newConditions });
    };

    const removeCondition = (index) => {
        const newConditions = [...(logic.conditions || [])];
        newConditions.splice(index, 1);
        updateLogic({ ...logic, conditions: newConditions });
    };

    const updateCondition = (index, key, val) => {
        const newConditions = [...(logic.conditions || [])];
        newConditions[index] = { ...newConditions[index], [key]: val };

        // If field_id changed, clear the value since options may be different
        if (key === 'field_id') {
            newConditions[index].value = '';
        }

        updateLogic({ ...logic, conditions: newConditions });
    };

    /**
     * Get the options for a field if it has any
     * Used to show a dropdown of valid values instead of free text
     */
    const getFieldOptions = (fieldId) => {
        const field = availableFields.find(f => f.id === fieldId);
        if (!field) return null;

        // Check if field has options (select, radio, checkbox)
        if (field.options && Array.isArray(field.options) && field.options.length > 0) {
            return field.options.map(opt =>
                typeof opt === 'string'
                    ? { label: opt, value: opt }
                    : opt
            );
        }
        return null;
    };

    /**
     * Render the value input - either a dropdown (if field has options) or text input
     */
    const renderValueInput = (condition, index) => {
        const fieldOptions = getFieldOptions(condition.field_id);

        // If the operator doesn't need a value, show nothing
        if (condition.operator === 'not_empty') {
            return (
                <div className="h-8 flex items-center text-xs text-slate-400 italic">
                    (no value needed)
                </div>
            );
        }

        // If the field has options, show a dropdown
        if (fieldOptions) {
            return (
                <Select
                    value={condition.value}
                    onValueChange={(val) => updateCondition(index, 'value', val)}
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select Value" />
                    </SelectTrigger>
                    <SelectContent>
                        {fieldOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label} ({opt.value})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }

        // Otherwise, show a text input
        return (
            <Input
                value={condition.value}
                onChange={(e) => updateCondition(index, 'value', e.target.value)}
                placeholder="Value"
                className="h-8 text-xs"
            />
        );
    };

    return (
        <div className="space-y-4 border rounded-md p-3 bg-slate-50">
            <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase text-slate-500">Visibility Rules</Label>
                <Button variant="ghost" size="sm" onClick={addCondition} className="h-6 text-xs">
                    <Plus className="w-3 h-3 mr-1" /> Add Rule
                </Button>
            </div>

            {(!logic.conditions || logic.conditions.length === 0) && (
                <p className="text-xs text-slate-400 italic">Always visible</p>
            )}

            {logic.conditions?.length > 1 && (
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                    <Label className="text-xs font-medium text-slate-600">Match:</Label>
                    <Select
                        value={logic.matchType || 'all'}
                        onValueChange={(val) => updateLogic({ ...logic, matchType: val })}
                    >
                        <SelectTrigger className="h-7 text-xs w-24">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="text-xs">All (AND)</SelectItem>
                            <SelectItem value="any" className="text-xs">Any (OR)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="space-y-3">
                {logic.conditions?.map((condition, index) => (
                    <div key={index} className="space-y-2 p-2 bg-white rounded border border-slate-200 relative group">
                        <button
                            onClick={() => removeCondition(index)}
                            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>

                        <div className="text-xs font-medium text-slate-500 mb-1">
                            Show field if:
                        </div>

                        <div className="grid gap-2">
                            {/* Field selector - uses field.id as value */}
                            <Select
                                value={condition.field_id}
                                onValueChange={(val) => updateCondition(index, 'field_id', val)}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Select Field" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableFields.map(f => (
                                        <SelectItem key={f.id} value={f.id} className="text-xs">
                                            {f.label} ({f.id})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="grid grid-cols-2 gap-2">
                                {/* Operator selector */}
                                <Select
                                    value={condition.operator}
                                    onValueChange={(val) => updateCondition(index, 'operator', val)}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {OPERATORS.map(op => (
                                            <SelectItem key={op.value} value={op.value} className="text-xs">
                                                {op.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Value input - dropdown if field has options, text otherwise */}
                                {renderValueInput(condition, index)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ConditionalLogicEditor;
