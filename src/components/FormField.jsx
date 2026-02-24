import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';

const FormField = ({
    field,
    value,
    onChange,
    error,
    disabled
}) => {
    const {
        id,
        type,
        label,
        placeholder,
        options: rawOptions,
        required
    } = field;

    console.log(`[FormField Debug] Mounting ${id} (${type})`); // DEBUG

    // Normalize options to always be { label, value } format
    const options = rawOptions?.map(opt =>
        typeof opt === 'string' ? { label: opt, value: opt } : opt
    );

    const handleChange = (e) => {
        const val = type === 'checkbox' ? e.target.checked : e.target.value;
        onChange(id, val);
    };

    const renderInput = () => {
        // Normalize options/check for empty
        const normalizedOptions = rawOptions?.map(opt =>
            typeof opt === 'string' ? { label: opt, value: opt } : opt
        );

        // Safety: If type needs options but has none, show warning
        const needsOptions = ['select', 'radio', 'checkbox'].includes(field.type);
        if (needsOptions && (!normalizedOptions || normalizedOptions.length === 0)) {
            return (
                <div className="space-y-2 mt-4">
                    <Label>{field.label}</Label>
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-700 text-xs italic">
                        ⚠ No options configured for this field.
                    </div>
                </div>
            );
        }

        switch (field.type) { // Changed to field.type
            case 'text':
            case 'number':
            case 'email':
            case 'tel': // Added tel
            case 'date':
                return (
                    <Input
                        id={id}
                        type={type}
                        placeholder={placeholder}
                        value={value || ''}
                        onChange={handleChange}
                        disabled={disabled}
                        className={cn(error && "border-red-500")}
                    />
                );

            case 'select':
                return (
                    <select
                        id={id}
                        value={value || ''}
                        onChange={handleChange}
                        disabled={disabled}
                        className={cn(
                            "flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                            error && "border-red-500",
                            !value && "text-slate-500"
                        )}
                    >
                        <option value="" disabled>{placeholder || `Select ${label}`}</option>
                        {options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                );

            case 'radio':
                return (
                    <div className="space-y-2 mt-2">
                        {options?.map((opt) => (
                            <div key={opt.value} className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id={`${id}-${opt.value}`}
                                    name={id}
                                    value={opt.value}
                                    checked={value === opt.value}
                                    onChange={handleChange}
                                    disabled={disabled}
                                    className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor={`${id}-${opt.value}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {opt.label}
                                </label>
                            </div>
                        ))}
                    </div>
                );

            case 'checkbox':
                return (
                    <div className="flex items-center space-x-2 mt-2">
                        <input
                            type="checkbox"
                            id={id}
                            checked={!!value}
                            onChange={handleChange}
                            disabled={disabled}
                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {label} {required && <span className="text-red-500">*</span>}
                        </label>
                    </div>
                );

            default:
                return (
                    <div className="text-sm text-red-500">
                        Unsupported field type: {type}
                    </div>
                );
        }
    };

    return (
        <div className="mb-4">
            {type !== 'checkbox' && (
                <label
                    htmlFor={id}
                    className="mb-1.5 block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            {renderInput()}
            {error && (
                <p className="mt-1 text-xs text-red-500">
                    {error}
                </p>
            )}
        </div>
    );
};

export default FormField;
