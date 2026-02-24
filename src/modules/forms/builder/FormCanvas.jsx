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
import FormField from '@/components/FormField';
import { Trash2, GripVertical, ArrowUp, ArrowDown, Plus, X, Layout } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function FormCanvas() {
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
        <div className="flex-1 bg-gray-50/50 flex flex-col h-full overflow-hidden">
            {/* Screen Tabs */}
            <div className="bg-white border-b border-gray-100 px-6 pt-4 flex items-center gap-2 overflow-x-auto min-h-[64px] scrollbar-hide">
                {screens.map((screen, index) => (
                    <div
                        key={screen.id}
                        onClick={() => dispatch(selectScreen(screen.id))}
                        className={cn(
                            "group flex items-center gap-2 px-5 py-2.5 rounded-t-2xl border-t border-x cursor-pointer text-sm font-semibold min-w-[140px] justify-between transition-all relative",
                            selectedScreenId === screen.id
                                ? "bg-gray-50/50 border-gray-100 text-[#14137F] border-b-white mb-[-1px] z-10"
                                : "bg-white border-transparent text-gray-400 hover:text-gray-600"
                        )}
                    >
                        <div className="flex items-center gap-2 truncate">
                            <span className="opacity-40"><Layout size={14} /></span>
                            <span className="truncate">{screen.title || `Screen ${index + 1}`}</span>
                        </div>
                        {screens.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Delete this screen?')) dispatch(deleteScreen(screen.id));
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                ))}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dispatch(addScreen())}
                    className="h-10 w-10 p-0 rounded-xl hover:bg-blue-50 text-blue-600 mb-1"
                >
                    <Plus size={18} />
                </Button>
            </div>

            {/* Canvas Area - The scrollable workspace */}
            <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar bg-gray-50/10">
                <div className="mx-auto w-full max-w-3xl">
                    {/* The Screen Card - Grows with content */}
                    <div className={cn(
                        "bg-white shadow-2xl shadow-gray-200/50 border border-gray-100 rounded-[32px] overflow-hidden flex flex-col transition-all duration-500 ease-in-out h-auto min-h-[400px]",
                        "animate-fade-in"
                    )}>
                        {/* Screen Header */}
                        <div className="p-8 md:p-10 border-b border-gray-50 bg-gradient-to-br from-white to-gray-50/30">
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-2xl mb-6">
                                📑
                            </div>
                            <Input
                                value={activeScreen.title}
                                onChange={handleScreenTitleChange}
                                className="text-2xl font-black text-gray-900 border-none bg-transparent hover:bg-gray-100/50 focus:bg-white transition-all px-3 h-auto py-2 -ml-3 rounded-xl focus:ring-0 w-full"
                            />
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-none font-bold">
                                    Screen {screens.findIndex(s => s.id === selectedScreenId) + 1}
                                </Badge>
                                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest px-1">Editor Canvas</span>
                            </div>
                        </div>

                        {/* Fields Container - No fixed height, grows naturally */}
                        <div className="p-8 md:p-10 space-y-6">
                            <div className="space-y-6 transition-all duration-500">
                                {fields.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50 group hover:border-blue-200 transition-colors">
                                        <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center text-gray-200 group-hover:text-blue-200 shadow-sm mb-4 transition-colors">
                                            <Plus size={32} />
                                        </div>
                                        <p className="font-bold text-gray-900/40 uppercase tracking-widest text-xs">Canvas is Empty</p>
                                        <p className="text-sm mt-1">Select fields from the palette to start building</p>
                                    </div>
                                ) : (
                                    fields.map((field, index) => (
                                        <div
                                            key={field.id}
                                            onClick={(e) => handleSelect(e, field.id)}
                                            className={cn(
                                                "group relative p-6 rounded-2xl border transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-bottom-2",
                                                selectedFieldId === field.id
                                                    ? "border-emerald-500 bg-emerald-50/10 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500"
                                                    : "border-transparent hover:border-gray-200 hover:bg-gray-50/30"
                                            )}
                                        >
                                            {/* Top-Right Action Toolbar */}
                                            <div className={cn(
                                                "absolute right-6 top-6 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10",
                                                selectedFieldId === field.id && "opacity-100"
                                            )}>
                                                <button
                                                    onClick={(e) => handleMove(e, index, -1)}
                                                    disabled={index === 0}
                                                    className="text-gray-400 hover:text-gray-600 disabled:opacity-0 transition-opacity"
                                                >
                                                    <ArrowUp size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleMove(e, index, 1)}
                                                    disabled={index === fields.length - 1}
                                                    className="text-gray-400 hover:text-gray-600 disabled:opacity-0 transition-opacity"
                                                >
                                                    <ArrowDown size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(e, field.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {/* Left Grip Indicator */}
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-300">
                                                <GripVertical size={16} />
                                            </div>

                                            {/* Field Preview Content */}
                                            <div className="pointer-events-none pl-6">
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

                            {/* End of Screen Visual Anchor */}
                            {fields.length > 0 && (
                                <div className="flex flex-col items-center pt-8 border-t border-gray-50 mt-12 mb-4 animate-fade-in">
                                    <Badge variant="outline" className="bg-white border-gray-200 text-gray-400 font-black uppercase tracking-[0.2em] text-[10px] py-2 px-8 rounded-full shadow-sm hover:text-gray-600 transition-colors border-dashed">
                                        End of Screen
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}

// Subcomponent for Badge since I don't want to rely on the external one if it's missing
const Badge = ({ children, variant, className }) => (
    <span className={cn(
        "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
        variant === 'secondary' ? "bg-gray-100 text-gray-600" : "bg-blue-600 text-white",
        className
    )}>
        {children}
    </span>
);
