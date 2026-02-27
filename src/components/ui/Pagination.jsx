import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

export default function Pagination({
    page = 0,
    pageSize = 10,
    total = 0,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100],
    className = ""
}) {
    const [showPageSizeMenu, setShowPageSizeMenu] = useState(false);

    const totalPages = Math.ceil(total / pageSize) || 1;
    const current = page + 1;

    // Helper to generate page numbers
    const getPageItems = () => {
        const items = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) items.push(i);
        } else {
            if (current <= 4) {
                items.push(1, 2, 3, 4, 5, '...', totalPages);
            } else if (current >= totalPages - 3) {
                items.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                items.push(1, '...', current - 1, current, current + 1, '...', totalPages);
            }
        }
        return items;
    };

    return (
        <div className={`px-6 py-5 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
            {/* Data Details (Left) */}
            <div className="flex-1 flex items-center justify-center sm:justify-start gap-3 w-full sm:w-auto text-[10px] uppercase font-black tracking-[0.12em] text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14137F] shadow-[0_0_8px_rgba(20,19,127,0.4)] hidden sm:block"></span>
                <span className="whitespace-nowrap">
                    Showing <span className="text-gray-900">{Math.min(total, page * pageSize + 1)}-{Math.min(total, (page + 1) * pageSize)}</span> of <span className="text-gray-900">{total}</span>
                </span>
            </div>

            {/* Navigation Controls (Center) */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-[#14137F] hover:bg-[#14137F]/5 rounded-full transition-all disabled:opacity-20 disabled:hover:bg-transparent"
                >
                    <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-1.5">
                    {getPageItems().map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => typeof item === 'number' && onPageChange(item - 1)}
                            disabled={typeof item !== 'number'}
                            className={`w-9 h-9 flex items-center justify-center rounded-full text-xs font-bold transition-all ${item === current
                                    ? 'bg-[#14137F] text-white shadow-lg shadow-[#14137F]/20 ring-4 ring-[#14137F]/5 scale-105'
                                    : item === '...'
                                        ? 'text-gray-300 cursor-default'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-[#14137F]'
                                }`}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
                    disabled={(page + 1) * pageSize >= total}
                    className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-[#14137F] hover:bg-[#14137F]/5 rounded-full transition-all disabled:opacity-20 disabled:hover:bg-transparent"
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Page Size Controls (Right) */}
            <div className="flex-1 flex justify-center sm:justify-end w-full sm:w-auto">
                <div className="relative">
                    <button
                        onClick={() => setShowPageSizeMenu(!showPageSizeMenu)}
                        className="flex items-center gap-2.5 text-[10px] uppercase font-black tracking-[0.12em] text-gray-900 hover:text-[#14137F] transition-colors group"
                    >
                        <span className="opacity-90 group-hover:opacity-100 whitespace-nowrap">Rows per page</span>
                        <div className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-lg px-2.5 py-1 text-gray-900 font-bold shadow-sm group-hover:border-[#14137F]/30 group-hover:text-[#14137F] transition-all">
                            {pageSize}
                            <ChevronDown size={12} className={`transition-transform duration-300 ${showPageSizeMenu ? 'rotate-180' : ''}`} />
                        </div>
                    </button>

                    {/* Custom Dropdown Menu */}
                    {showPageSizeMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowPageSizeMenu(false)} />
                            <div className="absolute bottom-full right-0 mb-3 w-28 bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-black/10 p-1.5 z-20 animate-in slide-in-from-bottom-2 duration-300 ring-1 ring-black/5">
                                {pageSizeOptions.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => {
                                            onPageSizeChange(size);
                                            setShowPageSizeMenu(false);
                                        }}
                                        className={`w-full py-2 rounded-xl text-[11px] font-black tracking-widest transition-all ${pageSize === size
                                                ? 'bg-[#14137F] text-white shadow-lg shadow-[#14137F]/20'
                                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
