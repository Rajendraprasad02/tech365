import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Zap, ArrowRight } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectAllFields } from '@/store/selectors/formSelectors';
import { cn } from '@/lib/utils';

const OPERATORS = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greater_than', label: 'Is Greater Than' },
    { value: 'less_than', label: 'Is Less Than' },
    { value: 'not_empty', label: 'Is Not Empty' },
];

export default function ConditionalLogicEditor({ fieldId, value, onChange }) {
    const allFields = useSelector(selectAllFields);

    const availableFields = useMemo(() =>
        (allFields || []).filter(f => f.id !== fieldId),
        [allFields, fieldId]
    );

    const logic = value || { action: 'show', conditions: [], matchType: 'all' };

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
        if (key === 'field_id') newConditions[index].value = '';
        updateLogic({ ...logic, conditions: newConditions });
    };

    const getFieldOptions = (fId) => {
        const field = availableFields.find(f => f.id === fId);
        if (!field) return null;
        if (field.options && Array.isArray(field.options) && field.options.length > 0) {
            return field.options.map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt);
        }
        return null;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap size={12} className="text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logic Rules</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={addCondition}
                    className="h-7 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[10px] font-bold"
                >
                    <Plus size={14} className="mr-1" /> Add Rule
                </Button>
            </div>

            {(!logic.conditions || logic.conditions.length === 0) && (
                <div className="p-6 bg-gray-50 border border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">No Rules Defined</p>
                    <p className="text-[9px] text-gray-400 mt-1">This field will always be visible</p>
                </div>
            )}

            {logic.conditions?.length > 1 && (
                <div className="flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100/50 rounded-2xl">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">Logic Method:</span>
                    <select
                        value={logic.matchType || 'all'}
                        onChange={(e) => updateLogic({ ...logic, matchType: e.target.value })}
                        className="bg-white border-transparent rounded-lg text-[10px] font-bold py-1 px-2 focus:ring-0 cursor-pointer shadow-sm text-[#14137F]"
                    >
                        <option value="all">Satisy ALL (AND)</option>
                        <option value="any">Satisfy ANY (OR)</option>
                    </select>
                </div>
            )}

            <div className="space-y-3">
                {logic.conditions?.map((condition, index) => {
                    const fieldOptions = getFieldOptions(condition.field_id);

                    return (
                        <div key={index} className="group/rule relative p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
                            <button
                                onClick={() => removeCondition(index)}
                                className="absolute -right-2 -top-2 h-6 w-6 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 shadow-sm opacity-0 group-hover/rule:opacity-100 transition-all"
                            >
                                <X size={12} />
                            </button>

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label className="text-[9px] text-gray-400 font-black uppercase flex items-center gap-1">
                                        Dependent Field
                                    </Label>
                                    <Select
                                        value={condition.field_id}
                                        onValueChange={(val) => updateCondition(index, 'field_id', val)}
                                    >
                                        <SelectTrigger className="h-8 text-[11px] bg-gray-50 border-none rounded-lg">
                                            <SelectValue placeholder="Target Field" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableFields.map(f => (
                                                <SelectItem key={f.id} value={f.id} className="text-xs">
                                                    {f.label} ({f.id})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[9px] text-gray-400 font-black uppercase">Operation</Label>
                                        <Select
                                            value={condition.operator}
                                            onValueChange={(val) => updateCondition(index, 'operator', val)}
                                        >
                                            <SelectTrigger className="h-8 text-[11px] bg-gray-50 border-none rounded-lg font-medium">
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
                                    </div>

                                    {condition.operator !== 'not_empty' && (
                                        <div className="space-y-1">
                                            <Label className="text-[9px] text-gray-400 font-black uppercase">Match Value</Label>
                                            {fieldOptions ? (
                                                <Select
                                                    value={condition.value}
                                                    onValueChange={(val) => updateCondition(index, 'value', val)}
                                                >
                                                    <SelectTrigger className="h-8 text-[11px] bg-gray-50 border-none rounded-lg font-medium">
                                                        <SelectValue placeholder="..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {fieldOptions.map(opt => (
                                                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                                                {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Input
                                                    value={condition.value}
                                                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                                                    className="h-8 text-[11px] bg-gray-50 border-none rounded-lg"
                                                    placeholder="Value..."
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const X = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);
