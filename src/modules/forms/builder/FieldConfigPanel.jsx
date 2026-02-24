import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateField, updateFieldId, moveFieldToScreen } from '@/store/slices/formBuilderSlice';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ConditionalLogicEditor from './ConditionalLogicEditor';

const FieldConfigPanel = () => {
    const { screens, selectedFieldId } = useSelector(state => state.formBuilder);
    const dispatch = useDispatch();

    // Find the field across all screens
    let selectedField = null;
    let currentScreen = null;
    for (const screen of screens) {
        const field = screen.fields.find(f => f.id === selectedFieldId);
        if (field) {
            selectedField = field;
            currentScreen = screen;
            break;
        }
    }

    if (!selectedField) {
        return (
            <div className="w-80 bg-white border-l border-slate-200 p-8 flex flex-col items-center justify-center text-center text-slate-500">
                <p>Select a field to configure</p>
            </div>
        );
    }

    const handleChange = (key, value) => {
        dispatch(updateField({ id: selectedFieldId, updates: { [key]: value } }));
    };

    const handleValidationChange = (key, value) => {
        const newRules = { ...selectedField.validation_rules, [key]: value };
        // Clean up empty values
        if (value === '' || value === null) delete newRules[key];
        handleChange('validation_rules', newRules);
    };

    const addOption = () => {
        const newOptions = [...(selectedField.options || [])];
        newOptions.push({ label: `Option ${newOptions.length + 1}`, value: `option_${newOptions.length + 1}` });
        handleChange('options', newOptions);
    };

    const updateOption = (index, key, val) => {
        const newOptions = [...selectedField.options];
        newOptions[index] = { ...newOptions[index], [key]: val };
        handleChange('options', newOptions);
    };

    const removeOption = (index) => {
        const newOptions = [...selectedField.options];
        newOptions.splice(index, 1);
        handleChange('options', newOptions);
    };

    return (
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full overflow-y-auto">
            <div className="p-4 border-b border-slate-200">
                <h2 className="font-semibold text-slate-800">Configuration</h2>
                <p className="text-xs text-slate-500">ID: {selectedField.id}</p>
            </div>

            <div className="p-4 space-y-6">
                {/* Move to Screen */}
                {screens.length > 1 && (
                    <div className="space-y-2 pb-4 border-b border-slate-100">
                        <Label>Move to Screen</Label>
                        <Select
                            value={currentScreen?.id}
                            onValueChange={(val) => dispatch(moveFieldToScreen({
                                fieldId: selectedFieldId,
                                targetScreenId: val
                            }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Screen" />
                            </SelectTrigger>
                            <SelectContent>
                                {screens.map(s => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Basic Properties */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Field Key (Slug)</Label>
                        <Input
                            value={selectedField.id}
                            onChange={(e) => dispatch(updateFieldId({
                                oldId: selectedField.id,
                                newId: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') // Basic slug validation
                            }))}
                            className="font-mono text-xs bg-slate-50"
                        />
                        <p className="text-[10px] text-slate-400">Unique identifier for this field</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Label</Label>
                        <Input
                            value={selectedField.label}
                            onChange={(e) => handleChange('label', e.target.value)}
                        />
                    </div>

                    {['text', 'number', 'email', 'textarea'].includes(selectedField.type) && (
                        <div className="space-y-2">
                            <Label>Placeholder</Label>
                            <Input
                                value={selectedField.placeholder || ''}
                                onChange={(e) => handleChange('placeholder', e.target.value)}
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <Label>Required</Label>
                        <Switch
                            checked={!!selectedField.validation_rules?.required}
                            onCheckedChange={(val) => handleValidationChange('required', val)}
                        />
                    </div>
                </div>

                {/* Options (Select/Radio) */}
                {['select', 'radio', 'checkbox'].includes(selectedField.type) && selectedField.type !== 'boolean' && (
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <Label>Options</Label>
                            <Button variant="ghost" size="sm" onClick={addOption} className="h-6 w-6 p-0">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {selectedField.options?.map((opt, index) => (
                                <div key={index} className="flex gap-2 items-start">
                                    <div className="grid gap-1 flex-1">
                                        <Input
                                            value={opt.label}
                                            onChange={(e) => updateOption(index, 'label', e.target.value)}
                                            placeholder="Label"
                                            className="h-8 text-xs"
                                        />
                                        <Input
                                            value={opt.value}
                                            onChange={(e) => updateOption(index, 'value', e.target.value)}
                                            placeholder="Value"
                                            className="h-8 text-xs font-mono text-slate-500"
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeOption(index)}
                                        className="h-8 w-8 text-slate-400 hover:text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Validation (Number) */}
                {selectedField.type === 'number' && (
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                        <Label>Validation</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs">Min</Label>
                                <Input
                                    type="number"
                                    value={selectedField.validation_rules?.min || ''}
                                    onChange={(e) => handleValidationChange('min', Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Max</Label>
                                <Input
                                    type="number"
                                    value={selectedField.validation_rules?.max || ''}
                                    onChange={(e) => handleValidationChange('max', Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Regex Validation (Text) */}
                {selectedField.type === 'text' && (
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                        <Label>Regex Pattern</Label>
                        <Input
                            value={selectedField.validation_rules?.regex || ''}
                            onChange={(e) => handleValidationChange('regex', e.target.value)}
                            placeholder="e.g. ^[A-Za-z]+$"
                            className="font-mono text-xs"
                        />
                        <Input
                            value={selectedField.validation_rules?.error_message || ''}
                            onChange={(e) => handleValidationChange('error_message', e.target.value)}
                            placeholder="Error message"
                            className="text-xs"
                        />
                    </div>
                )}


                {/* Conditional Logic */}
                <div className="pt-4 border-t border-slate-100">
                    <ConditionalLogicEditor
                        fieldId={selectedField.id}
                        value={selectedField.conditional_logic}
                        onChange={(val) => handleChange('conditional_logic', val)}
                    />
                </div>

            </div>
        </div>
    );
};

export default FieldConfigPanel;
