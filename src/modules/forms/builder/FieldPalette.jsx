import React from 'react';
import { useDispatch } from 'react-redux';
import { addField } from '@/store/slices/formBuilderSlice';
import { Button } from '@/components/ui/button';
import {
    Type, Hash, List, CheckSquare, Calendar, CircleDot,
    SplitSquareHorizontal
} from 'lucide-react';

const FIELD_TYPES = [
    { type: 'text', label: 'Text Input', icon: Type },
    { type: 'number', label: 'Number Input', icon: Hash },
    { type: 'select', label: 'Dropdown', icon: List },
    { type: 'radio', label: 'Radio Group', icon: CircleDot },
    { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
    { type: 'date', label: 'Date Picker', icon: Calendar },
    { type: 'yes_no', label: 'Yes / No', icon: CircleDot },
    { type: 'section', label: 'Section Header', icon: SplitSquareHorizontal },
];

const FieldPalette = () => {
    const dispatch = useDispatch();

    return (
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
            <div className="p-4 border-b border-slate-200">
                <h2 className="font-semibold text-slate-800">Field Types</h2>
                <p className="text-xs text-slate-500">Click to add to form</p>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto flex-1">
                {FIELD_TYPES.map((field) => {
                    const Icon = field.icon;
                    return (
                        <Button
                            key={field.type}
                            variant="outline"
                            className="w-full justify-start gap-2 h-10 hover:bg-slate-50 hover:text-emerald-600 hover:border-emerald-200 transition-all"
                            onClick={() => dispatch(addField(field.type))}
                        >
                            <Icon className="w-4 h-4" />
                            {field.label}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
};

export default FieldPalette;
