import { useState, useRef, useEffect } from 'react';
import { ChevronDown, CheckCircle } from 'lucide-react';

export default function CustomSelect({ value, options, onChange, icon: Icon, placeholder = "Select..." }) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 bg-white border rounded-lg shadow-sm transition-all duration-200 hover:border-violet-300 ${isOpen ? 'border-violet-500 ring-2 ring-violet-50/50' : 'border-gray-200'}`}
            >
                {Icon && <Icon size={16} className={`text-gray-400 ${isOpen ? 'text-violet-500' : ''}`} />}
                <span className="text-sm font-medium text-gray-700">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${value === option.value ? 'bg-violet-50 text-violet-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                            {option.label}
                            {value === option.value && <CheckCircle size={14} className="text-violet-600" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
