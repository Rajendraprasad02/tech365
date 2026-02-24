import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export default function FormField({ field, value, onChange, error, disabled }) {
    const { type, label, placeholder, options, validation_rules } = field;
    const isRequired = !!validation_rules?.required;

    const renderInput = () => {
        switch (type) {
            case 'textarea':
                return (
                    <Textarea
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        disabled={disabled}
                        className={cn(
                            "bg-white border-gray-200 focus:border-[#14137F] focus:ring-1 focus:ring-[#14137F] rounded-xl min-h-[100px] transition-all",
                            error && "border-red-500 bg-red-50/50"
                        )}
                    />
                );
            case 'select':
                const currentOptions = options || [];
                return (
                    <Select
                        value={String(value || '')}
                        onValueChange={onChange}
                        disabled={disabled}
                    >
                        <SelectTrigger className={cn(
                            "bg-white border-gray-200 focus:border-[#14137F] focus:ring-1 focus:ring-[#14137F] rounded-xl h-11 transition-all",
                            error && "border-red-500 bg-red-50/50"
                        )}>
                            <SelectValue placeholder={placeholder || "Select option..."} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-200 shadow-2xl bg-white !opacity-100 !visible">
                            {currentOptions.map((opt, i) => (
                                <SelectItem
                                    key={`${opt.value}-${i}`}
                                    value={String(opt.value || '')}
                                    className="focus:bg-blue-50 focus:text-blue-600 rounded-lg py-2.5"
                                >
                                    {opt.label || opt.value || "Option " + (i + 1)}
                                </SelectItem>
                            ))}
                            {currentOptions.length === 0 && (
                                <div className="p-4 text-center text-xs text-gray-400 italic">
                                    No options available
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                );
            case 'radio':
                return (
                    <div className="space-y-2 pt-1">
                        {options?.map(opt => (
                            <label
                                key={opt.value}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border border-gray-100 cursor-pointer transition-all hover:bg-gray-50",
                                    value === opt.value && "border-[#14137F] bg-blue-50/10"
                                )}
                            >
                                <input
                                    type="radio"
                                    name={field.id}
                                    value={opt.value}
                                    checked={value === opt.value}
                                    onChange={(e) => onChange(e.target.value)}
                                    disabled={disabled}
                                    className="w-4 h-4 text-[#14137F] border-gray-300 focus:ring-[#14137F]"
                                />
                                <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                );
            case 'checkbox':
                return (
                    <div className="space-y-2 pt-1">
                        {options?.map(opt => (
                            <label
                                key={opt.value}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border border-gray-100 cursor-pointer transition-all hover:bg-gray-50",
                                    (value || []).includes(opt.value) && "border-[#14137F] bg-blue-50/10"
                                )}
                            >
                                <input
                                    type="checkbox"
                                    value={opt.value}
                                    checked={(value || []).includes(opt.value)}
                                    onChange={(e) => {
                                        const newVal = e.target.checked
                                            ? [...(value || []), opt.value]
                                            : (value || []).filter(v => v !== opt.value);
                                        onChange(newVal);
                                    }}
                                    disabled={disabled}
                                    className="w-4 h-4 text-[#14137F] border-gray-300 rounded focus:ring-[#14137F]"
                                />
                                <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                );
            case 'phone':
            case 'tel':
            case 'email':
                return (
                    <Input
                        type={type === 'email' ? 'email' : 'tel'}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        disabled={disabled}
                        className={cn(
                            "bg-white border-gray-200 focus:border-[#14137F] focus:ring-1 focus:ring-[#14137F] rounded-xl h-11 transition-all",
                            error && "border-red-500 bg-red-50/50"
                        )}
                    />
                );
            case 'yes_no':
                return (
                    <div className="flex gap-3 pt-1">
                        {['Yes', 'No'].map(choice => (
                            <Button
                                key={choice}
                                variant="outline"
                                onClick={() => onChange(choice.toLowerCase())}
                                disabled={disabled}
                                className={cn(
                                    "flex-1 h-11 rounded-xl font-bold uppercase tracking-wider text-xs transition-all",
                                    value === choice.toLowerCase()
                                        ? "bg-[#14137F] text-white border-transparent shadow-lg shadow-blue-900/10"
                                        : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50"
                                )}
                            >
                                {choice}
                            </Button>
                        ))}
                    </div>
                );
            default:
                return (
                    <textarea
                        value={value || ''}
                        onChange={(e) => {
                            onChange(e.target.value);
                            e.target.style.height = 'inherit';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        onFocus={(e) => {
                            e.target.style.height = 'inherit';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={1}
                        className={cn(
                            "bg-white border-gray-200 w-full focus:border-[#14137F] focus:ring-1 focus:ring-[#14137F] rounded-xl transition-all py-3 px-4 text-sm leading-relaxed resize-none overflow-hidden min-h-[44px]",
                            error && "border-red-500 bg-red-50/50"
                        )}
                    />
                );
        }
    };

    return (
        <div className="space-y-2 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-1">
                <Label className="text-[11px] font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest">
                    <span className="normal-case tracking-normal">{label}</span>
                    {isRequired && <span className="text-red-500">*</span>}
                </Label>
                {error && <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">{error}</span>}
            </div>

            {renderInput()}

            {field.description && !error && (
                <p className="text-[10px] text-gray-400 font-medium italic mt-1 leading-tight">
                    {field.description}
                </p>
            )}
        </div>
    );
}
