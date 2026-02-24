import React from 'react';
import { useDispatch } from 'react-redux';
import { addField } from '@/store/slices/formBuilderSlice';
import { Button } from '@/components/ui/button';
import {
    Type, Hash, Mail, List, CircleDot,
    CheckSquare, Calendar, Phone, ThumbsUp
} from 'lucide-react';

const FIELD_TYPES = [
    { type: 'text', label: 'Text Input', icon: Type },
    { type: 'number', label: 'Number', icon: Hash },
    { type: 'email', label: 'Email', icon: Mail },
    { type: 'tel', label: 'Phone', icon: Phone },
    { type: 'select', label: 'Dropdown', icon: List },
    { type: 'radio', label: 'Radio Buttons', icon: CircleDot },
    { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
    { type: 'date', label: 'Date Picker', icon: Calendar },
    { type: 'yes_no', label: 'Yes / No', icon: ThumbsUp },
];

export default function FieldPalette() {
    const dispatch = useDispatch();

    return (
        <div className="w-64 bg-white border-r border-gray-100 flex flex-col h-full shadow-sm">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Field Palette</h2>
                <p className="text-xs text-gray-500 mt-1">Click to add fields to your form</p>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                {FIELD_TYPES.map((field) => {
                    const Icon = field.icon;
                    return (
                        <button
                            key={field.type}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all border border-transparent hover:border-blue-100 group"
                            onClick={() => dispatch(addField(field.type))}
                        >
                            <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                <Icon className="w-4 h-4" />
                            </div>
                            {field.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
