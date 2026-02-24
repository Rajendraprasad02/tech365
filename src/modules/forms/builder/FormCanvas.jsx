import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    selectField,
    removeField,
    moveField,
    addScreen,
    deleteScreen,
    selectScreen,
    updateScreenTitle
} from '@/store/slices/formBuilderSlice';
import FormField from '@/components/FormField'; // Reusing runtime component
import { Trash2, GripVertical, ArrowUp, ArrowDown, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const FormCanvas = () => {
    const { screens, selectedScreenId, selectedFieldId } = useSelector(state => state.formBuilder);
    const dispatch = useDispatch();

    const activeScreen = screens.find(s => s.id === selectedScreenId) || screens[0];
    const fields = activeScreen?.fields || [];

    const handleSelect = (e, id) => {
        e.stopPropagation();
        dispatch(selectField(id));
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        dispatch(removeField(id));
    };

    const handleMove = (e, index, direction) => {
        e.stopPropagation();
        const newIndex = index + direction;
        dispatch(moveField({ fromIndex: index, toIndex: newIndex }));
    };

    const handleScreenTitleChange = (e) => {
        dispatch(updateScreenTitle({ id: activeScreen.id, title: e.target.value }));
    };

    return (
        <div className="flex-1 bg-slate-50 flex flex-col h-full overflow-hidden">
            {/* Screen Tabs */}
            <div className="bg-white border-b border-slate-200 px-4 pt-4 flex items-center gap-2 overflow-x-auto">
                {screens.map((screen, index) => (
                    <div
                        key={screen.id}
                        onClick={() => dispatch(selectScreen(screen.id))}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-t-lg border-t border-x cursor-pointer text-sm font-medium min-w-[120px] justify-between group",
                            selectedScreenId === screen.id
                                ? "bg-slate-50 border-slate-200 text-slate-900 border-b-transparent mb-[-1px] z-10"
                                : "bg-slate-100 border-transparent text-slate-500 hover:bg-slate-50"
                        )}
                    >
                        <span>{screen.title || `Screen ${index + 1}`}</span>
                        {screens.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Delete this screen?')) dispatch(deleteScreen(screen.id));
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-red-500"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                ))}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dispatch(addScreen())}
                    className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 text-slate-500"
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 p-8 overflow-y-auto flex justify-center">
                <div className="w-full max-w-2xl bg-white shadow-sm border border-slate-200 rounded-xl min-h-[500px] flex flex-col animate-in fade-in duration-300 key={activeScreen.id}">
                    {/* Screen Header Editable */}
                    <div className="p-8 border-b border-slate-100 bg-white rounded-t-xl">
                        <div className="w-16 h-16 bg-slate-100 rounded-lg mb-4 flex items-center justify-center">
                            <span className="text-2xl">📝</span>
                        </div>
                        <Input
                            value={activeScreen.title}
                            onChange={handleScreenTitleChange}
                            className="text-xl font-bold border-transparent hover:border-slate-200 focus:border-blue-500 px-0 h-auto py-1"
                        />
                        <p className="text-sm text-slate-400 mt-1">Screen {screens.findIndex(s => s.id === selectedScreenId) + 1} of {screens.length}</p>
                    </div>

                    <div className="flex-1 p-8 space-y-4">
                        {fields.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                                <p>This screen is empty</p>
                                <p className="text-sm">Select fields from the left to add</p>
                            </div>
                        ) : (
                            fields.map((field, index) => (
                                <div
                                    key={field.id}
                                    onClick={(e) => handleSelect(e, field.id)}
                                    className={cn(
                                        "group relative p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-slate-50",
                                        selectedFieldId === field.id
                                            ? "border-emerald-500 bg-emerald-50/10 ring-1 ring-emerald-500"
                                            : "border-transparent hover:border-slate-200"
                                    )}
                                >
                                    {/* Hover Actions */}
                                    <div className={cn(
                                        "absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10",
                                        selectedFieldId === field.id && "opacity-100"
                                    )}>
                                        <button
                                            onClick={(e) => handleMove(e, index, -1)}
                                            disabled={index === 0}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                                            title="Move Up"
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => handleMove(e, index, 1)}
                                            disabled={index === fields.length - 1}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                                            title="Move Down"
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, field.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                                            title="Delete Field"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Drag Handle (Visual only for now) */}
                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab text-slate-300">
                                        <GripVertical className="w-4 h-4" />
                                    </div>

                                    {/* Field Preview */}
                                    <div className="pointer-events-none pl-6">
                                        {/* pointer-events-none prevents interacting with inputs in builder mode */}
                                        <FormField
                                            field={field}
                                            value=""
                                            onChange={() => { }}
                                            disabled={true}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FormCanvas;
