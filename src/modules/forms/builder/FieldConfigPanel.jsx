import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    updateField,
    updateFieldId,
    moveFieldToScreen
} from '@/store/slices/formBuilderSlice';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Settings2, Info, Lock, Zap, Shield, List, Layout as LayoutIcon } from 'lucide-react';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from '@/components/ui/select';
import ConditionalLogicEditor from './ConditionalLogicEditor';

export default function FieldConfigPanel() {
    const { screens, selectedFieldId } = useSelector(state => state.formBuilder);
    const dispatch = useDispatch();

    // Find the field and its screen
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
            <div className="w-80 bg-white border-l border-gray-100 p-12 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300 mb-6">
                    <Settings2 size={32} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Configuration</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">Select a field on the canvas to edit its properties, validation, and logic.</p>
            </div>
        );
    }

    const handleChange = (key, value) => {
        dispatch(updateField({ id: selectedFieldId, updates: { [key]: value } }));
    };

    const handleValidationChange = (key, value) => {
        const newRules = { ...selectedField.validation_rules, [key]: value };
        if (value === '' || value === null || value === false) delete newRules[key];
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
        <div className="w-85 bg-white border-l border-gray-100 flex flex-col h-full overflow-hidden shadow-2xl shadow-gray-200/20">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                    <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Properties</h2>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{selectedField.id}</p>
                </div>
                <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Zap size={16} fill="currentColor" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-8 pb-12">
                    {/* Move to Screen */}
                    {screens.length > 1 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-gray-900 mb-1">
                                <LayoutIcon size={14} className="text-blue-500" />
                                <Label className="text-[11px] font-bold uppercase tracking-wider">Location</Label>
                            </div>
                            <Select
                                value={currentScreen?.id}
                                onValueChange={(val) => dispatch(moveFieldToScreen({
                                    fieldId: selectedFieldId,
                                    targetScreenId: val
                                }))}
                            >
                                <SelectTrigger className="h-10 bg-gray-50 border-transparent rounded-xl focus:bg-white text-xs">
                                    <SelectValue placeholder="Select Screen" />
                                </SelectTrigger>
                                <SelectContent>
                                    {screens.map(s => (
                                        <SelectItem key={s.id} value={s.id} className="text-xs">
                                            {s.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Basic Properties */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-gray-900 mb-1">
                            <Info size={14} className="text-blue-500" />
                            <Label className="text-[11px] font-bold uppercase tracking-wider">General Information</Label>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] text-gray-400 font-bold uppercase">Slug Identifier</Label>
                            <Input
                                value={selectedField.id}
                                onChange={(e) => dispatch(updateFieldId({
                                    oldId: selectedField.id,
                                    newId: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '')
                                }))}
                                className="font-mono text-[10px] bg-gray-50 border-transparent rounded-xl h-9"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] text-gray-400 font-bold uppercase">Field Label</Label>
                            <Input
                                value={selectedField.label}
                                onChange={(e) => handleChange('label', e.target.value)}
                                className="bg-gray-100/50 border-transparent focus:bg-white rounded-xl h-10 text-sm font-medium"
                            />
                        </div>

                        {['text', 'number', 'email', 'textarea'].includes(selectedField.type) && (
                            <div className="space-y-2">
                                <Label className="text-[10px] text-gray-400 font-bold uppercase">Placeholder Hint</Label>
                                <Input
                                    value={selectedField.placeholder || ''}
                                    onChange={(e) => handleChange('placeholder', e.target.value)}
                                    className="bg-gray-100/50 border-transparent focus:bg-white rounded-xl h-10 text-sm"
                                />
                            </div>
                        )}
                    </div>

                    {/* Validation Settings */}
                    <div className="space-y-4 pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-2 text-gray-900 mb-1">
                            <Shield size={14} className="text-emerald-500" />
                            <Label className="text-[11px] font-bold uppercase tracking-wider">Validation Rules</Label>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                            <div className="flex items-center gap-2">
                                <Lock size={14} className="text-amber-500" />
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">Required Field</span>
                            </div>
                            <Switch
                                id="required-toggle"
                                checked={!!selectedField.validation_rules?.required}
                                onCheckedChange={(val) => handleValidationChange('required', val)}
                                className="data-[state=checked]:bg-[#14137F]"
                            />
                        </div>

                        {selectedField.validation_rules?.required && (
                            <div className="space-y-2 animate-fade-in px-1">
                                <Label htmlFor="error-msg" className="text-[10px] text-gray-400 font-bold uppercase">Error Message</Label>
                                <Input
                                    id="error-msg"
                                    value={selectedField.validation_rules?.error_message || ''}
                                    onChange={(e) => handleValidationChange('error_message', e.target.value)}
                                    placeholder="e.g. This field is required"
                                    className="bg-gray-100/50 border-transparent focus:bg-white rounded-xl h-10 text-xs"
                                />
                                <p className="text-[9px] text-gray-400 italic">User will see this message if they leave the field empty.</p>
                            </div>
                        )}
                    </div>

                    {/* Options Configuration */}
                    {['select', 'radio', 'checkbox'].includes(selectedField.type) && (
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-gray-900">
                                    <List size={14} className="text-blue-500" />
                                    <Label className="text-[11px] font-bold uppercase tracking-wider">Choice Options</Label>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={addOption}
                                    className="h-7 px-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[10px] font-bold"
                                >
                                    <Plus className="w-3 h-3 mr-1" /> Add
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {selectedField.options?.map((opt, index) => (
                                    <div key={index} className="flex gap-2 items-start group/opt">
                                        <div className="grid gap-2 flex-1 p-2 bg-gray-50/50 border border-gray-100 rounded-xl group-hover/opt:bg-white group-hover/opt:border-blue-100 transition-all">
                                            <Input
                                                value={opt.label}
                                                onChange={(e) => updateOption(index, 'label', e.target.value)}
                                                placeholder="Label (User sees this)"
                                                className="h-8 text-[11px] bg-transparent border-none focus:ring-0 px-1 font-medium"
                                            />
                                            <Input
                                                value={opt.value}
                                                onChange={(e) => updateOption(index, 'value', e.target.value)}
                                                placeholder="Value (Saved to database)"
                                                className="h-6 text-[9px] font-mono text-gray-400 bg-transparent border-none focus:ring-0 px-1 italic"
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeOption(index)}
                                            className="h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl mt-2"
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                ))}
                                {(!selectedField.options || selectedField.options.length === 0) && (
                                    <div className="text-[10px] text-center py-4 text-gray-400 italic bg-gray-50 rounded-2xl border border-dashed border-gray-100">
                                        No options configured
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Conditional Logic Section */}
                    <div className="pt-8 border-t border-gray-50">
                        <div className="flex items-center gap-2 text-gray-900 mb-4">
                            <Zap size={14} className="text-blue-500" />
                            <Label className="text-[11px] font-bold uppercase tracking-wider">Intelligence & Logic</Label>
                        </div>
                        <ConditionalLogicEditor
                            fieldId={selectedField.id}
                            value={selectedField.conditional_logic}
                            onChange={(val) => handleChange('conditional_logic', val)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
